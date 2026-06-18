$ErrorActionPreference = "SilentlyContinue"

function Get-LanIp {
  $addrs = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -notlike "169.254.*" -and
      $_.PrefixOrigin -ne "WellKnown"
    }

  $wifi = $addrs | Where-Object { $_.InterfaceAlias -match "Wi-?Fi|Wireless|WLAN" } | Select-Object -First 1
  if ($wifi) { return $wifi.IPAddress }

  $eth = $addrs | Where-Object { $_.InterfaceAlias -match "Ethernet" } | Select-Object -First 1
  if ($eth) { return $eth.IPAddress }

  return ($addrs | Sort-Object InterfaceMetric | Select-Object -First 1).IPAddress
}

$ip = Get-LanIp
$port = 5173

try {
  $existing = netsh advfirewall firewall show rule name="NutriScan Vite Dev" 2>$null
  if (-not $existing) {
    netsh advfirewall firewall add rule name="NutriScan Vite Dev" dir=in action=allow protocol=TCP localport=$port | Out-Null
    Write-Host "[OK] Regula firewall adaugata pentru portul $port" -ForegroundColor Green
  }
} catch {
  Write-Host "[!] Nu am putut deschide firewall-ul. Ruleaza scriptul ca Administrator sau permite manual portul $port." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NutriScan — acces de pe telefon" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Telefonul si PC-ul trebuie pe ACELASI Wi-Fi" -ForegroundColor Gray
Write-Host "2. Pe telefon deschide in browser:" -ForegroundColor Gray
Write-Host ""

if ($ip) {
  Write-Host "   https://${ip}:${port}" -ForegroundColor Green -BackgroundColor Black
} else {
  Write-Host "   https://IP-UL-PC-ului:${port}" -ForegroundColor Yellow
  Write-Host "   (IP-ul apare si in output-ul Vite mai jos)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "3. Daca IP-ul local NU merge (firewall):" -ForegroundColor Gray
Write-Host "   npm run dev:phone" -ForegroundColor Yellow
Write-Host "   (genereaza link public HTTPS — merge pe orice retea)" -ForegroundColor Gray
Write-Host ""
Write-Host "   SAU ruleaza ca Administrator:" -ForegroundColor Gray
Write-Host "   scripts\open-firewall.bat" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Chrome: Avansat -> Continua" -ForegroundColor Gray
Write-Host "   Safari: Afiseaza detalii -> viziteaza site-ul" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Permite accesul la camera cand cere aplicatia" -ForegroundColor Gray
Write-Host ""
Write-Host "Pornesc serverul..." -ForegroundColor Cyan
Write-Host ""

Set-Location (Split-Path $PSScriptRoot -Parent)
npm run dev -- --host 0.0.0.0 --port $port
