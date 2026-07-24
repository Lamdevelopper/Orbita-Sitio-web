import Link from "next/link";
import { NewsletterForm } from "../components/NewsletterForm";
import { articles, editions } from "../lib/content";
import { cmsSnapshot, type CmsArticle } from "../lib/cms";

export const dynamic = "force-dynamic";

const slotWeight: Record<string, number> = { hero: 0, featured: 1, feed: 2, hidden: 3 };

function sortManaged(items: CmsArticle[]) {
  return [...items].sort((a, b) =>
    (slotWeight[a.homepageSlot] ?? 9) - (slotWeight[b.homepageSlot] ?? 9)
    || a.homepageRank - b.homepageRank,
  );
}

export default async function Home() {
  const snapshot = await cmsSnapshot();
  const managed = sortManaged(snapshot.articles.filter((article) => article.homepageSlot !== "hidden"));
  const legacyFallback = articles.filter((article) => !snapshot.managedSlugs.has(article.slug));
  const publicArticles = [...managed, ...legacyFallback];
  const hero = managed.find((article) => article.homepageSlot === "hero") ?? publicArticles[0];
  const rest = publicArticles.filter((article) => article.slug !== hero?.slug);
  const current = editions[0];
  const currentStories = articles.filter((article) => current.articleSlugs.includes(article.slug));
  const currentMinutes = currentStories.reduce((total, article) => total + article.readingMinutes, 0);

  return <>
    {hero ? <section className="hero-grid page-shell">
      <Link href={`/articulos/${hero.slug}`} className="hero-image"><img src={hero.image} alt={hero.imageCaption ?? hero.title} /><span className="image-index">ÓRBITA / {current.number}</span></Link>
      <div className="hero-copy"><span className="eyebrow">{hero.category} · HISTORIA DE PORTADA</span><h1>{hero.title}</h1><p>{hero.dek}</p><div className="byline">Por {hero.author} <span>·</span> {hero.readingMinutes} min</div><Link className="arrow-link" href={`/articulos/${hero.slug}`}>Leer la historia <span>→</span></Link></div>
    </section> : <section className="page-shell listing-intro"><span className="eyebrow">ARCHIVO EDITORIAL</span><h1>La próxima historia está en preparación.</h1></section>}

    <section className="story-strip page-shell">{rest.slice(0, 3).map((article, index) => <article className="story-card" key={article.slug}><Link href={`/articulos/${article.slug}`}><div className="story-image"><img src={article.image} alt={article.imageCaption ?? article.title} /><span>0{index + 1}</span></div><span className="eyebrow">{article.category}</span><h2>{article.title}</h2><p>{article.dek}</p><div className="byline">{article.author} · {article.readingMinutes} min</div></Link></article>)}</section>

    <section className="edition-feature"><div className="page-shell edition-grid">{current.coverImage ? <div className="edition-feature-cover"><img src={current.coverImage} alt={`Portada de Órbita ${current.number}, ${current.title}`} /></div> : <div className={`cover cover-${current.color}`}><span>ÓRBITA</span><strong>{current.number}</strong><div className="cover-orbit"></div><h2>{current.title}</h2><small>REVISTA DE DIVULGACIÓN CIENTÍFICA</small></div>}<div className="edition-copy"><span className="eyebrow light">EDICIÓN ACTUAL / {current.year}</span><h2>{current.title}</h2><p>{current.summary}</p><div className="edition-stats"><div><strong>{current.articleSlugs.length}</strong><span>historia web</span></div><div><strong>{currentMinutes}</strong><span>min de lectura</span></div><div><strong>{current.number}</strong><span>número</span></div></div><Link className="button light-button" href={`/ediciones/${current.slug}`}>Explorar la edición →</Link></div></div></section>

    <section className="latest page-shell"><div className="section-heading"><div><span className="eyebrow">PUBLICADO RECIENTEMENTE</span><h2>Últimas historias</h2></div><Link href="/articulos">Ver todos →</Link></div>{publicArticles.map((article) => <Link className="feed-row" href={`/articulos/${article.slug}`} key={article.slug}><img src={article.image} alt="" /><div><span className="eyebrow">{article.category}</span><h3>{article.title}</h3><p>{article.dek}</p></div><div className="feed-meta">{article.author}<br />{article.readingMinutes} min <span>↗</span></div></Link>)}</section>

    <section className="topics page-shell"><div><span className="eyebrow">EXPLORA POR TEMA</span><h2>Una curiosidad lleva a otra.</h2></div><div className="topic-list">{["Aeroespacial", "Ingeniería", "Física", "Tecnología", "Medioambiente", "Comunidad científica"].map((topic, index) => <Link href={`/articulos?tema=${encodeURIComponent(topic)}`} key={topic}><span>0{index + 1}</span>{topic}<b>→</b></Link>)}</div></section>
    <section className="newsletter"><div><span className="eyebrow light">MENSAJES DESDE ÓRBITA</span><h2>Una selección de historias, una vez al mes.</h2></div><NewsletterForm /></section>
  </>;
}
