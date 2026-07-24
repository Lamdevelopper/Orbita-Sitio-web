import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { articles as articleTable, authors, editions as editionTable } from "../db/schema";
import type { Article, Edition } from "./content";

function sections(body: string, imageMap?: Map<string, { url: string; caption?: string }>) {
  const output: Article["body"] = [];
  let current: Article["body"][number] = { paragraphs: [] };
 for (const line of body.split(/\n+/).map((value) => value.trim()).filter(Boolean)) {
    // Resolve {{IMG:N}} markers from the imageMap (submission parser output)
    const imgMarker = line.match(/^\{\{IMG:(\d+)\}\}$/);
    if (imgMarker) {
      const imgKey = `IMAGEN ${imgMarker[1]}`;
      const imgData = imageMap?.get(imgKey);
      if (imgData) {
        if (current.paragraphs.length || current.heading || current.quote) output.push(current);
        output.push({ paragraphs: [], image: { url: imgData.url, caption: imgData.caption } });
        current = { paragraphs: [] };
      }
      continue;
    }
   if (line.startsWith("## ")) {
      if (current.paragraphs.length || current.heading) output.push(current);
      current = { heading: line.slice(3), paragraphs: [] };
    } else if (/^\[IMAGEN\s/.test(line)) {
      if (current.paragraphs.length || current.heading || current.quote) output.push(current);
      const inner = line.slice(8, -1).trim();
      const pipe = inner.lastIndexOf(" | ");
      const url = pipe > -1 ? inner.slice(0, pipe).trim() : inner;
      const caption = pipe > -1 ? inner.slice(pipe + 3).trim() : undefined;
      current = { paragraphs: [], image: { url, caption } };
      output.push(current);
      current = { paragraphs: [] };
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
export type CmsSnapshot = { articles: CmsArticle[]; managedSlugs: Set<string> };

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
    body: sections(row.body, row.images.length > 0
      ? new Map(row.images.map((img) => [img.ref, { url: img.url, caption: img.caption }]))
      : undefined),
    homepageSlot: row.homepageSlot,
    homepageRank: row.homepageRank,
  };
}

export async function cmsSnapshot(): Promise<CmsSnapshot> {
  try {
    const rows = await getDb().select({ article: articleTable, author: authors.name, editionSlug: editionTable.slug })
      .from(articleTable).leftJoin(authors, eq(articleTable.authorId, authors.id))
      .leftJoin(editionTable, eq(articleTable.editionId, editionTable.id))
      .orderBy(desc(articleTable.publishedAt));
    return {
      articles: rows
        .filter((row) => row.article.status === "published")
        .map((row) => mapArticle(row.article, row.author || "Equipo Órbita", row.editionSlug)),
      managedSlugs: new Set(rows.map((row) => row.article.slug)),
    };
  } catch { return { articles: [], managedSlugs: new Set<string>() }; }
}

export async function cmsArticles() {
  return (await cmsSnapshot()).articles;
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
