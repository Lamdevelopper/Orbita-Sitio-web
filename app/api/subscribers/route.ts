import { routeError } from "../../../lib/api";
import { sendEmailFlare } from "../../../lib/emailflare";
import {
  adminGuard,
  checkSubscriberEmailCooldown,
  checkSubscriberRateLimit,
  editorEmail,
  isSignupEnabled,
  listMaskedSubscribers,
  normalizeSubscriberEmail,
  suppressSubscriber,
  upsertPendingSubscriber,
  writeAudit,
} from "../../../lib/newsletter-service";

const GENERIC_RESPONSE = { ok: true, message: "Si el correo es valido, recibiras un enlace de confirmacion." };

/** IP confiable del edge. Solo se usa cf-connecting-ip en producción. */
function trustedClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? "127.0.0.1";
}

export async function POST(request: Request) {
  // 1. Validar estado de la feature antes de cualquier operación costosa.
  if (!isSignupEnabled()) {
    return Response.json(GENERIC_RESPONSE, { status: 503, headers: { "retry-after": "3600" } });
  }

  // 2. Validar que el body sea JSON y tenga tamaño razonable.
  let body: Record<string, unknown>;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return Response.json(GENERIC_RESPONSE, { status: 202 });
    }

    const text = await request.text();
    if (text.length > 2048) {
      return Response.json(GENERIC_RESPONSE, { status: 202 });
    }
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return Response.json(GENERIC_RESPONSE, { status: 202 });
  }

  // 3. Honeypot silencioso.
  if (typeof body._trap === "string" && body._trap) {
    return Response.json(GENERIC_RESPONSE, { status: 202 });
  }

  // 4. Rate limit por IP. Si la infraestructura falla (D1 ausente, secreto no
  //    configurado), devolvemos 503 con Retry-After y NUNCA llegamos a EmailFlare.
  try {
    const ip = trustedClientIp(request);
    const rateLimit = await checkSubscriberRateLimit(ip);
    if (!rateLimit.allowed) {
      return Response.json(GENERIC_RESPONSE, { status: 429, headers: { "retry-after": String(rateLimit.retryAfter) } });
    }
  } catch {
    // Infraestructura del rate limiter rota: falla cerrado.
    return Response.json(GENERIC_RESPONSE, { status: 503, headers: { "retry-after": "900" } });
  }

  // 5. Cooldown por email.
  try {
    const email = normalizeSubscriberEmail(body.email);
    const cooldown = await checkSubscriberEmailCooldown(email);
    if (!cooldown.allowed) {
      return Response.json(GENERIC_RESPONSE, { status: 429, headers: { "retry-after": String(cooldown.retryAfter) } });
    }
  } catch {
    // Si falla la normalización del email o el cooldown, respuesta genérica.
    return Response.json(GENERIC_RESPONSE, { status: 202 });
  }

  // 6. Suscripción. Fallos de upsert o email inválido → respuesta genérica.
  try {
    const subscription = await upsertPendingSubscriber(body.email, "website");
    if (subscription.token) {
      const origin = new URL(request.url).origin;
      const confirmUrl = `${origin}/api/subscribers/confirm/${encodeURIComponent(subscription.token)}`;
      await sendEmailFlare({
        to: subscription.recipient,
        subject: "Confirma tu suscripcion a Orbita",
        html: `<p>Confirma tu suscripcion a Orbita:</p><p><a href="${confirmUrl}">Confirmar suscripcion</a></p>`,
        text: `Confirma tu suscripcion a Orbita: ${confirmUrl}`,
        idempotencyKey: `subscriber-confirm:${subscription.subscriberId}:${subscription.token.slice(0, 12)}`,
      });
    }
  } catch {
    // upsert falló: email inválido, duplicado, o error de infraestructura del
    // cifrado (secreto ausente). Respuesta genérica, sin email.
  }
  return Response.json(GENERIC_RESPONSE, { status: 202 });
}

export async function GET(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const params = new URL(request.url).searchParams;
    const subscribers = await listMaskedSubscribers({
      status: params.get("status") ?? undefined,
      limit: Number(params.get("limit") ?? 100),
    });
    return Response.json({ subscribers });
  } catch (error) { return routeError(error); }
}

export async function PATCH(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = Number(body.id);
    if (!Number.isInteger(id) || body.status !== "unsubscribed") {
      return Response.json({ error: "Solo se permite suprimir un suscriptor" }, { status: 400 });
    }
    const subscriber = await suppressSubscriber(id);
    if (!subscriber) return Response.json({ error: "Suscriptor no encontrado" }, { status: 404 });
    await writeAudit("subscriber.suppressed", "subscriber", id, editorEmail(request));
    return Response.json({ subscriber });
  } catch (error) { return routeError(error); }
}
