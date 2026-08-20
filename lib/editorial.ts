import { and, asc, eq, lt, ne, or } from "drizzle-orm";
import { getDb } from "../db";
import { articles, editorialLocks } from "../db/schema";
import { calculatePlacements } from "./editorial-model";
import { PLACEMENT_LOCK, type ArticleStatus, type HomepageSlot } from "./editorial-contract";

export { articleStatuses, editorialSlug, homepageSlots, isArticleStatus, isHomepageSlot } from "./editorial-contract";
export type { ArticleStatus, HomepageSlot } from "./editorial-contract";

/**
 * D1 does not support Drizzle BEGIN/SAVEPOINT in Workers. A short D1 lease
 * coordinates isolates, this tail orders calls inside one isolate, and the
 * final batch commits every rank update together.
 */
let placementTail: Promise<void> = Promise.resolve();

async function acquirePlacementLock(db: ReturnType<typeof getDb>) {
  const owner = crypto.randomUUID();
  for (let attempt = 0; attempt < PLACEMENT_LOCK.attempts; attempt += 1) {
    const now = Date.now();
    const leaseExpiresAt = now + PLACEMENT_LOCK.leaseMs;
    const [lock] = await db.insert(editorialLocks).values({ scope: PLACEMENT_LOCK.scope, owner, leaseExpiresAt })
      .onConflictDoUpdate({
        target: editorialLocks.scope,
        set: { owner, leaseExpiresAt },
        setWhere: lt(editorialLocks.leaseExpiresAt, now),
      }).returning({ scope: editorialLocks.scope });
    if (lock) return { owner, leaseExpiresAt };
    await new Promise((resolve) => setTimeout(resolve, PLACEMENT_LOCK.retryDelayMs));
  }
  throw new Error("No se pudo adquirir el bloqueo editorial");
}

async function reconcileArticleUnlocked(
  articleId: number,
  slot: HomepageSlot,
  requestedRank?: number,
  targetStatus?: ArticleStatus,
) {
  const db = getDb();
  const lock = await acquirePlacementLock(db);
  let placementCommitted = false;
  try {
    const now = new Date();
    const currentRows = await db.select({
      id: articles.id,
      slug: articles.slug,
      homepageSlot: articles.homepageSlot,
      homepageRank: articles.homepageRank,
    }).from(articles).where(or(ne(articles.status, "archived"), eq(articles.id, articleId))).orderBy(asc(articles.homepageRank), asc(articles.id));
    const modelRows = currentRows.map(({ id, homepageSlot, homepageRank }) => ({
      id,
      homepageSlot: homepageSlot as HomepageSlot,
      homepageRank,
    }));
    const nextRows = calculatePlacements(modelRows, articleId, slot, requestedRank);
    const before = new Map(modelRows.map((row) => [row.id, row]));
    const next = new Map(nextRows.map((row) => [row.id, row]));

    const statements = [];
    for (const row of nextRows) {
      const previous = before.get(row.id);
      const placementChanged = !previous || previous.homepageSlot !== row.homepageSlot || previous.homepageRank !== row.homepageRank;
      if (!placementChanged && !(row.id === articleId && targetStatus)) continue;
      statements.push(db.update(articles).set({
        homepageSlot: row.homepageSlot,
        homepageRank: row.homepageRank,
        ...(row.id === articleId && targetStatus ? { status: targetStatus } : {}),
        updatedAt: now,
      }).where(eq(articles.id, row.id)));
    }
    const release = db.delete(editorialLocks).where(and(eq(editorialLocks.scope, PLACEMENT_LOCK.scope), eq(editorialLocks.owner, lock.owner)));
    const [first, ...rest] = statements;
    if (first) {
      // D1 batch executes the reconciliation as one ordered unit; no reader can
      // observe half of a rank rewrite.
      await db.batch([first, ...rest, release]);
    } else {
      await release;
    }
    placementCommitted = true;

    const displacedHeroIds = modelRows
      .filter((row) => row.id !== articleId && row.homepageSlot === "hero" && next.get(row.id)?.homepageSlot !== "hero")
      .map((row) => row.id);
    const displacedHeroSlugs = currentRows.filter((row) => displacedHeroIds.includes(row.id)).map((row) => row.slug);
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
    return { article, displacedHeroCount: displacedHeroSlugs.length, displacedHeroSlugs };
  } catch (error) {
    if (error && typeof error === "object") (error as { placementCommitted?: boolean }).placementCommitted = placementCommitted;
    await db.delete(editorialLocks).where(and(eq(editorialLocks.scope, PLACEMENT_LOCK.scope), eq(editorialLocks.owner, lock.owner))).catch(() => undefined);
    throw error;
  }
}

async function reconcileArticle(articleId: number, slot: HomepageSlot, requestedRank?: number, targetStatus?: ArticleStatus) {
  const run = placementTail.then(
    () => reconcileArticleUnlocked(articleId, slot, requestedRank, targetStatus),
    () => reconcileArticleUnlocked(articleId, slot, requestedRank, targetStatus),
  );
  placementTail = run.then(() => undefined, () => undefined);
  return run;
}

export async function placeArticle(articleId: number, slot: HomepageSlot, requestedRank?: number) {
  return reconcileArticle(articleId, slot, requestedRank);
}

/** Archives and removes an article from its source slot in the same batch. */
export async function archiveArticle(articleId: number) {
  return reconcileArticle(articleId, "hidden", undefined, "archived");
}
