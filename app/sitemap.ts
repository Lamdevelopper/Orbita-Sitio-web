import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site-config";
import { getArticles, getEditions, staticArticles } from "../lib/content";
import { monthYearToIso } from "../lib/seo";

/**
 * lastmod honesto: la fecha real de publicacion cuando existe (CMS) o el mes
 * visible del archivo estatico. Nunca la hora del request: un sitemap que dice
 * "todo cambio hoy" en cada rastreo pierde la confianza del buscador.
 */
function articleLastmod(article: { publishedAt?: string; published: string }): string | undefined {
  if (article.publishedAt) return article.publishedAt.slice(0, 10);
  return monthYearToIso(article.published);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cmsArticles = await getArticles();
  const allEditions = await getEditions();

  const contentDates = [
    ...cmsArticles.map(articleLastmod),
    ...allEditions.map((edition) => edition.publishedAt?.slice(0, 10) ?? edition.year),
  ].filter((date): date is string => Boolean(date));
  const sectionsLastmod = contentDates.sort().at(-1);

  const urls: MetadataRoute.Sitemap = [
    "", "/articulos", "/ediciones", "/autores", "/acerca", "/privacidad",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    ...(sectionsLastmod ? { lastModified: sectionsLastmod } : {}),
  }));

  // CMS articles (primary) + static fallback (deduplicated)
  const seenSlugs = new Set<string>();
  for (const article of [...cmsArticles, ...staticArticles]) {
    if (seenSlugs.has(article.slug)) continue;
    seenSlugs.add(article.slug);
    const lastModified = articleLastmod(article);
    urls.push({ url: `${SITE_URL}/articulos/${article.slug}`, ...(lastModified ? { lastModified } : {}) });
  }

  for (const edition of allEditions) {
    const lastModified = edition.publishedAt?.slice(0, 10) ?? (/^\d{4}$/.test(edition.year) ? edition.year : undefined);
    urls.push({ url: `${SITE_URL}/ediciones/${edition.slug}`, ...(lastModified ? { lastModified } : {}) });
  }

  return urls;
}
