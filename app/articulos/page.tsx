import type { Metadata } from "next";
import { staticArticles } from "../../lib/content";
import { ArticleExplorer } from "../../components/ArticleExplorer";
import { cmsSnapshot } from "../../lib/cms";
export const metadata:Metadata={title:"Artículos",description:"Historias de ciencia, ingeniería, tecnología y espacio.",alternates:{canonical:"/articulos"}};
export const dynamic="force-dynamic";
export default async function ArticlesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }){const params=await searchParams;const tema=String(Array.isArray(params.tema)?params.tema[0]:params.tema??"").trim().slice(0,80);const managed=await cmsSnapshot();const all=[...managed.articles,...staticArticles.filter(item=>!managed.managedSlugs.has(item.slug))];return <div className="page-shell listing-page"><div className="listing-intro"><span className="eyebrow">ARCHIVO EDITORIAL</span><h1>Historias para seguir preguntando.</h1><p>Explora entrevistas, investigaciones y explicaciones creadas desde la comunidad universitaria.</p></div><ArticleExplorer articles={all} initialCategory={tema}/></div>}
