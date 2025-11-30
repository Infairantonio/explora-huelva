// src/utils/auth.js
// Utilidades de autenticación basadas en JWT almacenado en localStorage.
// Incluye helpers para token, decodificación, expiración y cabeceras.

// =====================================
// Constantes
// =====================================
const TOKEN_KEY = 'token';

// =====================================
// Lectura / escritura del token
// =====================================
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
};

export const logout = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
};

// =====================================
// Decodificación JWT (Base64URL)
// =====================================
function b64urlToString(b64url = '') {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
  return atob(padded); // JWT payload debe ser JSON ASCII
}

// Devuelve payload decodificado o {} si no es válido
export const decodePayload = (token) => {
  try {
    const parts = String(token).split('.');
    if (parts.length < 2) return {};
    const json = b64urlToString(parts[1]);
    return JSON.parse(json) || {};
  } catch {
    return {};
  }
};

// =====================================
// Expiración y estado de autenticación
// =====================================
export const isExpired = (token, skewMs = 30_000) => {
  try {
    const { exp } = decodePayload(token);
    if (!exp) return false;
    const ahora = Date.now();
    const venceMs = exp * 1000;
    return venceMs - skewMs <= ahora;
  } catch {
    return false;
  }
};

export const isAuth = () => {
  const t = getToken();
  return Boolean(t) && !isExpired(t);
};

// =====================================
// Header Authorization
// =====================================
export const authHeader = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// Devuelve información básica del usuario desde el JWT
export const getUserInfo = () => decodePayload(getToken());
