// backend/src/middleware/autenticacion.js
// ————————————————————————————————————————————————
// Middleware de autenticación JWT.
//   - Lee "Authorization: Bearer <token>"
//   - Verifica el token (utils/jwt)
//   - Rellena req.usuario { id, nombre, email, rol }
// Versión opcional: deja pasar sin token pero, si lo hay, lo valida.
// ————————————————————————————————————————————————

import { verificar } from '../utils/jwt.js';

export default function autenticacion(req, res, next) {
  // Cabecera Authorization (acepta mayúsculas/minúsculas)
  const rawAuth = req.headers.authorization ?? req.headers.Authorization ?? '';
  const auth = typeof rawAuth === 'string' ? rawAuth.trim() : '';

  // Formato esperado: "Bearer <token>"
  const match = auth.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token) {
    return res
      .status(401)
      .json({ ok: false, mensaje: 'Falta token' });
  }

  try {
    // verificar() usa la clave y opciones definidas en utils/jwt
    const payload = verificar(token);

    // Estructura estándar para el resto de la aplicación
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
 *  - Sin cabecera Authorization → continúa como anónimo (sin req.usuario).
 *  - Con cabecera Authorization → reutiliza autenticacion normal.
 */
export function autenticacionOpcional(req, res, next) {
  const rawAuth = req.headers.authorization ?? req.headers.Authorization ?? '';
  const auth = typeof rawAuth === 'string' ? rawAuth.trim() : '';

  if (!auth) {
    // Sin token: no se toca req.usuario
    return next();
  }

  // Con token: se valida igual que en autenticacion
  return autenticacion(req, res, next);
}

