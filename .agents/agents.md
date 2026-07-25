# Admin access

El /admin usa autenticacion ChatGPT (Sign in with ChatGPT). 
La cabecera oai-authenticated-user-email la inyecta Sites/Cloudflare tras autenticacion OAuth.
La variable de entorno EDITOR_EMAILS (comma-separated, definida en Sites) controla que emails pueden acceder.
El fallback en codigo es lamoyi.matias@gmail.com si la variable no existe.

## Rutas admin

- /admin - panel editorial (AdminStudio), requiere email en EDITOR_EMAILS
- /admin/post - editor de articulos, requiere email en EDITOR_EMAILS
- /admin/analytics - dashboard de analitica, hardcodeado a lamoyi.matias@gmail.com en ANALYTICS_OWNER

## Como agregar un editor

1. Actualizar EDITOR_EMAILS en Sites (via update_environment_variables)
2. Desplegar una version nueva para aplicar el cambio de entorno
3. El editor inicia sesion con Sign in with ChatGPT en /admin
