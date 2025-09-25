// src/servicios/comentarios.js
// ————————————————————————————————————————————————
// Cliente API para comentarios de tarjetas públicas.
// Endpoints backend:
//  - GET    /api/tarjetas/:id/comentarios        -> listar (público)
//  - POST   /api/tarjetas/:id/comentarios        -> crear (auth)
//  - DELETE /api/comentarios/:id                 -> eliminar (auth)
// ————————————————————————————————————————————————

import { API_URL, authFetch } from './api';

// Helper: parsea respuesta y lanza Error si !res.ok
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

// Helper: construir querystring limpio
const qs = (obj = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const comentariosApi = {
  /**
   * Listar comentarios de una tarjeta pública (paginado).
   * @param {string} tarjetaId
   * @param {{page?:number, limit?:number, parent?:string}} [params]
   * @param {{signal?:AbortSignal}} [opts]
   */
  async listar(tarjetaId, params = {}, opts = {}) {
    const url = `${API_URL}/tarjetas/${encodeURIComponent(tarjetaId)}/comentarios${qs(params)}`;
    const res = await fetch(url, { signal: opts.signal, cache: 'no-store' });
    return handle(res); // { ok, items, meta }
    // Si la tarjeta no es pública, el backend responderá 403.
  },

  /**
   * Crear un comentario en una tarjeta pública (requiere token).
   * @param {string} tarjetaId
   * @param {{texto:string, parent?:string}} body
   * @param {{signal?:AbortSignal}} [opts]
   */
  async crear(tarjetaId, body, opts = {}) {
    const res = await authFetch(
      `${API_URL}/tarjetas/${encodeURIComponent(tarjetaId)}/comentarios`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
        signal: opts.signal,
      }
    );
    return handle(res); // { ok, comentario }
  },

  /**
   * Eliminar un comentario (autor o dueño de la tarjeta; requiere token).
   * @param {string} comentarioId
   * @param {{signal?:AbortSignal}} [opts]
   */
  async eliminar(comentarioId, opts = {}) {
    const res = await authFetch(
      `${API_URL}/comentarios/${encodeURIComponent(comentarioId)}`,
      { method: 'DELETE', signal: opts.signal }
    );
    return handle(res); // { ok, mensaje }
  },
};
