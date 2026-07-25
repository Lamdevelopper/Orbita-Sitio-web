import { getOrigin } from "../../lib/origin";
import { getArticles, staticArticles } from "../../lib/content";

const esc = (x) =>
  x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function GET() {
  const origin = await getOrigin();
  const cmsArticles = await getArticles();
  const seen = new Set();
  const all = [...cmsArticles, ...staticArticles].filter(a => {
    if (seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });

  let items = "";
  for (const a of all) {
    items += "<item><title>" + esc(a.title) + "</title>";
    items += "<link>" + origin + "/articulos/" + a.slug + "</link>";
    items += "<guid>" + origin + "/articulos/" + a.slug + "</guid>";
    items += "<description>" + esc(a.dek) + "</description></item>";
  }

  const head = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
  const rss = head + "<rss version=\"2.0\"><channel><title>Orbita</title><link>" + origin + "</link><description>Revista universitaria de divulgacion cientifica</description>" + items + "</channel></rss>";

  return new Response(rss, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
