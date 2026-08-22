import type { NewsletterBlock, NewsletterContent } from "./newsletter-model";
import { SITE_CONTACT } from "./site-config.ts";

export type RenderedNewsletter = { html: string; text: string };
export type NewsletterFooter = {
  organizationName: string;
  postalAddress: string;
  privacyUrl: string;
  contactUrl: string;
};
export const UNSUBSCRIBE_PLACEHOLDER = "__ORBITA_UNSUBSCRIBE_URL__";

export function escapeNewsletterHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

function safeUrl(value: string): string {
  if (value === UNSUBSCRIBE_PLACEHOLDER) return value;
  try {
    const url = new URL(value, SITE_CONTACT.siteUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "#";
    return escapeNewsletterHtml(url.toString());
  } catch { return "#"; }
}

function inline(text: string): string {
  let html = escapeNewsletterHtml(text);
  html = html.replace(/\[([^\]]{1,200})\]\((https?:\/\/[^\s)]+)\)/g, (_match, label: string, href: string) => `<a href="${safeUrl(href)}">${label}</a>`);
  html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/_([^_\n]+)_/g, "<em>$1</em>");
  return html.replace(/\n/g, "<br>");
}

function renderBlock(block: NewsletterBlock): RenderedNewsletter {
  if (block.type === "heading") {
    const level = block.level ?? 2;
    return { html: `<h${level} style="font-family:Georgia,serif;line-height:1.25;color:#172033">${inline(block.text ?? "")}</h${level}>`, text: block.text ?? "" };
  }
  if (block.type === "paragraph") return { html: `<p>${inline(block.text ?? "")}</p>`, text: block.text ?? "" };
  if (block.type === "quote") return { html: `<blockquote style="border-left:4px solid #405ca8;margin:24px 0;padding:8px 18px;color:#38445b">${inline(block.text ?? "")}</blockquote>`, text: `> ${block.text ?? ""}` };
  if (block.type === "bulletList" || block.type === "orderedList") {
    const tag = block.type === "bulletList" ? "ul" : "ol";
    return { html: `<${tag}>${block.items.map((item) => `<li>${inline(item)}</li>`).join("")}</${tag}>`, text: block.items.map((item, index) => `${block.type === "bulletList" ? "-" : `${index + 1}.`} ${item}`).join("\n") };
  }
  if (block.type === "image") {
    const caption = block.caption ? `<figcaption style="font-size:12px;color:#687284;margin-top:6px">${inline(block.caption)}</figcaption>` : "";
    return { html: `<figure style="margin:24px 0"><img src="${safeUrl(block.url)}" alt="${escapeNewsletterHtml(block.alt)}" style="display:block;max-width:100%;height:auto">${caption}</figure>`, text: `[Imagen: ${block.alt}]${block.caption ? ` ${block.caption}` : ""}` };
  }
  return { html: '<hr style="border:0;border-top:1px solid #d7dce6;margin:28px 0">', text: "---" };
}

export function renderNewsletter(
  content: NewsletterContent,
  footer: NewsletterFooter,
  unsubscribeUrl: string,
  viewUrl: string,
): RenderedNewsletter {
  const blocks = content.blocks.map(renderBlock);
  const bodyHtml = blocks.map((block) => block.html).join("\n");
  const bodyText = blocks.map((block) => block.text).filter(Boolean).join("\n\n");
  const footerHtml = `<footer style="border-top:1px solid #d7dce6;margin-top:36px;padding-top:18px;color:#687284;font-size:12px;line-height:1.55"><strong>${escapeNewsletterHtml(footer.organizationName)}</strong><br>${escapeNewsletterHtml(footer.postalAddress)}<br><a href="${safeUrl(viewUrl)}">Ver en navegador</a> &nbsp;|&nbsp; <a href="${safeUrl(footer.privacyUrl)}">Privacidad</a> &nbsp;|&nbsp; <a href="${safeUrl(footer.contactUrl)}">Contacto</a><br><a href="${safeUrl(unsubscribeUrl)}">Anular suscripcion</a></footer>`;
  const preheader = escapeNewsletterHtml(content.preheader);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeNewsletterHtml(content.subject)}</title></head><body style="margin:0;background:#f4f5f7"><div style="display:none!important;max-height:0;overflow:hidden;opacity:0">${preheader}</div><main style="box-sizing:border-box;max-width:680px;margin:0 auto;background:#fff;padding:32px;font-family:Arial,sans-serif;color:#172033;line-height:1.6">${bodyHtml}${footerHtml}</main></body></html>`;
  const text = `${content.preheader ? `${content.preheader}\n\n` : ""}${bodyText}\n\n${footer.organizationName}\n${footer.postalAddress}\nVer en navegador: ${viewUrl}\nPrivacidad: ${footer.privacyUrl}\nContacto: ${footer.contactUrl}\nAnular suscripcion: ${unsubscribeUrl}`.trim();
  return { html, text };
}
