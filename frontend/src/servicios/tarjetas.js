// src/servicios/tarjetas.js (mejorado)
import { API_URL, getToken } from './api';

// Header Authorization común
const authHeader = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// Igual que en api.js: parsea y lanza Error si !res.ok
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

// Helper para querystrings
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
  // === públicas
  async publicas(params = {}) {
    const r = await fetch(`${API_URL}/api/tarjetas/publicas${qs(params)}`, {
      cache: 'no-store',
    });
    return handle(r);
  },

  // === privadas
  async mias(params = {}) {
    const r = await fetch(`${API_URL}/api/tarjetas/mias${qs(params)}`, {
      headers: { ...authHeader() },
      cache: 'no-store',
    });
    return handle(r);
  },

  async una(id) {
    const r = await fetch(`${API_URL}/api/tarjetas/${id}`, {
      headers: { ...authHeader() },
      cache: 'no-store',
    });
    return handle(r);
  },

  async crear(payload) {
    const r = await fetch(`${API_URL}/api/tarjetas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(payload),
    });
    return handle(r);
  },

  async actualizar(id, payload) {
    const r = await fetch(`${API_URL}/api/tarjetas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(payload),
    });
    return handle(r);
  },

  async eliminar(id) {
    const r = await fetch(`${API_URL}/api/tarjetas/${id}`, {
      method: 'DELETE',
      headers: { ...authHeader() },
    });
    return handle(r);
  },

  // Subida de 1 imagen (FormData)
  async subirImagen(file) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${API_URL}/api/tarjetas/subir-imagen`, {
      method: 'POST',
      headers: { ...authHeader() }, // sin Content-Type manual
      body: fd,
    });
    return handle(r);
  },
};
