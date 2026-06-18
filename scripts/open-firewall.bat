@echo off
title NutriScan - Deschide Firewall
echo.
echo ========================================
echo   NutriScan - deschid portul 5173
echo ========================================
echo.

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Cer permisiuni Administrator...
  powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

netsh advfirewall firewall delete rule name="NutriScan Vite Dev" >nul 2>&1
netsh advfirewall firewall add rule name="NutriScan Vite Dev" dir=in action=allow protocol=TCP localport=5173 profile=private,public

if %errorlevel% equ 0 (
  echo.
  echo [OK] Firewall deschis pentru portul 5173!
  echo.
  echo Acum pe telefon deschide link-ul HTTPS din terminal:
  echo   npm run dev
  echo.
) else (
  echo [EROARE] Nu am putut adauga regula firewall.
)

pause
