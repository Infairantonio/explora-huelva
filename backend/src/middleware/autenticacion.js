// backend/src/middleware/autenticacion.js
// ————————————————————————————————————————————————
// Middleware de autenticación por JWT.
// Extrae "Authorization: Bearer <token>", verifica (utils/jwt) y añade req.usuario.
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
    return res.status(401).json({ ok: false, mensaje: 'Falta token' });
  }

  try {
    // verificar() ya usa el secreto del entorno y puede aplicar clockTolerance
    const payload = verificar(token);

    // Estructura que usan los middlewares/rutas aguas abajo (req.usuario.id, etc.)
    req.usuario = {
      id: payload.uid,
      nombre: payload.nombre,
      email: payload.email,
    };

    return next();
  } catch {
    return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
  }
}
