// backend/src/middleware/requiereRol.js
// ————————————————————————————————————————————————
// Middleware de autorización por rol (ej. 'admin').
// Supone que el middleware de autenticación ya rellenó req.usuario.rol.
// ————————————————————————————————————————————————

export default function requiereRol(rolNecesario = 'admin') {
  return function (req, res, next) {
    const usuario = req.usuario;

    if (!usuario) {
      return res
        .status(401)
        .json({ ok: false, mensaje: 'No autenticado' });
    }

    if (usuario.rol !== rolNecesario) {
      return res
        .status(403)
        .json({
          ok: false,
          mensaje: `Acceso denegado: se requiere rol ${rolNecesario}`,
        });
    }

    return next();
  };
}

