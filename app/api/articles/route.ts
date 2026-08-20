import { count, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { articles, authors, editions } from "../../../db/schema";
import { checkSameOrigin, isEditor, routeError, validSlug } from "../../../lib/api";
import { isCreatableArticleStatus, isHomepageSlot, normalizeImages, normalizeRank, normalizeReadingMinutes, normalizeTags, boundedText, ARTICLE_LIMITS, PAGINATION_LIMITS, parseOptionalId, ARTICLE_DEFAULTS } from "../../../lib/editorial-contract";
import { placeArticle } from "../../../lib/editorial";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const includeDrafts = params.get("scope") === "all" && isEditor(request);
    // Keep public responses bounded while allowing the authenticated admin to
    // load the complete editorial queue in one request (or paginate it).
    const maxLimit = includeDrafts ? PAGINATION_LIMITS.editorMax : PAGINATION_LIMITS.publicMax;
    const requestedLimit = Number(params.get("limit") || PAGINATION_LIMITS.default);
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), maxLimit) : PAGINATION_LIMITS.default;
    const requestedOffset = Number(params.get("offset") || 0);
    const offset = Number.isFinite(requestedOffset) ? Math.min(Math.max(Math.floor(requestedOffset), 0), PAGINATION_LIMITS.maxOffset) : 0;
    const db = getDb();
    const rows = includeDrafts
      ? await db.select().from(articles).orderBy(desc(articles.updatedAt)).limit(limit).offset(offset)
      : await db.select().from(articles).where(eq(articles.status, "published")).orderBy(desc(articles.publishedAt)).limit(limit).offset(offset);
    const [{ total }] = includeDrafts
      ? await db.select({ total: count() }).from(articles)
      : await db.select({ total: count() }).from(articles).where(eq(articles.status, "published"));
    return Response.json({ articles: rows, pagination: { limit, offset, total: Number(total), hasMore: offset + rows.length < Number(total) } });
  } catch (error) { return routeError(error); }
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = checkSameOrigin(request); if (origin) return origin;
  try {
    const body = await request.json() as Record<string, unknown>;
    const title = boundedText(body.title, ARTICLE_LIMITS.title);
    const slug = boundedText(body.slug, ARTICLE_LIMITS.slug);
    const content = boundedText(body.body, ARTICLE_LIMITS.body);
    const category = boundedText(body.category, ARTICLE_LIMITS.category);
    const authorId = parseOptionalId(body.authorId);
    if (!title || !validSlug(slug) || !content || !category || typeof authorId !== "number") {
      return Response.json({ error: "Titulo, slug, texto, categoria y autor son obligatorios" }, { status: 400 });
    }
    const [author] = await getDb().select({ id: authors.id }).from(authors).where(eq(authors.id, authorId)).limit(1);
    if (!author) return Response.json({ error: "Selecciona un autor registrado" }, { status: 400 });
    if (body.status !== undefined && !isCreatableArticleStatus(body.status)) {
      return Response.json({ error: "Estado no permitido al crear el artículo" }, { status: 400 });
    }
    if (body.homepageSlot !== undefined && !isHomepageSlot(body.homepageSlot)) {
      return Response.json({ error: "Ubicación inválida" }, { status: 400 });
    }
    const status = isCreatableArticleStatus(body.status) ? body.status : ARTICLE_DEFAULTS.status;
    const homepageSlot = isHomepageSlot(body.homepageSlot) ? body.homepageSlot : ARTICLE_DEFAULTS.homepageSlot;
    const images = normalizeImages(body.images);
    if (!images) return Response.json({ error: "Imágenes inválidas" }, { status: 400 });
    if (body.tags !== undefined && !Array.isArray(body.tags)) return Response.json({ error: "Tags inválidos" }, { status: 400 });
    const editionId = parseOptionalId(body.editionId);
    if (editionId === undefined && body.editionId !== undefined && body.editionId !== "") {
      return Response.json({ error: "Edición inválida" }, { status: 400 });
    }
    if (typeof editionId === "number") {
      const [edition] = await getDb().select({ id: editions.id }).from(editions).where(eq(editions.id, editionId)).limit(1);
      if (!edition) return Response.json({ error: "La edición seleccionada no existe" }, { status: 400 });
    }
    const now = new Date();
    const db = getDb();
    const [created] = await db.insert(articles).values({
      title, slug, body: content, category, authorId, dek: boundedText(body.dek, ARTICLE_LIMITS.dek),
      editionId: editionId ?? null,
      heroUrl: boundedText(body.heroUrl, ARTICLE_LIMITS.heroUrl) || null, heroCaption: boundedText(body.heroCaption, ARTICLE_LIMITS.caption) || null,
      tags: normalizeTags(body.tags),
      images: images as typeof articles.$inferInsert.images,
      homepageSlot: "hidden", homepageRank: 0, status,
      readingMinutes: normalizeReadingMinutes(body.readingMinutes),
      seoTitle: boundedText(body.seoTitle, ARTICLE_LIMITS.seoTitle) || null, seoDescription: boundedText(body.seoDescription, ARTICLE_LIMITS.seoDescription) || null,
      publishedAt: status === "published" ? now : null, createdAt: now, updatedAt: now,
    }).returning();
    let placement;
    try {
      placement = await placeArticle(created.id, homepageSlot, normalizeRank(body.homepageRank));
    } catch (error) {
      // D1 cannot include a returning INSERT in the placement batch; remove the
      // hidden row if placement cannot be reconciled.
      await db.delete(articles).where(eq(articles.id, created.id));
      throw error;
    }
    return Response.json({ article: placement.article, displacedHeroCount: placement.displacedHeroCount, displacedHeroSlugs: placement.displacedHeroSlugs }, { status: 201 });
  } catch (error) { return routeError(error); }
}
