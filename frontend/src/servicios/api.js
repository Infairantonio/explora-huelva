// src/servicios/api.js (mejorado + guarda token)
const RAW_API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5174';
// Quita una posible barra final para evitar //api/..
export const API_URL = RAW_API_URL.replace(/\/+$/, '');

export const getToken = () => {
  try { return localStorage.getItem('token'); } catch { return ''; }
};

async function parseAndThrowIfNotOk(res) {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const msg = (isJson && data?.mensaje) || res.statusText || 'Error de red';
    const err = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export async function getPerfil() {
  const r = await fetch(`${API_URL}/api/auth/perfil`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (r.status === 401) throw new Error('no-autorizado');
  return r.json();
}

export async function login({ email, password }) {
  const r = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await parseAndThrowIfNotOk(r); // lanza Error si no ok

  // ✅ Guarda el token para que el resto de peticiones lo usen automáticamente
  try {
    if (data?.token) localStorage.setItem('token', data.token);
  } catch (_) {
    // Si el navegador bloquea storage (modo privado duro), simplemente lo ignoramos
  }

  return data; // { ok, token, usuario }
}
