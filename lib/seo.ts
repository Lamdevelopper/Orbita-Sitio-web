import { SITE_URL, SITE_NAME, SITE_ALTERNATE_NAMES, SITE_DESCRIPTION } from "./site-config";
import type { Article } from "./content";

/** Meses en español tal como aparecen en Article.published ("marzo 2026"). */
const MONTHS_ES: Record<string, string> = {
  enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05", junio: "06",
  julio: "07", agosto: "08", septiembre: "09", setiembre: "09", octubre: "10",
  noviembre: "11", diciembre: "12",
};

/**
 * Convierte la fecha visible ("marzo 2026") a precision de mes ISO 8601
 * ("2026-03"). Devuelve undefined si no hay mes reconocible; nunca inventa
 * un dia.
 */
export function monthYearToIso(published: string | undefined | null): string | undefined {
  if (!published) return undefined;
  const match = published.trim().match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\.?(?:\s+de)?\s+(\d{4})$/);
  if (!match) return undefined;
  const month = MONTHS_ES[match[1].toLowerCase()];
  return month ? `${match[2]}-${month}` : undefined;
}

/** Fecha ISO mas precisa disponible para un articulo (CMS real o mes visible). */
export function articleIsoDate(article: Pick<Article, "publishedAt" | "published">): string | undefined {
  if (article.publishedAt) return article.publishedAt.slice(0, 10);
  return monthYearToIso(article.published);
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Nodo Organization compartido por el layout global y las paginas de articulo. */
function organizationNode() {
  return {
    "@type": "NewsMediaOrganization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      url: absoluteUrl("/brand/aerospace-aafi.png"),
    },
  };
}

/** @graph global: identidad de marca para consultas tipo "orbita divulgacion". */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        alternateName: [...SITE_ALTERNATE_NAMES],
        description: SITE_DESCRIPTION,
        inLanguage: "es-MX",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

export function newsArticleJsonLd(article: Article, canonicalPath: string) {
  const isoDate = articleIsoDate(article);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.dek,
    image: [absoluteUrl(article.image)],
    ...(isoDate ? { datePublished: isoDate, dateModified: isoDate } : {}),
    inLanguage: "es-MX",
    author: {
      "@type": "Person",
      name: article.author,
      ...(article.authorSlug ? { url: absoluteUrl(`/autores#${article.authorSlug}`) } : {}),
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(canonicalPath) },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
