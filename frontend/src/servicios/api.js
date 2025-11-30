// src/servicios/api.js
// Cliente API centralizado: URL base, token, authFetch y endpoints de autenticación.

const RAW_API_URL = import.meta.env.VITE_API_URL ?? "/api";
// Normaliza para evitar barras dobles al construir rutas
export const API_URL = RAW_API_URL.replace(/\/+$/, "");

const TOKEN_KEY = "token";

// Helper para construir URLs de imágenes del backend
// Uso: <img src={urlImagen(item.imagen)} />
export const urlImagen = (nombreArchivo = "") => {
  if (!nombreArchivo) return "";
  // Si ya es una URL absoluta (S3, CDN, etc.), se respeta
  if (/^https?:\/\//i.test(nombreArchivo)) return nombreArchivo;
  // Evita barras iniciales repetidas
  const limpio = String(nombreArchivo).replace(/^\/+/, "");
  return `${API_URL}/uploads/${limpio}`;
};

// Gestión del token en localStorage
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Posible modo privado estricto u otros bloqueos
  }
};

export const logout = () => setToken(""); // deja vacío y elimina

// Parse de respuesta con error enriquecido si !res.ok
async function parseAndThrowIfNotOk(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
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

// fetch con token Bearer automático si existe
export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const body = options.body;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const isURLParams =
    typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;
  const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
  const isArrayBuffer =
    typeof ArrayBuffer !== "undefined" &&
    (body instanceof ArrayBuffer ||
      (typeof ArrayBuffer.isView === "function" && ArrayBuffer.isView(body)));

  // Fuerza JSON solo cuando el body es un objeto "normal"
  if (
    body &&
    !headers.has("Content-Type") &&
    !isFormData &&
    !isURLParams &&
    !isBlob &&
    !isArrayBuffer &&
    typeof body !== "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });

  // Si 401 ⇒ token inválido/expirado: se limpia
  if (res.status === 401) {
    logout();
  }
  return res;
}

// ------------------- Auth API -------------------

export async function login({ email, password }) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseAndThrowIfNotOk(res);
  if (data?.token) setToken(data.token);
  return data; // { ok, token, usuario }
}

export async function register({ nombre, email, password }) {
  const res = await fetch(`${API_URL}/auth/registrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password }),
  });
  const data = await parseAndThrowIfNotOk(res);
  // Si se quisiera auto-login tras registro, se podría guardar el token aquí
  // if (data?.token) setToken(data.token);
  return data;
}

export async function getPerfil() {
  const res = await authFetch(`${API_URL}/auth/perfil`);
  if (res.status === 401) throw new Error("no-autorizado");
  return parseAndThrowIfNotOk(res);
}

// ---------------- Recuperación de contraseña ----------------

// Solicita el correo con el enlace de "Olvidé mi contraseña"
export async function solicitarResetPassword(email) {
  const res = await fetch(`${API_URL}/auth/olvide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return parseAndThrowIfNotOk(res); // { ok: true }
}

// Envía el token y la nueva contraseña al backend
export async function resetPassword({ token, newPassword }) {
  const res = await fetch(`${API_URL}/auth/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  return parseAndThrowIfNotOk(res); // { ok: true, mensaje: "Contraseña actualizada" }
}
