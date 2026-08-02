# Órbita en Sites: despliegue y recuperación

Este documento es el runbook operativo de `orbitadivulgacion.com`. El sitio se
ejecuta como un Worker de Cloudflare generado por vinext y publicado mediante
Sites. D1 guarda el CMS y R2 guarda medios.

## Incidente del 25 de julio de 2026

Síntoma: la portada devolvía Cloudflare `Error 1101` y el Worker terminaba con
una excepción durante `GET /` (Ray ID reportado: `a2079e88a86df08a`).

Causa raíz: la versión activa asumía que `cmsEditions()` siempre devolvía una
edición y accedía a `current.articleSlugs`, `current.number` y otras propiedades
cuando `current` era `undefined`. D1 podía responder correctamente con una lista
vacía, por lo que la excepción ocurría después de la consulta y escapaba hasta
Cloudflare.

Corrección:

- `app/page.tsx` usa la lectura resiliente de ediciones y renderiza el bloque de
  edición solo cuando existe una edición.
- `lib/content.ts` usa los datos estáticos cuando el CMS está vacío o no está
  disponible.
- `lib/cms.ts` ordena primero la edición marcada como actual.
- `lib/rate-limit.ts` no crea timers en el ámbito global del Worker y limita el
  tamaño de su mapa en memoria.
- El CMS falla cerrado si falta `EDITOR_EMAILS`, el preview escapa contenido y
  las imágenes se validan por tipo permitido y firma binaria.
- La prueba editorial lee los artículos desde `data/articles.ts`, su ubicación
  actual después de la separación de datos estáticos.
- La revisión posterior al despliegue detectó que las funciones del CMS estaban
  reexportadas pero no importadas localmente en `lib/content.ts`; el fallback
  ocultaba el error. Ahora las lecturas resilientes usan bindings reales y una
  prueba evita que reaparezca.

## Política de fallos

La portada y las páginas públicas deben seguir disponibles si D1 falla o está
vacío. En ese caso se muestra el archivo editorial estático incluido en el
build. Las operaciones de escritura del CMS sí deben fallar de forma explícita
con `503`; nunca deben fingir que una escritura tuvo éxito.

No se deben ejecutar timers, consultas ni otras operaciones ligadas a una
petición al cargar módulos del Worker. Esas operaciones van dentro del handler
o se realizan de forma perezosa durante una petición.

## Validación antes de publicar

Usar Node 22 o superior y ejecutar desde la raíz:

```powershell
npm ci
npm run lint
npm test
git status --short
```

`npm test` debe completar el build de vinext y la prueba editorial. Antes de
publicar también se debe confirmar que existen:

- `dist/server/index.js`
- `dist/.openai/hosting.json`
- `dist/.openai/drizzle/` cuando hay migraciones

No usar `git add -A` en una recuperación: puede incluir capturas, archivos de
prueba o paquetes `.tar.gz`. Preparar únicamente los archivos revisados.

## Publicación estándar

1. Ejecutar todas las validaciones anteriores.
2. Crear un commit con exactamente el código validado y subirlo a `origin`.
3. Generar el archivo de Sites con `sites-hosting/scripts/package-site.sh`.
   El script empaqueta `dist`, la configuración de hosting y las migraciones.
4. Guardar una nueva versión en el proyecto definido por
   `.openai/hosting.json`, usando el SHA del commit y el archivo generado.
5. Publicar esa versión y esperar hasta que Sites reporte `succeeded`.
6. Ejecutar las pruebas de humo de la sección siguiente.

El SHA entregado a Sites y el código usado para crear el archivo deben ser el
mismo. No reutilizar archivos de versiones anteriores.

### Cuando el historial no cabe en el remoto de Sites

El historial de este repositorio contiene adjuntos y PDFs grandes de etapas
anteriores. Si el `push` del historial completo termina con `HTTP 500`, no
reescribir ni forzar la rama de GitHub. Crear un commit de despliegue compacto:

1. Obtener el SHA actual de `refs/heads/main` en el remoto de Sites.
2. Ejecutar `./scripts/New-SitesDeploymentCommit.ps1 -ParentSha <sha-remoto>`.
   El script crea un índice temporal y excluye, sin borrarlos del checkout ni
   de GitHub, `.hermes/`, `Ediciones_Extraer_articulos/`,
   `articulos_extraidos/`, `output/` y paquetes históricos
   `orbita-sites-build*.tar.gz`.
3. Tomar el SHA compacto que imprime el script; este ya verificó las rutas de
   runtime contra `HEAD`.
4. Subir ese commit a `main` de Sites con la credencial temporal entregada por
   el proyecto.
5. Verificar con `ls-remote` que Sites apunta al commit compacto.
6. Usar el SHA compacto al guardar la versión y el archivo construido desde el
   mismo árbol.

Este procedimiento conserva todo el historial en GitHub y transfiere a Sites
solo la diferencia necesaria. Antes de publicar, comprobar que no exista diff
entre `HEAD` y el commit compacto para las rutas de runtime: `.openai`, `app`,
`build`, `components`, `data`, `db`, `drizzle`, `lib`, `public`, `tests`,
`worker`, archivos de configuración y manifiestos de paquetes.

## Pruebas de humo

```powershell
$paths = '/', '/articulos', '/ediciones', '/autores', '/rss.xml', '/robots.txt'
foreach ($path in $paths) {
  $response = Invoke-WebRequest "https://orbitadivulgacion.com$path" -TimeoutSec 30
  "{0} {1}" -f $response.StatusCode, $path
}
```

Resultado esperado: `200` en todas las rutas. Verificar además en navegador:

- La portada carga la historia principal y la edición, o degrada sin error si
  no hay edición en D1.
- Un artículo abre y muestra texto e imágenes.
- `/admin` no permite escrituras a usuarios no autorizados.
- Una imagen servida desde `/media/...` carga correctamente.

Después de las pruebas, revisar los logs recientes del Worker y confirmar que
no aparezcan invocaciones con `outcome: exception`.

## Diagnóstico de Error 1101

1. Anotar Ray ID, hora UTC, método y ruta afectada.
2. Consultar los logs del Worker del proyecto de `.openai/hosting.json` en una
   ventana que incluya esa hora.
3. Distinguir entre fallo de inicio y fallo de ruta: si assets o rutas 404
   responden, pero `/` falla, el Worker inició y la excepción está en el render.
4. Reproducir con el mismo estado límite: D1 vacío, binding ausente o entidad
   actual inexistente.
5. Corregir, agregar una prueba de regresión, construir una nueva versión y
   publicar. No sobrescribir una versión existente.

Los mensajes de React Server Components se ocultan en producción. Para obtener
una causa útil, registrar errores en el servidor con contexto de ruta y sin
datos personales, cookies, tokens ni contenido editorial sensible.

## Rollback

Si la versión nueva falla:

1. Detener nuevas publicaciones.
2. Seleccionar la última versión de Sites que pasó las pruebas de humo.
3. Publicar de nuevo ese `version_id`; no hace falta reconstruirlo.
4. Confirmar `succeeded`, repetir las pruebas de humo y revisar logs.
5. Abrir un incidente con Ray ID, versión, SHA, hora y rutas afectadas.

El rollback restaura código y assets. No revierte cambios de D1; las migraciones
deben ser compatibles hacia atrás o incluir un procedimiento de recuperación
de datos probado.

## Configuración y secretos

`.openai/hosting.json` solo contiene el `project_id` y los nombres lógicos de
los bindings `DB` y `MEDIA`. Los valores operativos se administran en Sites.

- `EDITOR_EMAILS`: lista de editores autorizados, separada por comas.
- `ANALYTICS_OWNER`: propietarios del panel de analítica, separados por comas;
  si no existe, se usa la lista de `EDITOR_EMAILS`.
- `EDITOR_API_KEY`: legado; no usarlo para la API de Codex.
- `CODEX_ARTICLE_API_KEY`: secreto separado para `POST /api/automation/articles`.
  Solo permite crear `draft`/`review` ocultos; no debe compartirse con el
  frontend, el admin humano ni las rutas de newsletter.
- `DB`: binding D1 del CMS.
- `MEDIA`: binding R2 de imágenes.

Nunca guardar tokens, credenciales temporales, cookies ni archivos `.env` en
Git. La autorización editorial debe fallar de forma cerrada si falta su
configuración de producción.

## Criterios de salida a producción

- Build, lint y pruebas pasan desde un checkout limpio.
- La versión publicada corresponde al SHA validado.
- Portada y rutas críticas responden `200` con D1 disponible y en el escenario
  de fallback.
- Las migraciones están incluidas y la edición actual está definida en el CMS.
- No hay excepciones nuevas en logs después de las pruebas de humo.
- Existe una versión anterior conocida y se probó el procedimiento de rollback.

## Newsletter: arquitectura y despliegue

Newsletter tiene tres unidades independientes. Sites sirve el sitio y `/admin`;
D1 conserva consentimiento, campañas y entregas; el Worker programado procesa
hasta 50 entregas por minuto. El fork de EmailFlare solo entrega correo y no es
la base de suscriptores. No habilitar las tres piezas en un mismo paso.

### Secretos y variables

Configurar en Sites y, cuando aplique, en el Worker programado:

- `NEWSLETTER_ENABLED=false` durante migración y pruebas.
- `NEWSLETTER_ENCRYPTION_KEY`: clave AES actual, base64 de 32 bytes.
- `NEWSLETTER_ENCRYPTION_KEYS`: mapa JSON opcional por versión para rotación.
- `NEWSLETTER_KEY_VERSION`: versión entera para cifrar nuevas filas.
- `NEWSLETTER_INDEX_KEY`: HMAC base64 de 32 bytes, distinto de AES.
- `NEWSLETTER_TOKEN_KEY`: secreto exclusivo del sender para tokens de baja.
- `NEWSLETTER_FROM_EMAIL`, inicialmente `newsletter@orbitadivulgacion.com`.
- `NEWSLETTER_FROM_NAME` y `NEWSLETTER_REPLY_TO`.
- `NEWSLETTER_FROM_VERIFIED=true` solo después de validar el dominio.
- `EMAILFLARE_BASE_URL` y `EMAILFLARE_API_KEY` limitada al dominio.
- `NEWSLETTER_PUBLIC_BASE_URL=https://orbitadivulgacion.com` en el sender.

Generar cada clave de 32 bytes con un CSPRNG. No reutilizar material entre AES,
blind index, tokens o `RECIPIENT_HASH_KEY` de EmailFlare.

### Migración D1 en dos fases

1. Confirmar `NEWSLETTER_ENABLED=false` en Sites y sender.
2. Hacer backup de D1 y aplicar `drizzle/0004_secure_newsletter.sql`. Esta fase
   conserva plaintext únicamente en `subscribers_legacy_0004`.
3. Configurar localmente `NEWSLETTER_D1_DATABASE`, claves y versión. Ejecutar
   `npm run newsletter:migrate` para preflight y luego
   `npm run newsletter:migrate -- --apply`.
4. Exigir el mensaje `0 campos faltantes` y verificar conteo legacy/nuevo,
   `COUNT(DISTINCT email_blind_index)` y estado `needs_reconfirmation`.
5. Mantener la tabla legacy durante la ventana de observación. Esos contactos
   no participan en campañas hasta confirmar de nuevo.
6. Solo con reconciliación y backup comprobados, aplicar
   `drizzle/0005_drop_legacy_subscribers.sql`.

### EmailFlare y sender

1. Clonar EmailFlare en repositorio separado al commit fijado en
   `integrations/emailflare/README.md` y validar `recipient-privacy.patch` con
   `git apply --check` antes de aplicarlo.
2. Ejecutar migraciones y typecheck del fork. Configurar `RECIPIENT_HASH_KEY`,
   desactivar el panel público y crear primero una key de prueba de dominio.
3. Probar que `/v1/send` devuelve máscara, no destinatario, y que los logs D1
   no contienen `to_address`.
4. Copiar `wrangler.newsletter-sender.example.jsonc` fuera del control de
   versiones, completar el ID de D1 compartido y desplegar el Worker cron.
5. Dejar su flag en `false` hasta terminar SPF, DKIM y DMARC. Luego enviar una
   prueba a cada editor, habilitar un piloto pequeño y revisar rebotes/errores.

### Pruebas de humo de Newsletter

Ejecutar `npm run test:newsletter`, lint y build. Con envío todavía pausado:

- alta nueva y duplicada devuelven el mismo cuerpo genérico;
- honeypot y cuarta solicitud en 15 minutos no crean actividad útil;
- confirmación activa una sola fila y la baja GET/POST es idempotente;
- `/admin` solo muestra `emailMasked` y buscar no pone el correo en la URL;
- editar después de probar vuelve a bloquear Enviar;
- preview HTML/texto siempre contiene domicilio, privacidad, contacto, vista web
  y baja;
- un envío repetido con la misma Idempotency-Key no duplica entregas;
- simular 401/403 sin retry y 429/502/timeout con backoff hasta cinco intentos.

### Pausa, rollback y rotación

Para detener envíos, poner `NEWSLETTER_ENABLED=false` en Sites y sender y
revocar la key de EmailFlare. No borrar campañas, consentimientos ni entregas:
quedan disponibles para diagnóstico o reanudación idempotente. El rollback de
Sites no revierte D1.

Para rotar AES o blind index, pausar ambos runtimes, conservar claves AES
anteriores en `NEWSLETTER_ENCRYPTION_KEYS`, subir `NEWSLETTER_KEY_VERSION` y
ejecutar primero `npm run newsletter:migrate -- --rotate` y después con
`--rotate --apply`. Verificar versión e índices únicos, actualizar los secretos
de runtime, probar descifrado/envío y solo entonces retirar la clave AES vieja.
