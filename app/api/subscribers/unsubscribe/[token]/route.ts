import { unsubscribeSubscriber } from "../../../../../lib/newsletter-service";

async function unsubscribe(params: Promise<{ token: string }>) {
  try { await unsubscribeSubscriber((await params).token); } catch { /* Generic page prevents enumeration. */ }
  return new Response("<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"referrer\" content=\"no-referrer\"><title>Orbita</title></head><body><main><h1>Suscripcion anulada</h1><p>No recibiras nuevos mensajes de esta lista.</p></main></body></html>", { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "referrer-policy": "no-referrer" } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) { return unsubscribe(params); }
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) { return unsubscribe(params); }
