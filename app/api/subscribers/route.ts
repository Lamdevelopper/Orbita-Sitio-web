import { routeError } from "../../../lib/api";
import { sendEmailFlare } from "../../../lib/emailflare";
import {
  adminGuard,
  checkSubscriberRateLimit,
  editorEmail,
  listMaskedSubscribers,
  suppressSubscriber,
  upsertPendingSubscriber,
  writeAudit,
} from "../../../lib/newsletter-service";
import { getClientIp } from "../../../lib/rate-limit";

const GENERIC_RESPONSE = { ok: true, message: "Si el correo es valido, recibiras un enlace de confirmacion." };

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body._trap === "string" && body._trap) return Response.json(GENERIC_RESPONSE, { status: 202 });

    const rateLimit = await checkSubscriberRateLimit(getClientIp(request));
    if (!rateLimit.allowed) {
      return Response.json(GENERIC_RESPONSE, { status: 429, headers: { "retry-after": String(rateLimit.retryAfter) } });
    }

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
      // The public response is intentionally indistinguishable for invalid,
      // duplicate and temporarily unavailable subscriptions.
    }
    return Response.json(GENERIC_RESPONSE, { status: 202 });
  } catch {
    return Response.json(GENERIC_RESPONSE, { status: 202 });
  }
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
