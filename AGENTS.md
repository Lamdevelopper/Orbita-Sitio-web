# Editorial CMS

The admin route (/admin) has operational tabs for articles, authors, and editions.

## Structure

- **components/AdminStudio.tsx** - Main admin panel with tabs (articles, authors, editions)
  - Articles tab: queue (CMS drafts), table view (all managed), archived collapsible, and form (create/edit)
  - Authors tab: form + registered authors list with avatar, bio, and CRUD
  - Editions tab: form + archive of CMS-managed editions with date, number, summary, links, PDF, and cover
  - Visual displaced-hero indicator via displacedSlugs state and .admin-displaced CSS class

- **lib/editorial.ts** - Owns article placement logic (placeArticle):
  - Ensures exactly one hero article at a time (displaces previous hero to feed)
  - Maintains contiguous ranked lists per slot
  - Returns displacedHeroCount and displacedHeroSlugs for frontend feedback

- **app/api/articles/route.ts** - GET (list), POST (create with placement)
- **app/api/articles/[slug]/route.ts** - GET (published article), PATCH (update with placement), DELETE (archive)
- **app/api/authors/route.ts** - GET (list), POST (create)
- **app/api/authors/[id]/route.ts** - PATCH (update), DELETE (remove, blocked if articles assigned)
- **app/api/editions/route.ts** - GET (list), POST (create), PATCH (update)

## Key behaviors

- Published content leaves the CMS queue automatically
- Setting an article as hero displaces any existing hero to feed with visual warning
- Changing position in feed auto-shifts other articles to avoid rank collisions
- Archived content is hidden from the table and shown under a collapsible Archivados section
- Import entry point opens the PDF guide directly (public/docs/Guia_entrega_articulos_Orbita.pdf)
- Analytics supports Todos los tiempos (all) and Este mes (month) period presets
