import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { newsletterCampaigns } from "../../../../../db/schema";
import { routeError } from "../../../../../lib/api";
import { adminGuard, campaignDto, editorEmail, hashActor, newPublicId, writeAudit } from "../../../../../lib/newsletter-service";

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const [source] = await getDb().select().from(newsletterCampaigns).where(eq(newsletterCampaigns.publicId, (await params).publicId)).limit(1);
    if (!source) return Response.json({ error: "Newsletter no encontrada" }, { status: 404 });
    const actor = editorEmail(request);
    const now = new Date();
    const [copy] = await getDb().insert(newsletterCampaigns).values({
      publicId: newPublicId(), subject: `Copia de ${source.subject}`.slice(0, 180), preheader: source.preheader,
      content: source.content, status: "draft", revision: 1, authorHash: await hashActor(actor), createdAt: now, updatedAt: now,
    }).returning();
    await writeAudit("newsletter.duplicated", "campaign", copy.id, actor, { sourceId: source.id });
    return Response.json({ newsletter: campaignDto(copy) }, { status: 201 });
  } catch (error) { return routeError(error); }
}
