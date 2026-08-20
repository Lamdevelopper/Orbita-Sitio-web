import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articles, authors, editions } from "../../../../db/schema";
import { checkSameOrigin, isEditor, routeError, validSlug } from "../../../../lib/api";
import { archiveArticle, placeArticle } from "../../../../lib/editorial";
import { ARTICLE_LIMITS, boundedText, isArticleStatus, isHomepageSlot, normalizeImages, normalizeRank, normalizeReadingMinutes, normalizeTags, parseOptionalId } from "../../../../lib/editorial-contract";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const [row] = await getDb().select().from(articles).where(eq(articles.slug, (await params).slug)).limit(1);
    if (!row || row.status !== "published") return Response.json({ error: "No encontrado" }, { status: 404 });
    return Response.json({ article: row });
  } catch (error) { return routeError(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = checkSameOrigin(request); if (origin) return origin;
  try {
    const slug = (await params).slug;
    const body = await request.json() as Record<string, unknown>;
    const nextSlug = "slug" in body ? boundedText(body.slug, ARTICLE_LIMITS.slug) : slug;
    if ("slug" in body && !nextSlug) return Response.json({ error: "Slug invalido" }, { status: 400 });
    if (!validSlug(nextSlug)) return Response.json({ error: "Slug invalido" }, { status: 400 });
    const [existing] = await getDb().select().from(articles).where(eq(articles.slug, slug)).limit(1);
    if (!existing) return Response.json({ error: "No encontrado" }, { status: 404 });
    if (body.status !== undefined && !isArticleStatus(body.status)) {
      return Response.json({ error: "Estado inválido" }, { status: 400 });
    }
    if (body.homepageSlot !== undefined && !isHomepageSlot(body.homepageSlot)) {
      return Response.json({ error: "Ubicación inválida" }, { status: 400 });
    }
    const updates: Record<string, unknown> = { updatedAt: new Date(), slug: nextSlug };
    const fieldLimits: Record<string, number> = {
      title: ARTICLE_LIMITS.title, dek: ARTICLE_LIMITS.dek, body: ARTICLE_LIMITS.body,
      category: ARTICLE_LIMITS.category, heroUrl: ARTICLE_LIMITS.heroUrl, heroCaption: ARTICLE_LIMITS.caption,
      seoTitle: ARTICLE_LIMITS.seoTitle, seoDescription: ARTICLE_LIMITS.seoDescription,
    };
    for (const [key, limit] of Object.entries(fieldLimits)) {
      if (key in body) {
        const value = boundedText(body[key], limit);
        if (["title", "body", "category"].includes(key) && !value) {
          return Response.json({ error: `${key} no puede estar vacío` }, { status: 400 });
        }
        updates[key] = key === "dek" ? value : value || null;
      }
    }
    if ("authorId" in body) {
      const authorId = parseOptionalId(body.authorId);
      if (typeof authorId !== "number") return Response.json({ error: "Autor inválido" }, { status: 400 });
      const [author] = await getDb().select({ id: authors.id }).from(authors).where(eq(authors.id, authorId)).limit(1);
      if (!author) return Response.json({ error: "Selecciona un autor registrado" }, { status: 400 });
      updates.authorId = authorId;
    }
    if ("editionId" in body) {
      const editionId = parseOptionalId(body.editionId);
      if (editionId === undefined && body.editionId !== "") return Response.json({ error: "Edición inválida" }, { status: 400 });
      if (typeof editionId === "number") {
        const [edition] = await getDb().select({ id: editions.id }).from(editions).where(eq(editions.id, editionId)).limit(1);
        if (!edition) return Response.json({ error: "La edición seleccionada no existe" }, { status: 400 });
      }
      updates.editionId = editionId ?? null;
    }
    if ("readingMinutes" in body) updates.readingMinutes = normalizeReadingMinutes(body.readingMinutes);
    if ("images" in body) {
      const images = normalizeImages(body.images);
      if (!images) return Response.json({ error: "Imágenes inválidas" }, { status: 400 });
      updates.images = images;
    }
    if (body.tags !== undefined && !Array.isArray(body.tags)) return Response.json({ error: "Tags inválidos" }, { status: 400 });
    if (Array.isArray(body.tags)) updates.tags = normalizeTags(body.tags);
    if (isArticleStatus(body.status)) {
      if (body.status !== "archived") updates.status = body.status;
      if (body.status === "published" && existing.status !== "published") updates.publishedAt = new Date();
    }
    const db = getDb();
    const originalMetadata: Record<string, unknown> = {};
    for (const key of ["slug", "title", "dek", "body", "category", "heroUrl", "heroCaption", "seoTitle", "seoDescription", "authorId", "editionId", "readingMinutes", "images", "tags", "status", "publishedAt"]) {
      if (key in updates) originalMetadata[key] = (existing as unknown as Record<string, unknown>)[key];
    }
    await db.update(articles).set(updates).where(eq(articles.id, existing.id));
    const restoringArchived = existing.status === "archived" && isArticleStatus(body.status) && body.status !== "archived";
    const mayPlace = existing.status !== "archived" || restoringArchived;
    const requestedSlot = !mayPlace || (isArticleStatus(body.status) && body.status === "archived")
      ? "hidden"
      : isHomepageSlot(body.homepageSlot) ? body.homepageSlot : existing.homepageSlot;
    const requestedRank = "homepageRank" in body ? normalizeRank(body.homepageRank) : existing.homepageRank;
    let placement;
    try {
      placement = isArticleStatus(body.status) && body.status === "archived"
        ? await archiveArticle(existing.id)
        : await placeArticle(existing.id, requestedSlot, requestedRank);
    } catch (error) {
      // Metadata was written before placement because D1 cannot wrap the
      // read/compute/write flow in BEGIN. Restore it when no placement batch
      // committed; a committed placement is left intact.
      if (!(error && typeof error === "object" && (error as { placementCommitted?: boolean }).placementCommitted)) {
        await db.update(articles).set({ ...originalMetadata, updatedAt: existing.updatedAt }).where(eq(articles.id, existing.id)).catch(() => undefined);
      }
      throw error;
    }
    return Response.json({ article: placement.article, displacedHeroCount: placement.displacedHeroCount, displacedHeroSlugs: placement.displacedHeroSlugs });
  } catch (error) { return routeError(error); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = checkSameOrigin(request); if (origin) return origin;
  try {
    const [existing] = await getDb().select({ id: articles.id }).from(articles).where(eq(articles.slug, (await params).slug)).limit(1);
    if (!existing) return Response.json({ error: "No encontrado" }, { status: 404 });
    const placement = await archiveArticle(existing.id);
    return Response.json({ article: placement.article });
  } catch (error) { return routeError(error); }
}
