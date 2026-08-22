import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { CookieConsent } from "../components/CookieConsent";
import { Analytics } from "../components/Analytics";
import { cn } from "@/lib/utils";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "../lib/site-config";
import { siteJsonLd } from "../lib/seo";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
});

// El dominio canonico es fijo: las URLs de canonical/OG/sitemap/RSS nunca
// dependen del Host header recibido (evita contenido duplicado entre hosts).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Revista universitaria de divulgación científica`, template: "%s · Órbita" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/", types: { "application/rss+xml": `${SITE_URL}/rss.xml` } },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: SITE_NAME,
    description: "Historias que acercan la ciencia a nuevas generaciones.",
    type: "website",
    locale: "es_MX",
    siteName: SITE_NAME,
    url: `${SITE_URL}/`,
    images: [{url:`${SITE_URL}/og.jpg`,width:1200,height:675,alt:"Órbita · Aerospace AAFI — Ciencia, ingeniería y espacio desde la universidad"}],
  },
  twitter: {card:"summary_large_image",title:SITE_NAME,description:"Ciencia, ingeniería y espacio desde la universidad",images:[`${SITE_URL}/og.jpg`]},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans", inter.variable)}>
      <body className={`${inter.variable} ${serif.variable}`}>
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <link rel="alternate" type="application/rss+xml" title="Órbita — Revista de divulgación científica" href="/rss.xml" />
        <SiteHeader/><main id="contenido">{children}</main><SiteFooter/><CookieConsent/><Analytics/>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
      </body>
    </html>
  );
}
