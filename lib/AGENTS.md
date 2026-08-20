# Newsletter domain helpers

- `newsletter-crypto.ts` usa WebCrypto AES-256-GCM para correo, HMAC-SHA256
  para blind indexes y SHA-256 para tokens. Las claves entran como secretos
  base64 de 32 bytes y nunca se registran.
- `newsletter-model.ts` valida bloques allowlisted, URLs http(s)/locales,
  limites de tamano y transiciones de estados. `toMaskedSubscriberDto` no
  expone ciphertext, nonce, blind index ni correo plano.
- Usa `generateToken` para enlaces y guarda solo `hashToken(token)` en D1.
- Auditoria debe recibir metadatos sanitizados sin correo, tokens, secretos,
  IPs ni credenciales.
- `newsletter-render.ts` es la unica fuente del footer HTML/texto. Los snapshots
  usan `UNSUBSCRIBE_PLACEHOLDER`, reemplazado en memoria por el sender.
- `newsletter-retry.ts` concentra la politica 429/5xx/timeout y el limite de
  cinco intentos para que pueda probarse sin D1 ni red.

# Editorial y parser de articulos

- `editorial-contract.ts` es la fuente unica para enums, defaults, labels,
  limites, locale/timezone y normalizadores del CMS. `db/schema.ts`, APIs,
  importador y componentes deben consumirlo; no repetir literales equivalentes.

- `submission.ts` parsea la plantilla del escritor: metadatos
  `TITULO`/`AUTOR`/`CATEGORIA` (obligatorios), `SUBTITULO`/`BAJADA`,
  `EDICION`, `TIEMPO DE LECTURA` (1-90), separador `---`, cuerpo con `##`,
  `>` y bloques `[IMAGEN N]` + `RUTA:` + `PIE DE FOTO:`. Tolera CRLF y claves
  sin acentos; convierte cada imagen a `{{IMG:N}}`.
- `editorial-model.ts` contiene la funcion pura `calculatePlacements()`: hay
  como maximo un `hero`, `featured` y `feed` son colecciones independientes
  con ranks contiguos, mover entre slots compacta origen/destino y `hidden`
  siempre usa rank `0`. Tambien repara de forma determinista datos con heroes
  duplicados.
- `editorial.ts` adapta ese modelo a D1 con `placeArticle()` y
  `archiveArticle()`. Calcula todo el estado antes de escribir y aplica el
  reordenamiento con `db.batch`; archivar cambia estado, slot y ranks en la
  misma operacion para no perder el slot origen ni dejar huecos.
- `content.ts` es la fachada resiliente publica (CMS con fallback estatico);
  el admin y las API usan `cms.ts` directamente.
- `cms.ts` obtiene `authors.slug` junto al nombre para construir bylines
  enlazables. Un CMS sin hero usa `/og.png` como neutral; sin edición enlazada
  conserva `edition: ""` y no inventa una ruta `en-preparacion`. La reparación
  del artículo del corazón y la portada local cuántica se aplican después del
  mapeo de relaciones sin cambiar su ubicación editorial.
- `cmsEditions` y `cmsEdition` cargan los slugs de artículos publicados por
  `editionId` en consultas agrupadas, y el color de una portada generada se
  deriva determinísticamente del número.
- `editorial-contract.ts` es la fuente única de estados/slots, límites de
  artículos, autores, ediciones y paginación. También centraliza slug puro,
  tags, minutos de lectura (1-90, default 5), rank opcional (ausente = append)
  y guards de estados creatables (archived nunca se crea).
- `EDITORIAL_LOCALE` y `EDITORIAL_TIMEZONE` fijan `es-MX` y
  `America/Mexico_City` para presentaciones administrativas consistentes.
  El schema de Drizzle importa los arrays del contrato puro; el test contractual
  comprueba esa conexión para evitar que UI, API y base de datos diverjan.
- `normalizeImages()` rechaza entradas no-array, objetos nulos, refs/URLs
  vacíos o fuera de límite, captions no-string y más de 12 imágenes.
- `editorial.ts` serializa placements dentro del Worker mediante una cola y un
  lease D1 en `editorial_locks` (scope `homepage`, TTL 15 s), y usa `db.batch`
  para las escrituras. No usa `db.transaction()` porque Cloudflare D1 Workers
  rechaza BEGIN/SAVEPOINT. El lock coordina isolates mientras la migración
  `0006_editorial_locks.sql` esté aplicada; si un isolate muere, el TTL libera
  el scope automáticamente. La adquisición reintenta hasta ~1 s; una
  reconciliación normal debe terminar muy por debajo del TTL y no se renueva.
  Los valores de scope/TTL/reintentos viven en `PLACEMENT_LOCK` del contrato.
# Automatizacion segura

- `isCodexArticleApiClient()` compara el Bearer contra el secreto separado
  `CODEX_ARTICLE_API_KEY` mediante digests SHA-256 y comparacion sin salida
  temprana. No amplia `isEditor()` ni el acceso OAuth.
- `limits.automation` limita el endpoint server-to-server por IP. No usarlo
  para rutas humanas ni reutilizar el token en newsletters/subscribers.
