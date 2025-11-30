// src/servicios/comentarios.js
// Servicio para listar, crear y eliminar comentarios de tarjetas.

import { API_URL, authFetch } from "./api";

// Manejo estándar de respuesta de API
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

export const comentariosApi = {
  // Listar comentarios (paginado)
  async listar(tarjetaId, params = {}, opts = {}) {
    const url = `${API_URL}/tarjetas/${encodeURIComponent(
      tarjetaId
    )}/comentarios${qs(params)}`;

    const res = await authFetch(url, {
      signal: opts.signal,
      cache: "no-store",
    });

    return handle(res);
  },

  // Crear comentario (requiere token)
  async crear(tarjetaId, body, opts = {}) {
    const res = await authFetch(
      `${API_URL}/tarjetas/${encodeURIComponent(tarjetaId)}/comentarios`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
        signal: opts.signal,
      }
    );

    return handle(res);
  },

  // Eliminar comentario (autor o dueño de la tarjeta)
  async eliminar(comentarioId, opts = {}) {
    const res = await authFetch(
      `${API_URL}/comentarios/${encodeURIComponent(comentarioId)}`,
      { method: "DELETE", signal: opts.signal }
    );

    return handle(res);
  },
};
