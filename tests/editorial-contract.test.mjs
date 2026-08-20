import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ARTICLE_LIMITS,
  ARTICLE_DEFAULTS,
  ARTICLE_STATUS_LABELS,
  EDITORIAL_LOCALE,
  EDITORIAL_TIMEZONE,
  homepageSlots,
  editorialSlug,
  isCreatableArticleStatus,
  normalizeRank,
  normalizeReadingMinutes,
  normalizeImages,
  parseDateOnlyUtc,
  parseStrictBoolean,
  normalizeTags,
} from "../lib/editorial-contract.ts";
import { calculatePlacements } from "../lib/editorial-model.ts";

test("canonical article contract clamps fields and excludes archived creation", () => {
  assert.equal(ARTICLE_LIMITS.title, 180);
  assert.equal(normalizeReadingMinutes(undefined), 5);
  assert.equal(normalizeReadingMinutes(999), 90);
  assert.equal(normalizeReadingMinutes(-2), 1);
  assert.equal(normalizeReadingMinutes(4.9), 4);
  assert.equal(normalizeRank(undefined), undefined);
  assert.equal(normalizeRank(0), undefined);
  assert.equal(normalizeRank(2.8), 2);
  assert.equal(isCreatableArticleStatus("published"), true);
  assert.equal(isCreatableArticleStatus("archived"), false);
  assert.equal(ARTICLE_DEFAULTS.readingMinutes, 5);
  assert.equal(ARTICLE_STATUS_LABELS.review, "En revisión");
  assert.equal(EDITORIAL_LOCALE, "es-MX");
  assert.equal(EDITORIAL_TIMEZONE, "America/Mexico_City");
});

test("schema enums stay in parity with the pure contract", () => {
  const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(schema, /import \{ ARTICLE_DEFAULTS, articleStatuses, homepageSlots \} from "\.\.\/lib\/editorial-contract"/);
  assert.match(schema, /homepage_slot[^\n]*enum: homepageSlots/);
  assert.match(schema, /status[^\n]*enum: articleStatuses/);
  assert.deepEqual([...homepageSlots], ["hero", "featured", "feed", "hidden"]);
});

test("contract uses pure slug normalization and bounded tags", () => {
  assert.equal(editorialSlug("Árbol y espacio", "fallback"), "arbol-y-espacio");
  assert.equal(editorialSlug("!!!", "fallback"), "fallback");
  assert.deepEqual(normalizeTags([" a ", "", 3, "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"]), ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"]);
  assert.equal(normalizeTags(["x".repeat(100)])[0].length, 80);
});

test("missing placement rank appends to its destination slot", () => {
  const rows = [
    { id: 1, homepageSlot: "featured", homepageRank: 1 },
    { id: 2, homepageSlot: "featured", homepageRank: 2 },
    { id: 3, homepageSlot: "feed", homepageRank: 1 },
  ];
  const result = calculatePlacements(rows, 3, "featured");
  assert.deepEqual(result.filter((row) => row.homepageSlot === "featured").map((row) => row.id), [1, 2, 3]);
  assert.deepEqual(result.filter((row) => row.homepageSlot === "featured").map((row) => row.homepageRank), [1, 2, 3]);
});

test("image contract rejects malformed metadata and bounds valid entries", () => {
  assert.deepEqual(normalizeImages([{ ref: " IMAGEN 1 ", url: " /media/a.png ", caption: " pie " }]), [{ ref: "IMAGEN 1", url: "/media/a.png", caption: "pie" }]);
  assert.equal(normalizeImages(null), null);
  assert.equal(normalizeImages([{ ref: "x", url: "" }]), null);
  assert.equal(normalizeImages([{ ref: "x", url: "/a", caption: 3 }]), null);
  assert.equal(normalizeImages(Array.from({ length: 13 }, (_, index) => ({ ref: String(index), url: "/a" }))), null);
});

test("edition date and boolean parsers are strict", () => {
  assert.equal(parseDateOnlyUtc("2026-02-30"), undefined);
  assert.equal(parseDateOnlyUtc("2026-02-01T00:00:00Z"), undefined);
  assert.equal(parseDateOnlyUtc("2026-02-01")?.toISOString(), "2026-02-01T00:00:00.000Z");
  assert.equal(parseStrictBoolean("false"), undefined);
  assert.equal(parseStrictBoolean(false), false);
});
