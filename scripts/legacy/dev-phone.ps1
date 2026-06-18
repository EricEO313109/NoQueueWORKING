$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Stop-Port5173 {
  Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue |
    Select-Object OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NutriScan - mod telefon (tunel HTTPS)" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Stop-Port5173

$env:MOBILE_TUNNEL = "1"
$npm = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { "npm.cmd" } else { "npm" }

Write-Host "Pornesc serverul..." -ForegroundColor Gray
$vite = Start-Process -FilePath $npm -ArgumentList "exec", "vite", "--", "--host", "127.0.0.1" -PassThru -NoNewWindow -WorkingDirectory $root

$deadline = (Get-Date).AddSeconds(25)
while ((Get-Date) -lt $deadline) {
  if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { break }
  Start-Sleep -Milliseconds 400
}

if (-not (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue)) {
  Write-Host "[EROARE] Serverul nu a pornit." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  PE TELEFON: deschide URL-ul de jos" -ForegroundColor White
Write-Host "  (HTTPS public - merge fara firewall)" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

try {
  npx --yes cloudflared tunnel --url http://127.0.0.1:5173
} finally {
  if ($vite -and -not $vite.HasExited) {
    Stop-Process -Id $vite.Id -Force -ErrorAction SilentlyContinue
  }
}
