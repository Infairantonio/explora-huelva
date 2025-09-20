// src/utils/auth.js
// Utilidades de autenticación basadas en JWT guardado en localStorage.
// Incluye helpers para leer/escribir el token, decodificar el payload,
// detectar expiración con pequeño “skew”, y construir el header Authorization.

const TOKEN_KEY = 'token';

/* =========================
 *  Lectura / escritura token
 * ========================= */
export const getToken = () => {
  // Devuelve el token guardado (o cadena vacía si no existe)
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

export const setToken = (token) => {
  // Guarda / actualiza el token en localStorage
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
};

export const logout = () => {
  // Elimina el token para “cerrar sesión” en el cliente
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
};

/* =========================
 *  Decodificación de JWT
 * ========================= */

// Base64URL -> string
function b64urlToString(b64url = '') {
  // Reemplaza caracteres URL-safe y añade padding si falta
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  const padded = pad ? b64 + '='.repeat(4 - pad) : b64;
  // atob trabaja con ASCII; el payload de JWT debería ser JSON ASCII
  return atob(padded);
}

// Devuelve el payload decodificado del JWT (o {} si no es válido)
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

/* =========================
 *  Estado de autenticación
 * ========================= */

export const isExpired = (token, skewMs = 30_000) => {
  // Devuelve true si el token está expirado. Aplica un margen (skew)
  // de 30s para evitar problemas de desfase horario entre cliente/servidor.
  try {
    const { exp } = decodePayload(token);
    if (!exp) return false; // si no hay exp, asumimos no expirado aquí
    const ahora = Date.now();
    const venceMs = exp * 1000;
    return venceMs - skewMs <= ahora;
  } catch {
    // Ante errores de parseo, no marcamos expirado aquí
    return false;
  }
};

export const isAuth = () => {
  // Hay token y no está expirado
  const t = getToken();
  return Boolean(t) && !isExpired(t);
};

// Devuelve cabecera Authorization si hay token válido (útil en fetch)
export const authHeader = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// Información básica del usuario a partir del payload (si existe)
// p.ej. { sub, email, name, iat, exp, ... }
export const getUserInfo = () => decodePayload(getToken());
