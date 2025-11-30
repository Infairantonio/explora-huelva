// backend/src/rutas/salud.ruta.js
// ————————————————————————————————————————————————————
// Ruta de salud/diagnóstico de la API.
// Devuelve un JSON mínimo para comprobar que el servicio está operativo.
// Ideal para healthchecks de Docker, monitorización y load balancers.
// ————————————————————————————————————————————————————

import { Router } from 'express';

const router = Router();

// GET /api/salud
router.get('/', (_req, res) => {
  res.json({
    ok: true,
    servicio: 'API Explora Huelva',
    endpoint: '/api/salud',
    hora: new Date().toISOString(),
  });
});

export default router;
