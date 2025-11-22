// backend/src/utils/jwt.js
import jwt from 'jsonwebtoken';

const getSecreto = () => {
  const sec = process.env.JWT_SECRETO;
  if (!sec) throw new Error('Falta JWT_SECRETO en variables de entorno');
  return sec;
};

// Algoritmo por defecto (puedes cambiarlo vía env si usas otro compatible)
const getAlgoritmo = () => process.env.JWT_ALG || 'HS256';

// Opcionales por entorno (útil para validar en proxies/servicios externos)
const getIssuer = () => process.env.JWT_ISSUER || undefined;
const getAudience = () => process.env.JWT_AUDIENCE || undefined;

// Payload mínimo que usamos en toda la app
// 👇 Ahora incluye también el ROL
export const buildUserPayload = (usuario) => ({
  uid: String(usuario._id || usuario.id || ''), // normaliza a string
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol || 'usuario',
});

// Firma un JWT con opciones (exp por defecto: 7d)
export const firmar = (
  payload,
  {
    exp = process.env.JWT_EXP || '7d',
    issuer = getIssuer(),
    audience = getAudience(),
    algorithm = getAlgoritmo(),
  } = {}
) =>
  jwt.sign(payload, getSecreto(), {
    expiresIn: exp,
    algorithm,
    ...(issuer ? { issuer } : {}),
    ...(audience ? { audience } : {}),
  });

// Verifica y devuelve el payload
// Puedes pasar opts extra de jsonwebtoken, p.ej. { issuer, audience }
export const verificar = (token, opts = {}) =>
  jwt.verify(token, getSecreto(), {
    clockTolerance: 5,
    algorithms: [getAlgoritmo()], // asegura el algoritmo esperado
    ...opts,
  });

// (Opcional) decodificación sin verificar — útil para debug (no usar en auth)
export const decodificar = (token) => jwt.decode(token, { json: true });
