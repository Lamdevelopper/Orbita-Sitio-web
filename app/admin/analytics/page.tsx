import { sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { articles } from "../../../lib/content";
import { chatGPTSignOutPath, requireChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

const ANALYTICS_OWNER = "lamoyi.matias@gmail.com";
const PERIODS = new Set([7, 30, 90]);
const EVENT_LABELS: Record<string, string> = {
  page_viewed: "Página vista",
  active_read_30_seconds: "Lectura activa (30 s)",
  article_25_percent: "Artículo 25%",
  article_50_percent: "Artículo 50%",
  article_75_percent: "Artículo 75%",
  article_90_percent: "Artículo completado",
  share_clicked: "Compartir",
  link_copied: "Enlace copiado",
  search_used: "Búsqueda",
  edition_opened: "Edición abierta",
};

type TotalsRow = {
  events: number;
  readers: number;
  sessions: number;
  pageViews: number;
  meaningfulReads: number;
  completions: number;
  shares: number;
};
type DailyRow = { day: string; pageViews: number; meaningfulReads: number };
type ArticleRow = { articleSlug: string; pageViews: number; readers: number; meaningfulReads: number; completions: number; shares: number };
type SourceRow = { source: string; visits: number };
type EventRow = { id: number; eventName: string; articleSlug: string | null; path: string; referrerHost: string | null; occurredAt: number };
type OptionRow = { value: string };
type CountRow = { value: number };

function number(value: unknown) {
  return Number(value ?? 0);
}

function periodStart(days: number) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function percent(value: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function articleTitle(slug: string | null) {
  if (!slug) return "Sitio general";
  return articles.find((article) => article.slug === slug)?.title ?? slug;
}

export default async function AnalyticsDashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireChatGPTUser("/admin/analytics");
  if (user.email.toLowerCase() !== ANALYTICS_OWNER) {
    return (
      <div className="analytics-denied page-shell">
        <span className="eyebrow">ACCESO RESTRINGIDO</span>
        <h1>Este dashboard es privado.</h1>
        <p>La cuenta activa no forma parte de la lista de acceso de analítica.</p>
        <a href={chatGPTSignOutPath("/admin/analytics")}>Cerrar sesión</a>
      </div>
    );
  }

  const params = await searchParams;
  const requestedDays = Number(Array.isArray(params.days) ? params.days[0] : params.days);
  const days = PERIODS.has(requestedDays) ? requestedDays : 30;
  const selectedArticle = String(Array.isArray(params.article) ? params.article[0] : params.article ?? "").slice(0, 180);
  const selectedEvent = String(Array.isArray(params.event) ? params.event[0] : params.event ?? "").slice(0, 60);
  const since = periodStart(days);
  const articleOptional = selectedArticle ? 0 : 1;
  const eventOptional = selectedEvent ? 0 : 1;
  const where = sql`occurred_at >= ${since}
    AND (${articleOptional} = 1 OR article_slug = ${selectedArticle})
    AND (${eventOptional} = 1 OR event_name = ${selectedEvent})`;
  const db = getDb();

  const [totalsRows, dailyRows, articleRows, sourceRows, eventRows, articleOptions, eventOptions, returningRows, secondStoryRows] = await Promise.all([
    db.all(sql<TotalsRow>`SELECT
      COUNT(*) AS events,
      COUNT(DISTINCT anonymous_id) AS readers,
      COUNT(DISTINCT session_id) AS sessions,
      SUM(CASE WHEN event_name = 'page_viewed' THEN 1 ELSE 0 END) AS pageViews,
      COUNT(DISTINCT CASE WHEN event_name = 'active_read_30_seconds' THEN session_id END) AS meaningfulReads,
      COUNT(DISTINCT CASE WHEN event_name = 'article_90_percent' THEN session_id END) AS completions,
      SUM(CASE WHEN event_name IN ('share_clicked', 'link_copied') THEN 1 ELSE 0 END) AS shares
      FROM audience_events WHERE ${where}`),
    db.all(sql<DailyRow>`SELECT
      strftime('%Y-%m-%d', occurred_at / 1000, 'unixepoch') AS day,
      SUM(CASE WHEN event_name = 'page_viewed' THEN 1 ELSE 0 END) AS pageViews,
      COUNT(DISTINCT CASE WHEN event_name = 'active_read_30_seconds' THEN session_id END) AS meaningfulReads
      FROM audience_events WHERE ${where}
      GROUP BY day ORDER BY day ASC`),
    db.all(sql<ArticleRow>`SELECT
      article_slug AS articleSlug,
      SUM(CASE WHEN event_name = 'page_viewed' THEN 1 ELSE 0 END) AS pageViews,
      COUNT(DISTINCT anonymous_id) AS readers,
      COUNT(DISTINCT CASE WHEN event_name = 'active_read_30_seconds' THEN session_id END) AS meaningfulReads,
      COUNT(DISTINCT CASE WHEN event_name = 'article_90_percent' THEN session_id END) AS completions,
      SUM(CASE WHEN event_name IN ('share_clicked', 'link_copied') THEN 1 ELSE 0 END) AS shares
      FROM audience_events WHERE ${where} AND article_slug IS NOT NULL
      GROUP BY article_slug ORDER BY pageViews DESC LIMIT 12`),
    db.all(sql<SourceRow>`SELECT COALESCE(NULLIF(referrer_host, ''), 'Directo') AS source, COUNT(*) AS visits
      FROM audience_events WHERE ${where} AND event_name = 'page_viewed'
      GROUP BY source ORDER BY visits DESC LIMIT 8`),
    db.all(sql<EventRow>`SELECT id, event_name AS eventName, article_slug AS articleSlug, path, referrer_host AS referrerHost, occurred_at AS occurredAt
      FROM audience_events WHERE ${where} ORDER BY occurred_at DESC LIMIT 100`),
    db.all(sql<OptionRow>`SELECT DISTINCT article_slug AS value FROM audience_events WHERE occurred_at >= ${since} AND article_slug IS NOT NULL ORDER BY value`),
    db.all(sql<OptionRow>`SELECT DISTINCT event_name AS value FROM audience_events WHERE occurred_at >= ${since} ORDER BY value`),
    db.all(sql<CountRow>`SELECT COUNT(*) AS value FROM (
      SELECT anonymous_id FROM audience_events WHERE ${where}
      GROUP BY anonymous_id HAVING COUNT(DISTINCT session_id) > 1
    )`),
    db.all(sql<CountRow>`SELECT COUNT(*) AS value FROM (
      SELECT session_id FROM audience_events WHERE ${where} AND article_slug IS NOT NULL
      GROUP BY session_id HAVING COUNT(DISTINCT article_slug) > 1
    )`),
  ]);

  const rawTotals = totalsRows[0] ?? {} as TotalsRow;
  const totals = {
    events: number(rawTotals.events), readers: number(rawTotals.readers), sessions: number(rawTotals.sessions),
    pageViews: number(rawTotals.pageViews), meaningfulReads: number(rawTotals.meaningfulReads),
    completions: number(rawTotals.completions), shares: number(rawTotals.shares),
    returningReaders: number(returningRows[0]?.value), secondStorySessions: number(secondStoryRows[0]?.value),
  };
  const daily = dailyRows.map((row) => ({ ...row, pageViews: number(row.pageViews), meaningfulReads: number(row.meaningfulReads) }));
  const topArticles = articleRows.map((row) => ({ ...row, pageViews: number(row.pageViews), readers: number(row.readers), meaningfulReads: number(row.meaningfulReads), completions: number(row.completions), shares: number(row.shares) }));
  const sources = sourceRows.map((row) => ({ ...row, visits: number(row.visits) }));
  const maxDaily = Math.max(1, ...daily.map((row) => row.pageViews));
  const maxArticle = Math.max(1, ...topArticles.map((row) => row.pageViews));
  const maxSource = Math.max(1, ...sources.map((row) => row.visits));

  return (
    <div className="analytics-dashboard">
      <header className="analytics-header">
        <div>
          <span className="eyebrow light">ÓRBITA · AUDIENCIA</span>
          <h1>Lo que la audiencia realmente lee.</h1>
          <p>Eventos consentidos y agregados. Sin nombres, correos ni seguimiento publicitario.</p>
        </div>
        <div className="analytics-user"><span>Acceso privado</span><strong>{user.email}</strong><a href={chatGPTSignOutPath("/")}>Cerrar sesión</a></div>
      </header>

      <main className="analytics-main">
        <form className="analytics-filters" method="get">
          <label>Periodo<select name="days" defaultValue={String(days)}><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="90">Últimos 90 días</option></select></label>
          <label>Artículo<select name="article" defaultValue={selectedArticle}><option value="">Todos los artículos</option>{articleOptions.map((row) => <option value={row.value} key={row.value}>{articleTitle(row.value)}</option>)}</select></label>
          <label>Evento<select name="event" defaultValue={selectedEvent}><option value="">Todos los eventos</option>{eventOptions.map((row) => <option value={row.value} key={row.value}>{EVENT_LABELS[row.value] ?? row.value}</option>)}</select></label>
          <button type="submit">Aplicar filtros</button>
        </form>

        <section className="analytics-metrics" aria-label="Indicadores principales">
          <article><span>LECTORES</span><strong>{totals.readers.toLocaleString("es-MX")}</strong><small>{totals.sessions.toLocaleString("es-MX")} sesiones</small></article>
          <article><span>LECTURAS SIGNIFICATIVAS</span><strong>{totals.meaningfulReads.toLocaleString("es-MX")}</strong><small>{percent(totals.meaningfulReads, totals.readers)} de lectores</small></article>
          <article><span>COMPLETARON 90%</span><strong>{totals.completions.toLocaleString("es-MX")}</strong><small>{percent(totals.completions, totals.meaningfulReads)} de lecturas activas</small></article>
          <article><span>LEYERON OTRA HISTORIA</span><strong>{totals.secondStorySessions.toLocaleString("es-MX")}</strong><small>sesiones con 2+ artículos</small></article>
          <article><span>REGRESARON</span><strong>{totals.returningReaders.toLocaleString("es-MX")}</strong><small>lectores con 2+ sesiones</small></article>
          <article><span>COMPARTIERON</span><strong>{totals.shares.toLocaleString("es-MX")}</strong><small>{percent(totals.shares, totals.pageViews)} de páginas vistas</small></article>
        </section>

        <section className="analytics-panel analytics-trend">
          <div className="analytics-panel-heading"><div><span className="eyebrow">TENDENCIA</span><h2>Lecturas por día</h2></div><p>{totals.pageViews.toLocaleString("es-MX")} páginas vistas en el periodo</p></div>
          {daily.length ? <div className="daily-chart" aria-label="Gráfica de páginas vistas por día">{daily.map((row) => <div className="daily-column" key={row.day} title={`${row.day}: ${row.pageViews} vistas, ${row.meaningfulReads} lecturas activas`}><div className="daily-value">{row.pageViews}</div><div className="daily-bar"><span style={{ height: `${Math.max(5, row.pageViews / maxDaily * 100)}%` }} /></div><small>{row.day.slice(5)}</small></div>)}</div> : <div className="analytics-empty">Aún no hay eventos para este filtro.</div>}
        </section>

        <div className="analytics-split">
          <section className="analytics-panel">
            <div className="analytics-panel-heading"><div><span className="eyebrow">CONTENIDO</span><h2>Artículos que funcionan</h2></div></div>
            {topArticles.length ? <div className="rank-list">{topArticles.map((row, index) => <article key={row.articleSlug}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{articleTitle(row.articleSlug)}</h3><div className="rank-track"><i style={{ width: `${Math.max(4, row.pageViews / maxArticle * 100)}%` }} /></div><p>{row.pageViews} vistas · {row.meaningfulReads} significativas · {row.completions} completas · {row.shares} compartidas</p></div></article>)}</div> : <div className="analytics-empty">Los artículos aparecerán aquí cuando reciban lecturas consentidas.</div>}
          </section>
          <section className="analytics-panel">
            <div className="analytics-panel-heading"><div><span className="eyebrow">DISTRIBUCIÓN</span><h2>De dónde llegan</h2></div></div>
            {sources.length ? <div className="source-list">{sources.map((row) => <div key={row.source}><p><span>{row.source}</span><strong>{row.visits}</strong></p><div><i style={{ width: `${Math.max(4, row.visits / maxSource * 100)}%` }} /></div></div>)}</div> : <div className="analytics-empty">Sin fuentes de tráfico para este filtro.</div>}
          </section>
        </div>

        <section className="analytics-panel analytics-events">
          <div className="analytics-panel-heading"><div><span className="eyebrow">LISTADO</span><h2>Eventos recientes</h2></div><p>Máximo 100 eventos · {totals.events.toLocaleString("es-MX")} en el periodo</p></div>
          <div className="analytics-table-wrap"><table><thead><tr><th>Hora</th><th>Evento</th><th>Artículo / ruta</th><th>Origen</th></tr></thead><tbody>{eventRows.map((row) => <tr key={row.id}><td>{new Date(number(row.occurredAt)).toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "short", timeStyle: "short" })}</td><td><span className="event-pill">{EVENT_LABELS[row.eventName] ?? row.eventName}</span></td><td><strong>{articleTitle(row.articleSlug)}</strong><small>{row.path}</small></td><td>{row.referrerHost || "Directo"}</td></tr>)}</tbody></table>{eventRows.length === 0 && <div className="analytics-empty">No hay eventos para mostrar.</div>}</div>
        </section>
      </main>
    </div>
  );
}
