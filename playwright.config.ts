import { defineConfig } from "@playwright/test";

// Escáner de accesibilidad (WCAG 2.1/2.2 AA). Usa el servidor de desarrollo
// porque `vinext start` requiere el runtime de Cloudflare/workerd y no corre
// como proceso Node plano. Si ya hay un servidor en el puerto 3000 se reutiliza.
export default defineConfig({
  testDir: "tests/a11y",
  timeout: 120_000,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
