# Componentes de Newsletter

- `AdminNewsletter.tsx` implementa el cuarto tab de escritorio de `/admin`:
  Redactar, Enviados, Suscriptores y Configuracion.
- El editor solo produce bloques tipados. La vista previa HTML/texto siempre
  llega de `/api/newsletters/:id/preview`; el navegador no construye el footer.
- Cada cambio invalida la prueba. Enviar exige borrador guardado, revision
  probada y configuracion operativa completa.
- La audiencia usa exclusivamente `emailMasked`. La busqueda exacta viaja por
  `POST /api/subscribers/search` para no poner PII en URLs ni access logs.
- `NewsletterForm.tsx` mantiene honeypot, rate limit y doble opt-in. La respuesta
  publica no distingue correos nuevos, duplicados o invalidos.
