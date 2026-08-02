# API segura de artículos para Codex

## Alcance

La API permite que un cliente Codex/MCP cree artículos para revisión editorial.
No sustituye el login humano y no permite publicar ni cambiar la portada.

Endpoint:

```text
POST https://orbitadivulgacion.com/api/automation/articles
Authorization: Bearer <CODEX_ARTICLE_API_KEY>
Content-Type: application/json
Idempotency-Key: <clave-estable-de-16-a-128-caracteres>
```

El cuerpo acepta `title`, `slug`, `body`, `category`, `authorId` y, de forma
opcional, `dek`, `editionId`, `tags`, `images`, `heroUrl`, SEO y
`readingMinutes`. `status` solo puede ser `draft` o `review`; el artículo se
guarda siempre oculto (`homepageSlot: hidden`). Las imágenes deben apuntar a
`/media/editorial/` del propio sitio.

## Configuración del secreto

Crear un secreto de alta entropía en Cloudflare Workers/Sites:

```powershell
wrangler secret put CODEX_ARTICLE_API_KEY
```

No guardar el valor en `.env`, Git, prompts, logs ni respuestas. Usar un
secreto distinto de `EDITOR_API_KEY`, `EDITOR_EMAILS` y las claves de newsletter.
Rotación recomendada: generar una clave nueva, actualizar el cliente MCP,
probar `401` con la clave anterior y eliminar la anterior del proveedor.

## Respuestas

- `201`: artículo creado, con `automationScope: draft-review-hidden`.
- `400`: JSON, campos, estado, slug o `Idempotency-Key` inválidos.
- `401`: token ausente o incorrecto.
- `409`: el slug ya existe; tratarlo como deduplicación y no reintentar con el
  mismo contenido sin revisar el artículo existente.
- `413`: cuerpo demasiado grande.
- `415`: `Content-Type` no es JSON.
- `429`: límite de automatización excedido; respetar `Retry-After`.

## Adaptador MCP

El servidor MCP debe exponer una herramienta estrecha, por ejemplo
`create_article_draft`, que solo construya este request. No debe exponer el
secreto como argumento de la herramienta: cargarlo desde el entorno del proceso
MCP. El adaptador tampoco debe ofrecer herramientas para `publish`, `move_hero`,
`delete_article`, newsletters o subscribers.
