import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articles, authors, editions } from "../../../../db/schema";
import { checkSameOrigin, isEditor, routeError, validSlug } from "../../../../lib/api";
import { placeArticle } from "../../../../lib/editorial";
import { ARTICLE_DEFAULTS, ARTICLE_LIMITS, AUTHOR_LIMITS, boundedText, editorialSlug, isCreatableArticleStatus, isHomepageSlot, normalizeImages, normalizeRank, normalizeReadingMinutes, normalizeTags, parseOptionalId } from "../../../../lib/editorial-contract";

async function getOrCreateAuthor(name: string) {
  const db = getDb();
  const clean = boundedText(name, AUTHOR_LIMITS.name);
  if (!clean) throw new Error("El autor es obligatorio");
  const slug = editorialSlug(clean, "equipo-orbita");
  const [existing] = await db.select().from(authors).where(eq(authors.slug, slug)).limit(1);
  if (existing) return existing.id;
  const now = new Date();
  const [created] = await db.insert(authors).values({ name: clean, slug, bio: "", area: "", createdAt: now }).returning();
  return created.id;
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = checkSameOrigin(request); if (origin) return origin;
  try {
    const body = await request.json() as Record<string, unknown>;
    const title = boundedText(body.title, ARTICLE_LIMITS.title);
    const slug = boundedText(body.slug, ARTICLE_LIMITS.slug) || editorialSlug(title, "articulo-sin-titulo");
    if (!title || !validSlug(slug)) return Response.json({ error: "Título y slug válidos son obligatorios" }, { status: 400 });
    const content = boundedText(body.body, ARTICLE_LIMITS.body);
    const category = boundedText(body.category, ARTICLE_LIMITS.category);
    const authorName = boundedText(body.author, AUTHOR_LIMITS.name);
    if (!content || !category || !authorName) return Response.json({ error: "Cuerpo, autor y categoría son obligatorios" }, { status: 400 });

    const now = new Date();
    if (body.status !== undefined && !isCreatableArticleStatus(body.status)) return Response.json({ error: "Estado no permitido al importar" }, { status: 400 });
    if (body.homepageSlot !== undefined && !isHomepageSlot(body.homepageSlot)) return Response.json({ error: "Ubicación inválida" }, { status: 400 });
    const status = isCreatableArticleStatus(body.status) ? body.status : ARTICLE_DEFAULTS.status;
    const homepageSlot = isHomepageSlot(body.homepageSlot) ? body.homepageSlot : ARTICLE_DEFAULTS.homepageSlot;
    const editionId = parseOptionalId(body.editionId);
    if (editionId === undefined && body.editionId !== undefined && body.editionId !== "") return Response.json({ error: "Edición inválida" }, { status: 400 });
    if (typeof editionId === "number") {
      const [edition] = await getDb().select({ id: editions.id }).from(editions).where(eq(editions.id, editionId)).limit(1);
      if (!edition) return Response.json({ error: "La edición seleccionada no existe" }, { status: 400 });
    }

    const authorId = await getOrCreateAuthor(authorName);

    const imageEntries = normalizeImages(body.images);
    if (!imageEntries) return Response.json({ error: "Imágenes inválidas" }, { status: 400 });
    if (body.tags !== undefined && !Array.isArray(body.tags)) return Response.json({ error: "Tags inválidos" }, { status: 400 });

    // Insert in hidden state first, then let placeArticle handle slot and rank.
    const db = getDb();
    const [article] = await db.insert(articles).values({
      title, slug, body: content, category,
      authorId,
      dek: boundedText(body.dek, ARTICLE_LIMITS.dek),
      editionId: editionId ?? null,
      heroUrl: boundedText(body.heroUrl, ARTICLE_LIMITS.heroUrl) || null,
      heroCaption: boundedText(body.heroCaption, ARTICLE_LIMITS.caption) || null,
      homepageSlot: "hidden", homepageRank: 0,
      tags: normalizeTags(body.tags),
      images: imageEntries,
      status, readingMinutes: normalizeReadingMinutes(body.readingMinutes),
      seoTitle: boundedText(body.seoTitle, ARTICLE_LIMITS.seoTitle) || null,
      seoDescription: boundedText(body.seoDescription, ARTICLE_LIMITS.seoDescription) || null,
      publishedAt: status === "published" ? now : null,
      createdAt: now, updatedAt: now,
    }).returning();

    let placement;
    try {
      placement = await placeArticle(article.id, homepageSlot, normalizeRank(body.homepageRank));
    } catch (error) {
      await db.delete(articles).where(eq(articles.id, article.id));
      throw error;
    }
    return Response.json({
      article: placement.article,
      success: true,
      displacedHeroCount: placement.displacedHeroCount,
      displacedHeroSlugs: placement.displacedHeroSlugs,
    }, { status: 201 });
  } catch (error) { return routeError(error); }
}
