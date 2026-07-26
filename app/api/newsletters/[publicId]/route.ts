import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { newsletterCampaigns } from "../../../../db/schema";
import { routeError } from "../../../../lib/api";
import { validateNewsletterContent } from "../../../../lib/newsletter-model";
import { adminGuard, campaignDto, editorEmail, writeAudit } from "../../../../lib/newsletter-service";

export async function GET(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const [campaign] = await getDb().select().from(newsletterCampaigns).where(eq(newsletterCampaigns.publicId, (await params).publicId)).limit(1);
    if (!campaign) return Response.json({ error: "Newsletter no encontrada" }, { status: 404 });
    return Response.json({ newsletter: campaignDto(campaign) });
  } catch (error) { return routeError(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const publicId = (await params).publicId;
    const [current] = await getDb().select().from(newsletterCampaigns).where(eq(newsletterCampaigns.publicId, publicId)).limit(1);
    if (!current) return Response.json({ error: "Newsletter no encontrada" }, { status: 404 });
    if (current.status !== "draft") return Response.json({ error: "Solo los borradores se pueden editar" }, { status: 409 });
    const body = await request.json() as Record<string, unknown>;
    const content = validateNewsletterContent(body.content ?? body);
    const revision = current.revision + 1;
    const [updated] = await getDb().update(newsletterCampaigns).set({
      subject: content.subject,
      preheader: content.preheader,
      content,
      contentHtml: null,
      contentText: null,
      revision,
      testedRevision: null,
      updatedAt: new Date(),
    }).where(eq(newsletterCampaigns.id, current.id)).returning();
    await writeAudit("newsletter.saved", "campaign", current.id, editorEmail(request), { revision });
    return Response.json({ newsletter: campaignDto(updated) });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Newsletter")) return Response.json({ error: error.message }, { status: 400 });
    return routeError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const publicId = (await params).publicId;
    const [campaign] = await getDb().select().from(newsletterCampaigns).where(eq(newsletterCampaigns.publicId, publicId)).limit(1);
    if (!campaign) return Response.json({ error: "Newsletter no encontrada" }, { status: 404 });
    if (campaign.status !== "draft") return Response.json({ error: "El historial enviado es inmutable" }, { status: 409 });
    await writeAudit("newsletter.deleted", "campaign", campaign.id, editorEmail(request));
    await getDb().delete(newsletterCampaigns).where(eq(newsletterCampaigns.id, campaign.id));
    return new Response(null, { status: 204 });
  } catch (error) { return routeError(error); }
}
