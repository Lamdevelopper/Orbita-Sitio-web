/**
 * Unica fuente de verdad para el contacto y la presencia publica de Orbita /
 * Aerospace AAFI. Consumidores: SiteFooter, Acerca, Enviar y el render de
 * newsletter. Cambiar aqui, no en cada componente.
 */
export const SITE_CONTACT = {
  contactEmail: "divulgacion.aafi@gmail.com",
  instagramUrl: "https://www.instagram.com/aerospaceaafi/",
  instagramHandle: "@aerospaceaafi",
  /** Dominio publico; base para resolver URLs relativas fuera de un request. */
  siteUrl: "https://orbitadivulgacion.com",
} as const;

/**
 * Identidad de marca para metadatos y datos estructurados. Los nombres
 * alternativos cubren las variantes con las que la audiencia busca la revista
 * ("Órbita divulgación", "Órbita AAFI"); se exponen en Organization/WebSite
 * JSON-LD para que los motores las asocien al dominio canónico.
 */
export const SITE_NAME = "Órbita · Aerospace AAFI";
export const SITE_ALTERNATE_NAMES = [
  "Órbita Divulgación",
  "Órbita AAFI",
  "Revista Órbita",
  "Órbita Aerospace AAFI",
] as const;
export const SITE_DESCRIPTION =
  "Revista universitaria de divulgación científica: ciencia, ingeniería y espacio contados desde la comunidad universitaria.";
/** Unica base absoluta para canonical, OG, sitemap, RSS y robots. */
export const SITE_URL = SITE_CONTACT.siteUrl;
