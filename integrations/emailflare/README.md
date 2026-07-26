# EmailFlare privacy fork

Orbita uses EmailFlare only as a delivery adapter. Subscriber consent,
campaigns, and retry state remain in Orbita D1.

## Pinned upstream

- Repository: `https://github.com/0xdps/emailflare`
- Commit: `1fef95577fff9ed8e7ec07f217ac24d468392e80`
- Runtime target: `services/worker` (Cloudflare Workers)

Apply the reviewed patch to a clean checkout at that commit:

```powershell
git clone https://github.com/0xdps/emailflare.git emailflare-orbita
Set-Location emailflare-orbita
git checkout 1fef95577fff9ed8e7ec07f217ac24d468392e80
git apply --check ..\Orbita-Sitio-web\integrations\emailflare\recipient-privacy.patch
git apply ..\Orbita-Sitio-web\integrations\emailflare\recipient-privacy.patch
```

## Privacy contract

The patch makes recipient addresses transient request data:

- D1 stores only `to_masked` and an HMAC-SHA256 `to_hash`.
- API responses return the masked recipient and never echo the address.
- Existing EmailFlare logs are irreversibly redacted by migration `0004`.
- `unsubscribeUrl` is the only added delivery metadata. It produces the
  `List-Unsubscribe` and `List-Unsubscribe-Post` headers.
- The Worker deployment omits the bundled admin SPA. Orbita `/admin` is the
  only editorial frontend.

Set `RECIPIENT_HASH_KEY` as a high-entropy Worker secret. Keep it separate
from Orbita's subscriber blind-index key so a compromise cannot correlate the
two databases.

## Upgrade procedure

1. Fetch upstream and create a branch from the candidate EmailFlare commit.
2. Reapply the patch with `git apply --3way` and resolve conflicts explicitly.
3. Run the EmailFlare Worker typecheck/build and local D1 migrations.
4. Verify `/v1/send` returns only a masked recipient and that `/api/logs`
   contains no `to_address` column.
5. Update the pinned commit here only after the patched deployment passes its
   smoke tests.

