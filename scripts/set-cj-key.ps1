# Stores the CJ API key in the git-ignored .env and in GitHub Actions secrets.
# The key is read with hidden input and never printed.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$secure = Read-Host -AsSecureString 'Paste CJ API key (hidden), then Enter'
$key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
if ([string]::IsNullOrWhiteSpace($key)) { Write-Host 'No key entered; nothing changed.'; exit 1 }

$envPath = Join-Path (Get-Location) '.env'
$lines = @()
if (Test-Path $envPath) { $lines = Get-Content $envPath | Where-Object { $_ -notmatch '^\s*CJ_API_KEY\s*=' } }
$lines += "CJ_API_KEY=$key"
Set-Content -Path $envPath -Value $lines -Encoding utf8

$key | gh secret set CJ_API_KEY -R arknodel/PetDropshipping
$key = $null
Write-Host 'Saved CJ_API_KEY to .env (git-ignored) and GitHub secrets. You can close this tab.'
