# ACTION-PLAN.md — Plan de mejora SEO para orbitadivulgacion.com

Complemento ejecutable de `FULL-AUDIT-REPORT.md` (2026-08-21). Ordenado por impacto/esfuerzo según la rúbrica de la skill. Todo se implementa en este repositorio salvo lo marcado como Cloudflare.

---

## Fase 0 — Quick wins (impacto alto, esfuerzo bajo; ~1–2 días)

### 1. Fijar el dominio canónico en todo el pipeline de URLs ⚠️→✅
- **Qué:** usar `SITE_URL` de `lib/site-config.ts:11` como única fuente en:
  - `metadataBase` de `app/layout.tsx` (hoy deriva del Host header, `app/layout.tsx:19-21`)
  - `app/robots.ts`, `app/sitemap.ts`, `app/rss.xml/route.ts` (hoy usan `lib/origin.ts`)
- **Por qué:** elimina el riesgo de contenido duplicado entre hosts y el fallback `"orbita-revista.example"` filtrándose a producción.
- **Dónde:** `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/rss.xml/route.ts`.

### 2. Añadir canonicals a todas las páginas ⚠️→✅
- `alternates: { canonical: "./" }` en el layout y en cada `generateMetadata` (artículos, ediciones, rutas estáticas).
- Verificar el tag renderizado con `curl` tras deploy.

### 3. `lastmod` real en el sitemap ⚠️→✅
- Sustituir `lastModified: new Date()` (`app/sitemap.ts:12,19,25`) por `publishedAt`/`updatedAt` de la fila CMS (`lib/cms.ts:104,127`) y fecha de la edición para `/ediciones/[slug]`.
- **Por qué:** hoy cada rastreo ve "todo cambió hoy" → Google ignora la señal.

### 4. Redirección permanente www y HTTP→HTTPS (Cloudflare)
- Cambiar el 302 actual `www → apex` por **308** (Redirect Rule o Bulk Redirect).
- Activar "Always Use HTTPS" en SSL/TLS Edge Certificates.
- Verificar después con `redirect_checker.py`.

### 5. Completar OpenGraph: `og:url` y `og:site_name` 🔴→✅
- En `openGraph` del layout añadir `siteName: "Órbita · Aerospace AAFI"` (con metadataBase arreglado, vinext/Next emite `og:url` por página).
- Subir el score social de 69/100 a ~95.

### 6. Favicon funcional ⚠️→✅
- Declarar en el layout: `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` + `apple-touch-icon`.
- Generar `public/favicon.ico` (32px) y `apple-touch-icon.png` (180px) desde el SVG existente — hoy `/favicon.ico` da 404 y Google puede mostrar favicon vacío en SERP.

### 7. Metadata para páginas de edición ⚠️→✅
- Añadir `generateMetadata` en `app/ediciones/[slug]/page.tsx` con título tipo `Edición No. 4 · Octubre 2025 · Órbita` y descripción del resumen.
- Hoy todas comparten el título por defecto del layout (duplicación masiva de titles).

### 8. Robots.txt: bloquear rutas privadas ⚠️→✅
- En `app/robots.ts` añadir `Disallow: /admin` y `Disallow: /newsletter` (las páginas públicas de newsletter no deben entrar al índice).

### 9. RSS completo + autodiscovery ⚠️→✅
- En `app/rss.xml/route.ts`: añadir `<pubDate>` (RFC-822, de `publishedAt`), `<language>es-mx</language>`, `<atom:link rel="self" type="application/rss+xml">` y acentos en la descripción del canal.
- En el layout: `<link rel="alternate" type="application/rss+xml" title="Órbita" href="/rss.xml">`.

### 10. Comprimir `og.png` ⚠️→✅
- Regenerar a 1200×630 y ≤300 KB (hoy ~2 MB). Opcional: `app/opengraph-image.tsx` con ImageResponse para previews dinámicas por artículo.

**Criterio de salida Fase 0:** `parse_html.py` muestra canonical en home/artículo; sitemap con lastmod distintos; social_meta ≥90; favicon 200; redirect_checker muestra 308.

---

## Fase 1 — Estratégico (1–2 semanas)

### 11. Suite JSON-LD (el mayor gap: score de categoría 0) 🔴
Solo JSON-LD (`<script type="application/ld+json">`). Plantillas en `~/.config/opencode/skills/seo/resources/schema/templates.json`. **No** usar HowTo (deprecado) ni FAQPage (restringido).

- **Layout global:** `NewsMediaOrganization` (nombre, logo, `sameAs` a redes) + `WebSite`.
- **Artículo (`app/articulos/[slug]/page.tsx`):** `NewsArticle` con headline, description, image, `datePublished` (¡día exacto desde CMS!), `dateModified`, `author` → `Person`, `publisher` → Organization, `mainEntityOfPage`.
- **Autores:** `ProfilePage`/`Person` con afiliación (E-E-A-T).
- **Ediciones y artículo:** `BreadcrumbList` (Inicio → Artículos → Artículo).
- Validar cada página con `python ~/.config/opencode/skills/seo/scripts/validate_schema.py <html>` y el Rich Results Test.

### 12. Modernizar imágenes
- Añadir `width`/`height` a todos los `<img>` (elimina CLS residual) y `loading="lazy"` a imágenes bajo el fold (home: 127 imágenes, hoy 0 lazy).
- Alt descriptivo en portadas del feed de home (119 con `alt=""`; mantener `alt=""` solo para decorativas reales).
- Adoptar el optimizador Cloudflare Images ya cableado en `worker/index.ts:32-41` (formatos modernos + resize) o al menos servir WebP/AVIF.

### 13. Paquete GEO / AI-readiness
- Crear `public/llms.txt` (nombre, misión, secciones, 10–15 URLs clave) y opcional `llms-full.txt`.
- Decisión editorial explícita en `robots.ts`: permitir GPTBot/ClaudeBot/PerplexityBot/Google-Extended (recomendado para una revista de divulgación que busca citas) declarándolos como reglas propias.
- Fechas completas en RSS y sitemap (sinergia con items 3 y 9).

### 14. E-E-A-T de autores
- Enlazar cada byline "Por …" al perfil del autor en `/autores` con bio, credenciales y artículos (hoy la relación no está verificada en el HTML del artículo).
- Fechas visibles con día + `<time datetime="2026-03-15">` en artículos.

### 15. Headers de seguridad (remate)
- HSTS: añadir `includeSubDomains` (y evaluar `preload`) en `next.config.ts:5-42`.

---

## Fase 2 — Mantenimiento y crecimiento

16. **Google Search Console**: registrar `https://orbitadivulgacion.com` (apex), enviar sitemap corregido, monitorizar cobertura y CWV (CrUX). Re-evaluar PageSpeed con `PAGESPEED_API_KEY` en `~/.agentic-seo/.env`.
17. **Paginación/colecciones** cuando el archivo supere ~100 artículos (hoy `/articulos` renderiza todo con búsqueda client-side; sin `?page=`).
18. **Intención de búsqueda por artículo**: usar los campos CMS `seoTitle`/`seoDescription` ya existentes en cada alta (plantilla del admin ya los soporta).
19. **Enlazado interno**: dar un enlace interno a las 3 páginas casi-huérfanas detectadas (`/ediciones/octubre-2025-nasa-space-apps`, `/ediciones/julio2025`, artículo "Alondra Balancán") desde páginas temáticas o la edición correspondiente.
20. **CI de SEO**: integrar `pre_commit_seo_check.sh` y `validate_schema.py` de la skill para evitar regresiones (placeholders en schema, títulos largos, alts faltantes).

---

## Esfuerzo estimado

| Fase | Ítems | Esfuerzo | Impacto esperado en score |
|---|---|---|---|
| 0 | 1–10 | ~1–2 días de código | 35 → ~55 (canonical, sitemap, OG, ediciones) |
| 1 | 11–15 | ~1–2 semanas | 55 → ~75–80 (schema + imágenes + GEO) |
| 2 | 16–20 | continuo | consolidación y medición real (GSC/CrUX) |

## Verificación post-implementación

```bash
SKILL=~/.config/opencode/skills/seo
python $SKILL/scripts/parse_html.py <url> --url <url> --json      # canonical/og/favicon
python $SKILL/scripts/social_meta.py <url>                        # og:url/site_name
python $SKILL/scripts/redirect_checker.py https://www.orbitadivulgacion.com/   # 308
python $SKILL/scripts/llms_txt_checker.py https://orbitadivulgacion.com/       # llms.txt
python $SKILL/scripts/validate_schema.py <html-descargado>        # JSON-LD
```
