import type { MetadataRoute } from "next";
import { articles, editions } from "../lib/content";
export default function sitemap():MetadataRoute.Sitemap{const base="https://orbita-aerospace-aafi.lamoyi-matias.chatgpt.site";return ["","/articulos","/ediciones","/autores","/acerca","/privacidad"].map(path=>({url:`${base}${path}`,lastModified:new Date()})).concat(articles.map(a=>({url:`${base}/articulos/${a.slug}`,lastModified:new Date("2026-07-13")})),editions.map(e=>({url:`${base}/ediciones/${e.slug}`,lastModified:new Date(`${e.year}-01-01`)})))}
