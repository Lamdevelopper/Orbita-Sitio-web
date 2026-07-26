import { routeError } from "../../../../lib/api";
import { adminGuard, editorEmail, suppressSubscriber, writeAudit } from "../../../../lib/newsletter-service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const body = await request.json() as Record<string, unknown>;
    const id = Number((await params).id);
    if (!Number.isInteger(id) || body.status !== "unsubscribed") return Response.json({ error: "Solo se permite suprimir" }, { status: 400 });
    const subscriber = await suppressSubscriber(id);
    if (!subscriber) return Response.json({ error: "Suscriptor no encontrado" }, { status: 404 });
    await writeAudit("subscriber.suppressed", "subscriber", id, editorEmail(request));
    return Response.json({ subscriber });
  } catch (error) { return routeError(error); }
}
