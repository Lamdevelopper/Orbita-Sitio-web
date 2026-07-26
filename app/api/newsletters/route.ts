import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { newsletterCampaigns } from "../../../db/schema";
import { routeError } from "../../../lib/api";
import { validateNewsletterContent } from "../../../lib/newsletter-model";
import { adminGuard, campaignDto, editorEmail, hashActor, newPublicId, writeAudit } from "../../../lib/newsletter-service";

export async function GET(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const status = new URL(request.url).searchParams.get("status");
    const query = getDb().select().from(newsletterCampaigns);
    const rows = status && ["draft", "queued", "sending", "sent", "failed", "cancelled"].includes(status)
      ? await query.where(eq(newsletterCampaigns.status, status as typeof newsletterCampaigns.$inferSelect.status)).orderBy(desc(newsletterCampaigns.updatedAt)).limit(200)
      : await query.orderBy(desc(newsletterCampaigns.updatedAt)).limit(200);
    return Response.json({ newsletters: rows.map((row) => campaignDto(row, false)) });
  } catch (error) { return routeError(error); }
}

export async function POST(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const body = await request.json() as Record<string, unknown>;
    const content = validateNewsletterContent(body.content ?? body);
    const actor = editorEmail(request);
    const now = new Date();
    const [created] = await getDb().insert(newsletterCampaigns).values({
      publicId: newPublicId(),
      subject: content.subject,
      preheader: content.preheader,
      content,
      status: "draft",
      revision: 1,
      testedRevision: null,
      authorHash: await hashActor(actor),
      createdAt: now,
      updatedAt: now,
    }).returning();
    await writeAudit("newsletter.created", "campaign", created.id, actor, { revision: 1 });
    return Response.json({ newsletter: campaignDto(created) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Newsletter")) return Response.json({ error: error.message }, { status: 400 });
    return routeError(error);
  }
}
