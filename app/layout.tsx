import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { CookieConsent } from "../components/CookieConsent";
import { Analytics } from "../components/Analytics";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});
const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "orbita-revista.example";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
  metadataBase: new URL(origin),
  title: { default: "Órbita · Aerospace AAFI — Revista universitaria de divulgación científica", template: "%s · Órbita" },
  description: "Ciencia, ingeniería y espacio contados desde la comunidad universitaria.",
  openGraph: { title: "Órbita · Aerospace AAFI", description: "Historias que acercan la ciencia a nuevas generaciones.", type: "website", locale: "es_MX", images: [{url:`${origin}/og.png`,width:1672,height:941,alt:"Órbita · Aerospace AAFI — Ciencia, ingeniería y espacio desde la universidad"}] },
  twitter: {card:"summary_large_image",title:"Órbita · Aerospace AAFI",description:"Ciencia, ingeniería y espacio desde la universidad",images:[`${origin}/og.png`]},
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn("font-sans", inter.variable)}>
      <body className={`${inter.variable} ${serif.variable}`}>
        <SiteHeader/><main>{children}</main><SiteFooter/><CookieConsent/><Analytics/>
      </body>
    </html>
  );
}
