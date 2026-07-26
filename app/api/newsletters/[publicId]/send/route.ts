import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { newsletterCampaigns, newsletterDeliveries, subscribers } from "../../../../../db/schema";
import { routeError } from "../../../../../lib/api";
import { renderNewsletter, UNSUBSCRIBE_PLACEHOLDER } from "../../../../../lib/newsletter-render";
import { adminGuard, campaignDto, editorEmail, getCampaign, getNewsletterSettings, parseCampaignContent, writeAudit } from "../../../../../lib/newsletter-service";

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (!idempotencyKey || idempotencyKey.length > 160) return Response.json({ error: "Idempotency-Key es obligatorio" }, { status: 400 });
  try {
    const publicId = (await params).publicId;
    const campaign = await getCampaign(publicId);
    if (!campaign) return Response.json({ error: "Newsletter no encontrada" }, { status: 404 });
    if (campaign.idempotencyKey === idempotencyKey && campaign.status !== "draft") return Response.json({ ok: true, newsletter: campaignDto(campaign), idempotent: true });
    if (campaign.status !== "draft") return Response.json({ error: "El borrador ya fue encolado" }, { status: 409 });
    if (campaign.testedRevision !== campaign.revision) return Response.json({ error: "Prueba la ultima revision antes de enviar" }, { status: 409 });
    const settings = await getNewsletterSettings();
    if (!settings.readyToSend) return Response.json({ error: "Configuracion incompleta", missingConfiguration: settings.missingConfiguration }, { status: 409 });

    const db = getDb();
    const active = await db.select({ id: subscribers.id }).from(subscribers).where(eq(subscribers.status, "active")).limit(50_000);
    if (active.length === 0) return Response.json({ error: "No hay suscriptores activos" }, { status: 409 });
    const now = new Date();
    const viewUrl = `${settings.publicBaseUrl}/newsletter/${campaign.publicId}`;
    const snapshot = renderNewsletter(parseCampaignContent(campaign.content), settings, UNSUBSCRIBE_PLACEHOLDER, viewUrl);
    if (active.length) {
      await db.insert(newsletterDeliveries).values(active.map((subscriber) => ({
        campaignId: campaign.id,
        subscriberId: subscriber.id,
        status: "queued" as const,
        attempts: 0,
        nextAttemptAt: now,
        createdAt: now,
        updatedAt: now,
      }))).onConflictDoNothing();
    }
    const [queued] = await db.update(newsletterCampaigns).set({
      status: "queued",
      idempotencyKey,
      recipientCount: active.length,
      contentHtml: snapshot.html,
      contentText: snapshot.text,
      queuedAt: now,
      updatedAt: now,
    }).where(and(eq(newsletterCampaigns.id, campaign.id), eq(newsletterCampaigns.status, "draft"))).returning();
    if (!queued) return Response.json({ error: "El borrador ya fue encolado" }, { status: 409 });
    await writeAudit("newsletter.queued", "campaign", campaign.id, editorEmail(request), { recipientCount: active.length, revision: campaign.revision });
    return Response.json({ ok: true, newsletter: campaignDto(queued) });
  } catch (error) { return routeError(error); }
}
