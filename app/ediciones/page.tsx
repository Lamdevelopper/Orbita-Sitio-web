import type { Metadata } from "next";
import Link from "next/link";
import { editions } from "../../lib/content";
import { cmsEditions } from "../../lib/cms";

export const metadata: Metadata = { title: "Ediciones", description: "El archivo completo de la revista Órbita." };

export const dynamic = "force-dynamic";

export default async function EditionsPage() {
  const managed = await cmsEditions();
  const allEditions = [...managed, ...editions.filter((edition) => !managed.some((item) => item.slug === edition.slug))];
  return (
    <div className="page-shell listing-page">
      <div className="listing-intro">
        <span className="eyebrow">ARCHIVO DE ÓRBITA</span>
        <h1>Cada número es una constelación.</h1>
        <p>Explora las ediciones por su fecha real y abre sus mejores historias como artículos independientes.</p>
      </div>
      <div className="edition-archive">
        {allEditions.map((edition) => (
          <Link href={`/ediciones/${edition.slug}`} key={edition.slug}>
            {edition.coverImage ? (
              <div className={`edition-thumbnail edition-thumbnail-${edition.slug}`}>
                <img src={edition.coverImage} alt={`Portada de Órbita ${edition.number}, ${edition.title}`} />
              </div>
            ) : (
              <div className={`cover cover-${edition.color}`}><span>ÓRBITA</span><strong>{edition.number}</strong><div className="cover-orbit" /><h2>{edition.title}</h2><small>REVISTA DE DIVULGACIÓN CIENTÍFICA</small></div>
            )}
            <div className="edition-label">
              <span>{edition.year} · NÚMERO {edition.number}</span>
              <h2>{edition.title}</h2>
              <p>{edition.summary}</p>
              <b>Explorar edición →</b>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
