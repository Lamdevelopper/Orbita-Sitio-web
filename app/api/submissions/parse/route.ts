import { isEditor, routeError } from "../../../../lib/api";
import { parseSubmission } from "../../../../lib/submission";

export async function POST(request: Request) {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  try {
    const { text } = await request.json() as { text?: string };
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ error: "El texto de la plantilla es obligatorio" }, { status: 400 });
    }
    const submission = parseSubmission(text.trim());
    return Response.json({ submission });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Formato")) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return routeError(error);
  }
}