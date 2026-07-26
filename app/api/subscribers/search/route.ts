import { routeError } from "../../../../lib/api";
import { adminGuard, listMaskedSubscribers } from "../../../../lib/newsletter-service";

export async function POST(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const body = await request.json() as Record<string, unknown>;
    const subscribers = await listMaskedSubscribers({ exactEmail: typeof body.email === "string" ? body.email : "" });
    return Response.json({ subscribers });
  } catch (error) {
    if (error instanceof Error && error.message === "Correo invalido") return Response.json({ subscribers: [] });
    return routeError(error);
  }
}
