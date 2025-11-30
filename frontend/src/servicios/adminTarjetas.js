// src/servicios/adminTarjetas.js
// Servicio para gestionar tarjetas desde el panel de administración.

import { API_URL, getToken } from "./api";

// Cabecera con token si está disponible
const authHeader = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// Manejo estándar de respuestas de la API
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

// Construcción de querystring limpia
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
  // Listado de tarjetas
  async listar(params = {}, options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas${qs(params)}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers || {}) },
      cache: "no-store",
    });
    return handle(r);
  },

  // Detalle de una tarjeta
  async detalle(id, options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers || {}) },
      cache: "no-store",
    });
    return handle(r);
  },

  // Eliminación (soft delete)
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

  // Restaurar tarjeta borrada
  async restaurar(id, options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}/restaurar`, {
      method: "POST",
      headers: { ...authHeader(), ...(options.headers || {}) },
      ...options,
    });
    return handle(r);
  },
};
