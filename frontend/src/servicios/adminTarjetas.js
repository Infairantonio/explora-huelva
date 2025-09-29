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
  async listar(params = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas${qs(params)}`, {
      headers: { ...auth() },
      cache: 'no-store',
    });
    return handle(r);
  },

  async detalle(id) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}`, {
      headers: { ...auth() },
      cache: 'no-store',
    });
    return handle(r);
  },

  async eliminar(id, motivo) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ motivo: motivo || '' }),
    });
    return handle(r);
  },

  async restaurar(id) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}/restaurar`, {
      method: 'POST',
      headers: { ...auth() },
    });
    return handle(r);
  },

  
};

export async function soyAdmin() {
  const t = getToken();
  if (!t) return false;
  try {
    const r = await fetch(`${API_URL}/admin/tarjetas?page=1&pageSize=1`, {
      headers: { ...auth() },
      cache: "no-store",
    });
    return r.status === 200;
  } catch {
    return false;
  }
}

