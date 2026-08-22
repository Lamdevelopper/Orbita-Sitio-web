import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // /admin esta protegido por sesion; se mantiene fuera del rastreo.
      // /newsletter NO se bloquea aqui: sus paginas llevan noindex propio y
      // deben poder rastrearse para verlo.
      { userAgent: "*", allow: "/", disallow: ["/api/", "/admin"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
