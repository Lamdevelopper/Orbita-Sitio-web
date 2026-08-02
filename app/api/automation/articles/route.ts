import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articles, authors, editions } from "../../../../db/schema";
import { checkSameOrigin, cleanText, isCodexArticleApiClient, routeError, validSlug } from "../../../../lib/api";
import { checkRateLimit, getClientIp, limits } from "../../../../lib/rate-limit";
import { isArticleStatus, placeArticle } from "../../../../lib/editorial";

const MAX_BODY_BYTES = 120_000;
const MAX_IMAGES = 12;
const MAX_TAGS = 12;

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
    const title = cleanText(body.title, 180);
    const slug = cleanText(body.slug, 180);
    const content = cleanText(body.body, 100000);
    const category = cleanText(body.category, 80);
    const authorId = boundedInteger(body.authorId, 0, 1, Number.MAX_SAFE_INTEGER);
    const readingMinutes = boundedInteger(body.readingMinutes, 5, 1, 90);
    const requestedStatus = body.status === undefined ? "draft" : String(body.status);
    const requestOrigin = new URL(request.url).origin;

    if (!title || !validSlug(slug) || !content || !category || !authorId || !readingMinutes) {
      return Response.json({ error: "title, slug, body, category y authorId son obligatorios" }, { status: 400 });
    }
    if (!isArticleStatus(requestedStatus) || !["draft", "review"].includes(requestedStatus)) {
      return Response.json({ error: "La automatizacion solo puede crear draft o review" }, { status: 400 });
    }
    if (body.homepageSlot !== undefined && body.homepageSlot !== "hidden") {
      return Response.json({ error: "La automatizacion no puede colocar articulos en portada" }, { status: 400 });
    }

    const heroUrl = body.heroUrl === undefined ? null : sameOriginMediaUrl(body.heroUrl, requestOrigin, 1000);
    if (body.heroUrl !== undefined && !heroUrl) return Response.json({ error: "heroUrl debe ser media local" }, { status: 400 });

    const rawImages = body.images === undefined ? [] : body.images;
    if (!Array.isArray(rawImages) || rawImages.length > MAX_IMAGES) {
      return Response.json({ error: "images invalido" }, { status: 400 });
    }
    const images: Array<{ ref: string; url: string; caption?: string }> = [];
    for (const image of rawImages) {
      if (!image || typeof image !== "object") return Response.json({ error: "images invalido" }, { status: 400 });
      const item = image as Record<string, unknown>;
      const ref = cleanText(item.ref, 80);
      const url = sameOriginMediaUrl(item.url, requestOrigin, 1000);
      if (!ref || !url) return Response.json({ error: "Cada imagen requiere ref y media local" }, { status: 400 });
      images.push({ ref, url, ...(item.caption ? { caption: cleanText(item.caption, 500) } : {}) });
    }

    const tags = Array.isArray(body.tags)
      ? body.tags.filter((item): item is string => typeof item === "string").slice(0, MAX_TAGS).map((item) => cleanText(item, 80))
      : [];
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
      dek: cleanText(body.dek, 420),
      heroUrl,
      heroCaption: cleanText(body.heroCaption, 500) || null,
      homepageSlot: "hidden",
      homepageRank: 0,
      tags,
      images,
      status: requestedStatus,
      readingMinutes,
      seoTitle: cleanText(body.seoTitle, 180) || null,
      seoDescription: cleanText(body.seoDescription, 320) || null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    }).returning();

    const placement = await placeArticle(created.id, "hidden", 0);
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
