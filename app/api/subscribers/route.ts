import { getDb } from "../../../db";
import { subscribers } from "../../../db/schema";
import { cleanText, routeError } from "../../../lib/api";
import { checkRateLimit, getClientIp, limits } from "../../../lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = getClientIp(request);
    const { allowed, retryAfter } = checkRateLimit(`sub:${ip}`, limits.subscribers);
    if (!allowed) {
      return Response.json(
        { error: "Demasiados intentos. Intenta de nuevo mas tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const email = cleanText(body.email, 254).toLowerCase();

    // Honeypot: campo invisible solo para bots
    if (body._trap && String(body._trap).length > 0) {
      return Response.json({ ok: true }, { status: 201 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Response.json({ error: "Correo invalido" }, { status: 400 });

    await getDb().insert(subscribers)
      .values({ email, status: "active", source: "website", createdAt: new Date() })
      .onConflictDoNothing();

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return routeError(error);
  }
}
