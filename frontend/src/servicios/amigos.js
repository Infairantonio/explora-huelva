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

export const amigosApi = {
  // Buscar usuarios para enviar solicitud
  async buscarUsuarios(q, { page = 1, limit = 20 } = {}) {
    const r = await fetch(`${API_URL}/amigos/buscar-usuarios${qs({ q, page, limit })}`, {
      headers: { ...auth() },
      cache: 'no-store',
    });
    return handle(r);
  },

  // Listar amigos
  async listar() {
    const r = await fetch(`${API_URL}/amigos`, { headers: { ...auth() }, cache: 'no-store' });
    return handle(r);
  },

  // Listar pendientes (recibidas y enviadas juntas en .items con {tipo, usuario})
  async pendientes() {
    const r = await fetch(`${API_URL}/amigos/pendientes`, { headers: { ...auth() }, cache: 'no-store' });
    return handle(r);
  },

  // Enviar solicitud (por ID de usuario)
  async solicitarPorId(usuarioId) {
    const r = await fetch(`${API_URL}/amigos/solicitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ usuarioId }),
    });
    return handle(r);
  },

  // Cancelar una solicitud que YO envié
  async cancelar(usuarioId) {
    const r = await fetch(`${API_URL}/amigos/cancelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ usuarioId }),
    });
    return handle(r);
  },

  // Aceptar / Rechazar solicitud recibida
  async aceptar(usuarioId) {
    const r = await fetch(`${API_URL}/amigos/aceptar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ usuarioId }),
    });
    return handle(r);
  },
  async rechazar(usuarioId) {
    const r = await fetch(`${API_URL}/amigos/rechazar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ usuarioId }),
    });
    return handle(r);
  },

  // Eliminar amistad (ya aceptada)
  async eliminar(usuarioId) {
    const r = await fetch(`${API_URL}/amigos/${usuarioId}`, {
      method: 'DELETE',
      headers: { ...auth() },
    });
    return handle(r);
  },
};
