import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articles, authors } from "../../../../db/schema";
import { cleanText, isEditor, routeError, validSlug } from "../../../../lib/api";
import { isArticleStatus, isHomepageSlot, placeArticle } from "../../../../lib/editorial";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const [row] = await getDb().select().from(articles).where(eq(articles.slug, (await params).slug)).limit(1);
    if (!row || row.status !== "published") return Response.json({ error: "No encontrado" }, { status: 404 });
    return Response.json({ article: row });
  } catch (error) { return routeError(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const slug = (await params).slug;
    const body = await request.json() as Record<string, unknown>;
    const nextSlug = body.slug ? cleanText(body.slug, 180) : slug;
    if (!validSlug(nextSlug)) return Response.json({ error: "Slug invalido" }, { status: 400 });
    const [existing] = await getDb().select().from(articles).where(eq(articles.slug, slug)).limit(1);
    if (!existing) return Response.json({ error: "No encontrado" }, { status: 404 });
    const updates: Record<string, unknown> = { updatedAt: new Date(), slug: nextSlug };
    for (const key of ["title", "dek", "body", "category", "heroUrl", "heroCaption", "seoTitle", "seoDescription"]) {
      if (key in body) updates[key] = cleanText(body[key], key === "body" ? 100000 : 1000) || null;
    }
    if ("authorId" in body) {
      const authorId = Number(body.authorId);
      const [author] = await getDb().select({ id: authors.id }).from(authors).where(eq(authors.id, authorId)).limit(1);
      if (!author) return Response.json({ error: "Selecciona un autor registrado" }, { status: 400 });
      updates.authorId = authorId;
    }
    if ("editionId" in body) updates.editionId = body.editionId ? Number(body.editionId) : null;
    if ("readingMinutes" in body) updates.readingMinutes = Math.max(1, Math.min(90, Number(body.readingMinutes) || 5));
    if ("images" in body && Array.isArray(body.images)) updates.images = body.images;
    if (Array.isArray(body.tags)) updates.tags = body.tags.filter((item) => typeof item === "string").slice(0, 12);
    if (isArticleStatus(body.status)) {
      updates.status = body.status;
      if (body.status === "published" && existing.status !== "published") updates.publishedAt = new Date();
      if (body.status === "archived") { updates.homepageSlot = "hidden"; updates.homepageRank = 0; }
    }
    await getDb().update(articles).set(updates).where(eq(articles.id, existing.id));
    const requestedSlot = isArticleStatus(body.status) && body.status === "archived" ? "hidden" : isHomepageSlot(body.homepageSlot) ? body.homepageSlot : existing.homepageSlot;
    const requestedRank = "homepageRank" in body ? Number(body.homepageRank) : existing.homepageRank;
    const placement = await placeArticle(existing.id, requestedSlot, requestedRank);
    return Response.json({ article: placement.article, displacedHeroCount: placement.displacedHeroCount, displacedHeroSlugs: placement.displacedHeroSlugs });
  } catch (error) { return routeError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const [row] = await getDb().update(articles).set({ status: "archived", homepageSlot: "hidden", homepageRank: 0, updatedAt: new Date() }).where(eq(articles.slug, (await params).slug)).returning();
    if (!row) return Response.json({ error: "No encontrado" }, { status: 404 });
    return Response.json({ article: row });
  } catch (error) { return routeError(error); }
}
