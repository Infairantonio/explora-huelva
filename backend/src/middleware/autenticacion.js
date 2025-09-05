import jwt from 'jsonwebtoken';

export default function autenticacion(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ ok: false, mensaje: 'Falta token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRETO);
    req.usuario = { id: payload.uid, nombre: payload.nombre, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
  }
}
