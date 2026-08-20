# API newsletter

Las rutas de `subscribers` y `newsletters` mantienen dos fronteras: las altas publicas responden de forma generica para evitar enumeracion, mientras las operaciones editoriales requieren `isEditor` y validan `Origin` cuando el navegador lo envia. Los correos se cifran y se consultan por blind index; las respuestas administrativas solo exponen DTOs enmascarados.

Las newsletters usan revisiones: autosave incrementa `revision` y anula `testedRevision`; `test` prueba la revision guardada; `send` exige que ambas coincidan, requiere `Idempotency-Key` y no permite editar envios enviados. El footer se agrega unicamente en `lib/newsletter-render.ts`.

# API submissions (importacion de articulos)

# API articles (listado editorial)

- `GET /api/articles` acepta `limit` y `offset`. El panel autenticado puede
  solicitar hasta 500 filas (`scope=all`); la vista publica permanece limitada
  a 100 por respuesta. La respuesta incluye `pagination` (`total`, `hasMore`).
- Archivar por PATCH o DELETE debe pasar por `archiveArticle()`; no ocultar la
  fila antes, porque se perderia el slot origen y quedarian huecos de rank.
- Las rutas de artículos y la importación usan `lib/editorial-contract.ts` para
  mantener límites idénticos en POST/PATCH (title 180, slug 180, body 100000,
  category 80, dek 420, hero URL 1000, captions 500, tags 12, SEO 180/320).
  `editionId` se valida contra D1 antes de guardar; el rank ausente significa
  append y no se representa con sentinelas como 9999.
- PATCH de artículos rechaza estados/ubicaciones inválidos y nunca escribe
  `null` en `title`, `body` o `category`; los campos opcionales sí pueden
  limpiarse a null. El conteo de autores excluye artículos archivados, igual
  que el catálogo administrativo.
- Las imágenes de artículos/importación pasan por `normalizeImages()` y las
  entradas inválidas devuelven 400; no se filtran silenciosamente.
- Placement usa un lease D1 de 15 segundos más cola local; requiere aplicar la
  migración `0006_editorial_locks.sql` antes de habilitar escrituras concurrentes.
- `POST/PATCH /api/editions` exige número mínimo 1 y conserva `publishedAt` como
  null cuando falta al crear; un PATCH que no lo envía no inventa ni reemplaza
  la fecha existente.
- `publishedAt` acepta únicamente `YYYY-MM-DD` válido (medianoche UTC) y
  `isCurrent` únicamente boolean real. Activar una edición limpia las demás y
  activa la seleccionada en el mismo `db.batch`; no se usa `transaction()` por
  la incompatibilidad conocida de D1 Workers.

- `POST /api/submissions/parse` valida y convierte la plantilla del escritor
  (formato de `lib/submission.ts`) en un `ParsedSubmission` con texto e imagenes.
- `POST /api/submissions/save` persiste el articulo: inserta en estado `hidden`
  y luego llama a `placeArticle()` para respetar un unico hero y ranks contiguos.
  Devuelve `displacedHeroCount` y `displacedHeroSlugs` para el feedback del admin.
- Ambas rutas requieren `isEditor` y fallan cerrado sin autorizacion.

# API automation (Codex)

- `POST /api/automation/articles` es una frontera server-to-server separada
  del OAuth humano. Requiere `Authorization: Bearer` con el secreto de
  Worker `CODEX_ARTICLE_API_KEY` y un `Idempotency-Key` estable.
- Solo crea articulos `draft` o `review` en `homepageSlot: hidden`; nunca
  publica, archiva, crea autores, sube media ni modifica el hero/feed.
- Valida `authorId`/`editionId`, limita tamano y arrays, acepta solo media local
  `/media/editorial/`, aplica rate limit y rechaza slugs duplicados. Sus limites
  de articulos, tags e imagenes vienen de `editorial-contract.ts`, pero la
  normalizacion de URLs conserva esta frontera same-origin.
- El secreto de automatizacion no debe ser igual a `EDITOR_API_KEY`,
  `EDITOR_EMAILS` ni ningun secreto de newsletter. Rotarlo desde Cloudflare y
  no enviarlo al frontend, repositorio o logs.

# API seed editorial

- `POST /api/admin/seed` importa solo contenido estático existente y conserva
  rangos por slot en orden de importación; no usa un rango fijo para todas las
  filas.
- Si una fila histórica no trae autor, usa la etiqueta técnica documentada
  `Equipo Órbita` y deja bio/área vacías; no inventa credenciales o afiliaciones.
