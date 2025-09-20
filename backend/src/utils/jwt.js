// backend/src/utils/jwt.js  (opcional)
import jwt from 'jsonwebtoken';

export const firmar = (payload, exp = '2h') =>
  jwt.sign(payload, process.env.JWT_SECRETO, { expiresIn: exp });

export const verificar = (token) =>
  jwt.verify(token, process.env.JWT_SECRETO);
