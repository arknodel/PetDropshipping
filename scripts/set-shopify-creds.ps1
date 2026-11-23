# Stores Shopify Dev Dashboard app credentials (Fondly Pet Ops) in the git-ignored .env
# and in GitHub Actions secrets. Values are read with hidden input and never printed.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$repo = 'arknodel/PetDropshipping'
$domain = 'fondlypet-store.myshopify.com'

function Read-Hidden([string]$prompt) {
  $s = Read-Host -AsSecureString $prompt
  [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}

Write-Host 'Dev Dashboard > Fondly Pet Ops > Settings > Credentials: use the copy buttons.'
if ($args -contains '-Typed') {
  $id = Read-Hidden 'Paste Client ID (hidden), then Enter'
  $secret = Read-Hidden 'Paste Client secret (hidden), then Enter'
} else {
  # Clipboard mode: works where pasting into a hidden prompt does not. Nothing is echoed.
  Add-Type -AssemblyName System.Windows.Forms
  Read-Host 'Click the copy button next to Client ID, then press Enter here' | Out-Null
  $id = [Windows.Forms.Clipboard]::GetText()
  Read-Host 'Click the copy button next to Client secret, then press Enter here' | Out-Null
  $secret = [Windows.Forms.Clipboard]::GetText()
  [Windows.Forms.Clipboard]::Clear()
  if ($id -eq $secret) { Write-Host 'Both reads were identical (clipboard did not change). Nothing changed.'; exit 1 }
}
$id = "$id".Trim(); $secret = "$secret".Trim()
Write-Host ("Received Client ID length {0}, Client secret length {1} (values not shown)." -f $id.Length, $secret.Length)
if ($id.Length -lt 20 -or $secret.Length -lt 20) {
  Write-Host 'Too short: the paste did not go through. Try right-click to paste (or Ctrl+Shift+V). Nothing changed.'
  exit 1
}

$envPath = Join-Path (Get-Location) '.env'
$lines = @()
if (Test-Path $envPath) {
  $lines = @(Get-Content $envPath | ForEach-Object { $_.TrimStart([char]0xFEFF) } |
    Where-Object { $_ -notmatch '^\s*SHOPIFY_(STORE_DOMAIN|CLIENT_ID|CLIENT_SECRET)\s*=' })
}
$lines += "SHOPIFY_STORE_DOMAIN=$domain"
$lines += "SHOPIFY_CLIENT_ID=$id"
$lines += "SHOPIFY_CLIENT_SECRET=$secret"
[IO.File]::WriteAllLines($envPath, [string[]]$lines, (New-Object Text.UTF8Encoding $false))

$domain | gh secret set SHOPIFY_STORE_DOMAIN -R $repo
$id | gh secret set SHOPIFY_CLIENT_ID -R $repo
$secret | gh secret set SHOPIFY_CLIENT_SECRET -R $repo
$id = $null; $secret = $null
Write-Host 'Saved SHOPIFY_STORE_DOMAIN / CLIENT_ID / CLIENT_SECRET to .env (git-ignored) and GitHub secrets. You can close this tab.'
