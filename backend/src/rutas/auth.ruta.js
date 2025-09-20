// backend/src/rutas/auth.ruta.js
// ————————————————————————————————————————————————————
// Rutas de autenticación: registro, login y perfil.
// Comentado y con mejoras suaves (mensajes de validación, normalización de input
// y manejador de errores de express-validator). Mantiene el contrato actual.
// ————————————————————————————————————————————————————

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import * as auth from '../controladores/auth.controlador.js';
// ATENCIÓN a la ruta del middleware: en tu proyecto tienes tanto "middleware" como "middlewares".
// Asegúrate de que el path coincida con la carpeta real.
import autenticacion from '../middleware/autenticacion.js';

const router = Router();

// (Solo para depuración temporal) — recuerda quitarlo en prod
console.log('auth.exports:', Object.keys(auth)); // debería mostrar registrar, iniciarSesion, perfil

// ——— Utilidad local: manejador de resultados de validación ———
const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ ok: false, errores: errores.array() });
  }
  next();
};

// ——— Reglas de validación ———
const reglaNombre = body('nombre')
  .isString().withMessage('Nombre inválido')
  .trim()
  .isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener 2-80 caracteres');

const reglaEmail = body('email')
  .isEmail().withMessage('Email no válido')
  .normalizeEmail();

const reglaPasswordRegistro = body('password')
  .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres');

const reglaPasswordLogin = body('password')
  .isLength({ min: 1 }).withMessage('La contraseña es obligatoria');

// ——— Endpoints ———
router.post(
  '/registrar',
  [reglaNombre, reglaEmail, reglaPasswordRegistro, validar],
  auth.registrar
);

router.post(
  '/login',
  [reglaEmail, reglaPasswordLogin, validar],
  auth.iniciarSesion
);

router.get('/perfil', autenticacion, auth.perfil);

export default router;
