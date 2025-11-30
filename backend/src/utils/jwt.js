// backend/src/utils/jwt.js
// ————————————————————————————————————————————————————————
// Utilidades para generar y verificar JWT en Explora Huelva.
//
// Características:
//  - Firma segura con HS256 (o el algoritmo definido en entorno).
//  - Payload mínimo: uid, nombre, email y rol.
//  - Expiración configurable (JWT_EXP, por defecto 7 días).
//  - Soporte opcional para issuer/audience.
//  - clockTolerance para permitir pequeña desviación horaria.
//  - Incluye función para decodificar sin verificar (solo debugging).
// ————————————————————————————————————————————————————————

import jwt from 'jsonwebtoken';

// ————————————————————————————————————————————————
// Obtención segura del secreto
// ————————————————————————————————————————————————
const getSecreto = () => {
  const sec = process.env.JWT_SECRETO;
  if (!sec) throw new Error('Falta JWT_SECRETO en variables de entorno');
  return sec;
};

// Algoritmo configurable (HS256 por defecto)
const getAlgoritmo = () => process.env.JWT_ALG || 'HS256';

// Opcionales de seguridad / integridad
const getIssuer = () => process.env.JWT_ISSUER || undefined;
const getAudience = () => process.env.JWT_AUDIENCE || undefined;

// ————————————————————————————————————————————————
// Construcción del payload estándar del usuario
// ————————————————————————————————————————————————
//
// Incluye:
//   - uid (id normalizada a string)
//   - nombre
//   - email
//   - rol (usuario/admin)
//
export const buildUserPayload = (usuario) => ({
  uid: String(usuario._id || usuario.id || ''),
  nombre: usuario.nombre,
  email: usuario.email,
  rol: usuario.rol || 'usuario',
});

// ————————————————————————————————————————————————
// Firmar un JWT
// exp por defecto → 7 días (configurable vía JWT_EXP="3h", "30m", "7d"...)
// ————————————————————————————————————————————————
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

// ————————————————————————————————————————————————
// Verificar un JWT
// clockTolerance: 5s → permite ligeras diferencias de hora
// Acepta opciones adicionales si quieres validar issuer/audience.
// ————————————————————————————————————————————————
export const verificar = (token, opts = {}) =>
  jwt.verify(token, getSecreto(), {
    clockTolerance: 5,
    algorithms: [getAlgoritmo()],
    ...opts,
  });

// ————————————————————————————————————————————————
// Decodificar sin verificar
// Útil solo para debugging / logs — NO usar para seguridad.
// ————————————————————————————————————————————————
export const decodificar = (token) =>
  jwt.decode(token, { json: true });
