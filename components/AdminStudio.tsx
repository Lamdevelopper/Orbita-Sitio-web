"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AdminNewsletter } from "./AdminNewsletter";
import { ArticleCatalog } from "./admin/ArticleCatalog";
import { ArticleEditor } from "./admin/ArticleEditor";
import { AuthorManager, type AuthorForm } from "./admin/AuthorManager";
import { EditionManager, type EditionForm } from "./admin/EditionManager";
import { formatDateTime } from "./admin/formatters";
import type { Article, ArticleForm, Author, Edition } from "./admin/types";
import { ARTICLE_DEFAULTS, editorialSlug, PAGINATION_LIMITS } from "../lib/editorial-contract";

const slugify = (value: string) => editorialSlug(value, "");

/** Factories deliberately leave editorial relationships empty until an editor chooses them. */
const createBlankArticle = (): ArticleForm => ({ title: "", slug: "", dek: "", body: "", category: "", authorId: null, editionId: null, status: ARTICLE_DEFAULTS.status, homepageSlot: ARTICLE_DEFAULTS.homepageSlot, homepageRank: undefined, heroUrl: null, heroCaption: null, readingMinutes: ARTICLE_DEFAULTS.readingMinutes, tags: [], images: [], seoTitle: null, seoDescription: null });
const createBlankAuthor = (): AuthorForm => ({ name: "", slug: "", bio: "", area: "", avatarUrl: null });
const createBlankEdition = (editions: Edition[]): EditionForm => ({ number: Math.max(0, ...editions.map((item) => item.number)) + 1, slug: "", title: "", summary: "", coverUrl: null, coverAlt: null, externalUrl: null, pdfUrl: null, isCurrent: false, publishedAt: null });

async function fetchAllArticles() {
  const output: Article[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const response = await fetch(`/api/articles?scope=all&limit=${PAGINATION_LIMITS.editorMax}&offset=${offset}`);
    if (!response.ok) throw new Error("No se pudo cargar el catálogo de artículos.");
    const data = await response.json() as { articles?: Article[]; pagination?: { hasMore?: boolean } };
    const page = data.articles || [];
    output.push(...page);
    offset += page.length;
    hasMore = Boolean(data.pagination?.hasMore && page.length);
  }
  return output;
}

export function AdminStudio({ email }: { email: string }) {
  const [tab, setTab] = useState<"articles" | "authors" | "editions" | "newsletter">("articles");
  const [articles, setArticles] = useState<Article[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [article, setArticle] = useState<ArticleForm>(createBlankArticle);
  const [author, setAuthor] = useState<AuthorForm>(createBlankAuthor);
  const [edition, setEdition] = useState<EditionForm>(() => createBlankEdition([]));
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleEditorOpen, setArticleEditorOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<number | null>(null);
  const [editingEdition, setEditingEdition] = useState<number | null>(null);
  const [articleAuthorFilter, setArticleAuthorFilter] = useState<number | null>(null);
  const [displacedSlugs, setDisplacedSlugs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const articleMutationQueue = useRef<Promise<void>>(Promise.resolve());
  const editionDraftDirty = useRef(false);

  const load = useCallback(async () => {
    const [articleRows, authorResponse, editionResponse] = await Promise.all([fetchAllArticles(), fetch("/api/authors?scope=all"), fetch("/api/editions?scope=all")]);
    if (!authorResponse.ok || !editionResponse.ok) throw new Error("No se pudo cargar el CMS.");
    const [authorData, editionData] = await Promise.all([authorResponse.json(), editionResponse.json()]);
    const nextEditions = editionData.editions || [];
    setArticles(articleRows); setAuthors(authorData.authors || []); setEditions(nextEditions);
    if (!editionDraftDirty.current && editingEdition === null) setEdition(createBlankEdition(nextEditions));
    return nextEditions as Edition[];
  }, [editingEdition]);
  useEffect(() => { const timer = window.setTimeout(() => { void load().catch((error) => setMessage(error instanceof Error ? error.message : "No se pudo cargar el CMS.")); }, 0); return () => window.clearTimeout(timer); }, [load]);

  function beginArticle(item?: Article) {
    setEditingArticle(item || null);
    setArticle(item ? { ...item, images: item.images || [], tags: item.tags || [], seoTitle: item.seoTitle || null, seoDescription: item.seoDescription || null } : createBlankArticle());
    setArticleEditorOpen(true); setTab("articles"); window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function saveArticle(event: FormEvent) {
    event.preventDefault();
    if (article.authorId === null) { setMessage("Selecciona un autor antes de guardar."); return; }
    if (!article.category.trim()) { setMessage("Agrega una categoría antes de guardar."); return; }
    setBusy(true);
    try {
      const url = editingArticle ? `/api/articles/${editingArticle.slug}` : "/api/articles";
      const response = await fetch(url, { method: editingArticle ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(article) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo guardar el artículo.");
      setDisplacedSlugs(data.displacedHeroSlugs || []); setMessage(data.displacedHeroCount ? "Artículo guardado. La portada anterior pasó al feed para que puedas reordenarla." : "Artículo guardado.");
      setArticle(createBlankArticle()); setEditingArticle(null); setArticleEditorOpen(false); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar el artículo."); } finally { setBusy(false); }
  }
  function updateArticle(item: Article, updates: Record<string, unknown>) {
    const run = async () => { setBusy(true); try { const response = await fetch(`/api/articles/${item.slug}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(updates) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo actualizar."); setDisplacedSlugs(data.displacedHeroSlugs || []); setMessage(data.displacedHeroCount ? "Se actualizó la portada y la anterior pasó al feed." : "Artículo actualizado."); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo actualizar."); } finally { setBusy(false); } };
    const pending = articleMutationQueue.current.then(run, run); articleMutationQueue.current = pending.catch(() => undefined); return pending;
  }
  async function saveAuthor(event: FormEvent) { event.preventDefault(); setBusy(true); try { const url = editingAuthor ? `/api/authors/${editingAuthor}` : "/api/authors"; const response = await fetch(url, { method: editingAuthor ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...author, slug: author.slug || slugify(author.name) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo guardar el autor."); setAuthor(createBlankAuthor()); setEditingAuthor(null); setMessage("Autor guardado."); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar el autor."); } finally { setBusy(false); } }
  async function removeAuthor(item: Author) { if (!window.confirm(`¿Quitar a ${item.name}?`)) return; setBusy(true); try { const response = await fetch(`/api/authors/${item.id}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setMessage("Autor eliminado."); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo quitar el autor."); } finally { setBusy(false); } }
  async function uploadCover(file: File) { editionDraftDirty.current = true; setUploadingCover(true); try { const formData = new FormData(); formData.append("file", file); const response = await fetch("/api/media", { method: "POST", body: formData }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo subir la imagen."); setEdition((current) => ({ ...current, coverUrl: data.url })); setMessage("Portada subida correctamente."); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo subir la portada."); } finally { setUploadingCover(false); } }
  async function saveEdition(event: FormEvent) { event.preventDefault(); setBusy(true); try { const response = await fetch("/api/editions", { method: editingEdition ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...edition, id: editingEdition || undefined, slug: edition.slug || slugify(edition.title) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo guardar la edición."); setEditingEdition(null); editionDraftDirty.current = false; setMessage("Edición guardada."); const nextEditions = await load(); setEdition(createBlankEdition(nextEditions)); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar la edición."); } finally { setBusy(false); } }

  const selectAuthor = (item: Author) => { setArticleAuthorFilter(item.id); setTab("articles"); setArticleEditorOpen(false); };
  const editAuthor = (item: Author) => { setEditingAuthor(item.id); setAuthor({ name: item.name, slug: item.slug, bio: item.bio, area: item.area, avatarUrl: item.avatarUrl }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const editEdition = (item: Edition) => { editionDraftDirty.current = true; setEditingEdition(item.id); setEdition({ ...item, publishedAt: item.publishedAt ? item.publishedAt.slice(0, 10) : null }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const changeEdition = (next: EditionForm) => { editionDraftDirty.current = true; setEdition(next); };

  return <main className="admin-studio"><header><div><span className="eyebrow light">ÓRBITA · MESA EDITORIAL</span><h1>Administrar, editar y publicar.</h1><p>Sesión privada: {email}</p></div><div className="admin-header-actions"><a href="/admin/post">Importación automática</a><a href="/docs/Guia_entrega_articulos_Orbita.pdf" target="_blank" rel="noreferrer">Guía para importar</a><a href="/admin/analytics">Ver analytics</a></div></header><nav className="admin-tabs" aria-label="Secciones del CMS">{([["articles", "Artículos"], ["authors", "Autores"], ["editions", "Ediciones"], ["newsletter", "Newsletter"]] as const).map(([value, label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)} aria-current={tab === value ? "page" : undefined}>{label}</button>)}</nav>{message && tab !== "newsletter" && <p className="admin-message" role="status">{message}</p>}
    {tab === "articles" && <div className="admin-workspace"><ArticleCatalog articles={articles} authors={authors} editions={editions} displacedSlugs={displacedSlugs} busy={busy} authorFilter={articleAuthorFilter} onAuthorFilterChange={setArticleAuthorFilter} onEdit={beginArticle} onCreate={() => beginArticle()} onUpdate={updateArticle} onClearDisplaced={() => setDisplacedSlugs([])} />{articleEditorOpen && <ArticleEditor article={article} editingArticle={editingArticle} authors={authors} editions={editions} busy={busy} onChange={setArticle} onSubmit={saveArticle} onCancel={() => { setArticleEditorOpen(false); setEditingArticle(null); setArticle(createBlankArticle()); }} slugify={slugify} formatDate={formatDateTime} />}</div>}
    {tab === "authors" && <AuthorManager authors={authors} articles={articles} author={author} editingAuthor={editingAuthor} busy={busy} onChange={setAuthor} onSubmit={saveAuthor} onCancel={() => { setEditingAuthor(null); setAuthor(createBlankAuthor()); }} onEdit={editAuthor} onRemove={removeAuthor} onViewArticles={selectAuthor} slugify={slugify} />}
    {tab === "editions" && <EditionManager editions={editions} edition={edition} editingEdition={editingEdition} busy={busy} uploadingCover={uploadingCover} onChange={changeEdition} onSubmit={saveEdition} onCancel={() => { editionDraftDirty.current = false; setEditingEdition(null); setEdition(createBlankEdition(editions)); }} onEdit={editEdition} onUploadCover={(file) => void uploadCover(file)} slugify={slugify} />}
    {tab === "newsletter" && <AdminNewsletter />}
  </main>;
}
