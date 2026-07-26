# Newsletter domain helpers

- `newsletter-crypto.ts` usa WebCrypto AES-256-GCM para correo, HMAC-SHA256
  para blind indexes y SHA-256 para tokens. Las claves entran como secretos
  base64 de 32 bytes y nunca se registran.
- `newsletter-model.ts` valida bloques allowlisted, URLs http(s)/locales,
  limites de tamano y transiciones de estados. `toMaskedSubscriberDto` no
  expone ciphertext, nonce, blind index ni correo plano.
- Usa `generateToken` para enlaces y guarda solo `hashToken(token)` en D1.
- Auditoria debe recibir metadatos sanitizados sin correo, tokens, secretos,
  IPs ni credenciales.
- `newsletter-render.ts` es la unica fuente del footer HTML/texto. Los snapshots
  usan `UNSUBSCRIBE_PLACEHOLDER`, reemplazado en memoria por el sender.
- `newsletter-retry.ts` concentra la politica 429/5xx/timeout y el limite de
  cinco intentos para que pueda probarse sin D1 ni red.
