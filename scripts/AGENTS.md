# Scripts

`New-SitesDeploymentCommit.ps1` creates a lean Sites deployment commit from a
temporary Git index. It excludes only historical/editorial extraction material
listed in the deployment runbook, preserves the working tree and active index,
and verifies that runtime paths and root manifests/configuration match `HEAD`.

Run it from the repository root with a valid parent commit:

```powershell
./scripts/New-SitesDeploymentCommit.ps1 -ParentSha <commit-sha>
```

## Newsletter migration

`newsletter-migrate.mjs` runs through the local Wrangler binary and never
prints a full address. It defaults to dry-run. `--apply` writes the legacy
backfill; `--rotate --apply` rotates AES ciphertext and blind indexes after a
duplicate preflight. Keep campaign sending disabled throughout either run.
