import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "../../../lib/content";
import { ShareButton } from "../../../components/ShareButton";
import { cmsArticle, cmsArticles } from "../../../lib/cms";

export async function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  return article
    ? { title: article.title, description: article.dek, openGraph: { title: article.title, description: article.dek, images: [article.image], type: "article" } }
    : { title: "Artículo" };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await cmsArticle(slug) ?? articles.find((item) => item.slug === slug);
  if (!article) notFound();

  const allArticles=[...(await cmsArticles()),...articles];const sameEdition = allArticles.filter((item) => item.slug !== article.slug && item.edition === article.edition);
  const related = [...sameEdition, ...allArticles.filter((item) => item.slug !== article.slug && item.edition !== article.edition)].filter((item,index,list)=>list.findIndex(candidate=>candidate.slug===item.slug)===index).slice(0, 2);
  const hasEditionPage = article.edition !== "en-preparacion";

  return (
    <article className="article-page" data-article-slug={article.slug}>
      <header className="article-header page-shell">
        <span className="eyebrow">{article.category}</span>
        <h1>{article.title}</h1>
        <p>{article.dek}</p>
        <div className="article-header-meta">
          <div>
            Por <Link href={`/autores#${article.authorSlug}`}>{article.author}</Link>
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
