import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { articles, authors, editions } from "../../../../db/schema";
import { isEditor, routeError } from "../../../../lib/api";
import { staticEditions, staticArticles } from "../../../../lib/content";
import { ARTICLE_LIMITS, EDITION_LIMITS, editorialSlug, parseEditionNumber } from "../../../../lib/editorial-contract";

// Only used when a legacy static article has no author metadata. This is a
// migration label, not a claim about a real person; profile fields stay empty.
const SEEDED_AUTHOR_FALLBACK = "Equipo Órbita";

async function getOrCreateAuthor(name: string) {
  const db = getDb();
  const clean = name.trim() || SEEDED_AUTHOR_FALLBACK;
  const slug = editorialSlug(clean, "equipo-orbita");
  const [existing] = await db.select().from(authors).where(eq(authors.slug, slug)).limit(1);
  if (existing) return existing.id;
  const now = new Date();
  const [created] = await db.insert(authors).values({ name: clean, slug, bio: "", area: "", createdAt: now }).returning();
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

async function migrationStatus() {
  const rows = await getDb().select({ slug: articles.slug }).from(articles);
  const existing = new Set(rows.map((row) => row.slug));
  const pendingSlugs = staticArticles.map((article) => article.slug).filter((slug) => !existing.has(slug));
  return {
    total: staticArticles.length,
    migrated: staticArticles.length - pendingSlugs.length,
    pending: pendingSlugs.length,
    pendingSlugs,
  };
}

async function editionMigrationStatus() {
  const rows = await getDb().select({ slug: editions.slug }).from(editions);
  const existing = new Set(rows.map((row) => row.slug));
  const pendingSlugs = staticEditions.map((edition) => edition.slug).filter((slug) => !existing.has(slug));
  return {
    total: staticEditions.length,
    migrated: staticEditions.length - pendingSlugs.length,
    pending: pendingSlugs.length,
    pendingSlugs,
  };
}

export async function GET(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try { return Response.json(await migrationStatus()); }
  catch (error) { return routeError(error); }
}

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const db = getDb();
    const results: string[] = [];
    let imported = 0; let skipped = 0;
    const rankBySlot = new Map<"featured" | "feed", number>();

    for (const article of staticArticles) {
      const [existing] = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, article.slug)).limit(1);
      if (existing) { skipped++; continue; }

      const authorId = await getOrCreateAuthor(article.author);
      const now = new Date();
      const homepageSlot = article.featured ? "featured" : "feed";
      const homepageRank = (rankBySlot.get(homepageSlot) ?? 0) + 1;
      rankBySlot.set(homepageSlot, homepageRank);
      await db.insert(articles).values({
        title: article.title.slice(0, ARTICLE_LIMITS.title),
        slug: article.slug,
        body: bodyToMarkdown(article.body).slice(0, ARTICLE_LIMITS.body),
        category: article.category.slice(0, ARTICLE_LIMITS.category),
        dek: article.dek.slice(0, ARTICLE_LIMITS.dek),
        authorId,
        heroUrl: article.image || null,
        heroCaption: article.imageCaption || null,
        homepageSlot,
        homepageRank,
        status: "published",
        readingMinutes: Math.max(ARTICLE_LIMITS.readingMin, Math.min(ARTICLE_LIMITS.readingMax, article.readingMinutes)),
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
        images: [],
        tags: [],
      });
      imported++;
      results.push(article.slug);
    }

    return Response.json({ imported, skipped, slugs: results, ...(await migrationStatus()) });
  } catch (error) { return routeError(error); }
}

export async function PUT(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const db = getDb();
    const results: string[] = [];
    let imported = 0; let skipped = 0;

    for (const edition of staticEditions) {
      const [existing] = await db.select({ id: editions.id }).from(editions).where(eq(editions.slug, edition.slug)).limit(1);
      if (existing) { skipped++; continue; }

      const months: Record<string, number> = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
      const monthMatch = edition.slug.match(/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)-(\d{4})$/);
      const publishedAt = monthMatch
        ? new Date(parseInt(monthMatch[2]), months[monthMatch[1]], 1)
        : null;

      await db.insert(editions).values({
        number: parseEditionNumber(edition.number) ?? 1,
        slug: edition.slug,
        title: edition.title.slice(0, EDITION_LIMITS.title),
        summary: edition.summary.slice(0, EDITION_LIMITS.summary),
        coverUrl: edition.coverImage || null,
        externalUrl: edition.externalUrl || null,
        publishedAt,
        createdAt: new Date(),
      });
      imported++;
      results.push(edition.slug);
    }

    return Response.json({ imported, skipped, slugs: results, ...(await editionMigrationStatus()) });
  } catch (error) { return routeError(error); }
}
