import { confirmSubscriber } from "../../../../../lib/newsletter-service";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try { await confirmSubscriber((await params).token); } catch { /* Generic page prevents enumeration. */ }
  return new Response("<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"referrer\" content=\"no-referrer\"><title>Orbita</title></head><body><main><h1>Suscripcion confirmada</h1><p>Ya puedes cerrar esta ventana.</p></main></body></html>", { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" } });
}
