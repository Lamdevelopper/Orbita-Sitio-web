"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminNewsletter } from "./AdminNewsletter";

type Article = { id: number; slug: string; title: string; dek: string; body: string; category: string; authorId: number; editionId: number | null; status: string; homepageSlot: string; homepageRank: number; heroUrl: string | null; heroCaption: string | null; readingMinutes: number; tags: string[]; updatedAt: string };
type Author = { id: number; name: string; slug: string; bio: string; area: string; avatarUrl: string | null; articleCount: number };
type Edition = { id: number; number: number; slug: string; title: string; summary: string; coverUrl: string | null; coverAlt: string | null; externalUrl: string | null; pdfUrl: string | null; isCurrent: boolean; publishedAt: string | null };

type ArticleForm = Omit<Article, "id" | "updatedAt">;
type AuthorForm = Omit<Author, "id" | "articleCount">;
type EditionForm = Omit<Edition, "id">;

const blankArticle: ArticleForm = { title: "", slug: "", dek: "", body: "", category: "Entrevista", authorId: 0, editionId: null, status: "draft", homepageSlot: "feed", homepageRank: 1, heroUrl: null, heroCaption: null, readingMinutes: 5, tags: [] };
const blankAuthor: AuthorForm = { name: "", slug: "", bio: "", area: "Aerospace AAFI", avatarUrl: null };
const blankEdition: EditionForm = { number: 1, slug: "", title: "", summary: "", coverUrl: null, coverAlt: null, externalUrl: null, pdfUrl: null, isCurrent: false, publishedAt: new Date().toISOString().slice(0, 10) };
const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }).format(new Date(value)) : "Sin cambios registrados";

export function AdminStudio({ email }: { email: string }) {
  const [tab, setTab] = useState<"articles" | "authors" | "editions" | "newsletter">("articles");
  const [articles, setArticles] = useState<Article[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [editions, setEditions] = useState<Edition[]>([]);
  const [article, setArticle] = useState<ArticleForm>(blankArticle);
  const [author, setAuthor] = useState<AuthorForm>(blankAuthor);
  const [edition, setEdition] = useState<EditionForm>(blankEdition);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editingAuthor, setEditingAuthor] = useState<number | null>(null);
  const [editingEdition, setEditingEdition] = useState<number | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [displacedSlugs, setDisplacedSlugs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [articleResponse, authorResponse, editionResponse] = await Promise.all([
      fetch("/api/articles?scope=all"), fetch("/api/authors?scope=all"), fetch("/api/editions?scope=all"),
    ]);
    if (!articleResponse.ok || !authorResponse.ok || !editionResponse.ok) throw new Error("No se pudo cargar el CMS.");
    const [articleData, authorData, editionData] = await Promise.all([articleResponse.json(), authorResponse.json(), editionResponse.json()]);
    setArticles(articleData.articles || []); setAuthors(authorData.authors || []); setEditions(editionData.editions || []);
  }

  useEffect(() => { const timer = window.setTimeout(() => { void load().catch((error) => setMessage(error instanceof Error ? error.message : "No se pudo cargar el CMS.")); }, 0); return () => window.clearTimeout(timer); }, []);

  const articlesByPlacement = useMemo(() => [...articles].sort((a, b) => a.homepageSlot.localeCompare(b.homepageSlot) || a.homepageRank - b.homepageRank || a.title.localeCompare(b.title)), [articles]);
  const cmsQueue = articlesByPlacement.filter((item) => item.status !== "published" && item.status !== "archived");
  const managedArticles = articlesByPlacement.filter((item) => item.status !== "archived");
  const archivedArticles = articlesByPlacement.filter((item) => item.status === "archived");

  function clearDisplaced() { setDisplacedSlugs([]); }

  function beginArticle(item?: Article) {
    if (item) { setEditingArticle(item); setArticle({ ...item }); } else { setEditingArticle(null); setArticle({ ...blankArticle, authorId: authors[0]?.id ?? 0 }); }
    setTab("articles"); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveArticle(event: React.FormEvent) {
    event.preventDefault();
    if (!article.authorId) { setMessage("Agrega o selecciona un autor antes de guardar."); return; }
    setBusy(true);
    try {
      const url = editingArticle ? `/api/articles/${editingArticle.slug}` : "/api/articles";
      const response = await fetch(url, { method: editingArticle ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(article) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo guardar el articulo.");
      setDisplacedSlugs(data.displacedHeroSlugs || []);
      setMessage(data.displacedHeroCount ? "Articulo guardado. La portada anterior paso al feed para que puedas reordenarla." : "Articulo guardado.");
      setArticle({ ...blankArticle, authorId: authors[0]?.id ?? 0 }); setEditingArticle(null); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar el articulo."); } finally { setBusy(false); }
  }

  async function updateArticle(item: Article, updates: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch(`/api/articles/${item.slug}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(updates) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo actualizar.");
      setDisplacedSlugs(data.displacedHeroSlugs || []); setMessage(data.displacedHeroCount ? "Se actualizo la portada y la anterior paso al feed." : "Articulo actualizado."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo actualizar."); } finally { setBusy(false); }
  }

  async function saveAuthor(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const url = editingAuthor ? `/api/authors/${editingAuthor}` : "/api/authors";
      const response = await fetch(url, { method: editingAuthor ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...author, slug: author.slug || slugify(author.name) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo guardar el autor.");
      setAuthor(blankAuthor); setEditingAuthor(null); setMessage("Autor guardado."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar el autor."); } finally { setBusy(false); }
  }

  async function removeAuthor(item: Author) {
    if (!window.confirm(`Quitar a ${item.name}?`)) return;
    setBusy(true);
    try { const response = await fetch(`/api/authors/${item.id}`, { method: "DELETE" }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setMessage("Autor eliminado."); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo quitar el autor."); } finally { setBusy(false); }
  }

  async function uploadCover(file: File) {
    if (!file) return;
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/media", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo subir la imagen.");
      setEdition({ ...edition, coverUrl: data.url });
      setMessage("Portada subida correctamente.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo subir la portada."); }
    finally { setUploadingCover(false); }
  }

  async function saveEdition(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch("/api/editions", { method: editingEdition ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...edition, id: editingEdition || undefined, slug: edition.slug || slugify(edition.title) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "No se pudo guardar la edicion.");
      setEdition(blankEdition); setEditingEdition(null); setMessage("Edicion guardada."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar la edicion."); } finally { setBusy(false); }
  }

  return <main className="admin-studio">
    <header><div><span className="eyebrow light">ORBITA · MESA EDITORIAL</span><h1>Administrar, editar y publicar.</h1><p>Sesion privada: {email}</p></div><div className="admin-header-actions"><a href="/docs/Guia_entrega_articulos_Orbita.pdf" target="_blank" rel="noreferrer">Guia para importar</a><a href="/admin/analytics">Ver analytics</a></div></header>
    <div className="admin-tabs"><button className={tab === "articles" ? "active" : ""} onClick={() => setTab("articles")}>Articulos</button><button className={tab === "authors" ? "active" : ""} onClick={() => setTab("authors")}>Autores</button><button className={tab === "editions" ? "active" : ""} onClick={() => setTab("editions")}>Ediciones</button><button className={tab === "newsletter" ? "active" : ""} onClick={() => setTab("newsletter")}>Newsletter</button></div>
    {message && tab !== "newsletter" && <p className="admin-message">{message}</p>}

    {tab === "articles" && <div className="admin-workspace">
      <section className="admin-list admin-queue"><span className="eyebrow">ORDEN DE PORTADA</span><h2>Articulos en CMS</h2>{cmsQueue.length ? cmsQueue.map((item) => <article key={item.id}><div><span className="admin-pill">{item.status}</span><h3>{item.title}</h3><p>{item.homepageSlot} · posicion {item.homepageRank}</p></div><div className="admin-actions"><button onClick={() => beginArticle(item)}>Editar</button><button onClick={() => updateArticle(item, { status: "published" })}>Publicar</button></div></article>) : <p>Todo esta publicado. Los nuevos borradores apareceran aqui hasta que los publiques.</p>}</section>
      <section className="admin-list admin-table-panel"><div className="admin-panel-title"><div><span className="eyebrow">ADMINISTRAR ARTICULOS</span><h2>Tabla editorial</h2></div><button onClick={() => beginArticle()}>Nuevo articulo</button></div><div className="admin-table-wrap"><table><thead><tr><th>Titulo</th><th>Autor</th><th>Estado</th><th>Ubicacion</th><th>Posicion</th><th>Modificado</th><th /></tr></thead><tbody>{managedArticles.map((item) => <tr key={item.id} className={displacedSlugs.includes(item.slug) ? "admin-displaced" : ""}><td><strong>{item.title}</strong><small>{item.slug}</small></td><td>{authors.find((authorItem) => authorItem.id === item.authorId)?.name || "Sin autor"}</td><td><span className="admin-pill">{item.status}</span></td><td><select value={item.homepageSlot} onChange={(event) => { clearDisplaced(); updateArticle(item, { homepageSlot: event.target.value, homepageRank: item.homepageRank }); }}><option value="hero">Portada</option><option value="featured">Destacado</option><option value="feed">Feed</option><option value="hidden">Oculto</option></select></td><td><input aria-label={`Posicion de ${item.title}`} type="number" min="1" value={item.homepageRank || 1} onChange={(event) => { clearDisplaced(); updateArticle(item, { homepageRank: Number(event.target.value) }); }} /></td><td>{formatDate(item.updatedAt)}</td><td><div className="admin-actions"><button onClick={() => beginArticle(item)}>Editar</button><button className="admin-danger-button" onClick={() => updateArticle(item, { status: "archived" })}>Archivar</button></div></td></tr>)}</tbody></table></div><details open={showArchived} onToggle={(event) => setShowArchived((event.target as HTMLDetailsElement).open)}><summary>Archivados ({archivedArticles.length})</summary>{archivedArticles.map((item) => <div className="admin-archive-row" key={item.id}><span>{item.title}</span><button onClick={() => updateArticle(item, { status: "draft" })}>Restaurar a borrador</button></div>)}</details></section>
      <form className="admin-form admin-article-form" onSubmit={saveArticle}><span className="eyebrow">{editingArticle ? "EDITAR ARTICULO" : "NUEVO ARTICULO"}</span><h2>{editingArticle ? editingArticle.title : "Redactar articulo"}</h2>{editingArticle && <p className="admin-updated">Ultima modificacion: {formatDate(editingArticle.updatedAt)}</p>}<label>Titulo<input required value={article.title} onChange={(event) => setArticle({ ...article, title: event.target.value, slug: article.slug || slugify(event.target.value) })} /></label><label>Slug<input required value={article.slug} onChange={(event) => setArticle({ ...article, slug: slugify(event.target.value) })} /></label><label>Autor<select required value={article.authorId || ""} onChange={(event) => setArticle({ ...article, authorId: Number(event.target.value) })}><option value="">Selecciona un autor</option>{authors.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Categoria<input required value={article.category} onChange={(event) => setArticle({ ...article, category: event.target.value })} /></label><label>Edicion<select value={article.editionId || ""} onChange={(event) => setArticle({ ...article, editionId: event.target.value ? Number(event.target.value) : null })}><option value="">Sin edicion</option>{editions.map((item) => <option value={item.id} key={item.id}>No. {item.number} · {item.title}</option>)}</select></label><label>Subtitulo<textarea required value={article.dek} onChange={(event) => setArticle({ ...article, dek: event.target.value })} /></label><label>Texto<textarea required className="article-editor" value={article.body} onChange={(event) => setArticle({ ...article, body: event.target.value })} /></label><label>URL de imagen principal<input value={article.heroUrl || ""} onChange={(event) => setArticle({ ...article, heroUrl: event.target.value || null })} /></label><label>Pie de imagen<input value={article.heroCaption || ""} onChange={(event) => setArticle({ ...article, heroCaption: event.target.value || null })} /></label><div className="admin-pair"><label>Ubicacion<select value={article.homepageSlot} onChange={(event) => setArticle({ ...article, homepageSlot: event.target.value })}><option value="hero">Portada unica</option><option value="featured">Destacado</option><option value="feed">Feed</option><option value="hidden">Oculto</option></select></label><label>Posicion<input type="number" min="1" disabled={article.homepageSlot === "hero" || article.homepageSlot === "hidden"} value={article.homepageRank || 1} onChange={(event) => setArticle({ ...article, homepageRank: Number(event.target.value) })} /></label></div><div className="admin-pair"><label>Estado<select value={article.status} onChange={(event) => setArticle({ ...article, status: event.target.value })}><option value="draft">Borrador</option><option value="review">Revision</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label><label>Minutos<input type="number" min="1" value={article.readingMinutes} onChange={(event) => setArticle({ ...article, readingMinutes: Number(event.target.value) })} /></label></div><button disabled={busy}>{busy ? "Guardando..." : editingArticle ? "Guardar cambios" : "Crear articulo"}</button></form>
    </div>}

    {tab === "authors" && <div className="admin-workspace"><form className="admin-form" onSubmit={saveAuthor}><span className="eyebrow">{editingAuthor ? "EDITAR AUTOR" : "NUEVO AUTOR"}</span><label>Nombre<input required value={author.name} onChange={(event) => setAuthor({ ...author, name: event.target.value, slug: author.slug || slugify(event.target.value) })} /></label><label>Slug<input value={author.slug} onChange={(event) => setAuthor({ ...author, slug: slugify(event.target.value) })} /></label><label>Area<input value={author.area} onChange={(event) => setAuthor({ ...author, area: event.target.value })} /></label><label>Descripcion<textarea value={author.bio} onChange={(event) => setAuthor({ ...author, bio: event.target.value })} /></label><label>Foto de perfil (URL)<input value={author.avatarUrl || ""} onChange={(event) => setAuthor({ ...author, avatarUrl: event.target.value || null })} /></label><button disabled={busy}>{editingAuthor ? "Guardar autor" : "Anadir autor"}</button></form><section className="admin-list"><span className="eyebrow">AUTORES REGISTRADOS</span><h2>Equipo editorial</h2>{authors.map((item) => <article key={item.id}><div className="admin-author-row">{item.avatarUrl ? <img className="admin-avatar" src={item.avatarUrl} alt="" /> : <span className="author-initial">{item.name.charAt(0)}</span>}<div><h3>{item.name}</h3><p>{item.area} · {item.articleCount} articulos</p></div></div><div className="admin-actions"><button onClick={() => { setEditingAuthor(item.id); setAuthor({ name: item.name, slug: item.slug, bio: item.bio, area: item.area, avatarUrl: item.avatarUrl }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</button><button className="admin-danger-button" onClick={() => removeAuthor(item)}>Quitar</button></div></article>)}</section></div>}

    {tab === "editions" && <div className="admin-workspace"><form className="admin-form" onSubmit={saveEdition}><span className="eyebrow">{editingEdition ? "EDITAR EDICION" : "NUEVA EDICION"}</span><label>Numero<input required type="number" min="1" value={edition.number} onChange={(event) => setEdition({ ...edition, number: Number(event.target.value) })} /></label><label>Titulo<input required value={edition.title} onChange={(event) => setEdition({ ...edition, title: event.target.value, slug: edition.slug || slugify(event.target.value) })} /></label><label>Slug<input value={edition.slug} onChange={(event) => setEdition({ ...edition, slug: slugify(event.target.value) })} /></label><label>Fecha de publicacion<input type="date" value={edition.publishedAt?.slice(0, 10) || ""} onChange={(event) => setEdition({ ...edition, publishedAt: event.target.value || null })} /></label><label>Descripcion<textarea value={edition.summary} onChange={(event) => setEdition({ ...edition, summary: event.target.value })} /></label><label>Enlace de la revista<input value={edition.externalUrl || ""} onChange={(event) => setEdition({ ...edition, externalUrl: event.target.value || null })} /></label><label>URL PDF<input value={edition.pdfUrl || ""} onChange={(event) => setEdition({ ...edition, pdfUrl: event.target.value || null })} /></label><label>Portada{edition.coverUrl && <img className="admin-cover-preview" src={edition.coverUrl} alt="Previsualizacion de portada" />}<input ref={coverFileRef} type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadCover(file); }} /><input value={edition.coverUrl || ""} placeholder="O pega una URL" onChange={(event) => setEdition({ ...edition, coverUrl: event.target.value || null })} /></label><label>Texto alternativo<textarea value={edition.coverAlt || ""} placeholder="Describe la portada para lectores de pantalla" onChange={(event) => setEdition({ ...edition, coverAlt: event.target.value || null })} /></label><label className="admin-check"><input type="checkbox" checked={edition.isCurrent} onChange={(event) => setEdition({ ...edition, isCurrent: event.target.checked })} /> Edicion actual</label><button disabled={busy || uploadingCover}>{uploadingCover ? "Subiendo portada..." : busy ? "Guardando..." : editingEdition ? "Guardar edicion" : "Crear edicion"}</button></form><section className="admin-list"><span className="eyebrow">ARCHIVO CMS</span><h2>Ediciones editables</h2>{editions.map((item) => <article key={item.id}><div><span className="admin-pill">No. {item.number}</span><h3>{item.title}</h3><p>{item.publishedAt ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(item.publishedAt)) : "Sin fecha"}{item.isCurrent ? " · Edicion actual" : ""}</p></div><button onClick={() => { setEditingEdition(item.id); setEdition({ ...item, publishedAt: item.publishedAt ? item.publishedAt.slice(0, 10) : null }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</button></article>)}</section></div>}
    {tab === "newsletter" && <AdminNewsletter />}
  </main>;
}

