import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Escaneo WCAG 2.1/2.2 AA de las rutas públicas. La suite falla con
// violaciones de impacto critical/serious; los hallazgos moderados se
// reportan en consola para triage sin romper el build.
const SCAN_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const PUBLIC_ROUTES = [
  "/",
  "/articulos",
  "/ediciones",
  "/autores",
  "/acerca",
  "/enviar",
  "/privacidad",
  "/accesibilidad",
  "/esta-pagina-no-existe",
];

async function scan(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(SCAN_TAGS).analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  const moderate = results.violations.filter(
    (violation) => violation.impact !== "critical" && violation.impact !== "serious",
  );
  if (moderate.length) {
    const summary = moderate.map((v) => `${v.id} (${v.impact})`).join(", ");
    console.log(`[a11y] ${label} · hallazgos moderados: ${summary}`);
  }
  expect
    .soft(blocking, `${label}: violaciones críticas o graves de accesibilidad`)
    .toEqual([]);
}

for (const route of PUBLIC_ROUTES) {
  test(`escaneo axe: ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "load" });
    await scan(page, route);
  });
}

test("escaneo axe: primer artículo", async ({ page }) => {
  await page.goto("/articulos");
  const href = await page.locator("a.article-tile").first().getAttribute("href");
  test.skip(!href, "No hay artículos publicados todavía.");
  await page.goto(href!, { waitUntil: "load" });
  await scan(page, href!);
});

test("escaneo axe: primera edición", async ({ page }) => {
  await page.goto("/ediciones");
  const href = await page.locator(".edition-archive > a").first().getAttribute("href");
  test.skip(!href, "No hay ediciones publicadas todavía.");
  await page.goto(href!, { waitUntil: "load" });
  await scan(page, href!);
});
