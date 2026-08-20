"use client";

import { useRef } from "react";
import type { FormEvent } from "react";
import { EDITION_LIMITS } from "../../lib/editorial-contract";
import { dateInputValue, formatDateOnly } from "./formatters";
import type { Edition } from "./types";

export type EditionForm = Omit<Edition, "id">;

type Props = {
  editions: Edition[];
  edition: EditionForm;
  editingEdition: number | null;
  busy: boolean;
  uploadingCover: boolean;
  onChange: (edition: EditionForm) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
  onEdit: (edition: Edition) => void;
  onUploadCover: (file: File) => void;
  slugify: (value: string) => string;
};

/** Edition CRUD. The file input is reset after upload so the same file can be selected again. */
export function EditionManager({ editions, edition, editingEdition, busy, uploadingCover, onChange, onSubmit, onCancel, onEdit, onUploadCover, slugify }: Props) {
  const coverFileRef = useRef<HTMLInputElement>(null);
  return <div className="admin-workspace">
    <form className="admin-form" onSubmit={onSubmit}>
      <span className="eyebrow">{editingEdition ? "EDITAR EDICIÓN" : "NUEVA EDICIÓN"}</span>
      <label>Número<input required type="number" min="1" value={edition.number} onChange={(event) => onChange({ ...edition, number: Number(event.target.value) })} /></label>
      <label>Título<input required maxLength={EDITION_LIMITS.title} value={edition.title} onChange={(event) => onChange({ ...edition, title: event.target.value, slug: edition.slug || slugify(event.target.value) })} /></label>
      <label>Slug<input maxLength={EDITION_LIMITS.slug} value={edition.slug} onChange={(event) => onChange({ ...edition, slug: slugify(event.target.value) })} /></label>
      <label>Fecha de publicación<input type="date" value={dateInputValue(edition.publishedAt)} onChange={(event) => onChange({ ...edition, publishedAt: event.target.value || null })} /></label>
      <label>Descripción<textarea maxLength={EDITION_LIMITS.summary} value={edition.summary} onChange={(event) => onChange({ ...edition, summary: event.target.value })} /></label>
      <label>Enlace de la revista<input maxLength={EDITION_LIMITS.externalUrl} value={edition.externalUrl || ""} onChange={(event) => onChange({ ...edition, externalUrl: event.target.value || null })} /></label>
      <label>URL PDF<input maxLength={EDITION_LIMITS.pdfUrl} value={edition.pdfUrl || ""} onChange={(event) => onChange({ ...edition, pdfUrl: event.target.value || null })} /></label>
      <label>Portada{edition.coverUrl && <img className="admin-cover-preview" src={edition.coverUrl} alt="Previsualización de portada" />}<input ref={coverFileRef} type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (file) onUploadCover(file); }} /><input maxLength={EDITION_LIMITS.coverUrl} value={edition.coverUrl || ""} placeholder="O pega una URL" onChange={(event) => onChange({ ...edition, coverUrl: event.target.value || null })} /></label>
      <label>Texto alternativo<textarea maxLength={EDITION_LIMITS.coverAlt} value={edition.coverAlt || ""} placeholder="Describe la portada para lectores de pantalla" onChange={(event) => onChange({ ...edition, coverAlt: event.target.value || null })} /></label>
      <label className="admin-check"><input type="checkbox" checked={edition.isCurrent} onChange={(event) => onChange({ ...edition, isCurrent: event.target.checked })} /> Edición actual</label>
      <div className="admin-editor-actions"><button disabled={busy || uploadingCover}>{uploadingCover ? "Subiendo portada…" : busy ? "Guardando…" : editingEdition ? "Guardar edición" : "Crear edición"}</button>{editingEdition !== null && <button type="button" className="admin-secondary-button" onClick={onCancel}>Cancelar</button>}</div>
    </form>
    <section className="admin-list"><span className="eyebrow">ARCHIVO CMS</span><h2>Ediciones editables</h2>{editions.map((item) => <article key={item.id}><div><span className="admin-pill">No. {item.number}</span><h3>{item.title}</h3><p>{formatDateOnly(item.publishedAt)}{item.isCurrent ? " · Edición actual" : ""}</p></div><button onClick={() => onEdit(item)}>Editar</button></article>)}</section>
  </div>;
}
