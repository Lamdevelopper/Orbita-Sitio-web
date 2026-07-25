import { asc, eq, ne } from "drizzle-orm";
import { getDb } from "../db";
import { articles } from "../db/schema";

export const articleStatuses = ["draft", "review", "scheduled", "published", "archived"] as const;
export const homepageSlots = ["hero", "featured", "feed", "hidden"] as const;

export type ArticleStatus = typeof articleStatuses[number];
export type HomepageSlot = typeof homepageSlots[number];

export function editorialSlug(value: string, fallback: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || fallback;
}

export function isArticleStatus(value: unknown): value is ArticleStatus {
  return articleStatuses.includes(value as ArticleStatus);
}

export function isHomepageSlot(value: unknown): value is HomepageSlot {
  return homepageSlots.includes(value as HomepageSlot);
}

/** Keeps positions unique; selecting a new hero moves the previous hero into the feed. */
export async function placeArticle(articleId: number, slot: HomepageSlot, requestedRank: number) {
  const db = getDb();
  const now = new Date();
  const others = await db.select({ id: articles.id, homepageSlot: articles.homepageSlot, homepageRank: articles.homepageRank })
    .from(articles).where(ne(articles.id, articleId)).orderBy(asc(articles.homepageRank), asc(articles.id));
  const normalizedRank = Math.max(1, Math.floor(Number(requestedRank) || 1));
  const displacedHeroes = slot === "hero" ? others.filter((article) => article.homepageSlot === "hero") : [];

  if (displacedHeroes.length) await Promise.all(displacedHeroes.map((article) =>
    db.update(articles).set({ homepageSlot: "feed", updatedAt: now }).where(eq(articles.id, article.id)),
  ));

  if (slot === "hidden") {
    const [article] = await db.update(articles).set({ homepageSlot: slot, homepageRank: 0, updatedAt: now }).where(eq(articles.id, articleId)).returning();
    return { article, displacedHeroCount: displacedHeroes.length, displacedHeroSlugs: [] as string[] };
  }

  if (slot === "hero") {
    const [article] = await db.update(articles).set({ homepageSlot: slot, homepageRank: 1, updatedAt: now }).where(eq(articles.id, articleId)).returning();
    const feedRows = await db.select({ id: articles.id }).from(articles).where(eq(articles.homepageSlot, "feed")).orderBy(asc(articles.homepageRank), asc(articles.id));
    await Promise.all(feedRows.map((row, index) => db.update(articles).set({ homepageRank: index + 1, updatedAt: now }).where(eq(articles.id, row.id))));
    const displacedSlugs = await Promise.all(displacedHeroes.map(async (h) => { const [r] = await db.select({ slug: articles.slug }).from(articles).where(eq(articles.id, h.id)).limit(1); return r?.slug ?? ""; }));
    return { article, displacedHeroCount: displacedHeroes.length, displacedHeroSlugs: displacedSlugs.filter(Boolean) };
  }

  const ranked = others.filter((article) => article.homepageSlot === slot);
  ranked.splice(Math.min(normalizedRank - 1, ranked.length), 0, { id: articleId, homepageSlot: slot, homepageRank: normalizedRank });
  await Promise.all(ranked.map((row, index) => db.update(articles).set({ homepageSlot: slot, homepageRank: index + 1, updatedAt: now }).where(eq(articles.id, row.id))));
  const [article] = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  return { article, displacedHeroCount: 0, displacedHeroSlugs: [] as string[] };
}
