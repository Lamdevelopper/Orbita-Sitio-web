# Datos editoriales estáticos

`articles.ts` contiene el respaldo que usa la web cuando D1 no responde y la
versión recompuesta del artículo del corazón, cuya extracción tenía un salto de
línea por fragmento. También conserva la portada local del artículo cuántico.
Mantén `Article.body` como secciones con párrafos completos; las imágenes
inline deben apuntar a assets locales o a URLs revisadas por el equipo editorial.
Las historias `en-preparacion` usan `/og.png` como imagen editorial neutral
hasta que exista una portada aprobada; no deben depender de hotlinks de
Unsplash. `editions.ts` deriva `articleSlugs` desde el campo `edition` de los
artículos para que el respaldo mantenga sus conteos sin duplicar listas a mano.
