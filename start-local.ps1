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

# =========================
# .env mínimos locales
# =========================
$backendEnvPath = Join-Path $root "backend\.env"
if (-not (Test-Path $backendEnvPath)) {
@"
PUERTO_INTERNO=5174
# Permite front en localhost y 127.0.0.1
FRONT_ORIGEN=http://localhost:5173,http://127.0.0.1:5173

# Mongo local (contenedor mapeado a 27017 del host)
CADENA_MONGO=mongodb://localhost:27017/explora_huelva

# JWT para dev
JWT_SECRETO=un_secreto_super_seguro_para_explora_huelva

# Subidas locales
UPLOAD_DIR=uploads

# Email DEV (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
MAIL_FROM=Explora Huelva <no-reply@explorahuelva.local>

# URL pública para construir enlaces en emails (verificación/reset)
PUBLIC_URL=http://localhost:5173
"@ | Set-Content -Encoding ascii $backendEnvPath
  Write-Host "backend\.env creado"
} else {
  Write-Host "backend\.env ya existe (OK)"
}

$frontendEnvPath = Join-Path $root "frontend\.env"
if (-not (Test-Path $frontendEnvPath)) {
"VITE_API_URL=/api" | Set-Content -Encoding ascii $frontendEnvPath
  Write-Host "frontend\.env creado"
} else {
  Write-Host "frontend\.env ya existe (OK)"
}

# =========================
# Infra: Mongo + (opcional) Mongo Express + MailHog
# =========================
Write-Host "`nLevantando infraestructura (Mongo, MailHog)..."
docker compose up -d mongo | Out-Null

# Mongo Express si existe en tu compose
$services = @()
try { $services = docker compose config --services 2>$null } catch {}
if ($services -contains 'mongo-express') { docker compose up -d mongo-express | Out-Null }
if ($services -contains 'mongo_express') { docker compose up -d mongo_express | Out-Null }

# MailHog (UI de emails en http://localhost:8025)
if ($services -contains 'mailhog' -or $services -contains 'mailhog_explora') {
  docker compose up -d mailhog | Out-Null
} else {
  Write-Host "⚠️  No hay servicio 'mailhog' en docker-compose. Añádelo si quieres ver los emails."
}

# =========================
# Backend local (nueva ventana)
# =========================
$backendCmd = @"
cd `"$($root)\backend`"
if (-not (Test-Path node_modules)) { npm install }
# Si en Windows falla el puerto ocupado, mata proceso previo en 5174:
# FOR /F "tokens=5" %P IN ('netstat -aon ^| findstr :5174 ^| findstr LISTENING') DO taskkill /PID %P /F
npm run dev
"@
Start-Process powershell -ArgumentList "-NoExit","-Command",$backendCmd | Out-Null
Write-Host "Backend iniciado en una nueva ventana (http://localhost:5174)"

# =========================
# Frontend local (nueva ventana)
# =========================
$frontendCmd = @"
cd `"$($root)\frontend`"
if (-not (Test-Path node_modules)) { npm install }
npm run dev
"@
Start-Process powershell -ArgumentList "-NoExit","-Command",$frontendCmd | Out-Null
Write-Host "Frontend iniciado en una nueva ventana (http://localhost:5173)"

# =========================
# Resumen
# =========================
Write-Host ""
Write-Host "Accesos locales:"
Write-Host "  - Frontend:         http://localhost:5173"
Write-Host "  - Backend salud:    http://localhost:5174/api/salud"
if ($services -contains 'mongo-express' -or $services -contains 'mongo_express') {
  Write-Host "  - Mongo Express:    http://localhost:8081"
} else {
  Write-Host "  - Mongo Express:    no definido en docker-compose (opcional)"
}
if ($services -contains 'mailhog' -or $services -contains 'mailhog_explora') {
  Write-Host "  - MailHog (emails): http://localhost:8025"
} else {
  Write-Host "  - MailHog:          no definido en docker-compose"
}
Write-Host ""
Write-Host "Para apagar contenedores:  powershell -NoProfile -ExecutionPolicy Bypass -File .\stop-local.ps1"
