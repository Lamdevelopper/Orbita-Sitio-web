import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "../db";
import { articles as articleTable, authors, editions as editionTable } from "../db/schema";
import type { Article, Edition, Author } from "./content";
import { articles as staticArticles } from "../data/articles";
import { EDITORIAL_LOCALE } from "./editorial-contract";

// Estas dos piezas históricas llegaron del PDF con OCR de columnas y relaciones
// de portada/edición incorrectas. La versión recompuesta es la fuente pública
// estable hasta que el CMS pueda corregir las filas originales sin perder sus
// imágenes. Mantener la lista aquí evita depender de IDs de D1 que cambiaron.
const repairedEditorialSlugs = new Set([
  "cuando-el-corazon-humano-latio-desde-la-orbita-lunar",
  "mecanica-cuantica-en-el-espacio",
]);

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
  return value ? new Intl.DateTimeFormat(EDITORIAL_LOCALE, { month: "long", year: "numeric" }).format(value) : "recién publicado";
}

export type CmsArticle = Article & {
  homepageSlot: string;
  homepageRank: number;
  /** Optional SEO overrides entered in the CMS article form. */
  seoTitle?: string;
  seoDescription?: string;
};
export type CmsSnapshot = { articles: CmsArticle[]; managedSlugs: Set<string> };

// A CMS article can be published before its editor has uploaded a hero image.
// Keep the card valid with the neutral site OG artwork instead of borrowing a
// different article's portrait (which made unrelated stories look authored by
// Jorge Ferrer).
const DEFAULT_CMS_IMAGE = "/og.jpg";

function mapArticle(
  row: typeof articleTable.$inferSelect,
  authorName: string | null,
  authorSlug: string | null,
  editionSlug?: string | null,
): CmsArticle {
  const repaired = repairedEditorialSlugs.has(row.slug)
    ? staticArticles.find((article) => article.slug === row.slug)
    : undefined;
  if (repaired) {
    return {
      ...repaired,
      // Preserve the reconstructed body/imagery and canonical print edition;
      // only the author relationship may safely come from the CMS row.
      author: authorName || repaired.author,
      authorSlug: authorSlug || repaired.authorSlug,
      edition: repaired.edition,
      seoTitle: row.seoTitle || undefined,
      seoDescription: row.seoDescription || undefined,
      homepageSlot: row.homepageSlot,
      homepageRank: row.homepageRank,
      // La fecha CMS manda aunque el cuerpo venga del archivo reconstruido.
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
    };
  }
  const mapped: CmsArticle = {
    slug: row.slug,
    category: row.category,
    title: row.title,
    dek: row.dek,
    author: authorName || "Equipo Órbita",
    // `authors.slug` is selected in the join below; an empty slug means the
    // article has no resolvable author page and is rendered as plain text.
    authorSlug: authorSlug || "",
    readingMinutes: row.readingMinutes,
    published: formatDate(row.publishedAt),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
    image: row.heroUrl || DEFAULT_CMS_IMAGE,
    imageCaption: row.heroCaption || undefined,
    // No linked edition is represented by an empty slug.  The old
    // `en-preparacion` value looked like a real route and produced broken
    // edition links on published CMS articles.
    edition: editionSlug || "",
    seoTitle: row.seoTitle || undefined,
    seoDescription: row.seoDescription || undefined,
    body: sections(row.body, row.images.length > 0
      ? new Map(row.images.map((img) => [img.ref, { url: img.url, caption: img.caption }]))
      : undefined),
    homepageSlot: row.homepageSlot,
    homepageRank: row.homepageRank,
  };
  return mapped;
}

export async function cmsSnapshot(): Promise<CmsSnapshot> {
  try {
    const rows = await getDb().select({ article: articleTable, author: authors.name, authorSlug: authors.slug, editionSlug: editionTable.slug })
      .from(articleTable).leftJoin(authors, eq(articleTable.authorId, authors.id))
      .leftJoin(editionTable, eq(articleTable.editionId, editionTable.id))
      .orderBy(desc(articleTable.publishedAt));
    return {
      articles: rows
        .filter((row) => row.article.status === "published")
        .map((row) => mapArticle(row.article, row.author, row.authorSlug, row.editionSlug)),
      managedSlugs: new Set(rows.map((row) => row.article.slug)),
    };
  } catch { return { articles: [], managedSlugs: new Set<string>() }; }
}

export async function cmsArticles() {
  return (await cmsSnapshot()).articles;
}

export async function cmsArticle(slug: string) {
  try {
    const [row] = await getDb().select({ article: articleTable, author: authors.name, authorSlug: authors.slug, editionSlug: editionTable.slug })
      .from(articleTable).leftJoin(authors, eq(articleTable.authorId, authors.id))
      .leftJoin(editionTable, eq(articleTable.editionId, editionTable.id))
      .where(and(eq(articleTable.slug, slug), eq(articleTable.status, "published"))).limit(1);
    return row ? mapArticle(row.article, row.author, row.authorSlug, row.editionSlug) : null;
  } catch { return null; }
}

function mapEdition(row: typeof editionTable.$inferSelect, articleSlugs: string[] = []): Edition {
  // Keep generated covers visually varied while deriving the value from the
  // edition number (rather than making every CMS edition blue).
  const number = Math.abs(row.number);
  const color = number % 3 === 0 ? "blue" : number % 3 === 1 ? "ink" : "red";
  return {
    slug: row.slug,
    number: String(row.number),
    year: row.publishedAt ? new Intl.DateTimeFormat(EDITORIAL_LOCALE, { year: "numeric" }).format(row.publishedAt) : "—",
    title: row.title,
    summary: row.summary || "Una edición de la revista Órbita.",
    color,
    articleSlugs,
    coverImage: row.coverUrl || undefined,
    externalUrl: row.pdfUrl || row.externalUrl || undefined,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : undefined,
  };
}

export async function cmsEditions() {
  try {
    const db = getDb();
    // Fetch all relations in one additional query, avoiding an N+1 query per
    // edition while keeping articleSlugs limited to published web stories.
    const [editionRows, articleRows] = await Promise.all([
      db.select().from(editionTable).orderBy(desc(editionTable.isCurrent), desc(editionTable.number)),
      db.select({ slug: articleTable.slug, editionId: articleTable.editionId })
        .from(articleTable)
        .where(eq(articleTable.status, "published"))
        .orderBy(desc(articleTable.publishedAt), desc(articleTable.id)),
    ]);
    const slugsByEdition = new Map<number, string[]>();
    for (const article of articleRows) {
      if (article.editionId === null) continue;
      const slugs = slugsByEdition.get(article.editionId) ?? [];
      slugs.push(article.slug);
      slugsByEdition.set(article.editionId, slugs);
    }
    return editionRows.map((edition) => mapEdition(edition, slugsByEdition.get(edition.id) ?? []));
  }
  catch { return [] as Edition[]; }
}

export async function cmsEdition(slug: string) {
  try {
    const db = getDb();
    const [row] = await db.select().from(editionTable).where(eq(editionTable.slug, slug)).limit(1);
    if (!row) return null;
    const articleRows = await db.select({ slug: articleTable.slug })
      .from(articleTable)
      .where(and(eq(articleTable.editionId, row.id), eq(articleTable.status, "published")))
      .orderBy(desc(articleTable.publishedAt), desc(articleTable.id));
    return mapEdition(row, articleRows.map((article) => article.slug));
  } catch { return null; }
}

export async function cmsAuthors(): Promise<Author[]> {
  try {
    const rows = await getDb().select({
      slug: authors.slug,
      name: authors.name,
      area: authors.area,
      bio: authors.bio,
      avatarUrl: authors.avatarUrl,
      articleCount: sql<number>`count(${articleTable.id})`,
    })
      .from(authors)
      .leftJoin(articleTable, and(eq(articleTable.authorId, authors.id), ne(articleTable.status, "archived")))
      .groupBy(authors.id)
      .orderBy(asc(authors.name));
    return rows.map((row) => ({ ...row, articleCount: Number(row.articleCount) }));
  }
  catch { return [] as Author[]; }
}

