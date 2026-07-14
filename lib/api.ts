import { env } from "cloudflare:workers";

const OWNER_EMAIL="lamoyi.matias@gmail.com";
export function isEditor(request: Request){const email=request.headers.get("oai-authenticated-user-email")?.toLowerCase();if(email===OWNER_EMAIL)return true;const configured=(env as unknown as {EDITOR_API_KEY?:string}).EDITOR_API_KEY;if(!configured)return false;const header=request.headers.get("authorization");return header===`Bearer ${configured}`}
export function cleanText(value:unknown,max=5000){return typeof value==="string"?value.trim().slice(0,max):""}
export function validSlug(value:string){return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)}
export function routeError(error:unknown){const message=error instanceof Error?error.message:"Error inesperado";const databaseUnavailable=/no such table|D1 binding|DB is unavailable/i.test(message);return Response.json({error:databaseUnavailable?"La base editorial todavía no está inicializada.":"No fue posible completar la operación."},{status:databaseUnavailable?503:500})}
