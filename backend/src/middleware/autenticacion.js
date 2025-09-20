// backend/src/middlewares/autenticacion.js
// ————————————————————————————————————————————————
// Middleware de autenticación por JWT.
// Extrae el token del header Authorization: Bearer <token>,
// verifica la firma y añade `req.usuario` con datos mínimos.
// Incluye mejoras suaves y comentarios línea a línea.
// ————————————————————————————————————————————————

import jwt from 'jsonwebtoken';

export default function autenticacion(req, res, next) {
  // Obtiene el header Authorization (puede venir en minúsculas según el proxy)
  const auth = req.headers.authorization || req.headers.Authorization || '';

  // Acepta formato "Bearer <token>" (con o sin espacios extra)
  const prefijo = 'Bearer ';
  const token = auth.startsWith(prefijo) ? auth.slice(prefijo.length).trim() : null;

  // (Opcional) también podríamos aceptar token vía cookie/session si lo habilitas en el futuro
  // const token = authHeader || req.cookies?.token || null;

  if (!token) {
    return res.status(401).json({ ok: false, mensaje: 'Falta token' });
  }

  try {
    // Verifica el token con el secreto del entorno
    const payload = jwt.verify(token, process.env.JWT_SECRETO);

    // Poblamos req.usuario con un subconjunto mínimo, evitando información sensible
    req.usuario = { id: payload.uid, nombre: payload.nombre, email: payload.email };

    // Continúa al siguiente middleware/controlador
    return next();
  } catch (e) {
    // jwt.verify puede lanzar por firma inválida, expiración, etc.
    // Para no filtrar detalles de seguridad, devolvemos un mensaje genérico
    return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
  }
}
