// src/servicios/newsletter.js
// Servicio para gestionar la newsletter: alta, baja y confirmación.

import { API_URL } from "./api";

/**
 * Helper local para manejar respuestas JSON.
 * Lanza un Error si la respuesta no es ok o si data.ok === false.
 */
async function handleRespuesta(res) {
  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.ok === false) {
    const msg =
      data?.mensaje ||
      data?.error ||
      (Array.isArray(data?.errores) && data.errores[0]?.msg) ||
      "Se ha producido un error en la petición.";
    const err = new Error(msg);
    err.payload = data;
    throw err;
  }

  return data;
}

export const newsletterApi = {
  /**
   * Suscribir un email a la newsletter.
   */
  async suscribir(email) {
    const res = await fetch(`${API_URL}/newsletter/suscribir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    return handleRespuesta(res);
  },

  /**
   * Confirmar la suscripción a partir de un token.
   */
  async confirmar(token) {
    const url = `${API_URL}/newsletter/confirmar?token=${encodeURIComponent(
      token
    )}`;

    const res = await fetch(url, {
      method: "GET",
    });

    return handleRespuesta(res);
  },

  /**
   * Dar de baja un email de la newsletter.
   */
  async baja(email) {
    const res = await fetch(`${API_URL}/newsletter/baja`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    return handleRespuesta(res);
  },
};
