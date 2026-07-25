import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("ships the Orbita Aerospace AAFI editorial surface", async () => {
  const [home, layout, header, footer, consent, content, contentModule, editions, styles, dashboard, articlePage] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteFooter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/CookieConsent.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/articles.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../data/editions.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/analytics/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/articulos/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(home, /NewsletterForm/);
  assert.match(contentModule, /import \{ cmsArticle, cmsArticles, cmsEditions, cmsEdition, cmsSnapshot \} from "\.\/cms"/);
  assert.match(home, /const current = \(await getEditions\(\)\)\[0\] \?\? null/);
  assert.match(home, /current \? <section className="edition-feature"/);
  assert.match(content, /México construye su futuro espacial/i);
  assert.match(content, /Ari Huizar Mayo/);
  assert.match(editions, /DaRQBDaDVzE/);
  assert.match(editions, /9874b3c7ea/);
  assert.match(editions, /7a7fc16697/);
  assert.match(consent, /Tu privacidad/i);
  assert.match(layout, /Órbita · Aerospace AAFI/i);
  assert.match(content, /Jorge Ferrer: construir tecnología espacial desde México/i);
  assert.match(editions, /Junio de 2026/i);
  assert.match(header, /aafi-logo\.svg/i);
  assert.match(styles, /analytics-dashboard/i);
  assert.match(dashboard, /getAnalyticsEmails/i);
  assert.match(dashboard, /requireChatGPTUser/i);
  assert.match(dashboard, /COUNT\(DISTINCT CASE WHEN event_name = 'page_viewed' THEN anonymous_id END\)/i);
  assert.match(dashboard, /article_slug IS NOT NULL/i);
  assert.match(articlePage, /imageCaption/i);
  assert.match(footer, /aafi-official/i);
  await access(new URL("../public/brand/aerospace-aafi.png", import.meta.url));
  await access(new URL("../public/brand/aafi-reference.png", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../public/articles/archive/jorge-ferrer.webp", import.meta.url));
  await access(new URL("../public/editions/12-junio-2026.webp", import.meta.url));
});
