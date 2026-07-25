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
2. Crear un índice temporal desde `HEAD` y quitar de ese índice, sin borrarlos
   del checkout ni de GitHub, únicamente los materiales que no usa el runtime:
   `.hermes/`, `Ediciones_Extraer_articulos/`, `articulos_extraidos/`,
   `output/` y paquetes históricos `orbita-sites-build*.tar.gz`.
3. Crear con `git commit-tree` un commit basado en ese índice y cuyo padre sea
   el SHA remoto.
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
- `EDITOR_API_KEY`: solo para automatización controlada; no exponer al cliente.
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
