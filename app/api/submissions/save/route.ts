import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articles, authors } from "../../../../db/schema";
import { cleanText, isEditor, routeError, validSlug } from "../../../../lib/api";

async function getOrCreateAuthor(name: string) {
  const db = getDb();
  const clean = name || "Equipo Órbita";
  const slug = clean.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "equipo-orbita";
  const [existing] = await db.select().from(authors).where(eq(authors.slug, slug)).limit(1);
  if (existing) return existing.id;
  const now = new Date();
  const [created] = await db.insert(authors).values({ name: clean, slug, bio: "Colaborador de Órbita.", area: "Aerospace AAFI", createdAt: now }).returning();
  return created.id;
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const title = cleanText(body.title, 180);
    const slug = cleanText(body.slug, 180) || title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "articulo-sin-titulo";
    if (!title || !validSlug(slug)) return Response.json({ error: "Título y slug válidos son obligatorios" }, { status: 400 });
    const content = cleanText(body.body, 100000);
    const category = cleanText(body.category, 80) || "Artículo";
    if (!content) return Response.json({ error: "El cuerpo del artículo es obligatorio" }, { status: 400 });

    const now = new Date();
    const status = ["draft", "review", "scheduled", "published"].includes(String(body.status))
      ? String(body.status) as "draft" | "review" | "scheduled" | "published"
      : "draft";
    const homepageSlot = ["hero", "featured", "feed", "hidden"].includes(String(body.homepageSlot))
      ? String(body.homepageSlot) as "hero" | "featured" | "feed" | "hidden"
      : "feed";

    const authorName = cleanText(body.author, 120) || "Equipo Órbita";
    const authorId = await getOrCreateAuthor(authorName);

    const imageEntries = Array.isArray(body.images)
      ? (body.images as Array<{ ref: string; url: string; caption?: string }>).filter((img) => img.ref && img.url)
      : [];

    const [article] = await getDb().insert(articles).values({
      title, slug, body: content, category,
      authorId,
      dek: cleanText(body.dek, 420),
      editionId: body.editionId ? Number(body.editionId) : null,
      heroUrl: cleanText(body.heroUrl, 1000) || null,
      heroCaption: cleanText(body.heroCaption, 500) || null,
      homepageSlot, homepageRank: Math.max(0, Number(body.homepageRank) || 0),
      tags: Array.isArray(body.tags) ? body.tags.filter((item: unknown) => typeof item === "string").slice(0, 12) as string[] : [],
      images: imageEntries,
      status, readingMinutes: Math.max(1, Math.min(90, Number(body.readingMinutes) || 5)),
      seoTitle: cleanText(body.seoTitle, 180) || null,
      seoDescription: cleanText(body.seoDescription, 320) || null,
      publishedAt: status === "published" ? now : null,
      createdAt: now, updatedAt: now,
    }).returning();
    return Response.json({ article, success: true }, { status: 201 });
  } catch (error) { return routeError(error); }
}