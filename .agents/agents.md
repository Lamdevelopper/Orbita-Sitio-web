# Admin access

El /admin usa autenticacion ChatGPT (Sign in with ChatGPT).
La cabecera oai-authenticated-user-email la inyecta Sites/Cloudflare tras autenticacion OAuth.
Solo funciona desplegado en Sites; fuera de ese entorno la cabecera no es confiable.

La variable de entorno EDITOR_EMAILS (comma-separated, definida en Sites) controla que emails pueden acceder.
Es fail-closed: si la variable no existe o esta vacia, NADIE accede.
Maximo de editores configurable via MAX_EDITORS (por defecto 2).
EDITOR_API_KEY existe solo para automatizacion puntual y no otorga acceso editorial general.

## Rutas admin

- /admin - panel editorial (AdminStudio), requiere email en EDITOR_EMAILS
- /admin/post - editor de articulos (PostEditor), requiere email en EDITOR_EMAILS
- /admin/analytics - dashboard de analitica, usa ANALYTICS_OWNER ?? EDITOR_EMAILS

Todas las rutas mutantes del CMS validan Origin (anti-CSRF) ademas de la autenticacion.

## Como agregar un editor

1. Actualizar EDITOR_EMAILS en Sites (via environment variables)
2. Verificar que no exceda MAX_EDITORS (default 2)
3. Desplegar una version nueva para aplicar el cambio de entorno
4. El editor inicia sesion con Sign in with ChatGPT en /admin
