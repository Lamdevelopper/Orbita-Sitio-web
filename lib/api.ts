import { env } from "cloudflare:workers";

type Runtime = {
  EDITOR_API_KEY?: string;
  CODEX_ARTICLE_API_KEY?: string;
  EDITOR_EMAILS?: string;
  ANALYTICS_OWNER?: string;
  MAX_EDITORS?: string;
};

/** Número máximo de editores permitidos en el allowlist. Configurable vía Sites. */
function editorLimit(): number {
  const raw = (env as unknown as Runtime).MAX_EDITORS;
  const max = Number(raw);
  return Number.isSafeInteger(max) && max > 0 ? max : 2;
}

function configuredEmails(value?: string) { return (value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean); }

export function getEditorEmails() {
  return configuredEmails((env as unknown as Runtime).EDITOR_EMAILS);
}

export function getAnalyticsEmails() {
  const runtime = env as unknown as Runtime;
  return configuredEmails(runtime.ANALYTICS_OWNER ?? runtime.EDITOR_EMAILS);
}

/**
 * Guard editorial principal. Solo acepta la identidad autenticada por la
 * plataforma (header oai-authenticated-user-email) contra EDITOR_EMAILS.
 * Rechaza cualquier otra fuente, incluyendo Bearer tokens.
 * Además impone un límite configurable al tamaño del allowlist para reducir
 * superficie de error humano o de configuración.
 */
export function isEditor(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email")?.toLowerCase();
  if (!email) return false;
  const editors = getEditorEmails();
  return editors.length > 0 && editors.length <= editorLimit() && editors.includes(email);
}

/**
 * Guard auxiliar para automatización controlada. Solo acepta el Bearer token
 * configurado en EDITOR_API_KEY. Las rutas que quieran aceptar este mecanismo
 * deben invocarlo explícitamente; no se mezcla con isEditor.
 */
export function isApiKeyEditor(request: Request): boolean {
  const configured = (env as unknown as Runtime).EDITOR_API_KEY;
  if (!configured) return false;
  return request.headers.get("authorization") === `Bearer ${configured}`;
}

/**
 * Dedicated server-to-server guard for Codex article ingestion. It is kept
 * separate from the human editor guard and uses a distinct Worker secret so a
 * leaked automation token cannot impersonate an OAuth editor elsewhere.
 */
export async function isCodexArticleApiClient(request: Request): Promise<boolean> {
  const configured = (env as unknown as Runtime).CODEX_ARTICLE_API_KEY;
  if (!configured || configured.length < 32 || configured.length > 512) return false;

  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  const provided = match?.[1]?.trim() ?? "";
  if (!provided || provided.length > 512) return false;

  const [expectedDigest, providedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(configured)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(provided)),
  ]);
  const expected = new Uint8Array(expectedDigest);
  const actual = new Uint8Array(providedDigest);
  let difference = expected.length ^ actual.length;
  for (let index = 0; index < expected.length; index++) difference |= expected[index] ^ actual[index];
  return difference === 0;
}

export function cleanText(value: unknown, max = 5000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
export function validSlug(value: string) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value); }
export function routeError(error: unknown) { const message = error instanceof Error ? error.message : "Error inesperado"; const databaseUnavailable = /no such table|D1 binding|DB is unavailable/i.test(message); return Response.json({ error: databaseUnavailable ? "La base editorial todav" + String.fromCharCode(237) + "a no est" + String.fromCharCode(225) + " inicializada." : "No fue posible completar la operaci" + String.fromCharCode(243) + "n." }, { status: databaseUnavailable ? 503 : 500 }); }

/**
 * Valida que la petición venga del mismo origen (anti-CSRF por Origin).
 * Se usa en rutas mutantes. Si no hay header Origin (p. ej. API clients),
 * permite la petición — la capa de autenticación ya cubre ese caso.
 */
export function checkSameOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    if (new URL(origin).origin !== new URL(request.url).origin)
      return Response.json({ error: "Origen no permitido" }, { status: 403 });
  } catch { return Response.json({ error: "Origen no permitido" }, { status: 403 }); }
  return null;
}
