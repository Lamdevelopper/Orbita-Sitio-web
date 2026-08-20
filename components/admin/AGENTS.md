# Componentes administrativos

- `ArticleCatalog.tsx` muestra el catálogo completo y combina búsqueda con
  filtros derivados de los datos (edición/carpeta, autor, categoría, estado y
  ubicación). Las categorías no se deben volver a hardcodear.
- `ArticleEditor.tsx` edita metadatos, etiquetas, SEO e imágenes existentes;
  `authorId` y categoría se eligen explícitamente al crear.
- `AuthorManager.tsx` y `EditionManager.tsx` encapsulan sus formularios y
  listados. Autores cuentan únicamente artículos no archivados; ambos ofrecen
  cancelar durante edición.
- `formatters.ts` es la única fuente de formato es-MX para fecha/hora y fecha
  pura de edición. El input de portada se limpia después de cada selección.
- `types.ts` reexporta los estados/slots del contrato editorial compartido;
  no dupliques arrays ni etiquetas de opciones aquí. Los límites, locale y
  timezone también pertenecen a `lib/editorial-contract.ts`.
- Un artículo nuevo conserva `authorId: null` y `homepageRank: undefined`
  hasta que el editor seleccione autor y posición (undefined significa anexar).
# Componentes administrativos editoriales

- Los formularios consumen limites, defaults, labels, locale y timezone desde
  `lib/editorial-contract.ts`; no duplicar numeros maximos ni enums en JSX.
- `AuthorManager.tsx` y `EditionManager.tsx` son superficies especificas, no un
  formulario generico. Nuevos registros empiezan sin identidad o fecha inventada.
- `ArticleEditor.tsx` preserva imagenes y permite editar tags y SEO; rank vacio
  significa agregar al final.
