/**
 * Canonical editorial input contract shared by API routes and pure tests.
 * Keep limits here so create, update and import cannot drift apart.
 */
export const articleStatuses = ["draft", "review", "scheduled", "published", "archived"] as const;
export const creatableArticleStatuses = ["draft", "review", "scheduled", "published"] as const;
export const homepageSlots = ["hero", "featured", "feed", "hidden"] as const;

export type ArticleStatus = typeof articleStatuses[number];
export type CreatableArticleStatus = typeof creatableArticleStatuses[number];
export type HomepageSlot = typeof homepageSlots[number];

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: "Borrador", review: "En revisión", scheduled: "Programado", published: "Publicado", archived: "Archivado",
};
export const HOMEPAGE_SLOT_LABELS: Record<HomepageSlot, string> = {
  hero: "Portada", featured: "Destacado", feed: "Feed", hidden: "No mostrar",
};
export const EDITORIAL_LOCALE = "es-MX";
export const EDITORIAL_TIMEZONE = "America/Mexico_City";

export const ARTICLE_LIMITS = {
  title: 180, slug: 180, body: 100_000, category: 80, dek: 420,
  heroUrl: 1_000, caption: 500, tags: 12, tag: 80, seoTitle: 180, seoDescription: 320,
  readingMin: 1, readingMax: 90, readingDefault: 5,
  imageCount: 12, imageRef: 100, imageUrl: 1_000,
} as const;

export const ARTICLE_DEFAULTS = {
  status: "draft" as const,
  homepageSlot: "feed" as const,
  readingMinutes: ARTICLE_LIMITS.readingDefault,
};

export const AUTHOR_LIMITS = { name: 120, slug: 180, bio: 1_000, area: 160, avatarUrl: 1_000 } as const;
export const EDITION_LIMITS = { title: 180, slug: 180, summary: 700, coverUrl: 1_000, coverAlt: 400, externalUrl: 1_000, pdfUrl: 1_000 } as const;
export const PAGINATION_LIMITS = { default: 100, publicMax: 100, editorMax: 500, maxOffset: 1_000_000 } as const;
export const PLACEMENT_LOCK = { scope: "homepage", leaseMs: 15_000, attempts: 20, retryDelayMs: 50 } as const;

export function isArticleStatus(value: unknown): value is ArticleStatus {
  return typeof value === "string" && articleStatuses.includes(value as ArticleStatus);
}
export function isCreatableArticleStatus(value: unknown): value is CreatableArticleStatus {
  return typeof value === "string" && creatableArticleStatuses.includes(value as CreatableArticleStatus);
}
export function isHomepageSlot(value: unknown): value is HomepageSlot {
  return typeof value === "string" && homepageSlots.includes(value as HomepageSlot);
}

/** Pure slug normalization used for imported authors and article fallbacks. */
export function editorialSlug(value: string, fallback: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || fallback;
}

export function boundedText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

/** Missing ranks append to the destination collection; zero is also treated as absent. */
export function normalizeRank(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1) return undefined;
  return Math.floor(number);
}

export function normalizeReadingMinutes(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return ARTICLE_LIMITS.readingDefault;
  return Math.max(ARTICLE_LIMITS.readingMin, Math.min(ARTICLE_LIMITS.readingMax, Math.floor(number)));
}

export function parseEditionNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 1 ? number : undefined;
}

/** Strict date-only parser. Dates are stored at midnight UTC; timestamps are rejected. */
export function parseDateOnlyUtc(value: unknown): Date | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : undefined;
}

export function parseStrictBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, ARTICLE_LIMITS.tag))
    .filter(Boolean)
    .slice(0, ARTICLE_LIMITS.tags);
}

export type EditorialImage = { ref: string; url: string; caption?: string };

/** Strict image metadata guard. `undefined` means the optional field was omitted. */
export function normalizeImages(value: unknown): EditorialImage[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > ARTICLE_LIMITS.imageCount) return null;
  const images: EditorialImage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.ref !== "string" || typeof candidate.url !== "string") return null;
    const ref = candidate.ref.trim();
    const url = candidate.url.trim();
    if (!ref || !url || ref.length > ARTICLE_LIMITS.imageRef || url.length > ARTICLE_LIMITS.imageUrl) return null;
    if (candidate.caption !== undefined && typeof candidate.caption !== "string") return null;
    const caption = typeof candidate.caption === "string" ? candidate.caption.trim() : undefined;
    if (caption !== undefined && caption.length > ARTICLE_LIMITS.caption) return null;
    images.push({ ref, url, ...(caption ? { caption } : {}) });
  }
  return images;
}

export function parseOptionalId(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === "") return value === null ? null : undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : undefined;
}
