import type { MetadataRoute } from "next";
import { getOrigin } from "../lib/origin";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await getOrigin();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: `${origin}/sitemap.xml`,
  };
}
