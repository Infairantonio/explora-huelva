import { Router } from 'express';
import { body } from 'express-validator';
import * as auth from '../controladores/auth.controlador.js';
import autenticacion from '../middleware/autenticacion.js';

const router = Router();

// Puedes dejar este console.log temporal para verificar que sí se importan:
console.log('auth.exports:', Object.keys(auth)); // debería mostrar registrar, iniciarSesion, perfil

router.post(
  '/registrar',
  [
    body('nombre').isString().isLength({ min: 2 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
  ],
  auth.registrar
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').isLength({ min: 1 })],
  auth.iniciarSesion
);

router.get('/perfil', autenticacion, auth.perfil);

export default router;
