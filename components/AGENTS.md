# Componentes de Newsletter

- `AdminNewsletter.tsx` implementa el cuarto tab de escritorio de `/admin`:
  Redactar, Enviados, Suscriptores y Configuracion.
- El editor solo produce bloques tipados. La vista previa HTML/texto siempre
  llega de `/api/newsletters/:id/preview`; el navegador no construye el footer.
- Cada cambio invalida la prueba. Enviar exige borrador guardado, revision
  probada y configuracion operativa completa.
- UX de borradores: `contentEmpty()` evita el autosave con contenido vacio;
  la insignia muestra "Sin probar" (neutral) mientras se edita y solo alerta
  al intentar enviar sin prueba. "Enviar prueba" y "Enviar" guardan el
  borrador pendiente antes de actuar.
- La audiencia usa exclusivamente `emailMasked`. La busqueda exacta viaja por
  `POST /api/subscribers/search` para no poner PII en URLs ni access logs.
- `NewsletterForm.tsx` mantiene honeypot, rate limit y doble opt-in. La respuesta
  publica no distingue correos nuevos, duplicados o invalidos.

# AdminStudio (panel editorial)

- `AdminStudio.tsx` es el panel principal de `/admin` (Articulos, Autores,
  Ediciones, Newsletter). El header tiene "Importacion automatica" que abre
  `/admin/post` y "Guia para importar" que abre el PDF del escritor.
- El listado administrativo pagina `/api/articles?scope=all` en bloques de 500
  hasta `pagination.hasMore=false`; no truncar el archivo editorial tras una
  mutacion. La API sigue acotando cada respuesta publica.
- `/admin/post` (PostEditor) requiere autenticacion ChatGPT + `EDITOR_EMAILS`
  y permite cargar `.txt`/`.md`, previsualizar el parseo y guardar el borrador.

## Catálogo editorial modular

- `AdminStudio.tsx` coordina carga, mutaciones y tabs; la gestión de artículos
  vive en `admin/ArticleCatalog.tsx` y `admin/ArticleEditor.tsx`.
- `ArticleCatalog` combina filtros por texto, edición/carpeta (incluye Todas y
  Sin edición), autor, estado y ubicación. El editor solo aparece al crear o
  editar para mantener el catálogo despejado.
- `admin/types.ts` centraliza los tipos del contrato actual sin cambiar el
  esquema ni las APIs, incluyendo estados, ubicaciones y etiquetas compartidas.
- La posición del catálogo se guarda al salir del campo o pulsar Enter; no se
  debe disparar una mutación de placement por cada tecla. Enter + blur se
  deduplican y `AdminStudio` serializa las mutaciones de placement.
- En Autores, `Ver artículos` navega al catálogo con el autor preseleccionado;
  el mismo catálogo ofrece editar cada artículo relacionado.
- `AuthorManager.tsx` y `EditionManager.tsx` contienen el CRUD de sus tabs; el
  coordinador conserva únicamente carga, mutaciones y estado de navegación.
- Las fábricas de formularios no inventan autor, categoría, área ni fecha:
  requieren selección explícita y proponen únicamente el siguiente número de
  edición. Los formateadores administrativos viven en `admin/formatters.ts` y
  consumen locale/timezone del contrato editorial.
