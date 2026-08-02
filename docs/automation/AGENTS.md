# Automatizacion editorial

Esta carpeta documenta el contrato de `POST /api/automation/articles` para un
cliente Codex/MCP. El endpoint es deliberadamente de baja autoridad: crea
`draft`/`review` ocultos y deja la publicación y la portada a un editor humano.
Mantener el secreto fuera del repositorio y actualizar esta guía cuando cambie
el contrato, el límite o el nombre del secret.
