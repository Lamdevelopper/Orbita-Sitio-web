# Database newsletter

- `schema.ts` define las tablas editoriales y el modelo privado de newsletter.
- `subscribers` no guarda correo plano: usa ciphertext, nonce, blind index,
  mascara y `keyVersion`. Los campos cifrados son nullable solo para filas
  heredadas con `needs_reconfirmation` mientras termina el backfill de app.
- `subscriberTokens` solo persiste hashes SHA-256; nunca se guarda el token
  entregado al usuario.
- `newsletterCampaigns.content` debe pasar por `validateNewsletterContent`;
  las entregas y el audit trail no deben incluir PII.
- `drizzle/0004_secure_newsletter.sql` conserva temporalmente la tabla antigua
  como `subscribers_legacy_0004`, fuera del esquema TypeScript. D1/SQLite no
  puede cifrar el correo en SQL: el backfill de aplicacion debe leer esa fuente,
  cifrar con WebCrypto, llenar los cuatro campos de correo y eliminar la fuente
  legacy despues de verificar la reconciliacion.
- `drizzle/0005_drop_legacy_subscribers.sql` es fase 2 destructiva: solo se
  aplica despues de que `newsletter:migrate -- --apply` verifique conteos,
  campos completos y blind indexes unicos.
- `newsletter_rate_limits` persiste un HMAC de la IP, nunca la IP original.
