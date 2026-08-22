import { SITE_URL, SITE_NAME } from "../../lib/site-config";
import { getArticles, staticArticles } from "../../lib/content";
import { articleIsoDate } from "../../lib/seo";

const esc = (x) =>
  x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/** RFC 822 exigido por RSS 2.0; acepta precision de mes ("2026-03"). */
function rfc822(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toUTCString();
}

export async function GET() {
  const cmsArticles = await getArticles();
  const seen = new Set();
  const all = [...cmsArticles, ...staticArticles].filter(a => {
    if (seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });

  let items = "";
  let newestIso = "";
  for (const a of all) {
    const iso = articleIsoDate(a);
    const pubDate = rfc822(iso);
    if (iso && (!newestIso || iso > newestIso)) newestIso = iso;
    items += "<item><title>" + esc(a.title) + "</title>";
    items += "<link>" + SITE_URL + "/articulos/" + a.slug + "</link>";
    items += "<guid isPermaLink=\"true\">" + SITE_URL + "/articulos/" + a.slug + "</guid>";
    items += "<description>" + esc(a.dek) + "</description>";
    if (pubDate) items += "<pubDate>" + pubDate + "</pubDate>";
    items += "</item>";
  }
  const lastBuild = rfc822(newestIso);

  const head = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
  const self = "<atom:link href=\"" + SITE_URL + "/rss.xml\" rel=\"self\" type=\"application/rss+xml\" xmlns:atom=\"http://www.w3.org/2005/Atom\" />";
  const rss = head
    + "<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\"><channel><title>" + esc(SITE_NAME) + " — Revista de divulgación científica</title>"
    + "<link>" + SITE_URL + "</link>"
    + "<description>Revista universitaria de divulgación científica: ciencia, ingeniería y espacio desde la comunidad universitaria.</description>"
    + "<language>es-mx</language>"
    + self
    + (lastBuild ? "<lastBuildDate>" + lastBuild + "</lastBuildDate>" : "")
    + items
    + "</channel></rss>";

  return new Response(rss, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
