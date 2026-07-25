import type { Metadata } from "next";
import { asc, count, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { articles as articleTable, authors as authorTable } from "../../db/schema";
import { staticAuthors, staticArticles } from "../../lib/content";

export const metadata: Metadata = { title: "Autores" };
export const dynamic = "force-dynamic";

type AuthorProfile = { id?: number; slug: string; name: string; area: string; bio: string; avatarUrl?: string | null; articleCount: number };

export default async function AuthorsPage() {
  let managed: AuthorProfile[] = [];
  try {
    managed = await getDb().select({ id: authorTable.id, slug: authorTable.slug, name: authorTable.name, area: authorTable.area, bio: authorTable.bio, avatarUrl: authorTable.avatarUrl, articleCount: count(articleTable.id) })
      .from(authorTable).leftJoin(articleTable, eq(articleTable.authorId, authorTable.id)).groupBy(authorTable.id).orderBy(asc(authorTable.name));
  } catch { managed = []; }
  const all = managed.length ? managed : staticAuthors.map((author) => ({ ...author, articleCount: staticArticles.filter((article) => article.authorSlug === author.slug).length }));
  return <div className="page-shell listing-page"><div className="listing-intro"><span className="eyebrow">VOCES DE ORBITA</span><h1>La ciencia tambien tiene rostro.</h1><p>Personas del equipo de Divulgacion AAFI Aerospace que convierten preguntas en historias.</p></div><div className="authors-grid">{all.map((author, index) => <article id={author.slug} key={author.slug}><div className="author-number">{String(index + 1).padStart(2, "0")}</div>{author.avatarUrl ? <img className="author-profile-photo" src={author.avatarUrl} alt={`Foto de ${author.name}`} /> : <div className="author-initial">{author.name.charAt(0)}</div>}<h2>{author.name}</h2><span>{author.area}</span><p>{author.bio}</p><small>{author.articleCount} articulos publicados</small></article>)}</div></div>;
}
