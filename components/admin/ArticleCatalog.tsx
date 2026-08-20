"use client";

import { useMemo, useRef, useState } from "react";
import {
  articleStatusLabels,
  homepageSlotLabels,
  type Article,
  type Author,
  type Edition,
  type HomepageSlot,
} from "./types";
import { formatDateTime } from "./formatters";

type Props = {
  articles: Article[];
  authors: Author[];
  editions: Edition[];
  displacedSlugs: string[];
  busy: boolean;
  authorFilter: number | null;
  onAuthorFilterChange: (id: number | null) => void;
  onEdit: (article: Article) => void;
  onCreate: () => void;
  onUpdate: (article: Article, updates: Record<string, unknown>) => void;
  onClearDisplaced: () => void;
};

/** Avoids overlapping placement requests by committing rank only on blur/Enter. */
function RankInput({ article, busy, onCommit }: { article: Article; busy: boolean; onCommit: (rank: number) => void }) {
  const [value, setValue] = useState(article.homepageRank || 1);
  const lastCommitted = useRef(article.homepageRank || 1);

  const commit = () => {
    const next = Math.max(1, Math.floor(Number(value) || 1));
    setValue(next);
    if (next !== lastCommitted.current) {
      lastCommitted.current = next;
      onCommit(next);
    }
  };

  return <input
    aria-label={`Posición de ${article.title}`}
    type="number"
    min="1"
    disabled={busy || article.homepageSlot === "hero" || article.homepageSlot === "hidden"}
    value={value}
    onChange={(event) => setValue(Number(event.target.value))}
    onBlur={commit}
    onKeyDown={(event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
      }
    }}
  />;
}

/** Catálogo editorial con filtros combinables y agrupación de ediciones tipo carpeta. */
export function ArticleCatalog({
  articles,
  authors,
  editions,
  displacedSlugs,
  busy,
  authorFilter,
  onAuthorFilterChange,
  onEdit,
  onCreate,
  onUpdate,
  onClearDisplaced,
}: Props) {
  const [query, setQuery] = useState("");
  const [editionFilter, setEditionFilter] = useState<number | "all" | "none">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  const authorName = (id: number | null) => id === null ? "Sin autor" : authors.find((item) => item.id === id)?.name || "Sin autor";
  const visibleArticles = useMemo(() => articles.filter((item) => {
    // Archivados quedan colapsados, salvo que el editor los filtre expresamente.
    if (statusFilter !== "archived" && item.status === "archived") return false;
    const normalized = `${item.title} ${item.slug} ${item.dek} ${item.category} ${item.tags.join(" ")}`.toLocaleLowerCase();
    return (!query || normalized.includes(query.toLocaleLowerCase()))
      && (categoryFilter === "all" || item.category === categoryFilter)
      && (editionFilter === "all" || (editionFilter === "none" ? item.editionId === null : item.editionId === editionFilter))
      && (authorFilter === null || item.authorId === authorFilter)
      && (statusFilter === "all" || item.status === statusFilter)
      && (locationFilter === "all" || item.homepageSlot === locationFilter);
  }).sort((a, b) => a.homepageSlot.localeCompare(b.homepageSlot) || (a.homepageRank ?? Number.MAX_SAFE_INTEGER) - (b.homepageRank ?? Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title)), [articles, query, categoryFilter, editionFilter, authorFilter, statusFilter, locationFilter]);

  const categories = useMemo(() => Array.from(new Set(articles.map((item) => item.category.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "es")), [articles]);

  const folders = useMemo(() => editions.map((edition) => ({
    ...edition,
    count: articles.filter((item) => item.editionId === edition.id && item.status !== "archived").length,
  })).sort((a, b) => b.number - a.number), [editions, articles]);

  const clearFilters = () => {
    setQuery("");
    setCategoryFilter("all");
    setEditionFilter("all");
    onAuthorFilterChange(null);
    setStatusFilter("all");
    setLocationFilter("all");
  };
  const activeFilters = Boolean(query || categoryFilter !== "all" || editionFilter !== "all" || authorFilter !== null || statusFilter !== "all" || locationFilter !== "all");
  const archived = articles.filter((item) => item.status === "archived");

  return <section className="admin-list admin-table-panel" aria-labelledby="article-catalog-title">
    <div className="admin-panel-title">
      <div><span className="eyebrow">ADMINISTRAR ARTÍCULOS</span><h2 id="article-catalog-title">Catálogo editorial</h2></div>
      <button onClick={onCreate}>Nuevo artículo</button>
    </div>

    <div className="admin-catalog-filters" role="search" aria-label="Filtrar artículos">
      <label>Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Título, slug, categoría o etiqueta" /></label>
      <label>Categoría<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">Todas las categorías</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
      <label>Edición<select value={editionFilter} onChange={(event) => setEditionFilter(event.target.value === "none" ? "none" : event.target.value === "all" ? "all" : Number(event.target.value))}><option value="all">Todas las ediciones</option><option value="none">Sin edición</option>{folders.map((folder) => <option value={folder.id} key={folder.id}>No. {folder.number} · {folder.title} ({folder.count})</option>)}</select></label>
      <label>Autor<select value={authorFilter ?? "all"} onChange={(event) => onAuthorFilterChange(event.target.value === "all" ? null : Number(event.target.value))}><option value="all">Todos los autores</option>{authors.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label>Estado<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos los estados</option>{(Object.entries(articleStatusLabels) as Array<[string, string]>).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Ubicación<select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}><option value="all">Todas las ubicaciones</option>{(Object.entries(homepageSlotLabels) as Array<[string, string]>).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      {activeFilters && <button type="button" className="admin-clear-filters" onClick={clearFilters}>Limpiar filtros</button>}
    </div>

    <div className="admin-edition-folders" aria-label="Carpetas por edición">
      <button className={editionFilter === "all" ? "active" : ""} onClick={() => setEditionFilter("all")}>Todas <span>{articles.filter((item) => item.status !== "archived").length}</span></button>
      <button className={editionFilter === "none" ? "active" : ""} onClick={() => setEditionFilter("none")}>Sin edición <span>{articles.filter((item) => item.editionId === null && item.status !== "archived").length}</span></button>
      {folders.map((folder) => <button key={folder.id} className={editionFilter === folder.id ? "active" : ""} onClick={() => setEditionFilter(folder.id)} aria-label={`Filtrar por edición ${folder.title}`}>Carpeta No. {folder.number} <span>{folder.count}</span></button>)}
    </div>

    {visibleArticles.length ? <div className="admin-table-wrap"><table>
      <thead><tr><th>Título</th><th>Autor</th><th>Edición</th><th>Estado</th><th>Ubicación</th><th>Posición</th><th>Modificado</th><th /></tr></thead>
      <tbody>{visibleArticles.map((item) => <tr key={item.id} className={displacedSlugs.includes(item.slug) ? "admin-displaced" : ""}>
        <td><strong>{item.title}</strong><small>{item.slug}</small></td>
        <td>{authorName(item.authorId)}</td>
        <td>{item.editionId ? editions.find((edition) => edition.id === item.editionId)?.title || "Sin edición" : "Sin edición"}</td>
        <td><span className="admin-pill">{articleStatusLabels[item.status]}</span></td>
        <td><select aria-label={`Ubicación de ${item.title}`} value={item.homepageSlot} disabled={busy} onChange={(event) => {
          onClearDisplaced();
          // Cada slot tiene su propio ranking; una mudanza comienza arriba.
          onUpdate(item, { homepageSlot: event.target.value as HomepageSlot, homepageRank: 1 });
        }}>{(Object.entries(homepageSlotLabels) as Array<[string, string]>).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></td>
        <td><RankInput key={`${item.id}:${item.homepageSlot}:${item.homepageRank}`} article={item} busy={busy} onCommit={(rank) => { onClearDisplaced(); onUpdate(item, { homepageRank: rank }); }} /></td>
        <td>{formatDateTime(item.updatedAt)}</td>
        <td><div className="admin-actions"><button onClick={() => onEdit(item)}>Editar</button>{item.status === "archived" ? <button onClick={() => onUpdate(item, { status: "draft" })}>Restaurar</button> : <button className="admin-danger-button" onClick={() => onUpdate(item, { status: "archived" })}>Archivar</button>}</div></td>
      </tr>)}</tbody>
    </table></div> : <div className="admin-empty-state"><strong>No hay artículos con estos filtros.</strong><span>Prueba otra combinación o limpia los filtros para ver el catálogo completo.</span>{activeFilters && <button onClick={clearFilters}>Limpiar filtros</button>}</div>}

    {archived.length > 0 && statusFilter !== "archived" && <details open={showArchived} onToggle={(event) => setShowArchived((event.target as HTMLDetailsElement).open)}><summary>Archivados ({archived.length})</summary>{showArchived && archived.map((item) => <div className="admin-archive-row" key={item.id}><span>{item.title}</span><button onClick={() => onUpdate(item, { status: "draft" })}>Restaurar a borrador</button></div>)}</details>}
  </section>;
}
