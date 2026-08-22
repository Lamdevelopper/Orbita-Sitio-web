import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UNSUBSCRIBE_PLACEHOLDER } from "../../../lib/newsletter-render";
import { getCampaign, getNewsletterSettings } from "../../../lib/newsletter-service";

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }): Promise<Metadata> {
  const campaign = await getCampaign((await params).publicId);
  if (!campaign) return { title: "Newsletter no encontrada" };
  // Archivo por campana: util para quien conserva el enlace, pero no debe
  // competir en el indice con el contenido editorial.
  return { title: campaign.subject, description: campaign.preheader, robots: { index: false, follow: false } };
}

export default async function PublicNewsletterPage({ params }: { params: Promise<{ publicId: string }> }) {
  const campaign = await getCampaign((await params).publicId);
  if (!campaign || campaign.status !== "sent" || !campaign.contentHtml) notFound();
  const settings = await getNewsletterSettings();
  const html = campaign.contentHtml.replaceAll(UNSUBSCRIBE_PLACEHOLDER, settings.contactUrl || settings.privacyUrl);
  // Div, no <main>: el layout raíz ya provee el landmark principal.
  return <div className="page-shell" style={{ maxWidth: 800, paddingBlock: 48 }}>
    <p className="eyebrow">MENSAJES DESDE ÓRBITA</p>
    <h1>{campaign.subject}</h1>
    {campaign.preheader && <p style={{ color: "#626873" }}>{campaign.preheader}</p>}
    <iframe title={campaign.subject} sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={html} style={{ width: "100%", minHeight: 760, border: 0, background: "white" }} />
  </div>;
}
