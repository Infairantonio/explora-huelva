import { Router } from 'express';
const router = Router();

router.get('/', (_req, res) => {
  res.json({
    ok: true,
    servicio: 'API Explora Huelva',
    endpoint: '/api/salud',
    hora: new Date().toISOString()
  });
});

export default router;
