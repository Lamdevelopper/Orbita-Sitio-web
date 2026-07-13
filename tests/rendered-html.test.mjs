import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("ships the Orbita Aerospace AAFI editorial surface", async () => {
  const [home, layout, header, footer, consent] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteHeader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/SiteFooter.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/CookieConsent.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(home, /México construye su futuro espacial/i);
  assert.match(consent, /Tu privacidad/i);
  assert.match(layout, /Órbita · Aerospace AAFI/i);
  assert.match(header, /aerospace-aafi\.png/i);
  assert.match(footer, /aafi-official/i);
  await access(new URL("../public/brand/aerospace-aafi.png", import.meta.url));
  await access(new URL("../public/brand/aafi-reference.png", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
});
