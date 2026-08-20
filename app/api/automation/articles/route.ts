import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articles, authors, editions } from "../../../../db/schema";
import { checkSameOrigin, cleanText, isCodexArticleApiClient, routeError, validSlug } from "../../../../lib/api";
import { checkRateLimit, getClientIp, limits } from "../../../../lib/rate-limit";
import { ARTICLE_DEFAULTS, ARTICLE_LIMITS, isCreatableArticleStatus, normalizeImages, normalizeReadingMinutes, normalizeTags } from "../../../../lib/editorial-contract";
import { placeArticle } from "../../../../lib/editorial";

const MAX_BODY_BYTES = 120_000;

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number | null {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function sameOriginMediaUrl(value: unknown, requestOrigin: string, maxLength: number): string | null {
  if (typeof value !== "string" || value.length > maxLength) return null;
  const candidate = value.trim();
  if (!candidate || candidate.includes("..")) return null;
  if (candidate.startsWith("/media/editorial/")) return candidate;
  try {
    const url = new URL(candidate);
    return url.origin === requestOrigin && url.pathname.startsWith("/media/editorial/")
      ? `${url.pathname}${url.search}`
      : null;
  } catch {
    return null;
  }
}

function isUniqueSlugError(error: unknown): boolean {
  return error instanceof Error && /unique.*articles[_ ]slug|articles\.slug/i.test(error.message);
}

/**
 * Server-to-server Codex ingestion boundary.
 *
 * This route intentionally creates only hidden draft/review articles. Human
 * OAuth routes remain the only path that can publish or arrange homepage
 * placement. The durable slug uniqueness constraint is the retry/idempotency
 * boundary; callers must send a stable Idempotency-Key for observability.
 */
export async function POST(request: Request) {
  const rate = checkRateLimit(`automation:${getClientIp(request)}`, limits.automation);
  if (!rate.allowed) {
    return Response.json({ error: "Demasiadas solicitudes" }, {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfter), "Cache-Control": "no-store" },
    });
  }

  // Count failed guesses too; otherwise the bearer verifier becomes a cheap
  // unlimited oracle for token brute force.
  if (!(await isCodexArticleApiClient(request))) return Response.json({ error: "No autorizado" }, { status: 401 });

  const origin = checkSameOrigin(request);
  if (origin) return origin;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json({ error: "Content-Type debe ser application/json" }, { status: 415 });
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? "";
  if (!/^[A-Za-z0-9._:-]{16,128}$/.test(idempotencyKey)) {
    return Response.json({ error: "Idempotency-Key invalido" }, { status: 400 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Cuerpo demasiado grande" }, { status: 413 });
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return Response.json({ error: "Cuerpo demasiado grande" }, { status: 413 });
    }

    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const title = cleanText(body.title, ARTICLE_LIMITS.title);
    const slug = cleanText(body.slug, ARTICLE_LIMITS.slug);
    const content = cleanText(body.body, ARTICLE_LIMITS.body);
    const category = cleanText(body.category, ARTICLE_LIMITS.category);
    const authorId = boundedInteger(body.authorId, 0, 1, Number.MAX_SAFE_INTEGER);
    const readingInput = body.readingMinutes === undefined
      ? ARTICLE_DEFAULTS.readingMinutes
      : boundedInteger(body.readingMinutes, 0, ARTICLE_LIMITS.readingMin, ARTICLE_LIMITS.readingMax);
    const readingMinutes = readingInput === null ? null : normalizeReadingMinutes(readingInput);
    const requestedStatus = body.status === undefined ? ARTICLE_DEFAULTS.status : String(body.status);
    const requestOrigin = new URL(request.url).origin;

    if (!title || !validSlug(slug) || !content || !category || !authorId || !readingMinutes) {
      return Response.json({ error: "title, slug, body, category y authorId son obligatorios" }, { status: 400 });
    }
    if (!isCreatableArticleStatus(requestedStatus) || !["draft", "review"].includes(requestedStatus)) {
      return Response.json({ error: "La automatizacion solo puede crear draft o review" }, { status: 400 });
    }
    if (body.homepageSlot !== undefined && body.homepageSlot !== "hidden") {
      return Response.json({ error: "La automatizacion no puede colocar articulos en portada" }, { status: 400 });
    }

    const heroUrl = body.heroUrl === undefined ? null : sameOriginMediaUrl(body.heroUrl, requestOrigin, ARTICLE_LIMITS.heroUrl);
    if (body.heroUrl !== undefined && !heroUrl) return Response.json({ error: "heroUrl debe ser media local" }, { status: 400 });

    const normalizedImages = normalizeImages(body.images);
    if (normalizedImages === null) {
      return Response.json({ error: "images invalido" }, { status: 400 });
    }
    const images: Array<{ ref: string; url: string; caption?: string }> = [];
    for (const image of normalizedImages) {
      const ref = image.ref;
      const url = sameOriginMediaUrl(image.url, requestOrigin, ARTICLE_LIMITS.imageUrl);
      if (!ref || !url) return Response.json({ error: "Cada imagen requiere ref y media local" }, { status: 400 });
      images.push({ ref, url, ...(image.caption ? { caption: image.caption } : {}) });
    }

    const tags = normalizeTags(body.tags);
    if (body.tags !== undefined && !Array.isArray(body.tags)) return Response.json({ error: "tags invalido" }, { status: 400 });

    const editionId = body.editionId === undefined || body.editionId === null || body.editionId === ""
      ? null
      : boundedInteger(body.editionId, 0, 1, Number.MAX_SAFE_INTEGER);
    if (body.editionId !== undefined && body.editionId !== null && body.editionId !== "" && !editionId) {
      return Response.json({ error: "editionId invalido" }, { status: 400 });
    }

    const db = getDb();
    const [existingSlug] = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, slug)).limit(1);
    if (existingSlug) return Response.json({ error: "El slug ya existe", articleId: existingSlug.id }, { status: 409 });

    const [author] = await db.select({ id: authors.id }).from(authors).where(eq(authors.id, authorId)).limit(1);
    if (!author) return Response.json({ error: "authorId no existe" }, { status: 400 });
    if (editionId !== null) {
      const [edition] = await db.select({ id: editions.id }).from(editions).where(eq(editions.id, editionId)).limit(1);
      if (!edition) return Response.json({ error: "editionId no existe" }, { status: 400 });
    }

    const now = new Date();
    const [created] = await db.insert(articles).values({
      title,
      slug,
      body: content,
      category,
      authorId,
      editionId,
      dek: cleanText(body.dek, ARTICLE_LIMITS.dek),
      heroUrl,
      heroCaption: cleanText(body.heroCaption, ARTICLE_LIMITS.caption) || null,
      homepageSlot: "hidden",
      homepageRank: 0,
      tags,
      images,
      status: requestedStatus,
      readingMinutes,
      seoTitle: cleanText(body.seoTitle, ARTICLE_LIMITS.seoTitle) || null,
      seoDescription: cleanText(body.seoDescription, ARTICLE_LIMITS.seoDescription) || null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    }).returning();

    let placement;
    try {
      placement = await placeArticle(created.id, "hidden", 0);
    } catch (error) {
      // Placement is a second D1 batch because the auto-increment id is only
      // known after INSERT; remove the hidden row on failure so the slug can be retried.
      await db.delete(articles).where(eq(articles.id, created.id));
      throw error;
    }
    return Response.json({
      success: true,
      idempotencyKey,
      article: placement.article,
      automationScope: "draft-review-hidden",
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isUniqueSlugError(error)) return Response.json({ error: "El slug ya existe" }, { status: 409 });
    if (error instanceof SyntaxError) return Response.json({ error: "JSON invalido" }, { status: 400 });
    return routeError(error);
  }
}
