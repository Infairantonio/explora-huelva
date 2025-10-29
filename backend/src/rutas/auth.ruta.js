// backend/src/rutas/auth.ruta.js
// ————————————————————————————————————————————————————
// Rutas de autenticación: registro, login, refresh, verificación y reset.
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
// ⬅️ asegúrate de que el archivo está en "middlewares"
import autenticacion from "../middleware/autenticacion.js";

const router = Router();

// Validación genérica
const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ ok: false, errores: errores.array() });
  }
  next();
};

// Reglas
const toTrimLower = (v) => (typeof v === "string" ? v.trim().toLowerCase() : v);

const reglaNombre = body("nombre")
  .isString().withMessage("Nombre inválido")
  .trim()
  .isLength({ min: 2, max: 80 }).withMessage("El nombre debe tener 2-80 caracteres");

const reglaEmail = body("email")
  .customSanitizer(toTrimLower)
  .isEmail().withMessage("Email no válido");

// ✅ Endurecida: contraseña fuerte en registro
const reglaPasswordRegistro = body("password")
  .isLength({ min: 10 }).withMessage("La contraseña debe tener al menos 10 caracteres")
  .matches(/[a-z]/).withMessage("Debe incluir una minúscula")
  .matches(/[A-Z]/).withMessage("Debe incluir una mayúscula")
  .matches(/[0-9]/).withMessage("Debe incluir un número")
  .matches(/[^A-Za-z0-9]/).withMessage("Debe incluir un símbolo");

const reglaPasswordLogin = body("password")
  .isLength({ min: 1 }).withMessage("La contraseña es obligatoria");

const reglaRemember = body("remember")
  .optional()
  .isBoolean().withMessage("remember debe ser booleano")
  .toBoolean();

// ——— Endpoints principales ———
router.post("/registrar", [reglaNombre, reglaEmail, reglaPasswordRegistro, validar], registrar);
router.post("/login", [reglaEmail, reglaPasswordLogin, reglaRemember, validar], iniciarSesion);
router.post("/refresh", refrescar);
router.post("/logout", cerrarSesion);
router.post("/logout-all", autenticacion, cerrarSesiones);
router.get("/perfil", autenticacion, perfil);

// ——— Verificación y recuperación ———
router.get(
  "/verificar-email",
  [query("token").isString().isLength({ min: 10 }).withMessage("Token inválido")],
  validar,
  verificarEmail
);

router.post("/reenviar-verificacion", [reglaEmail, validar], reenviarVerificacion);

router.post("/olvide", [reglaEmail, validar], olvidePassword);

// ✅ Endurecida: contraseña fuerte en reset
router.post(
  "/reset",
  [
    body("token").isString().isLength({ min: 10 }),
    body("newPassword")
      .isLength({ min: 10 }).withMessage("La contraseña debe tener al menos 10 caracteres")
      .matches(/[a-z]/).withMessage("Debe incluir una minúscula")
      .matches(/[A-Z]/).withMessage("Debe incluir una mayúscula")
      .matches(/[0-9]/).withMessage("Debe incluir un número")
      .matches(/[^A-Za-z0-9]/).withMessage("Debe incluir un símbolo"),
    validar,
  ],
  resetPassword
);

export default router;
