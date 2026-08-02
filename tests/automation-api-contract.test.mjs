import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const route = await readFile(new URL("../app/api/automation/articles/route.ts", import.meta.url), "utf8");
const api = await readFile(new URL("../lib/api.ts", import.meta.url), "utf8");
const docs = await readFile(new URL("../docs/automation/codex-article-api.md", import.meta.url), "utf8");

test("la API Codex mantiene una frontera de autorización separada", () => {
  assert.match(route, /isCodexArticleApiClient/);
  assert.doesNotMatch(route, /isEditor\(/);
  assert.match(api, /CODEX_ARTICLE_API_KEY/);
  assert.match(api, /crypto\.subtle\.digest/);
});

test("la automatización queda limitada a borradores ocultos", () => {
  assert.match(route, /\[\"draft\", \"review\"\]/);
  assert.match(route, /homepageSlot: \"hidden\"/);
  assert.match(route, /no puede colocar articulos en portada/);
  assert.match(route, /Idempotency-Key invalido/);
  assert.match(route, /status: 429/);
  assert.match(docs, /CODEX_ARTICLE_API_KEY/);
  assert.match(docs, /no permite publicar/);
});
