import type { Metadata } from "next";
import { authors, articles } from "../../lib/content";

export const metadata: Metadata = { title: "Autores" };

export default function AuthorsPage(){return <div className="page-shell listing-page"><div className="listing-intro"><span className="eyebrow">VOCES DE ÓRBITA</span><h1>La ciencia también tiene rostro.</h1><p>Personas del equipo de Divulgación AAFI Aerospace que convierten preguntas en historias.</p></div><div className="authors-grid">{authors.map((a,i)=><article id={a.slug} key={a.slug}><div className="author-number">{String(i+1).padStart(2,"0")}</div><div className="author-initial">{a.name.charAt(0)}</div><h2>{a.name}</h2><span>{a.area}</span><p>{a.bio}</p><small>{articles.filter(x=>x.authorSlug===a.slug).length} artículos publicados</small></article>)}</div></div>}
