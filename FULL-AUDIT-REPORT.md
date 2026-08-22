# FULL-AUDIT-REPORT.md — Auditoría SEO de orbitadivulgacion.com

**Fecha:** 2026-08-21 · **Skill:** Agentic SEO (LLM-first, evidencia script + código fuente)
**Alcance:** full-site (homepage, plantilla de artículo, ediciones, archivos técnicos, código fuente del repositorio `Orbita-Sitio-web`)
**Sitio:** https://orbitadividulacion.com → revista universitaria de divulgación científica (Publisher/Media, `es-MX`)
**Stack verificado:** vinext (Vite) sobre Cloudflare Worker + D1 + R2

---

## A) Resumen de auditoría

### Puntuación global: 35/100 — Pobre (banda 30–49) · Score confidence: Medium

> La puntuación se calculó con el protocolo de la skill (pesos: Técnico 25%, Contenido 20%, On-Page 15%, Schema 15%, Imágenes 10%, GEO 5%; CWV excluido por falta de datos, pesos renormalizados). Es direccional: el sitio tiene fundamentos técnicos sólidos (sin enlaces rotos, SSR limpio, cero JS de terceros), pero las categorías de mayor peso están hundidas por tres omisiones estructurales fáciles de corregir.

| Categoría | Peso | Score | Confidence |
|---|---|---|---|
| Technical SEO | 25% | 44 | Confirmed |
| Content Quality / E-E-A-T | 20% | 50 | Confirmed |
| On-Page SEO | 15% | 44 | Confirmed |
| Schema / Structured Data | 15% | 0 | Confirmed |
| Core Web Vitals | 10% | *Sin datos* | — |
| Image Optimization | 10% | 13 | Confirmed |
| AI Search Readiness (GEO) | 5% | 45 | Confirmed |

**Top 3 problemas**
1. **Cero JSON-LD en todo el sitio** — ni Organization, ni WebSite, ni Article/NewsArticle, ni Person. Sin elegibilidad a resultados enriquecidos y con señales E-E-A-T débiles para máquinas (Confirmado en repo y en HTML vivo).
2. **Sin canonical en ninguna página y URLs derivadas del Host header** (`metadataBase`, sitemap, robots y RSS usan el host recibido en vez de `https://orbitadivulgacion.com` fijado en `lib/site-config.ts:11` pero sin usar para SEO). `www` redirige al apex con **302 temporal**.
3. **Sitemap con `lastmod` falsificado**: todas las URLs comparten el timestamp de la petición (`app/sitemap.ts` usa `new Date()`), destruyendo la confianza de Google en la señal de frescura.

**Top 3 oportunidades**
1. Paquete de datos estructurados (Organization + WebSite + NewsArticle/Article + BreadcrumbList + Person de autores) → elegibilidad a rich results y refuerzo E-E-A-T.
2. Paquete GEO/AI: `llms.txt`, política explícita de AI crawlers en robots.txt, `pubDate` completos en RSS → citabilidad en búsquedas con IA.
3. Revisión de imágenes: `og.png` pesa ~2 MB (límite práctico de previews sociales ~300 KB), 127 imágenes en home sin dimensiones, sin lazy-load y 119 con `alt=""`.

---

## B) Tabla de hallazgos

Leyenda severidad: 🔴 Critical · ⚠️ Warning · ✅ Pass · ℹ️ Info

### Technical SEO (score 44)

| Sev | Conf | Hallazgo | Evidencia | Fix |
|---|---|---|---|---|
| ⚠️ | Confirmado | Sin `<link rel="canonical">` en ninguna página | `parse_html.py`: `canonical: null` en home y artículo; grep de `alternates` en repo: 0 resultados | Añadir `alternates.canonical` en layout y `generateMetadata` de cada ruta |
| ⚠️ | Confirmado | URLs de sitemap/robots/RSS/metadataBase derivadas del Host header | `lib/origin.ts:4-9`, `app/layout.tsx:19-21`; fallback `"orbita-revista.example"` | Usar `SITE_URL` de `lib/site-config.ts:11` como única fuente |
| ⚠️ | Confirmado | `lastmod` del sitemap = momento de la petición para todas las URLs | `curl sitemap.xml`: todas `2026-08-22T01:45:25.584Z` | Usar `publishedAt`/`updatedAt` reales de D1 |
| ⚠️ | Confirmado | `www → apex` responde 302 (temporal) en vez de 301/308 | `curl -I https://www.orbitadivulgacion.com/` → `302 → https://orbitadivulgacion.com/` | Regla de redirección 308 en Cloudflare |
| ⚠️ | Confirmado | `/admin` y `/newsletter/[publicId]` rastreables | `app/robots.ts:4-10` solo bloquea `/api/` | Añadir `Disallow: /admin`, `/newsletter` |
| ✅ | Confirmado | robots.txt válido con sitemap declarado; HTTP 200 | `robots_checker.py`: Status 200, 1 sitemap | — |
| ✅ | Confirmado | 0 enlaces rotos de 132 verificados | `broken_links.py`: 132 healthy, 0 broken | — |
| ✅ | Confirmado | Apex sirve 200 directo sin cadena de redirecciones | `redirect_checker.py`: 0 hops, 308 ms | — |
| ✅ | Confirmado | 404 correctos y branded; estados de carga; fallback estático si D1 cae | `app/not-found.tsx`; `notFound()` en `[slug]`; `SITES_DEPLOY.md:38-45` | — |
| ✅ | Confirmado | Enlazado interno sano: 430 links, promedio 20.5/página, solo 3 casi-huérfanas | `internal_links.py` (21 páginas, 138 únicas) | Enlazar las 2 ediciones antiguas y el artículo huérfano desde páginas temáticas |
| ⚠️ | Confirmado | Headers de seguridad 90/100: falta X-Frame-Options (mitigado por CSP `frame-ancestors 'none'`) y HSTS sin `includeSubDomains` | `security_headers.py` | Añadir `includeSubDomains` a HSTS en `next.config.ts` |

### Content Quality / E-E-A-T (score 50)

| Sev | Conf | Hallazgo | Evidencia | Fix |
|---|---|---|---|---|
| ✅ | Confirmado | Byline de autor visible + tiempo de lectura | Artículo vivo: "Por Fernando Rodríguez Solana · marzo 2026 · 5 min de lectura" | — |
| ✅ | Confirmado | Extensión adecuada de artículos | `parse_html.py`: 1083 palabras en artículo muestra | — |
| ✅ | Confirmado | Identidad institucional clara (Órbita · Aerospace AAFI, revista universitaria), página Acerca y Privacidad | Layout + rutas `/acerca`, `/privacidad` | — |
| ⚠️ | Confirmado | Fechas visibles sin día y sin `<time datetime>` | HTML del artículo: "marzo 2026", sin elemento `<time>` | Fecha completa + `<time datetime="ISO">` |
| ⚠️ | Probable | Bylines no enlazan a perfil de autor con credenciales (página `/autores` existe pero vínculo por-artículo no verificado) | Requiere verificación en HTML del artículo | Enlazar cada byline a su perfil con bio/credenciales (E-E-A-T) |
| ℹ️ | Confirmado | Volumen actual moderado (~50–100 URLs de contenido); sin paginación (todo en client-side search) | `internal_links.py`: 138 URLs únicas | Vigilar al crecer el archivo; añadir paginación/colecciones temáticas |

### On-Page SEO (score 44)

| Sev | Conf | Hallazgo | Evidencia | Fix |
|---|---|---|---|---|
| 🔴 | Confirmado | `og:url` ausente (tag requerido); `og:site_name` ausente | `social_meta.py`: Score 69/100, "Missing required: og:url" | Completar OpenGraph en layout |
| ⚠️ | Confirmado | Páginas de edición (`/ediciones/[slug]`) sin ningún export de metadata → todas comparten título/description por defecto | `app/ediciones/[slug]/page.tsx` (36 líneas, sin metadata) | `generateMetadata` con número, fecha y resumen de la edición |
| ⚠️ | Confirmado | Favicon roto: sin `<link rel="icon">` en head y `/favicon.ico` devuelve 404 | `parse_html.py`: `favicon: null`; `curl /favicon.ico` → 404; solo existe `public/favicon.svg` | Declarar `<link rel="icon">` + servir favicon.ico/apple-touch-icon |
| ⚠️ | Confirmado | RSS sin descubrimiento automático ni metadatos completos | Sin `<link rel="alternate" type="application/rss+xml">`; RSS sin `pubDate`, `<language>` ni `atom:link rel=self` | Añadir autodiscovery en layout y completar canal RSS |
| ✅ | Confirmado | Title template `%s · Órbita` + títulos/descripciones por artículo vía CMS (`seoTitle`/`seoDescription`) | `app/layout.tsx:17-29`; `app/articulos/[slug]/page.tsx:12-32` | — |
| ✅ | Confirmado | `lang="es"`, viewport correcto, un solo H1 por página, jerarquía H2/H3 coherente | HTML vivo de home y artículo | — |
| ✅ | Confirmado | OG de artículo con imagen y alt descriptivo | Meta tags del artículo vivo | — |

### Schema / Structured Data (score 0)

| Sev | Conf | Hallazgo | Evidencia | Fix |
|---|---|---|---|---|
| 🔴 | Confirmado | **Cero JSON-LD en todo el sitio** (ni Organization, WebSite, Article, Person, BreadcrumbList) | `grep -r "application/ld+json"` en repo: 0; regex sobre HTML vivo de home y artículo: NONE | Implementar suite JSON-LD (ver ACTION-PLAN fase 2). Solo JSON-LD; no recomendar HowTo (deprecado) ni FAQPage (restringido) |

### Core Web Vitals (sin datos)

| Sev | Conf | Hallazgo | Evidencia | Fix |
|---|---|---|---|---|
| ℹ️ | — | **Limitación del entorno**: PageSpeed Insights API rate-limited en 2 intentos (sin API key). No se inventan cifras. Proxy favorable: 0 scripts externos, fuentes self-hosted (`next/font`), assets inmutables, media R2 con cache 1 año | Salida de `pagespeed.py`; `next.config.ts`; `worker/index.ts` | Re-evaluar con API key propia o CrUX; mientras tanto aplicar mejoras de imágenes/lazy-load |
| ⚠️ | Confirmado | Documento HTML de 232 KB con 155 scripts inline (payload SSR pesado); render dinámico en todas las páginas por `headers()` en `generateMetadata` | Análisis de `home.html`; `export const dynamic="force-dynamic"` en `/articulos` | Evaluar ISR/cache edge para rutas públicas |

### Image Optimization (score 13)

| Sev | Conf | Hallazgo | Evidencia | Fix |
|---|---|---|---|---|
| ⚠️ | Confirmado | `public/og.png` = 2,098,722 bytes (~2 MB) usado como imagen social única | Tamaño local; referenciada en `app/layout.tsx:26-27` | Regenerar ≤300 KB, 1200×630; considerar `opengraph-image.tsx` dinámico |
| ⚠️ | Confirmado | 127 imágenes en home: 0 con width/height (riesgo CLS, parcialmente mitigado por CSS aspect-ratio), 0 con lazy-load | Regex sobre `home.html`: `sin_dimensiones=127 lazy=0` | Dimensiones explícitas + `loading="lazy"` bajo el fold |
| ⚠️ | Confirmado | 119 imágenes con `alt=""` en home (portadas de artículos deberían describirse) | Regex sobre `home.html`: `alt_vacio=119` | Alt descriptivo en portadas de tarjetas |
| ✅ | Confirmado | Optimizador de imágenes Cloudflare cableado pero sin uso; media R2 cacheada inmutable | `worker/index.ts:32-41`; todo el sitio usa `<img>` plano | Adoptar el optimizador existente para redimensionar/formatos modernos |

### AI Search Readiness / GEO (score 45)

| Sev | Conf | Hallazgo | Evidencia | Fix |
|---|---|---|---|---|
| 🔴 | Confirmado | `llms.txt` y `llms-full.txt` inexistentes (404) | `llms_txt_checker.py`: 404 ambos | Crear `/llms.txt` con identidad, secciones y artículos destacados |
| ⚠️ | Confirmado | 11 crawlers de IA sin gestión explícita (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot…) heredan `Allow: /` | `robots_checker.py` | Decisión editorial: si interesa ser citado por IA (revista de divulgación), declararlo explícitamente en robots.txt + `llms.txt` |
| ✅ | Confirmado | Contenido SSR semántico legible sin JS, encabezados claros, nicho temático bien definido | HTML vivo | — |

---

## C) Desconocidos y seguimientos (para pasar de Likely/Hypothesis a Confirmed)

1. **CWV reales**: correr PageSpeed con API key (`PAGESPEED_API_KEY`) o leer CrUX Dashboard. Bloqueado hoy por rate-limit compartido.
2. **Indexación multi-host**: verificar en Google Search Console si hay URLs con `www` indexadas antes del 302; confirmar que el puerto 80 responde con redirect a HTTPS (curl local no pudo conectar: posible restricción del sandbox).
3. **Byline ↔ perfil de autor**: confirmar si el nombre del autor enlaza a `/autores` (o crear esa relación).
4. **Estado de Search Console**: desconocido; registrar propiedad apex + enviar sitemap tras corregir `lastmod`.
5. **Páginas `/newsletter/[publicId]`**: comprobar en GSC si alguna quedó indexada antes de añadir `noindex`.

---

## Artefactos y evidencia generados

- Este reporte: `FULL-AUDIT-REPORT.md`
- Plan priorizado: `ACTION-PLAN.md`
- Evidencia cruda: `tmp/seo-audit/` (home.html, article.html, home-parsed.json, article-parsed.json)
- Scripts usados (skill instalada en `~/.config/opencode/skills/seo/`): fetch_page, parse_html, robots_checker, llms_txt_checker, security_headers, redirect_checker, social_meta, internal_links, broken_links, pagespeed (rate-limited)

## Limitaciones del entorno

- PageSpeed Insights API rate-limited (2 intentos, sin key): categoría CWV sin score, marcada como Unknown según la rúbrica.
- Conexión por puerto 80 (HTTP plano) falló desde este entorno: verificación de "Always Use HTTPS" pendiente.
