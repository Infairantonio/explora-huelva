// backend/src/middleware/requiereRol.js
// Middleware de autorización por rol (p.ej., 'admin')
// Lee req.usuario.id (puesto por autenticacion) y consulta la BD.

import Usuario from '../modelos/usuario.modelo.js';

export default function requiereRol(rolNecesario = 'admin') {
  return async function (req, res, next) {
    try {
      const uid = req?.usuario?.id;
      if (!uid) {
        return res.status(401).json({ ok: false, mensaje: 'No autenticado' });
      }

      const u = await Usuario.findById(uid).select('rol').lean();
      if (!u) {
        return res.status(401).json({ ok: false, mensaje: 'Usuario no encontrado' });
      }
      if (u.rol !== rolNecesario) {
        return res.status(403).json({ ok: false, mensaje: 'Acceso denegado' });
      }

      next();
    } catch (err) {
      console.error('requiereRol error:', err);
      res.status(500).json({ ok: false, mensaje: 'Error de autorización' });
    }
  };
}
