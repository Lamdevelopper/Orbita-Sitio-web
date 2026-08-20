import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculatePlacements } from "../lib/editorial-model.ts";

const seed = [
  { id: 1, homepageSlot: "hero", homepageRank: 1 },
  { id: 2, homepageSlot: "featured", homepageRank: 1 },
  { id: 3, homepageSlot: "featured", homepageRank: 2 },
  { id: 4, homepageSlot: "feed", homepageRank: 1 },
  { id: 5, homepageSlot: "feed", homepageRank: 2 },
  { id: 6, homepageSlot: "hidden", homepageRank: 0 },
];

function rowsBySlot(rows, slot) {
  return rows.filter((row) => row.homepageSlot === slot).sort((a, b) => a.homepageRank - b.homepageRank).map((row) => row.id);
}

function ranksAreContiguous(rows, slot) {
  const ranks = rows.filter((row) => row.homepageSlot === slot).sort((a, b) => a.homepageRank - b.homepageRank).map((row) => row.homepageRank);
  assert.deepEqual(ranks, ranks.map((_, index) => index + 1));
}

test("moving an article to hero preserves every featured article", () => {
  const result = calculatePlacements(seed, 4, "hero", 1);
  assert.equal(result.filter((row) => row.homepageSlot === "hero").length, 1);
  assert.deepEqual(rowsBySlot(result, "featured"), [2, 3]);
  ranksAreContiguous(result, "featured");
  ranksAreContiguous(result, "feed");
});

test("inserting into featured changes only the featured ordering plus its source", () => {
  const result = calculatePlacements(seed, 4, "featured", 2);
  assert.deepEqual(rowsBySlot(result, "featured"), [2, 4, 3]);
  assert.deepEqual(rowsBySlot(result, "feed"), [5]);
  assert.equal(result.find((row) => row.id === 1)?.homepageSlot, "hero");
  ranksAreContiguous(result, "featured");
  ranksAreContiguous(result, "feed");
});

test("moving featured to feed compacts featured and inserts in feed", () => {
  const result = calculatePlacements(seed, 2, "feed", 2);
  assert.deepEqual(rowsBySlot(result, "featured"), [3]);
  assert.deepEqual(rowsBySlot(result, "feed"), [4, 2, 5]);
  assert.equal(result.find((row) => row.id === 1)?.homepageRank, 1);
  ranksAreContiguous(result, "featured");
  ranksAreContiguous(result, "feed");
});

test("moving an article to hidden always uses rank zero", () => {
  const result = calculatePlacements(seed, 2, "hidden", 99);
  assert.equal(result.find((row) => row.id === 2)?.homepageRank, 0);
  assert.deepEqual(rowsBySlot(result, "featured"), [3]);
  assert.equal(result.find((row) => row.id === 1)?.homepageSlot, "hero");
});

test("hiding a feed article compacts the feed it came from", () => {
  const result = calculatePlacements(seed, 4, "hidden", 0);
  assert.deepEqual(rowsBySlot(result, "feed"), [5]);
  assert.equal(result.find((row) => row.id === 5)?.homepageRank, 1);
});

test("repairs duplicate legacy heroes without disturbing featured stories", () => {
  const malformed = [
    { id: 1, homepageSlot: "hero", homepageRank: 8 },
    { id: 7, homepageSlot: "hero", homepageRank: 2 },
    ...seed.filter((row) => row.id !== 1),
  ];
  const result = calculatePlacements(malformed, 5, "feed", 1);
  const heroes = result.filter((row) => row.homepageSlot === "hero");
  assert.equal(heroes.length, 1);
  assert.equal(heroes[0].id, 7);
  assert.equal(heroes[0].homepageRank, 1);
  assert.deepEqual(rowsBySlot(result, "featured"), [2, 3]);
});

test("article archive routes delegate placement to archiveArticle", async () => {
  const route = await readFile(new URL("../app/api/articles/[slug]/route.ts", import.meta.url), "utf8");
  assert.match(route, /archiveArticle\(existing\.id\)/);
  assert.doesNotMatch(route, /updates\.homepageSlot\s*=/);
});
