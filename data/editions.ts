import type { Edition } from "../lib/content";
import { articles } from "./articles";

/** Keep the static edition archive in sync with article metadata. */
const articleSlugsFor = (edition: string) =>
  articles.filter((article) => article.edition === edition).map((article) => article.slug);

export const staticEditions: Edition[] = [
  { slug: "junio-2026", number: "12", year: "2026", title: "Junio de 2026", summary: "Artemis II, decisiones bajo presion y tecnologia espacial construida desde Mexico.", color: "blue", articleSlugs: articleSlugsFor("junio-2026"), externalUrl: "https://www.instagram.com/p/DaRQBDaDVzE/?igsh=YXd6MnN4YXRzdzVi", coverImage: "/editions/12-junio-2026.webp" },
  { slug: "mayo-2026", number: "11", year: "2026", title: "Mayo de 2026", summary: "Liderazgo, ciencia extrema y nuevas voces que acercan las areas STEM.", color: "red", articleSlugs: articleSlugsFor("mayo-2026"), coverImage: "/editions/11-mayo-2026.webp" },
  { slug: "abril-2026", number: "10", year: "2026", title: "Abril de 2026", summary: "Medicina aeroespacial, movilidad sostenible e ingenieria con impacto social.", color: "ink", articleSlugs: articleSlugsFor("abril-2026"), coverImage: "/editions/10-abril-2026.webp" },
  { slug: "marzo-2026", number: "09", year: "2026", title: "Marzo de 2026", summary: "Mujeres que construyen el futuro y medicina mas alla de la Tierra.", color: "blue", articleSlugs: articleSlugsFor("marzo-2026"), coverImage: "/editions/09-marzo-2026.webp" },
  { slug: "febrero-2026", number: "08", year: "2026", title: "Febrero de 2026", summary: "Biotecnologia espacial, mundos extranos y el arte de sonar en grande.", color: "red", articleSlugs: articleSlugsFor("febrero-2026"), coverImage: "/editions/08-febrero-2026.webp" },
  { slug: "enero-2026", number: "07", year: "2026", title: "Enero de 2026", summary: "Viento solar, trayectorias cientificas y perseverancia en ingenieria.", color: "ink", articleSlugs: articleSlugsFor("enero-2026"), coverImage: "/editions/07-enero-2026.webp" },
  { slug: "noviembre-2025", number: "05", year: "2025", title: "Noviembre de 2025", summary: "Toulouse, proyectos jovenes y divulgacion bajo las estrellas.", color: "blue", articleSlugs: articleSlugsFor("noviembre-2025"), coverImage: "/editions/05-noviembre-2025.webp" },
  { slug: "septiembre-2025", number: "03", year: "2025", title: "Septiembre de 2025", summary: "NASA Space Apps Challenge, astrobiologia y diseno aeronautico universitario.", color: "red", articleSlugs: articleSlugsFor("septiembre-2025"), externalUrl: "https://heyzine.com/flip-book/7a7fc16697.html#page/1", coverImage: "/editions/trayectorias.png" },
  { slug: "agosto-2025", number: "02", year: "2025", title: "Agosto de 2025", summary: "3I/ATLAS, creatividad cientifica y equipos universitarios en construccion.", color: "ink", articleSlugs: articleSlugsFor("agosto-2025"), externalUrl: "https://heyzine.com/flip-book/9874b3c7ea.html", coverImage: "/editions/senales.png" },
];
