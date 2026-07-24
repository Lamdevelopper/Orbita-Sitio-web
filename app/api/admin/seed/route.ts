import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articles, authors } from "../../../../db/schema";
import { isEditor, routeError } from "../../../../lib/api";
import { articles as staticArticles } from "../../../../lib/content";

async function getOrCreateAuthor(name: string) {
  const db = getDb();
  const clean = name || "Equipo Orbita";
  const slug = clean.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "equipo-orbita";
  const [existing] = await db.select().from(authors).where(eq(authors.slug, slug)).limit(1);
  if (existing) return existing.id;
  const now = new Date();
  const [created] = await db.insert(authors).values({ name: clean, slug, bio: "Colaborador de Orbita.", area: "Aerospace AAFI", createdAt: now }).returning();
  return created.id;
}

function bodyToMarkdown(body: typeof staticArticles[number]["body"]): string {
  return body.map(section => {
    const lines: string[] = [];
    if (section.heading) lines.push("## " + section.heading);
    if (section.paragraphs.length > 0) lines.push(section.paragraphs.join("\n\n"));
    if (section.quote) lines.push("> " + section.quote);
    return lines.join("\n");
  }).join("\n\n");
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const db = getDb();
    const results: string[] = [];
    let imported = 0; let skipped = 0;

    for (const article of staticArticles) {
      const [existing] = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, article.slug)).limit(1);
      if (existing) { skipped++; continue; }

      const authorId = await getOrCreateAuthor(article.author);
      const now = new Date();
      await db.insert(articles).values({
        title: article.title,
        slug: article.slug,
        body: bodyToMarkdown(article.body),
        category: article.category,
        dek: article.dek,
        authorId,
        heroUrl: article.image || null,
        heroCaption: article.imageCaption || null,
        homepageSlot: article.featured ? "featured" : "feed",
        homepageRank: 10,
        status: "published",
        readingMinutes: article.readingMinutes,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        images: [],
        tags: [],
      });
      imported++;
      results.push(article.slug);
    }

    return Response.json({ imported, skipped, total: staticArticles.length, slugs: results });
  } catch (error) { return routeError(error); }
}