export type Article = {
  slug: string;
  category: string;
  title: string;
  dek: string;
  author: string;
  authorSlug: string;
  readingMinutes: number;
  published: string;
  image: string;
  imageCaption?: string;
  edition: string;
  sourceLabel?: string;
  featured?: boolean;
  body: Array<{ heading?: string; paragraphs: string[]; quote?: string; image?: { url: string; caption?: string } }>;
};

export type Edition = {
  slug: string;
  number: string;
  year: string;
  title: string;
  summary: string;
  color: string;
  articleSlugs: string[];
  externalUrl?: string;
  coverImage?: string;
};

export type Author = {
  slug: string;
  name: string;
  area: string;
  bio: string;
  avatarUrl?: string | null;
  articleCount?: number;
};

// Import locally for the resilient helpers below, then expose the same API.
import { cmsArticle, cmsArticles, cmsEditions, cmsEdition, cmsSnapshot } from "./cms";
export { cmsArticle, cmsArticles, cmsEditions, cmsEdition, cmsSnapshot };
export type { CmsArticle, CmsSnapshot } from "./cms";

// Static data (kept in separate files to avoid bloating the main bundle)
import { articles as _staticArticles } from "../data/articles";
import { staticEditions as _staticEditions } from "../data/editions";
import { authors as _staticAuthors } from "../data/authors";
export const staticArticles = _staticArticles;
export const staticEditions = _staticEditions;
export const staticAuthors = _staticAuthors;

import { logError } from "./log";

/** Articulos: CMS primero, fallback a datos estaticos si la DB no responde. */
export async function getArticles() {
  try {
    const managed = await cmsArticles();
    return managed.length ? managed : _staticArticles;
  }
  catch (error) { logError("getArticles", error); return _staticArticles; }
}

export async function getArticle(slug: string) {
  try { return await cmsArticle(slug) ?? _staticArticles.find(a => a.slug === slug) ?? null; }
  catch (error) { logError("getArticle", error); return _staticArticles.find(a => a.slug === slug) ?? null; }
}

export async function getEditions() {
  try {
    const managed = await cmsEditions();
    return managed.length ? managed : _staticEditions;
  }
  catch (error) { logError("getEditions", error); return _staticEditions; }
}

export async function getEdition(slug: string) {
  try { return await cmsEdition(slug) ?? _staticEditions.find(e => e.slug === slug) ?? null; }
  catch (error) { logError("getEdition", error); return _staticEditions.find(e => e.slug === slug) ?? null; }
}

export function getAuthors() {
  return _staticAuthors;
}
