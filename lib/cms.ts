import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { articles as articleTable, authors, editions as editionTable } from "../db/schema";
import type { Article, Edition } from "./content";

function sections(body: string) {
  const output: Article["body"] = [];
  let current: { heading?: string; paragraphs: string[]; quote?: string } = { paragraphs: [] };
  for (const line of body.split(/\n+/).map((value) => value.trim()).filter(Boolean)) {
    if (line.startsWith("## ")) {
      if (current.paragraphs.length || current.heading) output.push(current);
      current = { heading: line.slice(3), paragraphs: [] };
    } else if (line.startsWith("> ")) current.quote = line.slice(2);
    else current.paragraphs.push(line);
  }
  if (current.paragraphs.length || current.heading) output.push(current);
  return output.length ? output : [{ paragraphs: [body] }];
}

function formatDate(value: Date | null) {
  return value ? new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(value) : "recién publicado";
}

export type CmsArticle = Article & { homepageSlot: string; homepageRank: number };

function mapArticle(row: typeof articleTable.$inferSelect, author: string, editionSlug?: string | null): CmsArticle {
  return {
    slug: row.slug,
    category: row.category,
    title: row.title,
    dek: row.dek,
    author,
    authorSlug: "",
    readingMinutes: row.readingMinutes,
    published: formatDate(row.publishedAt),
    image: row.heroUrl || "/articles/archive/jorge-ferrer.webp",
    imageCaption: row.heroCaption || undefined,
    edition: editionSlug || "en-preparacion",
    body: sections(row.body),
    homepageSlot: row.homepageSlot,
    homepageRank: row.homepageRank,
  };
}

export async function cmsArticles() {
  try {
    const rows = await getDb().select({ article: articleTable, author: authors.name, editionSlug: editionTable.slug })
      .from(articleTable).leftJoin(authors, eq(articleTable.authorId, authors.id))
      .leftJoin(editionTable, eq(articleTable.editionId, editionTable.id))
      .where(eq(articleTable.status, "published")).orderBy(desc(articleTable.publishedAt));
    return rows.map((row) => mapArticle(row.article, row.author || "Equipo Órbita", row.editionSlug));
  } catch { return [] as CmsArticle[]; }
}

export async function cmsArticle(slug: string) {
  try {
    const [row] = await getDb().select({ article: articleTable, author: authors.name, editionSlug: editionTable.slug })
      .from(articleTable).leftJoin(authors, eq(articleTable.authorId, authors.id))
      .leftJoin(editionTable, eq(articleTable.editionId, editionTable.id))
      .where(and(eq(articleTable.slug, slug), eq(articleTable.status, "published"))).limit(1);
    return row ? mapArticle(row.article, row.author || "Equipo Órbita", row.editionSlug) : null;
  } catch { return null; }
}

function mapEdition(row: typeof editionTable.$inferSelect): Edition {
  return {
    slug: row.slug,
    number: String(row.number),
    year: new Intl.DateTimeFormat("es-MX", { year: "numeric" }).format(row.publishedAt),
    title: row.title,
    summary: row.summary || "Una edición de la revista Órbita.",
    color: "blue",
    articleSlugs: [],
    coverImage: row.coverUrl || undefined,
    externalUrl: row.externalUrl || undefined,
  };
}

export async function cmsEditions() {
  try { return (await getDb().select().from(editionTable).orderBy(desc(editionTable.publishedAt))).map(mapEdition); }
  catch { return [] as Edition[]; }
}

export async function cmsEdition(slug: string) {
  try {
    const [row] = await getDb().select().from(editionTable).where(eq(editionTable.slug, slug)).limit(1);
    return row ? mapEdition(row) : null;
  } catch { return null; }
}
