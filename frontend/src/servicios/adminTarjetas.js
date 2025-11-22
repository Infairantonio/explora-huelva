// src/servicios/adminTarjetas.js
// API de administración para TARJETAS (rutas /api/admin/tarjetas)

import { API_URL, getToken } from "./api";

// Igual que en tarjetas.js
const authHeader = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

async function handle(res) {
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    const msg = (isJson && data?.mensaje) || res.statusText || "Error de red";
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
    if (v === undefined || v === null || v === "") continue;
    p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const adminTarjetasApi = {
  // GET /api/admin/tarjetas
  async listar(params = {}, options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas${qs(params)}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers || {}) },
      cache: "no-store",
    });
    return handle(r);
  },

  // GET /api/admin/tarjetas/:id
  async detalle(id, options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers || {}) },
      cache: "no-store",
    });
    return handle(r);
  },

  // DELETE /api/admin/tarjetas/:id  (soft delete)
  async eliminar(id, motivo = "", options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...(options.headers || {}),
      },
      body: JSON.stringify({ motivo }),
      ...options,
    });
    return handle(r);
  },

  // POST /api/admin/tarjetas/:id/restaurar
  async restaurar(id, options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}/restaurar`, {
      method: "POST",
      headers: { ...authHeader(), ...(options.headers || {}) },
      ...options,
    });
    return handle(r);
  },
};
