/**
 * Pure placement model for the editorial homepage.
 *
 * The database stores a single slot and rank on each article.  This function
 * is deliberately unaware of Drizzle/D1 so that placement invariants can be
 * tested without a worker runtime.
 */

// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { homepageSlots, type HomepageSlot } from "./editorial-contract.ts";

export const placementSlots = homepageSlots;
export type PlacementSlot = HomepageSlot;

export type PlacementRow = {
  id: number;
  homepageSlot: PlacementSlot;
  homepageRank: number;
};

function rankOf(value: number | undefined, length: number) {
  // An omitted rank is an explicit append command, not a magic large number.
  if (value === undefined) return length + 1;
  return Math.max(1, Math.floor(Number(value) || 1));
}

function ordered(rows: readonly PlacementRow[], slot: PlacementSlot) {
  return rows
    .filter((row) => row.homepageSlot === slot)
    .sort((a, b) => a.homepageRank - b.homepageRank || a.id - b.id);
}

function withRanks(rows: PlacementRow[], slot: PlacementSlot) {
  if (slot === "hero") {
    return rows.map((row) => ({ ...row, homepageSlot: slot, homepageRank: 1 }));
  }
  if (slot === "hidden") {
    return rows.map((row) => ({ ...row, homepageSlot: slot, homepageRank: 0 }));
  }
  return rows.map((row, index) => ({ ...row, homepageSlot: slot, homepageRank: index + 1 }));
}

/**
 * Computes the complete desired placement state after moving one article.
 *
 * - At most one article remains in `hero`.
 * - `featured` and `feed` are independent ordered collections.
 * - Moving between slots compacts the source and destination slots.
 * - Hidden articles always have rank zero.
 *
 * Existing malformed duplicate heroes are repaired deterministically: the
 * requested article wins when it targets hero; otherwise the first existing
 * hero (rank, then id) is retained and the remainder move to feed.
 */
export function calculatePlacements(
  rows: readonly PlacementRow[],
  articleId: number,
  targetSlot: PlacementSlot,
  requestedRank?: number,
): PlacementRow[] {
  const current = rows.find((row) => row.id === articleId);
  if (!current) throw new Error(`Article ${articleId} is not present in placement state`);

  const working = rows.map((row) => ({ ...row }));
  const byId = new Map(working.map((row) => [row.id, row]));
  const target = byId.get(articleId)!;

  // Remove the target from whichever collection it currently belongs to.
  target.homepageSlot = "hidden";
  target.homepageRank = 0;

  // Repair duplicate heroes while preserving one deterministic incumbent when
  // the requested destination is not hero.
  const existingHeroes = ordered(working, "hero").filter((row) => row.id !== articleId);
  const heroToKeep = targetSlot === "hero" ? undefined : existingHeroes[0];
  for (const hero of existingHeroes) {
    if (hero !== heroToKeep) {
      hero.homepageSlot = "feed";
      hero.homepageRank = 0;
    }
  }

  // Compact all collections touched by the target move and any hero repair.
  const sourceSlot = current.homepageSlot;
  const touched = new Set<PlacementSlot>([sourceSlot, targetSlot, "hidden"]);
  // Normalize the retained hero too, including malformed legacy rows.
  touched.add("hero");
  if (existingHeroes.some((hero) => hero !== heroToKeep)) touched.add("feed");
  for (const slot of touched) {
    const members = ordered(working, slot).filter((row) => row.id !== articleId);
    const ranked = slot === "hero" ? members.slice(0, 1) : members;
    for (const row of withRanks(ranked, slot)) {
      const destination = byId.get(row.id)!;
      destination.homepageSlot = row.homepageSlot;
      destination.homepageRank = row.homepageRank;
    }
  }

  if (targetSlot === "hero") {
    target.homepageSlot = "hero";
    target.homepageRank = 1;
  } else if (targetSlot === "hidden") {
    target.homepageSlot = "hidden";
    target.homepageRank = 0;
  } else {
    const destination = ordered(working, targetSlot).filter((row) => row.id !== articleId);
    destination.splice(Math.min(rankOf(requestedRank, destination.length) - 1, destination.length), 0, target);
    for (const row of withRanks(destination, targetSlot)) {
      const destinationRow = byId.get(row.id)!;
      destinationRow.homepageSlot = row.homepageSlot;
      destinationRow.homepageRank = row.homepageRank;
    }
  }

  // Hidden rows are always rank zero, including rows already hidden before the
  // move.  Return input order so callers can produce deterministic updates.
  for (const row of working) {
    if (row.homepageSlot === "hidden") row.homepageRank = 0;
  }
  return working;
}
