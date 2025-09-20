// backend/src/rutas/salud.ruta.js
// ————————————————————————————————————————————————————
// Ruta de salud/diagnóstico de la API.
// Responde con un pequeño JSON para comprobar que el servicio está vivo.
// Útil para healthchecks de Docker y monitorización básica.
// ————————————————————————————————————————————————————

import { Router } from 'express';

const router = Router();

// GET /api/salud
// - Devuelve ok=true, nombre del servicio, el endpoint y la hora ISO
// - No depende de la base de datos, por lo que es ideal para healthchecks
router.get('/', (_req, res) => {
  res.json({
    ok: true,
    servicio: 'API Explora Huelva',
    endpoint: '/api/salud',
    hora: new Date().toISOString(),
  });
});

export default router;
