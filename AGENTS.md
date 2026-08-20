# Editorial CMS

The admin route (/admin) has operational tabs for articles, authors, editions, and Newsletter.

## Structure

- **components/AdminStudio.tsx** - Main admin panel with tabs (articles, authors, editions)
  - Articles tab: queue (CMS drafts), table view (all managed), archived collapsible, and form (create/edit)
  - Authors tab: form + registered authors list with avatar, bio, and CRUD
  - Editions tab: form + archive of CMS-managed editions with date, number, summary, links, PDF, and cover
  - Visual displaced-hero indicator via displacedSlugs state and .admin-displaced CSS class
  - Newsletter delegates to `components/AdminNewsletter.tsx`; it never receives
    subscriber email plaintext.

- **lib/editorial.ts** - Owns article placement logic (placeArticle):
  - Ensures exactly one hero article at a time (displaces previous hero to feed)
  - Maintains contiguous ranked lists per slot
  - Returns displacedHeroCount and displacedHeroSlugs for frontend feedback

- **app/api/articles/route.ts** - GET (list), POST (create with placement)
- **app/api/articles/[slug]/route.ts** - GET (published article), PATCH (update with placement), DELETE (archive)
- **app/api/authors/route.ts** - GET (list), POST (create)
- **app/api/authors/[id]/route.ts** - PATCH (update), DELETE (remove, blocked if articles assigned)
- **app/api/editions/route.ts** - GET (list), POST (create), PATCH (update)


- **Importación automática** - Botón en el header del admin que abre `/admin/post`.
  Permite pegar o cargar un `.txt` / `.md` con la plantilla del escritor,
  previsualizar el parseo, subir imágenes y guardar como borrador.
  El guardado invoca `placeArticle()` para mantener la invariante de un solo héroe.
  La guía PDF (`/docs/Guia_entrega_articulos_Orbita.pdf`) sigue disponible como referencia.

- **Archivo editorial estático** - `data/articles.ts` conserva una versión de
  respaldo de los artículos históricos recompuestos desde los PDFs de las
  ediciones No. 9 (marzo 2026) y No. 2 (agosto 2025). Sus imágenes locales
  viven en `public/articles/archive/heart-*.png` y
  `public/articles/archive/quantum-*.png`. `lib/cms.ts` usa la versión
  recompuesta completa para `cuando-el-corazon-humano-latio-desde-la-orbita-lunar`
  y sólo corrige la portada local de `mecanica-cuantica-en-el-espacio`; la
  ubicación en portada/feed continúa viniendo de la fila CMS. No sustituir
  estos assets por hotlinks sin revisar derechos y pies de foto en la edición
  original.

## Key behaviors

- Published content leaves the CMS queue automatically
- Setting an article as hero displaces any existing hero to feed with visual warning
- Changing position in feed auto-shifts other articles to avoid rank collisions
- Archived content is hidden from the table and shown under a collapsible Archivados section
- Import entry point opens the PDF guide directly (public/docs/Guia_entrega_articulos_Orbita.pdf)
- Analytics supports Todos los tiempos (all) and Este mes (month) period presets

## PDF guide (public/docs/Guia_entrega_articulos_Orbita.pdf)

Generated via fpdf2 (Python). Two-page guide covering:
  1. Folder preparation + naming rules
  2. Template with metadata, markdown signals, and image blocks
  3. Complete example
  4. How to compress and send
  5. Pre-submission checklist

To regenerate: run the fpdf2 script in public/docs/gen_guide.py.

## Production resilience

- Public pages must render when D1 is unavailable or has no editorial rows.
- `lib/content.ts` owns CMS-to-static fallback behavior; callers should use
  `getArticles`, `getArticle`, `getEditions`, and `getEdition` when a public
  route needs resilient reads.
- CMS functions used by those helpers must be local imports; a re-export alone
  does not create callable bindings in the module.
- A missing current edition must never crash the homepage. Edition-only UI is
  rendered conditionally in `app/page.tsx`.
- Do not start timers or perform request-bound I/O in Worker module scope.
  `lib/rate-limit.ts` cleans its bounded in-memory state during requests.
- Editor access is configured only through `EDITOR_EMAILS` and fails closed.
- Admin post previews escape submissions before adding preview markup.
- Media uploads accept only allowlisted image formats with matching signatures;
  SVG and client-declared arbitrary MIME types are rejected.
- Follow `SITES_DEPLOY.md` for build, publish, smoke-test, log, and rollback
  procedures. Never deploy an archive that was built from a different commit.
- Newsletter remains fail-closed until both the D1 setting and
  `NEWSLETTER_ENABLED=true` are present. Email delivery runs in the separate
  scheduled Worker documented in `SITES_DEPLOY.md`.

## Placement editorial y portada publica

- `lib/editorial-model.ts` es la fuente pura y testeable de las invariantes de
  ubicacion: como maximo un `hero`; `featured` y `feed` mantienen colecciones
  independientes y ranks contiguos; mover un articulo compacta el slot origen
  y el destino; `hidden` siempre tiene rank `0`.
- `lib/editorial.ts` aplica el modelo a D1 con un batch y solo persiste filas
  que cambiaron. `archiveArticle()` incluye estado, slot y compactacion en esa
  misma operacion.
- `app/page.tsx` renderiza explicitamente todos los articulos `featured` y
  excluye el `hero`; solo usa los primeros tres articulos publicos como
  fallback cuando no hay destacados configurados.
- La prueba focalizada es `npm run test:editorial` y también forma parte de
  `npm test`.

