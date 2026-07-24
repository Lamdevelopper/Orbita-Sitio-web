import { env } from "cloudflare:workers";

const FALLBACK_EMAILS = "lamoyi.matias@gmail.com";
export function isEditor(request: Request) {
  const email = request.headers.get("oai-authenticated-user-email")?.toLowerCase();
  if (!email) { const configured = (env as unknown as { EDITOR_API_KEY?: string }).EDITOR_API_KEY; if (!configured) return false; const header = request.headers.get("authorization"); return header === `Bearer ${configured}`; }
  const editorEmails = (env as unknown as { EDITOR_EMAILS?: string }).EDITOR_EMAILS || FALLBACK_EMAILS;
  return editorEmails.split(",").map((item: string) => item.trim().toLowerCase()).includes(email);
}
export function cleanText(value: unknown, max = 5000) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
export function validSlug(value: string) { return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value); }
export function routeError(error: unknown) { const message = error instanceof Error ? error.message : "Error inesperado"; const databaseUnavailable = /no such table|D1 binding|DB is unavailable/i.test(message); return Response.json({ error: databaseUnavailable ? "La base editorial todav" + String.fromCharCode(237) + "a no est" + String.fromCharCode(225) + " inicializada." : "No fue posible completar la operaci" + String.fromCharCode(243) + "n." }, { status: databaseUnavailable ? 503 : 500 }); }