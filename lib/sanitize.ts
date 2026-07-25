/** Sanitiza HTML de cuerpo de articulo. Permite tags seguros, bloquea scripts y eventos. */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi, 'href="#"')
    .replace(/<\/?(?:iframe|object|embed)\b[^>]*>/gi, "")
    .replace(/<a\s+/gi, '<a rel=\"noopener noreferrer\" ')
    .replace(/<img\s+/gi, '<img loading=\"lazy\" ');
}
