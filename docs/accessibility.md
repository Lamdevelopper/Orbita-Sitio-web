# Accesibilidad — Órbita

Objetivo: **WCAG 2.2 nivel AA** en todo el sitio público. Es el estándar técnico que
referencian la ADA Título III (EE.UU.), el European Accessibility Act (UE, EN 301 549)
y el resto de marcos nacionales; conformar con AA y publicar la declaración en
`/accesibilidad` es la mitigación práctica frente a demandas y "demand letters".

Alcance: rutas públicas. El panel `/admin` está **fuera de alcance por decisión**
(ver deuda al final).

## Cómo verificar

1. **Automatizado:** `npm run test:a11y`. Levanta (o reutiliza) el servidor de
   desarrollo en el puerto 3000 — `vinext start` no corre fuera del runtime
   Cloudflare/workerd, por eso se escanea contra `npm run dev`.
   Escanea las rutas públicas con axe-core y falla con violaciones
   *critical/serious*. Los hallazgos *moderate/minor* se imprimen en consola
   para triage.
2. **Lint:** `npm run lint` incluye `eslint-plugin-jsx-a11y` (recommended).
   Las reglas de interacción con puntero quedaron en `warn` por la deuda del admin.
3. **Manual (cada release mayor):**
   - Recorrer la portada y un artículo solo con Tab / Shift+Tab / Enter / Escape.
   - Verificar foco visible en fondo claro y oscuro (footer, newsletter, mast de edición).
   - Zoom 200% en portada y artículo: sin pérdida de contenido ni scroll horizontal.
   - Vista móvil: el menú hamburguesa abre/cierra y contiene los 4 destinos + búsqueda.
   - `prefers-reduced-motion` activo: sin transiciones de zoom ni smooth scroll.

## Reglas editoriales (contenido nuevo)

- Toda imagen subida por `/admin/post` debe traer `PIE DE FOTO` descriptivo:
  ese texto se usa como `alt`. Sin pie, la imagen se trata como decorativa (`alt=""`).
- No usar el título del artículo como `alt` de figuras internas.
- Los enlaces deben tener texto propio significativo; los glifos `→`/`↗` van con
  `aria-hidden` y los enlaces `target="_blank"` avisan "(se abre en una pestaña nueva)".
- Mantener un solo `h1` por página y no saltar niveles de encabezado.

## Decisiones de implementación (2026-08)

- Skip-link global en `app/layout.tsx` (`#contenido`), estilos en `globals.css`.
- Foco visible: `:focus-visible` con `outline` de 3px `--orbita-blue-deep` y
  variante blanca dentro de superficies oscuras (`.utility-bar`, `.edition-feature`,
  `.edition-mast`, `.newsletter`, `.site-footer`, `.about-blue`). No usar `outline:none`.
- Diálogo de cookies (`CookieConsent`): foco movido al abrir, Tab atrapado,
  Escape cierra y el foco vuelve al elemento previo.
- Portadas de edición sin imagen usan `<b class="cover-title">`, no `h2`, para no
  duplicar el encabezado de la tarjeta (`.cover>span`/`.cover>strong` tienen reglas
  CSS por elemento; `b` es el único tag sin colisión).
- Menú móvil: `SiteHeader` es cliente; `nav[data-open]` controlado por un botón
  con `aria-expanded`/`aria-controls`. Los links cierran el menú al navegar porque
  el layout persiste entre rutas.
- Tabla de contenidos del artículo: `<nav class="article-toc" aria-label>` en lugar
  de `aside` (los selectores CSS de `.reading-layout` apuntan a `.article-toc`).
- Filtros de `/articulos`: `aria-pressed` por botón y conteo de resultados en
  `role="status"`.
- Imágenes de artículos sin pie: `alt=""` (decorativas junto al texto descrito).

## Deuda documentada — panel /admin (fuera de alcance)

Detectado en auditoría 2026-08, pendiente de un pase dedicado:

- `AdminNewsletter`: modales con `role="dialog"` sin gestión de foco, sin Escape
  y botón de cierre sin `aria-label`; bloques del editor son `div` con `onClick`
  (no operables por teclado); toolbar nombrada solo con `title` y sin
  `aria-pressed`; tabs sin `aria-current`.
- `AdminStudio`: tabs como botones con `aria-current` (aceptable) pero sin patrón
  ARIA tabs (`role="tablist"`, flechas de teclado).
- `PostEditor`: `span` con `onClick` (no operable por teclado).
- Enlaces externos de ediciones y `window.prompt` para URLs en el editor.

## Rutina de reevaluación

- Cada release: `npm run test:a11y` + `npm run lint`.
- Trimestral: pase manual de teclado/zoom en portada, artículo, ediciones y formularios.
- Anual: actualizar `/accesibilidad` (fecha de evaluación y limitaciones conocidas).
