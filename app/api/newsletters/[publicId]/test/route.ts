import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { newsletterCampaigns } from "../../../../../db/schema";
import { routeError } from "../../../../../lib/api";
import { sendEmailFlare } from "../../../../../lib/emailflare";
import { renderNewsletter } from "../../../../../lib/newsletter-render";
import { adminGuard, editorEmail, getCampaign, getNewsletterSettings, parseCampaignContent, writeAudit } from "../../../../../lib/newsletter-service";

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const publicId = (await params).publicId;
    const recipient = editorEmail(request);
    if (!recipient) return Response.json({ error: "La prueba requiere un administrador autenticado por correo" }, { status: 400 });
    const campaign = await getCampaign(publicId);
    if (!campaign) return Response.json({ error: "Newsletter no encontrada" }, { status: 404 });
    if (campaign.status !== "draft") return Response.json({ error: "Solo se prueban borradores" }, { status: 409 });
    const settings = await getNewsletterSettings();
    const missingForTest = settings.missingConfiguration.filter((item) => item !== "featureFlag");
    if (missingForTest.length) return Response.json({ error: "Configuracion incompleta", missingConfiguration: missingForTest }, { status: 409 });
    const viewUrl = `${settings.publicBaseUrl}/newsletter/${campaign.publicId}`;
    const rendered = renderNewsletter(parseCampaignContent(campaign.content), settings, settings.contactUrl, viewUrl);
    await sendEmailFlare({
      to: recipient,
      subject: `[Prueba] ${campaign.subject}`,
      html: rendered.html,
      text: rendered.text,
      idempotencyKey: `newsletter-test:${campaign.publicId}:${campaign.revision}`,
    });
    const now = new Date();
    await getDb().update(newsletterCampaigns).set({ testedRevision: campaign.revision, testSentAt: now, updatedAt: now }).where(eq(newsletterCampaigns.id, campaign.id));
    await writeAudit("newsletter.tested", "campaign", campaign.id, recipient, { revision: campaign.revision });
    return Response.json({ ok: true, testedRevision: campaign.revision, testSentAt: now });
  } catch (error) { return routeError(error); }
}
