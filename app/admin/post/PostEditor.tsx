"use client";

import { useState, useEffect, useCallback } from "react";

type ImageRef = { ref: string; fileName: string; caption?: string };
type ParsedSubmission = {
  title: string; author: string; category: string; dek: string; edition?: string;
  body: string; images: ImageRef[];
};
type Edition = { id: number; number: number; title: string };

function parseBodyHtml(body: string, imageUrls: Map<string, string>, images: ImageRef[], captions: Map<string, string>): string {
  let html = body;
  for (const img of images) {
    const marker = "{{IMG:" + img.ref.replace(/^IMAGEN /, "") + "}}";
    const url = imageUrls.get(img.ref);
    const cap = captions.get(img.ref) ?? img.caption ?? "";
    if (url) {
      html = html.split(marker).join('<figure><img src="' + url + '" alt="' + (cap || img.fileName) + '" />' + (cap ? '<figcaption>' + cap + '</figcaption>' : '') + '</figure>');
    } else {
      html = html.split(marker).join('<div class="post-placeholder"><span>[IMG]</span> ' + img.fileName + '</div>');
    }
  }
  const lines = html.split("\n"); let out = ""; let para = false;
  for (const line of lines) {
    if (line.startsWith("## ")) { if (para) { out += "</p>"; para = false; } out += "<h2>" + line.slice(3) + "</h2>"; }
    else if (line.startsWith("> ")) { if (para) { out += "</p>"; para = false; } out += "<blockquote><p>" + line.slice(2) + "</p></blockquote>"; }
    else if (line.trim() === "") { if (para) { out += "</p>"; para = false; } }
    else { if (!para) { out += "<p>"; para = true; } out += line + "\n"; }
  }
  if (para) out += "</p>"; return out;
}

export function PostEditor({ email }: { email: string }) {
  const [text, setText] = useState("");
  const [submission, setSubmission] = useState<ParsedSubmission | null>(null);
  const [imageFiles, setImageFiles] = useState<Map<string, File>>(new Map());
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [imageCaptions, setImageCaptions] = useState<Map<string, string>>(new Map());
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroUrl, setHeroUrl] = useState("");
  const [heroCaption, setHeroCaption] = useState("");
  const [editionId, setEditionId] = useState("");
  const [homepageSlot, setHomepageSlot] = useState("feed");
  const [homepageRank, setHomepageRank] = useState(10);
  const [status, setStatus] = useState("draft");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editions, setEditions] = useState<Edition[]>([]);

  useEffect(() => {
    fetch("/api/editions?scope=all").then(r => r.json()).then(d => setEditions(d.editions || [])).catch(() => {});
  }, []);

  const handleFileLoad = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => setText(reader.result as string);
    reader.readAsText(file); e.target.value = "";
  }, []);

  const handlePreview = useCallback(async () => {
    if (!text.trim()) { setMessage("Pega o carga un texto antes de previsualizar."); return; }
    setBusy(true); setMessage("");
    try {
      const res = await fetch("/api/submissions/parse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Error al analizar");
      setSubmission(data.submission);
      const capMap = new Map<string, string>();
      for (const img of data.submission.images || []) { if (img.caption) capMap.set(img.ref, img.caption); }
      setImageCaptions(capMap); setImageFiles(new Map()); setImageUrls(new Map());
    } catch (err) { setMessage(err instanceof Error ? err.message : "No se pudo analizar"); setSubmission(null); }
    finally { setBusy(false); }
  }, [text]);

  const handleHeroSelect = useCallback((file: File) => {
    setHeroFile(file); setHeroUrl(URL.createObjectURL(file));
  }, []);

  const handleImageSelect = useCallback((ref: string, file: File) => {
    setImageFiles(prev => { const n = new Map(prev); n.set(ref, file); return n; });
    setImageUrls(prev => { const n = new Map(prev); n.set(ref, URL.createObjectURL(file)); return n; });
  }, []);

  const uploadToMedia = useCallback(async (file: File): Promise<string> => {
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: fd });
    const d = await res.json(); if (!res.ok) throw new Error(d.error || "No se pudo subir");
    return d.url as string;
  }, []);

  const handlePublish = useCallback(async () => {
    if (!submission) return; setBusy(true); setMessage("");
    try {
      let finalHeroUrl = heroUrl;
      if (heroFile && heroUrl.startsWith("blob:")) { finalHeroUrl = await uploadToMedia(heroFile); }
      const uploaded = new Map<string, string>();
      for (const [ref, file] of imageFiles) {
        const previewUrl = imageUrls.get(ref) || "";
        const url = previewUrl.startsWith("blob:") ? await uploadToMedia(file) : previewUrl;
        uploaded.set(ref, url);
      }
      const imageEntries = submission.images.map(img => ({
        ref: img.ref, url: uploaded.get(img.ref) || imageUrls.get(img.ref) || "",
        caption: imageCaptions.get(img.ref) || img.caption || "",
      }));
      const body = {
        title: submission.title, author: submission.author, category: submission.category,
        dek: submission.dek, body: submission.body, editionId: editionId || undefined,
        homepageSlot, homepageRank, status,
        heroUrl: finalHeroUrl || undefined,
        heroCaption: heroCaption || undefined,
        images: imageEntries, tags: [] as string[],
      };
      const res = await fetch("/api/submissions/save", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "No se pudo publicar");
      setMessage("Articulo publicado correctamente.");
      setSubmission(null); setText(""); setHeroFile(null); setHeroUrl(""); setHeroCaption("");
    } catch (err) { setMessage(err instanceof Error ? err.message : "No se pudo guardar"); }
    finally { setBusy(false); }
  }, [submission, imageFiles, imageUrls, imageCaptions, heroFile, heroUrl, heroCaption, editionId, homepageSlot, homepageRank, status, uploadToMedia]);

  const bodyHtml = submission ? parseBodyHtml(submission.body, imageUrls, submission.images, imageCaptions) : "";

  return <main className="admin-studio">
    <header><div><span className="eyebrow light">ORBITA - MESA EDITORIAL</span><h1>Importar y publicar.</h1><p>Sesion privada: {email} - <a href="/admin/analytics" style={{color:"#c7d0e8"}}>Ver analytics</a></p></div><a href="/admin">Volver al CMS</a></header>
    <div className="admin-tabs"><button className="active">Importar</button></div>
    {message && <p className="admin-message">{message}</p>}
    <section className="admin-layout" style={{alignItems:"start"}}>
      <form className="admin-form" onSubmit={e => { e.preventDefault(); handlePreview(); }}>
        <span className="eyebrow">TEXTO DE IMPORTACION</span>
        <label>Pega el texto o carga un archivo<textarea className="article-editor" value={text} onChange={e => setText(e.target.value)} placeholder="Pega aqui el contenido del escritor..." /></label>
        <label className="post-file-label"><span className="post-file-zone" onClick={() => document.getElementById("pf-upload")?.click()}>Cargar archivo .txt o .md</span><input id="pf-upload" type="file" accept=".txt,.md" onChange={handleFileLoad} hidden /></label>
        <button type="submit" disabled={busy}>{busy ? "Analizando..." : "Previsualizar"}</button>
      </form>
      {submission && <section className="admin-list">
        <span className="eyebrow">VISTA PREVIA</span>
        <h2>{submission.title || "Sin titulo"}</h2>
        <p style={{fontSize:".82rem",color:"#657083",marginBottom:4}}><strong>{submission.author}</strong> - {submission.category}{submission.edition ? " - " + submission.edition : ""}</p>
        <p style={{fontSize:".88rem",color:"#4f555e",lineHeight:1.45,marginBottom:20}}>{submission.dek}</p>
        <div className="post-preview-body" dangerouslySetInnerHTML={{__html:bodyHtml}} />
        {submission.images.length > 0 && <div className="post-images-section"><h3>Imagenes detectadas</h3>
          {submission.images.map(img => <div key={img.ref} className="post-image-entry">
            <p className="post-image-label">{img.fileName}</p>
            <div className="post-image-row">
              <label>Archivo<input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(img.ref, f); }} /></label>
              <label>Pie de foto<input type="text" value={imageCaptions.get(img.ref) || img.caption || ""} onChange={e => setImageCaptions(prev => { const n = new Map(prev); n.set(img.ref, e.target.value); return n; })} /></label>
            </div>
            {imageUrls.get(img.ref) && <img src={imageUrls.get(img.ref)!} alt={img.fileName} className="post-image-thumb" />}
          </div>)}
        </div>}
        <div className="post-meta-fields">
          <label>Edicion<select value={editionId} onChange={e => setEditionId(e.target.value)}><option value="">Sin edicion</option>{editions.map(ed => <option value={ed.id} key={ed.id}>No {ed.number} - {ed.title}</option>)}</select></label>
          <div className="admin-pair"><label>Ubicacion<select value={homepageSlot} onChange={e => setHomepageSlot(e.target.value)}><option value="hero">Hero</option><option value="featured">Destacado</option><option value="feed">Feed</option><option value="hidden">No mostrar</option></select></label><label>Prioridad<input type="number" min={0} value={homepageRank} onChange={e => setHomepageRank(Number(e.target.value))} /></label></div>
          <label>Estado<select value={status} onChange={e => setStatus(e.target.value)}><option value="draft">Borrador</option><option value="published">Publicado</option></select></label>
          <div className="post-hero-section"><h3>Imagen principal</h3>
            <label>Archivo de portada<input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroSelect(f); }} /></label>
            {heroUrl && <img src={heroUrl} alt="Hero preview" className="post-image-thumb" />}
            <label>Pie de foto principal<input type="text" value={heroCaption} onChange={e => setHeroCaption(e.target.value)} placeholder="Descripcion de la imagen principal" /></label>
          </div>
          <button className="admin-form-button" onClick={handlePublish} disabled={busy}>{busy ? "Publicando..." : "Publicar"}</button>
        </div>
      </section>}
    </section>
  </main>;
}
