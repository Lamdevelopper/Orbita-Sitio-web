import type { Metadata } from "next";
import { articles } from "../../lib/content";
import { ArticleExplorer } from "../../components/ArticleExplorer";
import { cmsSnapshot } from "../../lib/cms";
export const metadata:Metadata={title:"Artículos",description:"Historias de ciencia, ingeniería, tecnología y espacio."};
export const dynamic="force-dynamic";
export default async function ArticlesPage(){const managed=await cmsSnapshot();const all=[...managed.articles,...articles.filter(item=>!managed.managedSlugs.has(item.slug))];return <div className="page-shell listing-page"><div className="listing-intro"><span className="eyebrow">ARCHIVO EDITORIAL</span><h1>Historias para seguir preguntando.</h1><p>Explora entrevistas, investigaciones y explicaciones creadas desde la comunidad universitaria.</p></div><ArticleExplorer articles={all}/></div>}
