import { notFound } from "next/navigation";
import { UNSUBSCRIBE_PLACEHOLDER } from "../../../lib/newsletter-render";
import { getCampaign, getNewsletterSettings } from "../../../lib/newsletter-service";

export default async function PublicNewsletterPage({ params }: { params: Promise<{ publicId: string }> }) {
  const campaign = await getCampaign((await params).publicId);
  if (!campaign || campaign.status !== "sent" || !campaign.contentHtml) notFound();
  const settings = await getNewsletterSettings();
  const html = campaign.contentHtml.replaceAll(UNSUBSCRIBE_PLACEHOLDER, settings.contactUrl || settings.privacyUrl);
  return <main className="page-shell" style={{ maxWidth: 800, paddingBlock: 48 }}>
    <p className="eyebrow">MENSAJES DESDE ÓRBITA</p>
    <h1>{campaign.subject}</h1>
    {campaign.preheader && <p style={{ color: "#626873" }}>{campaign.preheader}</p>}
    <iframe title={campaign.subject} sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={html} style={{ width: "100%", minHeight: 760, border: 0, background: "white" }} />
  </main>;
}
