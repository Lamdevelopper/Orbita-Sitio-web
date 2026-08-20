# Archivo de artículos

- `[slug]/page.tsx` resuelve cada artículo mediante `getArticle`, por lo que la
  metadata y el contenido usan CMS cuando D1 está disponible y datos estáticos
  como respaldo.
- Los artículos CMS sin edición vinculada tienen `edition: ""`; no deben crear
  enlaces a `/ediciones/` ni conservar el placeholder histórico
  `en-preparacion`.
- Los artículos CMS sin autor enlazable se muestran como texto, mientras que
  los que tienen `authors.slug` enlazan a `/autores#<slug>`.
- `generateMetadata` respeta `seoTitle`/`seoDescription` del CMS y usa título,
  bajada e imagen del artículo como fallback.
