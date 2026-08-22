"use client";

import {
  Bold, Check, CircleAlert, Eye, FileImage, FilePlus2, Italic, Link as LinkIcon,
  List, ListOrdered, LoaderCircle, Mail, Minus, Quote, RefreshCw, Send,
  Settings2, ShieldCheck, Trash2, UserRound, X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDateTime } from "./admin/formatters";

type Block =
  | { type: "paragraph" | "heading" | "quote"; text: string; level?: 1 | 2 | 3 }
  | { type: "bulletList" | "orderedList"; items: string[] }
  | { type: "divider" }
  | { type: "image"; url: string; alt: string; caption?: string };
type Content = { subject: string; preheader: string; blocks: Block[] };
type CampaignStatus = "draft" | "queued" | "sending" | "sent" | "failed" | "cancelled";
type Campaign = {
  publicId: string; subject: string; preheader: string; content?: Content; html?: string | null;
  text?: string | null; status: CampaignStatus; revision: number; testedRevision: number | null;
  testSentAt?: string | null; recipientCount: number; sentCount: number; failedCount: number;
  queuedAt?: string | null; sentAt?: string | null; createdAt?: string; updatedAt?: string;
};
type Subscriber = {
  id: number; emailMasked: string | null; status: "pending" | "active" | "unsubscribed" | "bounced" | "needs_reconfirmation";
  source: string; consentAt?: string | null; confirmedAt?: string | null; unsubscribedAt?: string | null; createdAt: string;
};
type Metrics = { total: number; pending: number; active: number; unsubscribed: number; bounced: number; needs_reconfirmation: number };
type Settings = {
  enabled: boolean; organizationName: string; postalAddress: string; privacyUrl: string; contactUrl: string; publicBaseUrl: string;
  fromEmail: string; fromName: string; replyTo: string; fromVerified: boolean; readyToSend: boolean; missingConfiguration: string[];
};
type Preview = { html: string; text: string; revision: number; readyToSend: boolean; missingConfiguration: string[] };
type Tab = "compose" | "sent" | "subscribers" | "settings";

const blankContent = (): Content => ({ subject: "", preheader: "", blocks: [{ type: "paragraph", text: "" }] });
const blankMetrics: Metrics = { total: 0, pending: 0, active: 0, unsubscribed: 0, bounced: 0, needs_reconfirmation: 0 };
const blankSettings: Settings = { enabled: false, organizationName: "Órbita", postalAddress: "", privacyUrl: "", contactUrl: "", publicBaseUrl: "", fromEmail: "", fromName: "Órbita", replyTo: "", fromVerified: false, readyToSend: false, missingConfiguration: [] };

function contentEmpty(c: Content) { return !c.subject.trim() && !c.preheader.trim() && c.blocks.every(function(b) { return !("text" in b) || !b.text.trim(); }) && c.blocks.every(function(b) { return !("items" in b) || b.items.every(function(i) { return !i.trim(); }); }); }
const statusLabel: Record<Subscriber["status"], string> = { pending: "Pendiente", active: "Activo", unsubscribed: "Suprimido", bounced: "Rebotado", needs_reconfirmation: "Debe reconfirmar" };

function formatDate(value?: string | null) {
  return formatDateTime(value).replace("Sin cambios registrados", "Sin fecha");
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "No se pudo completar la operación.");
  return data;
}

function normalizeContent(value: unknown, subject = "", preheader = ""): Content {
  let candidate = value;
  if (typeof candidate === "string") { try { candidate = JSON.parse(candidate); } catch { candidate = null; } }
  const record = candidate && typeof candidate === "object" ? candidate as Partial<Content> : {};
  return {
    subject: typeof record.subject === "string" ? record.subject : subject,
    preheader: typeof record.preheader === "string" ? record.preheader : preheader,
    blocks: Array.isArray(record.blocks) && record.blocks.length ? record.blocks as Block[] : blankContent().blocks,
  };
}

function normalizeCampaign(value: unknown): Campaign {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const subject = typeof row.subject === "string" ? row.subject : "";
  const preheader = typeof row.preheader === "string" ? row.preheader : "";
  return {
    publicId: String(row.publicId ?? ""), subject, preheader,
    content: row.content === undefined ? undefined : normalizeContent(row.content, subject, preheader),
    html: typeof row.html === "string" ? row.html : null, text: typeof row.text === "string" ? row.text : null,
    status: (["draft", "queued", "sending", "sent", "failed", "cancelled"].includes(String(row.status)) ? row.status : "draft") as CampaignStatus,
    revision: Number(row.revision ?? 1), testedRevision: row.testedRevision === null || row.testedRevision === undefined ? null : Number(row.testedRevision),
    testSentAt: typeof row.testSentAt === "string" ? row.testSentAt : null,
    recipientCount: Number(row.recipientCount ?? 0), sentCount: Number(row.sentCount ?? 0), failedCount: Number(row.failedCount ?? 0),
    queuedAt: typeof row.queuedAt === "string" ? row.queuedAt : null, sentAt: typeof row.sentAt === "string" ? row.sentAt : null,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined, updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
  };
}

export function AdminNewsletter() {
  const [tab, setTab] = useState<Tab>("compose");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [content, setContent] = useState<Content>(blankContent);
  const [serverRevision, setServerRevision] = useState(0);
  const [testedRevision, setTestedRevision] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewMode, setPreviewMode] = useState<"html" | "text">("html");
  const [selectedBlock, setSelectedBlock] = useState(0);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(blankMetrics);
  const [exactSearch, setExactSearch] = useState("");
  const [subscriberStatus, setSubscriberStatus] = useState("");
  const [settings, setSettings] = useState<Settings>(blankSettings);
  const [viewing, setViewing] = useState<Campaign | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const editVersion = useRef(0);

  const loadSettings = useCallback(async () => {
    const data = await jsonFetch<{ settings: Settings }>("/api/newsletters/settings");
    setSettings(data.settings);
  }, []);

  const loadCampaigns = useCallback(async () => {
    const data = await jsonFetch<{ newsletters: unknown[] }>("/api/newsletters");
    setCampaigns((data.newsletters ?? []).map(normalizeCampaign));
  }, []);

  const loadDetail = useCallback(async (publicId: string) => {
    const data = await jsonFetch<{ newsletter: unknown }>(`/api/newsletters/${publicId}`);
    const campaign = normalizeCampaign(data.newsletter);
    if (campaign.status === "draft") {
      setDraftId(campaign.publicId); setContent(campaign.content ?? blankContent()); setServerRevision(campaign.revision);
      setTestedRevision(campaign.testedRevision); setDirty(false); setPreview(null);
    }
    return campaign;
  }, []);

  const loadPreview = useCallback(async (publicId: string) => {
    const value = await jsonFetch<Preview>(`/api/newsletters/${publicId}/preview`, { method: "POST" });
    setPreview(value);
  }, []);

  const loadSubscribers = useCallback(async (search = exactSearch, status = subscriberStatus) => {
    const params = new URLSearchParams();
    if (status && !search.trim()) params.set("status", status);
    const [list, counts] = await Promise.all([
      search.trim()
        ? jsonFetch<{ subscribers: Subscriber[] }>("/api/subscribers/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: search.trim() }) })
        : jsonFetch<{ subscribers: Subscriber[] }>(`/api/subscribers${params.size ? `?${params}` : ""}`),
      jsonFetch<{ metrics: Metrics }>("/api/subscribers/stats"),
    ]);
    setSubscribers(list.subscribers); setMetrics(counts.metrics);
  }, [exactSearch, subscriberStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([loadCampaigns(), loadSettings(), jsonFetch<{ metrics: Metrics }>("/api/subscribers/stats").then((data) => setMetrics(data.metrics))]).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudo cargar Newsletter."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCampaigns, loadSettings]);

  useEffect(() => {
    if (tab !== "subscribers") return;
    const timer = window.setTimeout(() => {
      void loadSubscribers("", subscriberStatus).catch((reason) => setError(reason instanceof Error ? reason.message : "No se pudo cargar la audiencia."));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tab, subscriberStatus, loadSubscribers]);

  const saveDraft = useCallback(async () => {
    if (!dirty || saving) return;
    const savingVersion = editVersion.current;
    setSaving(true); setError("");
    try {
      const url = draftId ? `/api/newsletters/${draftId}/autosave` : "/api/newsletters";
      const data = await jsonFetch<{ newsletter: unknown }>(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) });
      const saved = normalizeCampaign(data.newsletter);
      setDraftId(saved.publicId); setServerRevision(saved.revision); setTestedRevision(saved.testedRevision); await loadCampaigns();
      if (editVersion.current === savingVersion) {
        setContent(saved.content ?? content); setDirty(false); await loadPreview(saved.publicId);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo guardar el borrador."); }
    finally { setSaving(false); }
  }, [content, dirty, draftId, loadCampaigns, loadPreview, saving]);

  useEffect(() => {
    if (!dirty || contentEmpty(content)) return;
    const timer = window.setTimeout(() => { void saveDraft(); }, 900);
    return () => window.clearTimeout(timer);
  }, [dirty, content, saveDraft]);

  function changeContent(next: Content) { editVersion.current += 1; setContent(next); setDirty(true); setTestedRevision(null); setPreview(null); }
  function changeBlock(index: number, block: Block) { const blocks = [...content.blocks]; blocks[index] = block; changeContent({ ...content, blocks }); }
  function addBlock(type: Block["type"]) {
    const block: Block = type === "divider" ? { type } : type === "image" ? { type, url: "", alt: "", caption: "" } : type === "bulletList" || type === "orderedList" ? { type, items: [""] } : { type, text: "", ...(type === "heading" ? { level: 2 as const } : {}) };
    const blocks = [...content.blocks]; blocks.splice(selectedBlock + 1, 0, block); setSelectedBlock(selectedBlock + 1); changeContent({ ...content, blocks });
  }
  function formatSelection(prefix: string, suffix = prefix) {
    const element = document.querySelector<HTMLTextAreaElement>(`#newsletter-block-${selectedBlock}`);
    const block = content.blocks[selectedBlock];
    if (!element || !block || !("text" in block)) return;
    const selected = block.text.slice(element.selectionStart, element.selectionEnd) || "texto";
    changeBlock(selectedBlock, { ...block, text: `${block.text.slice(0, element.selectionStart)}${prefix}${selected}${suffix}${block.text.slice(element.selectionEnd)}` });
  }
  async function uploadImage(file: File) {
    const form = new FormData(); form.set("file", file);
    const result = await jsonFetch<{ url: string }>("/api/media", { method: "POST", body: form });
    const blocks = [...content.blocks]; blocks.splice(selectedBlock + 1, 0, { type: "image", url: result.url, alt: "", caption: "" });
    setSelectedBlock(selectedBlock + 1); changeContent({ ...content, blocks });
  }
  async function testDraft() {
    if (dirty) await saveDraft();
    if (!draftId) { setError("Guarda el borrador antes de probar."); return; }
    setBusy(true);
    try {
      const result = await jsonFetch<{ testedRevision: number }>(`/api/newsletters/${draftId}/test`, { method: "POST" });
      setTestedRevision(result.testedRevision); setNotice("Prueba enviada a tu correo autenticado."); await loadCampaigns();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo enviar la prueba."); }
    finally { setBusy(false); }
  }
  async function sendDraft() {
    if (dirty) await saveDraft();
    if (!draftId || dirty || testedRevision !== serverRevision) return;
    setBusy(true);
    try {
      await jsonFetch(`/api/newsletters/${draftId}/send`, { method: "POST", headers: { "idempotency-key": `newsletter:${draftId}:${serverRevision}` } });
      setNotice("Envío en cola."); setSendOpen(false); setDraftId(null); setContent(blankContent()); setPreview(null); await loadCampaigns(); setTab("sent");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo encolar el envío."); }
    finally { setBusy(false); }
  }
  async function duplicate(publicId: string) {
    const data = await jsonFetch<{ newsletter: unknown }>(`/api/newsletters/${publicId}/duplicate`, { method: "POST" });
    const copy = normalizeCampaign(data.newsletter); setDraftId(copy.publicId); setContent(copy.content ?? blankContent()); setServerRevision(copy.revision); setTestedRevision(null); setTab("compose"); setViewing(null); await loadCampaigns();
  }
  async function deleteDraft(publicId: string) {
    await jsonFetch(`/api/newsletters/${publicId}`, { method: "DELETE" });
    if (draftId === publicId) { setDraftId(null); setContent(blankContent()); setServerRevision(0); setTestedRevision(null); setPreview(null); }
    setNotice("Borrador eliminado."); await loadCampaigns();
  }
  async function openSent(campaign: Campaign) {
    const detail = await jsonFetch<{ newsletter: unknown }>(`/api/newsletters/${campaign.publicId}`);
    setViewing(normalizeCampaign(detail.newsletter));
  }

  const drafts = campaigns.filter((item) => item.status === "draft");
  const history = campaigns.filter((item) => item.status !== "draft");
  const testCurrent = !dirty && testedRevision !== null && testedRevision === serverRevision;

  return <section className="newsletter-admin" aria-label="Administración de newsletters">
    <div className="newsletter-admin-heading"><div><span className="eyebrow">NEWSLETTER</span><h2>Mensajes desde Órbita</h2></div><div className="newsletter-admin-status" aria-live="polite">{saving ? <><LoaderCircle size={15} className="newsletter-admin-spin" /> Guardando</> : dirty ? "Cambios pendientes" : <><Check size={15} /> Guardado</>}</div></div>
    <nav className="newsletter-admin-tabs" aria-label="Secciones de Newsletter">{([["compose", "Redactar", Mail], ["sent", "Enviados", Send], ["subscribers", "Suscriptores", UserRound], ["settings", "Configuración", Settings2]] as const).map(([value, label, Icon]) => <button key={value} type="button" className={tab === value ? "active" : ""} onClick={() => setTab(value)}><Icon size={16} />{label}</button>)}</nav>
    {error && <div className="newsletter-admin-alert" role="alert"><CircleAlert size={17} /><span>{error}</span><button type="button" aria-label="Cerrar" onClick={() => setError("")}><X size={16} /></button></div>}
    {notice && <div className="newsletter-admin-notice" role="status"><Check size={16} />{notice}</div>}

    {tab === "compose" && <div className="newsletter-admin-compose">
      <aside className="newsletter-admin-drafts"><div className="newsletter-admin-section-title"><span><span className="eyebrow">BORRADORES</span><strong>{drafts.length}</strong></span><button className="icon-button" type="button" title="Nuevo borrador" onClick={() => { setDraftId(null); setContent(blankContent()); setServerRevision(0); setTestedRevision(null); setDirty(false); setPreview(null); }}><FilePlus2 size={17} /></button></div>{drafts.map((item) => <div className="newsletter-admin-draft-entry" key={item.publicId}><button type="button" className={`newsletter-admin-draft-row ${draftId === item.publicId ? "selected" : ""}`} onClick={() => void loadDetail(item.publicId).then(() => loadPreview(item.publicId))}><strong>{item.subject}</strong><span>{formatDate(item.updatedAt)}</span></button><button type="button" className="newsletter-admin-delete-draft" title="Eliminar borrador" onClick={() => void deleteDraft(item.publicId).catch((reason) => setError(reason.message))}><Trash2 size={14} /></button></div>)}</aside>
      <div className="newsletter-admin-editor-column">
        <div className="newsletter-admin-editor-top"><div><label htmlFor="newsletter-subject">Asunto</label><input id="newsletter-subject" value={content.subject} onChange={(event) => changeContent({ ...content, subject: event.target.value })} /></div><div className="newsletter-admin-test-state">{testCurrent ? <><ShieldCheck size={16} /> Prueba vigente</> : dirty ? <span className="newsletter-admin-test-pending">Sin probar</span> : <><CircleAlert size={16} /> Requiere prueba</>}</div></div>
        <div className="newsletter-admin-editor-top"><div><label htmlFor="newsletter-preheader">Preheader</label><input id="newsletter-preheader" value={content.preheader} onChange={(event) => changeContent({ ...content, preheader: event.target.value })} /></div></div>
        <div className="newsletter-admin-toolbar" role="toolbar" aria-label="Formato"><button type="button" title="Negrita" onClick={() => formatSelection("**")}><Bold size={16} /></button><button type="button" title="Cursiva" onClick={() => formatSelection("_")}><Italic size={16} /></button><button type="button" title="Enlace" onClick={() => { const url = window.prompt("URL HTTPS"); if (url) formatSelection("[", `](${url})`); }}><LinkIcon size={16} /></button><button type="button" title="Párrafo" onClick={() => addBlock("paragraph")}>P</button><button type="button" title="Encabezado" onClick={() => addBlock("heading")}>H2</button><button type="button" title="Lista" onClick={() => addBlock("bulletList")}><List size={16} /></button><button type="button" title="Lista numerada" onClick={() => addBlock("orderedList")}><ListOrdered size={16} /></button><button type="button" title="Cita" onClick={() => addBlock("quote")}><Quote size={16} /></button><button type="button" title="Separador" onClick={() => addBlock("divider")}><Minus size={16} /></button><button type="button" title="Imagen" onClick={() => fileRef.current?.click()}><FileImage size={16} /></button><input className="sr-only" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file).catch((reason) => setError(reason.message)); }} /></div>
        <div className="newsletter-admin-blocks">{content.blocks.map((block, index) => <div key={index} className={`newsletter-admin-block ${selectedBlock === index ? "selected" : ""}`} onClick={() => setSelectedBlock(index)}>{block.type === "divider" ? <div className="newsletter-admin-divider"><Minus /></div> : block.type === "image" ? <div className="newsletter-admin-image-block"><label>URL<input value={block.url} onChange={(event) => changeBlock(index, { ...block, url: event.target.value })} /></label><label>Texto alternativo<input value={block.alt} onChange={(event) => changeBlock(index, { ...block, alt: event.target.value })} /></label><label>Pie<input value={block.caption ?? ""} onChange={(event) => changeBlock(index, { ...block, caption: event.target.value })} /></label></div> : "items" in block ? <div className="newsletter-admin-list-block">{block.items.map((item, itemIndex) => <input key={itemIndex} value={item} aria-label={`Elemento ${itemIndex + 1}`} onChange={(event) => { const items = [...block.items]; items[itemIndex] = event.target.value; changeBlock(index, { ...block, items }); }} />)}<button type="button" onClick={() => changeBlock(index, { ...block, items: [...block.items, ""] })}>Añadir elemento</button></div> : <div className="newsletter-admin-text-block"><textarea id={`newsletter-block-${index}`} value={block.text} aria-label={`Bloque ${index + 1}`} onChange={(event) => changeBlock(index, { ...block, text: event.target.value })} /></div>}{content.blocks.length > 1 && <button className="newsletter-admin-delete-block" type="button" title="Eliminar bloque" onClick={(event) => { event.stopPropagation(); const blocks = content.blocks.filter((_, item) => item !== index); setSelectedBlock(Math.max(0, index - 1)); changeContent({ ...content, blocks }); }}><Trash2 size={15} /></button>}</div>)}</div>
        <div className="newsletter-admin-editor-footer"><span className="footer-legal-label">Pie legal automático</span><p>{settings.organizationName || "Órbita"} · {settings.postalAddress || "Configura el domicilio"} · Privacidad · Contacto · Ver en navegador · Anular suscripción</p></div>
        <div className="newsletter-admin-editor-actions"><button className="newsletter-admin-secondary" type="button" disabled={busy || !draftId} onClick={() => void testDraft()}><ShieldCheck size={16} /> Enviar prueba</button><button className="newsletter-admin-primary" type="button" disabled={busy || metrics.active === 0 || !testCurrent || !preview?.readyToSend} onClick={() => setSendOpen(true)}><Send size={16} /> Revisar y enviar</button></div>
      </div>
      <aside className="newsletter-admin-preview"><div className="newsletter-admin-preview-head"><strong>Vista previa</strong><div className="newsletter-admin-segmented"><button className={previewMode === "html" ? "active" : ""} onClick={() => setPreviewMode("html")}>HTML</button><button className={previewMode === "text" ? "active" : ""} onClick={() => setPreviewMode("text")}>Texto</button></div></div>{preview ? previewMode === "html" ? <iframe title="Vista previa" sandbox="" srcDoc={preview.html} /> : <pre>{preview.text}</pre> : <div className="newsletter-admin-empty"><Eye size={22} /><p>Guarda el borrador para previsualizarlo.</p></div>}</aside>
    </div>}

    {tab === "sent" && <section className="newsletter-admin-panel"><div className="newsletter-admin-panel-heading"><div><span className="eyebrow">HISTORIAL</span><h3>Enviados</h3></div></div><div className="newsletter-admin-sent-list">{history.map((item) => <article key={item.publicId}><div><span className="newsletter-admin-pill">{item.status}</span><h4>{item.subject}</h4><p>{formatDate(item.sentAt ?? item.queuedAt)} · {item.sentCount}/{item.recipientCount} entregados</p></div><div className="newsletter-admin-actions"><button type="button" onClick={() => void openSent(item)}><Eye size={16} /> Ver</button><button type="button" onClick={() => void duplicate(item.publicId)}><RefreshCw size={16} /> Duplicar</button></div></article>)}</div></section>}

    {tab === "subscribers" && <section className="newsletter-admin-panel"><div className="newsletter-admin-panel-heading"><div><span className="eyebrow">AUDIENCIA</span><h3>Suscriptores</h3><p>Las direcciones completas nunca salen del servidor.</p></div><div className="newsletter-admin-metrics"><span><strong>{metrics.active}</strong> activos</span><span><strong>{metrics.pending}</strong> pendientes</span><span><strong>{metrics.total}</strong> total</span></div></div><div className="newsletter-admin-actions"><label className="newsletter-admin-search">Búsqueda exacta<input value={exactSearch} onChange={(event) => setExactSearch(event.target.value)} placeholder="correo exacto" /></label><button type="button" onClick={() => void loadSubscribers(exactSearch, "")}>Buscar</button><label className="newsletter-admin-search">Estado<select value={subscriberStatus} onChange={(event) => { setSubscriberStatus(event.target.value); setExactSearch(""); }}><option value="">Todos</option>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><div className="newsletter-admin-subscribers"><table><thead><tr><th>Correo</th><th>Estado</th><th>Origen</th><th>Alta</th><th>Acción</th></tr></thead><tbody>{subscribers.map((item) => <tr key={item.id}><td>{item.emailMasked ?? "***"}</td><td>{statusLabel[item.status]}</td><td>{item.source}</td><td>{formatDate(item.createdAt)}</td><td>{item.status !== "unsubscribed" && <button className="newsletter-admin-suppress" type="button" onClick={() => void jsonFetch("/api/subscribers", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, status: "unsubscribed" }) }).then(() => loadSubscribers())}>Suprimir</button>}</td></tr>)}</tbody></table></div></section>}

    {tab === "settings" && <section className="newsletter-admin-panel newsletter-admin-settings"><div className="newsletter-admin-panel-heading"><div><span className="eyebrow">CONFIGURACIÓN</span><h3>Identidad y pie legal</h3></div><ShieldCheck size={23} /></div><label>Remitente<input value={`${settings.fromName} <${settings.fromEmail || "sin configurar"}>`} disabled /></label><label>Responder a<input value={settings.replyTo || "sin configurar"} disabled /></label><label className="admin-check"><input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })} /> Habilitar campañas</label><label>Identidad institucional<input value={settings.organizationName} onChange={(event) => setSettings({ ...settings, organizationName: event.target.value })} /></label><label>Domicilio<textarea value={settings.postalAddress} onChange={(event) => setSettings({ ...settings, postalAddress: event.target.value })} /></label><label>URL de privacidad<input value={settings.privacyUrl} onChange={(event) => setSettings({ ...settings, privacyUrl: event.target.value })} /></label><label>URL de contacto<input value={settings.contactUrl} onChange={(event) => setSettings({ ...settings, contactUrl: event.target.value })} /></label><label>URL pública<input value={settings.publicBaseUrl} onChange={(event) => setSettings({ ...settings, publicBaseUrl: event.target.value })} /></label><button className="newsletter-admin-primary" type="button" onClick={() => void jsonFetch<{ settings: Settings }>("/api/newsletters/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(settings) }).then((data) => { setSettings(data.settings); setNotice("Configuración guardada."); }).catch((reason) => setError(reason.message))}><Check size={16} /> Guardar</button></section>}

    {viewing && <div className="newsletter-admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewing(null); }}><section className="newsletter-admin-modal" role="dialog" aria-modal="true"><button className="icon-button newsletter-admin-modal-close" onClick={() => setViewing(null)}><X /></button><span className="eyebrow">SNAPSHOT INMUTABLE</span><h3>{viewing.subject}</h3>{viewing.html && <iframe title="Newsletter enviada" sandbox="" srcDoc={viewing.html.replaceAll("__ORBITA_UNSUBSCRIBE_URL__", settings.contactUrl)} />}<button className="newsletter-admin-primary" onClick={() => void duplicate(viewing.publicId)}>Duplicar como borrador</button></section></div>}
    {sendOpen && <div className="newsletter-admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSendOpen(false); }}><section className="newsletter-admin-modal" role="dialog" aria-modal="true"><button className="icon-button newsletter-admin-modal-close" onClick={() => setSendOpen(false)}><X /></button><span className="eyebrow">CONFIRMAR ENVÍO</span><h3>Revisa antes de encolar</h3><dl><div><dt>Asunto</dt><dd>{content.subject}</dd></div><div><dt>Destinatarios</dt><dd>{metrics.active} activos</dd></div><div><dt>Remitente</dt><dd>{settings.fromName} &lt;{settings.fromEmail}&gt;</dd></div><div><dt>Footer</dt><dd>{settings.organizationName} · {settings.postalAddress}</dd></div><div><dt>Última prueba</dt><dd>{testCurrent ? formatDate(campaigns.find((item) => item.publicId === draftId)?.testSentAt) : "Pendiente"}</dd></div></dl><button className="newsletter-admin-primary" disabled={busy} onClick={() => void sendDraft()}>{busy ? <LoaderCircle className="newsletter-admin-spin" /> : <Send />} Encolar ahora</button></section></div>}
  </section>;
}
