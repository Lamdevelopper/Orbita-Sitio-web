import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { staticArticles, getArticle, getArticles } from "../../../lib/content";
import { ShareButton } from "../../../components/ShareButton";


export async function generateStaticParams() {
  return staticArticles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  // Resolve through the resilient CMS facade so published CMS stories do not
  // fall back to a generic title or stale static Open Graph image.
  const article = await getArticle(slug);
  if (!article) return { title: "Artículo no encontrado" };
  const seoTitle = "seoTitle" in article && article.seoTitle?.trim() ? article.seoTitle : article.title;
  const seoDescription = "seoDescription" in article && article.seoDescription?.trim()
    ? article.seoDescription
    : article.dek;
  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      images: [{ url: article.image, alt: article.imageCaption ?? article.title }],
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const allArticles=[...(await getArticles()),...staticArticles];
  // An empty edition is unknown, not a shared bucket; only use edition
  // affinity for stories with a real linked edition slug.
  const sameEdition = article.edition
    ? allArticles.filter((item) => item.slug !== article.slug && item.edition === article.edition)
    : [];
  const related = [...sameEdition, ...allArticles.filter((item) => item.slug !== article.slug && item.edition !== article.edition)].filter((item,index,list)=>list.findIndex(candidate=>candidate.slug===item.slug)===index).slice(0, 2);
  // Empty edition slugs mean the CMS row has no linked edition.  Do not
  // render a link to `/ediciones/` or the old placeholder route in that case.
  const hasEditionPage = Boolean(article.edition && article.edition !== "en-preparacion");

  return (
    <article className="article-page" data-article-slug={article.slug}>
      <header className="article-header page-shell">
        <span className="eyebrow">{article.category}</span>
        <h1>{article.title}</h1>
        <p>{article.dek}</p>
        <div className="article-header-meta">
          <div>
            Por {article.authorSlug ? <Link href={`/autores#${article.authorSlug}`}>{article.author}</Link> : article.author}
            <br />
            <span>{article.published} · {article.readingMinutes} min de lectura</span>
          </div>
          <ShareButton title={article.title} />
        </div>
      </header>

      <figure className="article-hero">
        <img src={article.image} alt={article.imageCaption ?? article.title} />
        {article.imageCaption && <figcaption>{article.imageCaption}</figcaption>}
      </figure>

      <div className="reading-layout page-shell">
        <aside>
          <div className="reading-progress"><span /></div>
          <p>EN ESTA HISTORIA</p>
          {article.body.map((section, index) => section.heading && <a href={`#seccion-${index}`} key={section.heading}>{section.heading}</a>)}
        </aside>
        <div className="article-body">
          {article.body.map((section, index) => (
            <section id={`seccion-${index}`} key={index}>
              {section.heading && <h2>{section.heading}</h2>}
              {section.image && (
                <figure className="article-inline-image">
                  <img src={section.image.url} alt={section.image.caption || article.title} />
                  {section.image.caption && <figcaption>{section.image.caption}</figcaption>}
                </figure>
              )}
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.quote && <blockquote>{section.quote}</blockquote>}
            </section>
          ))}
          <div className="references">
            <span className="eyebrow">ARCHIVO EDITORIAL</span>
            <h2>Origen de esta historia</h2>
            <p>{article.sourceLabel ?? "Pieza desarrollada para el archivo web de Órbita y revisada por el equipo editorial."}</p>
            {hasEditionPage && <Link href={`/ediciones/${article.edition}`}>Explorar la edición original →</Link>}
          </div>
          <div className="author-card">
            <div className="author-initial">{article.author.charAt(0)}</div>
            <div><span>ESCRITO POR</span><h3>{article.author}</h3><p>{article.dek}</p></div>
          </div>
        </div>
      </div>

      <section className="related page-shell">
        <div className="section-heading"><h2>Continúa en esta órbita</h2></div>
        <div className="related-grid">
          {related.map((item) => (
            <Link href={`/articulos/${item.slug}`} key={item.slug}>
              <img src={item.image} alt={item.imageCaption ?? item.title} />
              <span className="eyebrow">{item.category}</span>
              <h3>{item.title}</h3>
              <small>{item.readingMinutes} min →</small>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
