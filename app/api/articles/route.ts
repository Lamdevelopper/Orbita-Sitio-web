import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { articles, authors } from "../../../db/schema";
import { cleanText, isEditor, routeError, validSlug } from "../../../lib/api";
import { isArticleStatus, isHomepageSlot, placeArticle } from "../../../lib/editorial";

export async function GET(request: Request) {
  try {
    const includeDrafts = new URL(request.url).searchParams.get("scope") === "all" && isEditor(request);
    const rows = includeDrafts
      ? await getDb().select().from(articles).orderBy(desc(articles.updatedAt)).limit(100)
      : await getDb().select().from(articles).where(eq(articles.status, "published")).orderBy(desc(articles.publishedAt)).limit(100);
    return Response.json({ articles: rows });
  } catch (error) { return routeError(error); }
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const title = cleanText(body.title, 180);
    const slug = cleanText(body.slug, 180);
    const content = cleanText(body.body, 100000);
    const category = cleanText(body.category, 80);
    const authorId = Number(body.authorId);
    if (!title || !validSlug(slug) || !content || !category || !Number.isInteger(authorId)) {
      return Response.json({ error: "Titulo, slug, texto, categoria y autor son obligatorios" }, { status: 400 });
    }
    const [author] = await getDb().select({ id: authors.id }).from(authors).where(eq(authors.id, authorId)).limit(1);
    if (!author) return Response.json({ error: "Selecciona un autor registrado" }, { status: 400 });
    const status = isArticleStatus(body.status) ? body.status : "draft";
    const homepageSlot = isHomepageSlot(body.homepageSlot) ? body.homepageSlot : "feed";
    const now = new Date();
    const [created] = await getDb().insert(articles).values({
      title, slug, body: content, category, authorId, dek: cleanText(body.dek, 420),
      editionId: body.editionId ? Number(body.editionId) : null,
      heroUrl: cleanText(body.heroUrl, 1000) || null, heroCaption: cleanText(body.heroCaption, 500) || null,
      tags: Array.isArray(body.tags) ? body.tags.filter((item) => typeof item === "string").slice(0, 12) as string[] : [],
      images: Array.isArray(body.images) ? body.images as typeof articles.$inferInsert.images : [],
      homepageSlot: "hidden", homepageRank: 0, status,
      readingMinutes: Math.max(1, Math.min(90, Number(body.readingMinutes) || 5)),
      seoTitle: cleanText(body.seoTitle, 180) || null, seoDescription: cleanText(body.seoDescription, 320) || null,
      publishedAt: status === "published" ? now : null, createdAt: now, updatedAt: now,
    }).returning();
    const placement = await placeArticle(created.id, homepageSlot, Number(body.homepageRank));
    return Response.json({ article: placement.article, displacedHeroCount: placement.displacedHeroCount, displacedHeroSlugs: placement.displacedHeroSlugs }, { status: 201 });
  } catch (error) { return routeError(error); }
}