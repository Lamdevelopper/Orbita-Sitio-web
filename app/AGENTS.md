# Rutas publicas de la aplicacion

`page.tsx` usa la instantanea del CMS y el archivo editorial estatico como
respaldo. La portada respeta un `hero` configurado; si falta, elige de forma
determinista el articulo publico de menor slot/rank y deja el slug como
desempate, antes de usar un articulo estatico marcado `featured`. No dependas
del orden incidental de los arrays para elegir la historia principal.

Las rutas `/ediciones` y `/ediciones/[slug]` usan `getEditions`, `getEdition` y
`getArticles` para conservar el fallback estático cuando D1 no responde; no
deben importar las consultas CMS directas para renderizado público.
