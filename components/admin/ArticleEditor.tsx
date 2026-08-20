"use client";

import type { FormEvent } from "react";
import { ARTICLE_LIMITS } from "../../lib/editorial-contract";
import {
  articleStatusLabels,
  homepageSlotLabels,
  type Article,
  type ArticleForm,
  type ArticleStatus,
  type Author,
  type Edition,
  type HomepageSlot,
} from "./types";

type Props = {
  article: ArticleForm;
  editingArticle: Article | null;
  authors: Author[];
  editions: Edition[];
  busy: boolean;
  onChange: (article: ArticleForm) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
  slugify: (value: string) => string;
  formatDate: (value?: string | null) => string;
};

/** Editor aislado: solo se monta cuando se crea o edita un artículo. */
export function ArticleEditor({ article, editingArticle, authors, editions, busy, onChange, onSubmit, onCancel, slugify, formatDate }: Props) {
  const update = (patch: Partial<ArticleForm>) => onChange({ ...article, ...patch });
  return <section className="admin-form admin-article-form" aria-labelledby="article-editor-title">
    <div className="admin-editor-heading"><div><span className="eyebrow">{editingArticle ? "EDITAR ARTÍCULO" : "NUEVO ARTÍCULO"}</span><h2 id="article-editor-title">{editingArticle ? editingArticle.title : "Redactar artículo"}</h2></div><button type="button" className="admin-close-button" onClick={onCancel} aria-label="Cerrar editor">Cerrar</button></div>
    {editingArticle && <p className="admin-updated">Última modificación: {formatDate(editingArticle.updatedAt)}</p>}
    <form className="admin-article-editor-fields" onSubmit={onSubmit}>
      <label>Título<input required maxLength={ARTICLE_LIMITS.title} value={article.title} onChange={(event) => update({ title: event.target.value, slug: article.slug || slugify(event.target.value) })} /></label>
      <label>Slug<input required maxLength={ARTICLE_LIMITS.slug} value={article.slug} onChange={(event) => update({ slug: slugify(event.target.value) })} /></label>
      <label>Autor<select required value={article.authorId ?? ""} onChange={(event) => update({ authorId: event.target.value ? Number(event.target.value) : null })}><option value="">Selecciona un autor</option>{authors.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label>Categoría<input required maxLength={ARTICLE_LIMITS.category} value={article.category} onChange={(event) => update({ category: event.target.value })} /></label>
      <label>Edición<select value={article.editionId || ""} onChange={(event) => update({ editionId: event.target.value ? Number(event.target.value) : null })}><option value="">Sin edición</option>{editions.map((item) => <option value={item.id} key={item.id}>No. {item.number} · {item.title}</option>)}</select></label>
      <label>Subtítulo<textarea required maxLength={ARTICLE_LIMITS.dek} value={article.dek} onChange={(event) => update({ dek: event.target.value })} /></label>
      <label className="admin-field-wide">Texto<textarea required maxLength={ARTICLE_LIMITS.body} className="article-editor" value={article.body} onChange={(event) => update({ body: event.target.value })} /></label>
      <label>URL de imagen principal<input maxLength={ARTICLE_LIMITS.heroUrl} value={article.heroUrl || ""} onChange={(event) => update({ heroUrl: event.target.value || null })} /></label>
      <label>Pie de imagen<input maxLength={ARTICLE_LIMITS.caption} value={article.heroCaption || ""} onChange={(event) => update({ heroCaption: event.target.value || null })} /></label>
      <label>Etiquetas <span className="admin-field-hint">separadas por comas</span><input value={article.tags.join(", ")} onChange={(event) => update({ tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, ARTICLE_LIMITS.tags) })} /></label>
      <label>SEO title<input maxLength={ARTICLE_LIMITS.seoTitle} value={article.seoTitle || ""} placeholder={article.title || "Título para buscadores"} onChange={(event) => update({ seoTitle: event.target.value || null })} /></label>
      <label>SEO description<textarea maxLength={ARTICLE_LIMITS.seoDescription} value={article.seoDescription || ""} placeholder={article.dek || "Descripción para buscadores"} onChange={(event) => update({ seoDescription: event.target.value || null })} /></label>
      <div className="admin-pair"><label>Ubicación<select value={article.homepageSlot} onChange={(event) => update({ homepageSlot: event.target.value as HomepageSlot })}>{(Object.entries(homepageSlotLabels) as Array<[string, string]>).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Posición<input type="number" min="1" disabled={article.homepageSlot === "hero" || article.homepageSlot === "hidden"} value={article.homepageRank ?? ""} placeholder="Automática" onChange={(event) => update({ homepageRank: event.target.value ? Number(event.target.value) : undefined })} /></label></div>
      <div className="admin-pair"><label>Estado<select value={article.status} onChange={(event) => update({ status: event.target.value as ArticleStatus })}>{(Object.entries(articleStatusLabels) as Array<[string, string]>).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Minutos de lectura<input type="number" min={ARTICLE_LIMITS.readingMin} max={ARTICLE_LIMITS.readingMax} value={article.readingMinutes} onChange={(event) => update({ readingMinutes: Number(event.target.value) })} /></label></div>
      <div className="admin-editor-actions"><button type="button" className="admin-secondary-button" onClick={onCancel}>Cancelar</button><button disabled={busy}>{busy ? "Guardando…" : editingArticle ? "Guardar cambios" : "Crear artículo"}</button></div>
    </form>
  </section>;
}
