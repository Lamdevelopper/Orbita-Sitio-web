import type { Metadata } from "next";
import { articles } from "../../lib/content";
import { ArticleExplorer } from "../../components/ArticleExplorer";
import { cmsArticles } from "../../lib/cms";
export const metadata:Metadata={title:"Artículos",description:"Historias de ciencia, ingeniería, tecnología y espacio."};
export const dynamic="force-dynamic";
export default async function ArticlesPage(){const managed=await cmsArticles();const all=[...managed,...articles.filter(item=>!managed.some(managedItem=>managedItem.slug===item.slug))];return <div className="page-shell listing-page"><div className="listing-intro"><span className="eyebrow">ARCHIVO EDITORIAL</span><h1>Historias para seguir preguntando.</h1><p>Explora entrevistas, investigaciones y explicaciones creadas desde la comunidad universitaria.</p></div><ArticleExplorer articles={all}/></div>}
