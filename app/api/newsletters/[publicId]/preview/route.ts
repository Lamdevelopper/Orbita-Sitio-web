import { routeError } from "../../../../../lib/api";
import { renderNewsletter, UNSUBSCRIBE_PLACEHOLDER } from "../../../../../lib/newsletter-render";
import { adminGuard, getCampaign, getNewsletterSettings, parseCampaignContent } from "../../../../../lib/newsletter-service";

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try {
    const campaign = await getCampaign((await params).publicId);
    if (!campaign) return Response.json({ error: "Newsletter no encontrada" }, { status: 404 });
    const settings = await getNewsletterSettings();
    const rendered = renderNewsletter(parseCampaignContent(campaign.content), settings, UNSUBSCRIBE_PLACEHOLDER, `${settings.publicBaseUrl || new URL(request.url).origin}/newsletter/${campaign.publicId}`);
    return Response.json({ ...rendered, revision: campaign.revision, readyToSend: settings.readyToSend, missingConfiguration: settings.missingConfiguration });
  } catch (error) { return routeError(error); }
}
