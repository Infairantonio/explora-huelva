// backend/src/middleware/autenticacion.js
// ————————————————————————————————————————————————
// Middleware de autenticación por JWT.
// Extrae "Authorization: Bearer <token>", verifica (utils/jwt)
// y añade req.usuario con id, nombre, email y rol.
// ————————————————————————————————————————————————

import { verificar } from '../utils/jwt.js';

export default function autenticacion(req, res, next) {
  // Leer cabecera Authorization (tolerante a mayúsculas/minúsculas)
  const rawAuth = req.headers.authorization ?? req.headers.Authorization ?? '';
  const auth = typeof rawAuth === 'string' ? rawAuth.trim() : '';

  // Acepta "Bearer <token>" con prefijo case-insensitive y espacios variables
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token) {
    return res
      .status(401)
      .json({ ok: false, mensaje: 'Falta token' });
  }

  try {
    // verificar() ya usa el secreto del entorno y puede aplicar clockTolerance
    const payload = verificar(token);

    // Estructura que usan los middlewares/rutas aguas abajo (req.usuario.id, etc.)
    req.usuario = {
      id: payload.uid,
      nombre: payload.nombre,
      email: payload.email,
      rol: payload.rol || 'usuario',
    };

    return next();
  } catch {
    return res
      .status(401)
      .json({ ok: false, mensaje: 'Token inválido o expirado' });
  }
}

/**
 * autenticacionOpcional:
 * - Si NO hay cabecera Authorization → deja pasar como anónimo (sin req.usuario).
 * - Si SÍ hay cabecera → reutiliza el middleware autenticacion normal.
 */
export function autenticacionOpcional(req, res, next) {
  const rawAuth = req.headers.authorization ?? req.headers.Authorization ?? '';
  const auth = typeof rawAuth === 'string' ? rawAuth.trim() : '';

  if (!auth) {
    // sin token: seguimos sin tocar nada, req.usuario queda undefined
    return next();
  }

  // hay Authorization → validamos como siempre
  return autenticacion(req, res, next);
}
