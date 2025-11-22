import { API_URL, getToken } from './api';

// =========================================================
// Header Authorization dinámico
// =========================================================
const authHeader = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

// =========================================================
// Parse genérico con throw si !res.ok
// =========================================================
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

// =========================================================
// Helper querystring
// =========================================================
const qs = (obj = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
};

// =========================================================
// API TARJETAS COMPLETA
// =========================================================
export const tarjetasApi = {
  // -----------------------------------------------------
  // 1) Públicas generales
  // -----------------------------------------------------
  async publicas(params = {}) {
    const r = await fetch(`${API_URL}/tarjetas/publicas${qs(params)}`, {
      cache: 'no-store',
    });
    return handle(r);
  },

  async publicaUna(id, options = {}) {
    const r = await fetch(`${API_URL}/tarjetas/publicas/${id}`, {
      ...options,
      cache: 'no-store',
    });
    return handle(r);
  },

  // -----------------------------------------------------
  // 2) Amigos (privado con token)
  // -----------------------------------------------------
  async amigos(params = {}, options = {}) {
    const r = await fetch(`${API_URL}/tarjetas/amigos${qs(params)}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers || {}) },
      cache: 'no-store',
    });
    return handle(r);
  },

  // -----------------------------------------------------
  // 3) Mis tarjetas (privado con token)
  // -----------------------------------------------------
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

  // -----------------------------------------------------
  // 4) Crear / Actualizar / Eliminar (usuario normal)
  // -----------------------------------------------------
  async crear(payload, options = {}) {
    const r = await fetch(`${API_URL}/tarjetas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...(options.headers || {}),
      },
      body: JSON.stringify(payload),
      ...options,
    });
    return handle(r);
  },

  async actualizar(id, payload, options = {}) {
    const r = await fetch(`${API_URL}/tarjetas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...(options.headers || {}),
      },
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

  // -----------------------------------------------------
  // 5) Subida de imágenes
  // -----------------------------------------------------
  async subirImagen(file, options = {}) {
    const fd = new FormData();
    fd.append('file', file);

    const r = await fetch(`${API_URL}/tarjetas/subir-imagen`, {
      method: 'POST',
      headers: { ...authHeader(), ...(options.headers || {}) }, // no pongas Content-Type
      body: fd,
      ...options,
    });
    return handle(r);
  },

  // ======================================================
  // 6) 🔥 ADMIN: Gestión completa de tarjetas
  // ======================================================
  async adminListar(params = {}, options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas${qs(params)}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers || {}) },
      cache: 'no-store',
    });
    return handle(r);
  },

  async adminUna(id, options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}`, {
      ...options,
      headers: { ...authHeader(), ...(options.headers || {}) },
      cache: 'no-store',
    });
    return handle(r);
  },

  async adminEliminar(id, motivo = '', options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...(options.headers || {}),
      },
      body: JSON.stringify({ motivo }),
      ...options,
    });
    return handle(r);
  },

  async adminRestaurar(id, options = {}) {
    const r = await fetch(`${API_URL}/admin/tarjetas/${id}/restaurar`, {
      method: 'POST',
      headers: { ...authHeader(), ...(options.headers || {}) },
      ...options,
    });
    return handle(r);
  },
};
