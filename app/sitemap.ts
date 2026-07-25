import type { MetadataRoute } from "next";
import { getOrigin } from "../lib/origin";
import { getArticles, getEditions, staticArticles } from "../lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await getOrigin();
  const cmsArticles = await getArticles();
  const allEditions = await getEditions();

  const urls = [
    "", "/articulos", "/ediciones", "/autores", "/acerca", "/privacidad",
  ].map((path) => ({ url: `${origin}${path}`, lastModified: new Date() }));

  // CMS articles (primary) + static fallback (deduplicated)
  const seenSlugs = new Set<string>();
  for (const article of [...cmsArticles, ...staticArticles]) {
    if (seenSlugs.has(article.slug)) continue;
    seenSlugs.add(article.slug);
    urls.push({ url: `${origin}/articulos/${article.slug}`, lastModified: new Date() });
  }

  for (const edition of allEditions) {
    urls.push({
      url: `${origin}/ediciones/${edition.slug}`,
      lastModified: new Date(),
    });
  }

  return urls;
}
