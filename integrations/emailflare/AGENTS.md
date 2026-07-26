# EmailFlare integration

This directory pins and patches the separate EmailFlare Worker used by Orbita.

- Never vendor secrets, Cloudflare resource IDs, or a generated API key.
- `recipient-privacy.patch` must apply cleanly to the commit in `README.md`.
- Recipient addresses may exist only in request memory during delivery. Do not
  add them back to D1, responses, errors, or the EmailFlare admin bundle.
- Keep the public API limited to `/v1/send` and `/health` for this deployment.
- Re-run patch application and Worker typechecking for every upstream update.

