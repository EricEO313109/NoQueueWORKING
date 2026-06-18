# NutriScan — one-command deploy + verify (no manual steps)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "`n=== NutriScan Setup ===" -ForegroundColor Cyan

Write-Host "`n[1/3] Building..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "`n[2/3] Deploying to Vercel (production)..." -ForegroundColor Yellow
npx vercel deploy --prod --yes
if ($LASTEXITCODE -ne 0) { exit 1 }

$appUrl = "https://noqueuev2-ochre.vercel.app"
Write-Host "`n[3/3] Health check..." -ForegroundColor Yellow
npm run verify:health -- $appUrl
if ($LASTEXITCODE -ne 0) { exit 1 }

try {
  $setup = Invoke-RestMethod -Uri "$appUrl/api/setup/status" -Method Get
  Write-Host "`nSetup status:" -ForegroundColor Green
  $setup | ConvertTo-Json -Depth 5
  if (-not $setup.migration002) {
    Write-Host "`nOptional: run supabase/migrations/002_nutrition_verification.sql in Supabase SQL Editor" -ForegroundColor Yellow
  }
} catch {
  Write-Host "Setup status endpoint not yet deployed (will work after this deploy propagates)" -ForegroundColor Yellow
}

Write-Host "`n=== DONE ===" -ForegroundColor Green
Write-Host "Open on your phone: $appUrl" -ForegroundColor Cyan
Write-Host "Scan tab -> Pornește camera -> scan barcode or label photo`n"
