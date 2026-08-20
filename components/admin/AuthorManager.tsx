"use client";

import type { FormEvent } from "react";
import { AUTHOR_LIMITS } from "../../lib/editorial-contract";
import type { Article, Author } from "./types";

export type AuthorForm = Omit<Author, "id" | "articleCount">;

type Props = {
  authors: Author[];
  articles: Article[];
  author: AuthorForm;
  editingAuthor: number | null;
  busy: boolean;
  onChange: (author: AuthorForm) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
  onEdit: (author: Author) => void;
  onRemove: (author: Author) => void;
  onViewArticles: (author: Author) => void;
  slugify: (value: string) => string;
};

/** Author CRUD and related-article navigation, kept separate from the tab coordinator. */
export function AuthorManager({ authors, articles, author, editingAuthor, busy, onChange, onSubmit, onCancel, onEdit, onRemove, onViewArticles, slugify }: Props) {
  return <div className="admin-workspace">
    <form className="admin-form" onSubmit={onSubmit}>
      <span className="eyebrow">{editingAuthor ? "EDITAR AUTOR" : "NUEVO AUTOR"}</span>
      <label>Nombre<input required maxLength={AUTHOR_LIMITS.name} value={author.name} onChange={(event) => onChange({ ...author, name: event.target.value, slug: author.slug || slugify(event.target.value) })} /></label>
      <label>Slug<input maxLength={AUTHOR_LIMITS.slug} value={author.slug} onChange={(event) => onChange({ ...author, slug: slugify(event.target.value) })} /></label>
      <label>Área<input maxLength={AUTHOR_LIMITS.area} value={author.area} onChange={(event) => onChange({ ...author, area: event.target.value })} /></label>
      <label>Descripción<textarea maxLength={AUTHOR_LIMITS.bio} value={author.bio} onChange={(event) => onChange({ ...author, bio: event.target.value })} /></label>
      <label>Foto de perfil (URL)<input maxLength={AUTHOR_LIMITS.avatarUrl} value={author.avatarUrl || ""} onChange={(event) => onChange({ ...author, avatarUrl: event.target.value || null })} /></label>
      <div className="admin-editor-actions"><button disabled={busy}>{editingAuthor ? "Guardar autor" : "Añadir autor"}</button>{editingAuthor !== null && <button type="button" className="admin-secondary-button" onClick={onCancel}>Cancelar</button>}</div>
    </form>
    <section className="admin-list">
      <span className="eyebrow">AUTORES REGISTRADOS</span><h2>Equipo editorial</h2>
      {authors.map((item) => {
        const related = articles.filter((article) => article.authorId === item.id && article.status !== "archived");
        return <article key={item.id}><div className="admin-author-row">{item.avatarUrl ? <img className="admin-avatar" src={item.avatarUrl} alt="" /> : <span className="author-initial" aria-hidden="true">{item.name.charAt(0)}</span>}<div><h3>{item.name}</h3><p>{item.area || "Sin área"} · {related.length} artículos activos</p></div></div><div className="admin-actions"><button onClick={() => onViewArticles(item)}>Ver artículos ({related.length})</button><button onClick={() => onEdit(item)}>Editar</button><button className="admin-danger-button" onClick={() => onRemove(item)}>Quitar</button></div></article>;
      })}
    </section>
  </div>;
}
