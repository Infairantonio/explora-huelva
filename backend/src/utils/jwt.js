// backend/src/utils/jwt.js
import jwt from 'jsonwebtoken';

const getSecreto = () => {
  const sec = process.env.JWT_SECRETO;
  if (!sec) throw new Error('Falta JWT_SECRETO en variables de entorno');
  return sec;
};

// Payload mínimo que usamos en toda la app
export const buildUserPayload = (usuario) => ({
  uid: usuario._id,
  nombre: usuario.nombre,
  email: usuario.email,
});

// Firma un JWT con opciones
export const firmar = (payload, { exp = process.env.JWT_EXP || '7d', issuer, audience } = {}) =>
  jwt.sign(payload, getSecreto(), {
    expiresIn: exp,
    ...(issuer ? { issuer } : {}),
    ...(audience ? { audience } : {}),
  });

// Verifica y devuelve el payload (puedes pasar clockTolerance u otras opciones de jsonwebtoken)
export const verificar = (token, opts = {}) =>
  jwt.verify(token, getSecreto(), { clockTolerance: 5, ...opts });

// (Opcional) decodificación sin verificar — útil para debug (no usar en auth)
export const decodificar = (token) => jwt.decode(token, { json: true });
