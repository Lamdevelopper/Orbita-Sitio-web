import type { Metadata } from "next";
import { getAuthors, staticArticles } from "../../lib/content";
import { absoluteUrl } from "../../lib/seo";

export const metadata: Metadata = { title: "Autores", description: "Las voces del equipo de Divulgación AAFI Aerospace que escriben Órbita.", alternates: { canonical: "/autores" } };
export const dynamic = "force-dynamic";

type AuthorProfile = { id?: number; slug: string; name: string; area: string; bio: string; avatarUrl?: string | null; articleCount: number };

function authorsJsonLd(authors: AuthorProfile[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: authors.map((author, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        name: author.name,
        jobTitle: author.area,
        description: author.bio,
        url: absoluteUrl(`/autores#${author.slug}`),
        worksFor: { "@type": "Organization", name: "Órbita · Aerospace AAFI" },
      },
    })),
  };
}

export default async function AuthorsPage() {
  const roster = await getAuthors();
  const all: AuthorProfile[] = roster.map((author) => ({
    ...author,
    // El roster estatico no trae conteos; se derivan del archivo local.
    articleCount: author.articleCount ?? staticArticles.filter((article) => article.authorSlug === author.slug).length,
  }));
  return <div className="page-shell listing-page"><div className="listing-intro"><span className="eyebrow">VOCES DE ORBITA</span><h1>La ciencia tambien tiene rostro.</h1><p>Personas del equipo de Divulgacion AAFI Aerospace que convierten preguntas en historias.</p></div><div className="authors-grid">{all.map((author, index) => <article id={author.slug} key={author.slug}><div className="author-number">{String(index + 1).padStart(2, "0")}</div>{author.avatarUrl ? <img className="author-profile-photo" src={author.avatarUrl} alt={`Foto de ${author.name}`} /> : <div className="author-initial">{author.name.charAt(0)}</div>}<h2>{author.name}</h2><span>{author.area}</span><p>{author.bio}</p><small>{author.articleCount} articulos publicados</small></article>)}</div><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(authorsJsonLd(all)) }} /></div>;
}
