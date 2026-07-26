import { routeError } from "../../../../lib/api";
import { adminGuard, editorEmail, getNewsletterSettings, saveNewsletterSettings, writeAudit } from "../../../../lib/newsletter-service";

export async function GET(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try { return Response.json({ settings: await getNewsletterSettings() }); }
  catch (error) { return routeError(error); }
}

export async function PATCH(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const body = await request.json() as Record<string, unknown>;
    const allowed = ["enabled", "organizationName", "postalAddress", "privacyUrl", "contactUrl", "publicBaseUrl"];
    const input = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)));
    const settings = await saveNewsletterSettings(input);
    await writeAudit("newsletter.settings.updated", "settings", null, editorEmail(request), { fieldsChanged: Object.keys(input).length });
    return Response.json({ settings });
  } catch (error) {
    if (error instanceof Error && /HTTPS|URL/i.test(error.message)) return Response.json({ error: error.message }, { status: 400 });
    return routeError(error);
  }
}
