import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticles, getEdition } from "../../../lib/content";
import { SITE_URL } from "../../../lib/site-config";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const edition = await getEdition(slug);
  if (!edition) return { title: "Edición no encontrada" };
  const canonical = `/ediciones/${edition.slug}`;
  return {
    title: `${edition.title} · Número ${edition.number}`,
    description: edition.summary,
    alternates: { canonical },
    openGraph: {
      title: `${edition.title} · Número ${edition.number}`,
      description: edition.summary,
      url: `${SITE_URL}${canonical}`,
      ...(edition.coverImage ? { images: [{ url: edition.coverImage, alt: `Portada de Órbita ${edition.number}, ${edition.title}` }] } : {}),
    },
  };
}

export default async function EditionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const edition = await getEdition(slug);
  if (!edition) notFound();
  const stories = (await getArticles()).filter((article) => article.edition === edition.slug);

  return (
    <div className="edition-page">
      <section className="edition-mast">
        <div className="page-shell">
          {edition.coverImage ? (
            <div className="edition-mast-cover"><img src={edition.coverImage} alt={`Portada de Órbita ${edition.number}, ${edition.title}`} /></div>
          ) : (
            <div className={`cover cover-${edition.color}`}><span>ÓRBITA</span><strong>{edition.number}</strong><div className="cover-orbit" /><b className="cover-title">{edition.title}</b><small>REVISTA DE DIVULGACIÓN CIENTÍFICA</small></div>
          )}
          <div>
            <span className="eyebrow light">NÚMERO {edition.number} · {edition.year}</span>
            <h1>{edition.title}</h1>
            <p>{edition.summary}</p>
            {edition.externalUrl && <a className="white-outline" href={edition.externalUrl} target="_blank" rel="noopener noreferrer">Abrir revista completa <span aria-hidden="true">↗</span><span className="sr-only">(se abre en una pestaña nueva)</span></a>}
          </div>
        </div>
      </section>
      <section className="page-shell edition-index">
        <span className="eyebrow">CONTENIDO WEB</span>
        <h2>Historias recuperadas de esta edición</h2>
        {stories.length ? stories.map((article, index) => (
          <Link href={`/articulos/${article.slug}`} key={article.slug}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div><small>{article.category}</small><h3>{article.title}</h3><p>{article.dek}</p></div>
            <b>{article.readingMinutes} min →</b>
          </Link>
        )) : <p className="empty-note">Esta edición se conserva en su visor original. Sus artículos se incorporarán progresivamente al archivo web.</p>}
      </section>
    </div>
  );
}
