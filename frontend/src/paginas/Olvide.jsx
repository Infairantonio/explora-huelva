// src/paginas/Olvide.jsx
// Pantalla para solicitar un enlace de restablecimiento de contraseña.
// También permite reenviar el email de verificación si tu backend lo soporta.

import { useState } from "react";

export default function Olvide() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null); // { tipo: 'success'|'danger'|'info', texto: string }
  const [cargando, setCargando] = useState(false);

  // Enviar enlace de restablecimiento
  const enviarReset = async (e) => {
    e.preventDefault();
    if (!email || cargando) return;

    setMsg(null);
    setCargando(true);

    try {
      const res = await fetch("/api/auth/olvide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.mensaje || "No se pudo enviar el email de restablecimiento."
        );
      }

      setMsg({
        tipo: "success",
        texto: "Hemos enviado un enlace de restablecimiento si el email existe.",
      });
    } catch (e2) {
      setMsg({
        tipo: "danger",
        texto: e2?.message || "Error al enviar el correo.",
      });
    } finally {
      setCargando(false);
    }
  };

  // Reenviar email de verificación (opcional)
  const reenviarVerificacion = async () => {
    if (!email || cargando) return;

    setMsg(null);
    setCargando(true);

    try {
      const res = await fetch("/api/auth/reenviar-verificacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.mensaje || "No se pudo reenviar el correo de verificación."
        );
      }

      setMsg({
        tipo: "success",
        texto: "Enlace de verificación reenviado (si el email existe).",
      });
    } catch {
      // Si el backend no tiene este endpoint, devolvemos mensaje claro.
      setMsg({
        tipo: "info",
        texto:
          "El reenvío de verificación aún no está disponible. Puedes usar el restablecimiento o contactar soporte.",
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">

          <div className="card shadow-sm">
            <div className="card-body">
              <h1 className="h4 mb-3">¿Olvidaste tu contraseña?</h1>

              <p className="text-muted">
                Te enviaremos un enlace temporal para crear una contraseña nueva.
              </p>

              {/* Mensaje de estado */}
              {msg && (
                <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>
              )}

              {/* Formulario */}
              <form onSubmit={enviarReset} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!email || cargando}
                  >
                    {cargando ? "Enviando…" : "Enviar enlace"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={reenviarVerificacion}
                    disabled={!email || cargando}
                    title="Opcional: si tu cuenta aún no está verificada"
                  >
                    Reenviar verificación
                  </button>
                </div>
              </form>
            </div>
          </div>

          <p className="text-center text-muted mt-3">
            ¿Ya tienes el token?  
            <a href="/reset"> Ir a /reset</a>
          </p>
        </div>
      </div>
    </div>
  );
}
