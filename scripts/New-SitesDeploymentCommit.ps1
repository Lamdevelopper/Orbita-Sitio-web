[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$ParentSha
)

$ErrorActionPreference = 'Stop'
$repoRoot = (git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoRoot)) {
    throw 'Unable to locate the Git repository root.'
}
Set-Location -LiteralPath $repoRoot

function Invoke-Git {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    $result = & git @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed:`n$($result -join [Environment]::NewLine)"
    }
    return $result
}

$previousIndex = $env:GIT_INDEX_FILE
$tempIndex = Join-Path ([IO.Path]::GetTempPath()) ("orbita-sites-index-{0}" -f [Guid]::NewGuid().ToString('N'))
$runtimePathspec = @(
    '.openai', 'app', 'build', 'components', 'data', 'db', 'drizzle',
    'lib', 'public', 'tests', 'worker',
    ':(top,glob)package*.json',
    ':(top)components.json',
    ':(top,glob)tsconfig*.json',
    ':(top,glob)*.config.*',
    ':(top,glob)wrangler*.json*',
    ':(top,glob)wrangler*.toml'
)

try {
    Invoke-Git @('rev-parse', '--verify', "$ParentSha^{commit}") | Out-Null
    $env:GIT_INDEX_FILE = $tempIndex

    Invoke-Git @('read-tree', 'HEAD') | Out-Null
    Invoke-Git @(
        'rm', '--cached', '--ignore-unmatch', '-r', '--',
        '.hermes', 'Ediciones_Extraer_articulos', 'articulos_extraidos', 'output',
        ':(top,glob)orbita-sites-build*.tar.gz'
    ) | Out-Null

    $treeSha = (Invoke-Git @('write-tree')).Trim()
    $compactSha = (Invoke-Git @('commit-tree', $treeSha, '-p', $ParentSha, '-m', 'chore: create lean Sites deployment commit')).Trim()
    if ($compactSha -notmatch '^[0-9a-f]{40}$') {
        throw "git commit-tree returned an invalid commit SHA: $compactSha"
    }

    $diff = & git diff --quiet HEAD $compactSha -- @runtimePathspec 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Runtime/config paths differ between HEAD and compact commit ${compactSha}:`n$($diff -join [Environment]::NewLine)"
    }

    Write-Output "Compact commit: $compactSha"
    Write-Output 'Runtime/config verification: PASS (no diff against HEAD)'
}
finally {
    if ($null -eq $previousIndex) {
        Remove-Item Env:GIT_INDEX_FILE -ErrorAction SilentlyContinue
    }
    else {
        $env:GIT_INDEX_FILE = $previousIndex
    }
    Remove-Item -LiteralPath $tempIndex -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath "$tempIndex.lock" -Force -ErrorAction SilentlyContinue
}
