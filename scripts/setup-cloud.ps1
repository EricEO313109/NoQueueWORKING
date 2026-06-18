# NutriScan — configure Vercel env (non-interactive)
param(
  [Parameter(Mandatory=$true)][string]$SupabaseUrl,
  [Parameter(Mandatory=$true)][string]$SupabaseAnonKey,
  [Parameter(Mandatory=$true)][string]$SupabaseServiceKey,
  [string]$OpenAiKey = ""
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Add-Env($name, $value) {
  Write-Host "Adding $name ..."
  npx vercel env add $name production --value $value --yes --force
}

Add-Env "SUPABASE_URL" $SupabaseUrl
Add-Env "SUPABASE_ANON_KEY" $SupabaseAnonKey
Add-Env "SUPABASE_SERVICE_ROLE_KEY" $SupabaseServiceKey
Add-Env "VITE_SUPABASE_URL" $SupabaseUrl
Add-Env "VITE_SUPABASE_ANON_KEY" $SupabaseAnonKey
if ($OpenAiKey) { Add-Env "OPENAI_API_KEY" $OpenAiKey }

Write-Host "Redeploying..." -ForegroundColor Green
npx vercel deploy --prod --yes
Write-Host "Done: https://noqueuev2-ochre.vercel.app" -ForegroundColor Green
