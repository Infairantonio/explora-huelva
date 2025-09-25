# stop-local.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker no está instalado o no está en PATH."
}

Write-Host "Apagando contenedores (docker compose down)..."
docker compose down
Write-Host "Contenedores detenidos."
