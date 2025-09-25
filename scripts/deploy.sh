#!/usr/bin/env bash
set -euo pipefail

# Ir a la raíz del repo (por si lo lanzas desde otra carpeta)
cd "$(dirname "$0")/.."

echo "🔄 Levantando producción…"
docker compose -f docker-compose.prod.yml up -d --build

echo "🧹 Limpieza de imágenes colgantes…"
docker image prune -f >/dev/null || true

echo "✅ Despliegue listo."
