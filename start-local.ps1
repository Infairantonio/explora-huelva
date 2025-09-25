# start-local.ps1
$ErrorActionPreference = 'Stop'

# Root del repo
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# Comprobaciones
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker no está instalado o no está en PATH."
}
$null = docker version | Out-Null
$null = docker compose version | Out-Null  # Compose v2

# .env mínimos locales
$backendEnv = Join-Path $root "backend\.env"
if (-not (Test-Path $backendEnv)) {
@"
PUERTO_INTERNO=5174
FRONT_ORIGEN=http://localhost:5173,http://127.0.0.1:5173
CADENA_MONGO=mongodb://localhost:27017/explora
"@ | Set-Content -Encoding ascii $backendEnv
  Write-Host "backend\.env creado"
}

$frontendEnv = Join-Path $root "frontend\.env"
if (-not (Test-Path $frontendEnv)) {
"VITE_API_URL=/api" | Set-Content -Encoding ascii $frontendEnv
  Write-Host "frontend\.env creado"
}

# Servicios definidos en compose
$services = @()
try { $services = docker compose config --services 2>$null } catch {}

# Levantar Mongo y, si existe en compose, mongo-express
Write-Host "Levantando contenedores de base de datos..."
docker compose up -d mongo | Out-Null
if ($services -contains 'mongo-express') { docker compose up -d mongo-express | Out-Null }
if ($services -contains 'mongo_express') { docker compose up -d mongo_express | Out-Null }

# Abrir backend en nueva ventana
$backendCmd = "cd `"$($root)\backend`"; if (-not (Test-Path node_modules)) { npm install }; npm run dev"
Start-Process powershell -ArgumentList "-NoExit","-Command",$backendCmd | Out-Null
Write-Host "Backend iniciado en una nueva ventana (http://localhost:5174)"

# Abrir frontend en nueva ventana
$frontendCmd = "cd `"$($root)\frontend`"; if (-not (Test-Path node_modules)) { npm install }; npm run dev"
Start-Process powershell -ArgumentList "-NoExit","-Command",$frontendCmd | Out-Null
Write-Host "Frontend iniciado en una nueva ventana (http://localhost:5173)"

# Resumen
Write-Host ""
Write-Host "Accesos locales:"
Write-Host "  - Frontend:  http://localhost:5173"
Write-Host "  - Backend:   http://localhost:5174/api/salud"
if ($services -contains 'mongo-express' -or $services -contains 'mongo_express') {
  Write-Host "  - Mongo Express: http://localhost:8081"
} else {
  Write-Host "  - Mongo Express: no definido en docker-compose (opcional)"
}
Write-Host ""
Write-Host "Para apagar contenedores:  powershell -NoProfile -ExecutionPolicy Bypass -File .\stop-local.ps1"
