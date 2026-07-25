# Scripts

`New-SitesDeploymentCommit.ps1` creates a lean Sites deployment commit from a
temporary Git index. It excludes only historical/editorial extraction material
listed in the deployment runbook, preserves the working tree and active index,
and verifies that runtime paths and root manifests/configuration match `HEAD`.

Run it from the repository root with a valid parent commit:

```powershell
./scripts/New-SitesDeploymentCommit.ps1 -ParentSha <commit-sha>
```
