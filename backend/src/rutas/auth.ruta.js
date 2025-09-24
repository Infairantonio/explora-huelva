// backend/src/rutas/auth.ruta.js
// ————————————————————————————————————————————————————
// Rutas de autenticación: registro, login y perfil.
// Mantiene contrato actual y valida inputs.
// ————————————————————————————————————————————————————

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import * as auth from '../controladores/auth.controlador.js';
// OJO: ajusta este import a tu carpeta real: 'middleware' vs 'middlewares'
import autenticacion from '../middleware/autenticacion.js';

const router = Router();

// ——— Utilidad local: manejador de resultados de validación ———
const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ ok: false, errores: errores.array() });
  }
  next();
};

// ——— Sanitizadores seguros ———
const toTrimLower = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v);

// ——— Reglas de validación ———
const reglaNombre = body('nombre')
  .isString().withMessage('Nombre inválido')
  .trim()
  .isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener 2-80 caracteres');

const reglaEmail = body('email')
  .customSanitizer(toTrimLower) // Evita normalizaciones agresivas de Gmail/Yahoo
  .isEmail().withMessage('Email no válido');

const reglaPasswordRegistro = body('password')
  .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres');

const reglaPasswordLogin = body('password')
  .isLength({ min: 1 }).withMessage('La contraseña es obligatoria');

// ——— Endpoints ———
router.post('/registrar', [reglaNombre, reglaEmail, reglaPasswordRegistro, validar], auth.registrar);

router.post('/login', [reglaEmail, reglaPasswordLogin, validar], auth.iniciarSesion);

router.get('/perfil', autenticacion, auth.perfil);

export default router;
