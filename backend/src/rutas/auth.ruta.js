// backend/src/rutas/auth.ruta.js
// ————————————————————————————————————————————————————
// Rutas de autenticación:
//  - Registro
//  - Login
//  - Refresh de token
//  - Logout (una sesión y todas)
//  - Perfil
//  - Verificación de email y recuperación de contraseña
// ————————————————————————————————————————————————————

import { Router } from "express";
import { body, query, validationResult } from "express-validator";
import {
  registrar,
  iniciarSesion,
  refrescar,
  cerrarSesion,
  cerrarSesiones,
  perfil,
  verificarEmail,
  reenviarVerificacion,
  olvidePassword,
  resetPassword,
} from "../controladores/auth.controlador.js";
import autenticacion from "../middleware/autenticacion.js";

const router = Router();

// Validación genérica de express-validator
const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ ok: false, errores: errores.array() });
  }
  next();
};

// Sanitizador sencillo para emails
const toTrimLower = (v) =>
  typeof v === "string" ? v.trim().toLowerCase() : v;

// Reglas de validación
const reglaNombre = body("nombre")
  .isString()
  .withMessage("Nombre inválido")
  .trim()
  .isLength({ min: 2, max: 80 })
  .withMessage("El nombre debe tener entre 2 y 80 caracteres");

const reglaEmail = body("email")
  .customSanitizer(toTrimLower)
  .isEmail()
  .withMessage("Email no válido");

// Contraseña fuerte en registro
const reglaPasswordRegistro = body("password")
  .isLength({ min: 10 })
  .withMessage("La contraseña debe tener al menos 10 caracteres")
  .matches(/[a-z]/)
  .withMessage("Debe incluir una minúscula")
  .matches(/[A-Z]/)
  .withMessage("Debe incluir una mayúscula")
  .matches(/[0-9]/)
  .withMessage("Debe incluir un número")
  .matches(/[^A-Za-z0-9]/)
  .withMessage("Debe incluir un símbolo");

const reglaPasswordLogin = body("password")
  .isLength({ min: 1 })
  .withMessage("La contraseña es obligatoria");

const reglaRemember = body("remember")
  .optional()
  .isBoolean()
  .withMessage("remember debe ser booleano")
  .toBoolean();

// ————————————————————————————————————————————————————
// Endpoints principales
// ————————————————————————————————————————————————————

// Registro (requiere nombre, email y contraseña fuerte)
router.post(
  "/registrar",
  [reglaNombre, reglaEmail, reglaPasswordRegistro, validar],
  registrar
);

// Login con opción "recuérdame" (refresh más largo)
router.post(
  "/login",
  [reglaEmail, reglaPasswordLogin, reglaRemember, validar],
  iniciarSesion
);

// Obtener nuevo access token a partir del refresh cookie httpOnly
router.post("/refresh", refrescar);

// Cerrar solo la sesión actual (revoca refresh de esta cookie)
router.post("/logout", cerrarSesion);

// Cerrar todas las sesiones del usuario (requiere estar logueado)
router.post("/logout-all", autenticacion, cerrarSesiones);

// Datos básicos del usuario autenticado
router.get("/perfil", autenticacion, perfil);

// ————————————————————————————————————————————————————
// Verificación de email y recuperación de contraseña
// ————————————————————————————————————————————————————

// Verificar email a partir de enlace con token
router.get(
  "/verificar-email",
  [query("token").isString().isLength({ min: 10 }).withMessage("Token inválido")],
  validar,
  verificarEmail
);

// Reenviar correo de verificación
router.post("/reenviar-verificacion", [reglaEmail, validar], reenviarVerificacion);

// Enviar enlace de "he olvidado mi contraseña"
router.post("/olvide", [reglaEmail, validar], olvidePassword);

// Reset de contraseña (con token y contraseña fuerte)
router.post(
  "/reset",
  [
    body("token").isString().isLength({ min: 10 }),
    body("newPassword")
      .isLength({ min: 10 })
      .withMessage("La contraseña debe tener al menos 10 caracteres")
      .matches(/[a-z]/)
      .withMessage("Debe incluir una minúscula")
      .matches(/[A-Z]/)
      .withMessage("Debe incluir una mayúscula")
      .matches(/[0-9]/)
      .withMessage("Debe incluir un número")
      .matches(/[^A-Za-z0-9]/)
      .withMessage("Debe incluir un símbolo"),
    validar,
  ],
  resetPassword
);

export default router;
