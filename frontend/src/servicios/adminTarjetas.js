// src/servicios/adminTarjetas.js
import { API_URL, getToken } from './api';

const auth = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

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

const qs = (obj = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const adminTarjetas = {
  // Listado de tarjetas con filtros (page, limit, q, etiqueta, visibilidad, eliminado, etc.)
  async listar(params = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas${qs(params)}`, {
      headers: { ...auth() },
      cache: 'no-store',
    });
    return handle(r);
  },

  // Detalle de una tarjeta (para moderación)
  async detalle(id) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}`, {
      headers: { ...auth() },
      cache: 'no-store',
    });
    return handle(r);
  },

  // Soft delete con motivo
  async eliminar(id, motivo) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ motivo: motivo || '' }),
    });
    return handle(r);
  },

  // Restaurar una tarjeta previamente eliminada
  async restaurar(id) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}/restaurar`, {
      method: 'POST',
      headers: { ...auth() },
    });
    return handle(r);
  },
};

// Comprobación rápida: ¿el token actual tiene acceso a /admin?
export async function soyAdmin() {
  const t = getToken();
  if (!t) return false;
  try {
    // El backend acepta page/limit (y también pageSize por compat)
    const r = await fetch(`${API_URL}/admin/tarjetas?page=1&limit=1`, {
      headers: { ...auth() },
      cache: 'no-store',
    });
    return r.status === 200;
  } catch {
    return false;
  }
}
