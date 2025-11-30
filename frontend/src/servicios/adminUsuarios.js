// src/servicios/adminUsuarios.js
// Servicio para gestionar usuarios desde el panel de administración.

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

export const adminUsuariosApi = {
  // Listado de usuarios (con filtros y paginación)
  async listar(params = {}, options = {}) {
    const r = await fetch(`${API_URL}/admin/usuarios${qs(params)}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers || {}) },
      cache: "no-store",
    });
    return handle(r);
  },

  // Cambio de rol (usuario ↔ admin)
  async cambiarRol(id, rol, options = {}) {
    const r = await fetch(`${API_URL}/admin/usuarios/${id}/rol`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...(options.headers || {}),
      },
      body: JSON.stringify({ rol }),
      ...options,
    });
    return handle(r);
  },

  // Bloquear usuario
  async bloquear(id, options = {}) {
    const r = await fetch(`${API_URL}/admin/usuarios/${id}/bloqueo`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...(options.headers || {}),
      },
      body: JSON.stringify({ bloqueado: true }),
      ...options,
    });
    return handle(r);
  },

  // Desbloquear usuario
  async desbloquear(id, options = {}) {
    const r = await fetch(`${API_URL}/admin/usuarios/${id}/bloqueo`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...(options.headers || {}),
      },
      body: JSON.stringify({ bloqueado: false }),
      ...options,
    });
    return handle(r);
  },

  // Eliminación suave (soft delete)
  async eliminar(id, motivo, options = {}) {
    const r = await fetch(`${API_URL}/admin/usuarios/${id}`, {
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

  // Restaurar usuario eliminado
  async restaurar(id, options = {}) {
    const r = await fetch(`${API_URL}/admin/usuarios/${id}/restaurar`, {
      method: "PATCH",
      headers: { ...authHeader(), ...(options.headers || {}) },
      ...options,
    });
    return handle(r);
  },

  // Eliminación definitiva (opcional para futuro)
  async eliminarDefinitivo(id, options = {}) {
    const r = await fetch(`${API_URL}/admin/usuarios/${id}/definitivo`, {
      method: "DELETE",
      headers: { ...authHeader(), ...(options.headers || {}) },
      ...options,
    });
    return handle(r);
  },
};
