// src/servicios/tarjetas.js
import { API_URL, getToken } from './api';

// Header Authorization (si hay token)
const authHeader = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// Parse genérico con throw si !res.ok
async function handle(res) {
  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
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

// Helper querystring
const qs = (obj = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const tarjetasApi = {
  // === públicas (listado)
  async publicas(params = {}) {
    const r = await fetch(`${API_URL}/tarjetas/publicas${qs(params)}`, {
      cache: 'no-store',
    });
    return handle(r);
  },

  // === pública (detalle)
  async publicaUna(id, options = {}) {
    const r = await fetch(`${API_URL}/tarjetas/publicas/${id}`, {
      ...options,
      cache: 'no-store',
    });
    return handle(r);
  },

  // === privadas
  async mias(params = {}, options = {}) {
    const r = await fetch(`${API_URL}/tarjetas/mias${qs(params)}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers || {}) },
      cache: 'no-store',
    });
    return handle(r);
  },

  async una(id, options = {}) {
    const r = await fetch(`${API_URL}/tarjetas/${id}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers || {}) },
      cache: 'no-store',
    });
    return handle(r);
  },

  async crear(payload, options = {}) {
    const r = await fetch(`${API_URL}/tarjetas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader(), ...(options.headers || {}) },
      body: JSON.stringify(payload),
      ...options,
    });
    return handle(r);
  },

  async actualizar(id, payload, options = {}) {
    const r = await fetch(`${API_URL}/tarjetas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader(), ...(options.headers || {}) },
      body: JSON.stringify(payload),
      ...options,
    });
    return handle(r);
  },

  async eliminar(id, options = {}) {
    const r = await fetch(`${API_URL}/tarjetas/${id}`, {
      method: 'DELETE',
      headers: { ...authHeader(), ...(options.headers || {}) },
      ...options,
    });
    return handle(r);
  },

  // Subida de 1 imagen (FormData)
  async subirImagen(file, options = {}) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${API_URL}/tarjetas/subir-imagen`, {
      method: 'POST',
      headers: { ...authHeader(), ...(options.headers || {}) }, // sin Content-Type manual
      body: fd,
      ...options,
    });
    return handle(r);
  },
};
