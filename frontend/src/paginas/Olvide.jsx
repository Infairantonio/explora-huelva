import { useState } from "react";

export default function Olvide() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null); // { tipo: 'success'|'danger'|'info', texto: string }
  const [cargando, setCargando] = useState(false);

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
      if (!res.ok || !data?.ok) throw new Error(data?.mensaje || "No se pudo enviar el email de restablecimiento.");
      setMsg({ tipo: "success", texto: "Hemos enviado un enlace de restablecimiento si el email existe." });
    } catch (e2) {
      setMsg({ tipo: "danger", texto: e2?.message || "Error al enviar el correo." });
    } finally {
      setCargando(false);
    }
  };

  // Opcional: reenviar verificación (solo si tu backend expuso /api/auth/reenviar-verificacion)
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
      if (!res.ok || !data?.ok) throw new Error(data?.mensaje || "No se pudo reenviar el correo de verificación.");
      setMsg({ tipo: "success", texto: "Enlace de verificación reenviado (si el email existe)." });
    } catch (e2) {
      // Si tu backend aún no tiene este endpoint, devolverá 404; mostramos un mensaje claro.
      setMsg({ tipo: "info", texto: "Reenvío de verificación no disponible todavía. Usa el restablecimiento o contacta soporte." });
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
                Te enviaremos un email con un enlace temporal para que puedas crear una contraseña nueva.
              </p>

              {msg && <div className={`alert alert-${msg.tipo}`}>{msg.texto}</div>}

              <form onSubmit={enviarReset} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
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
                  <button type="submit" className="btn btn-primary" disabled={!email || cargando}>
                    {cargando ? "Enviando…" : "Enviar enlace de restablecimiento"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={reenviarVerificacion}
                    disabled={!email || cargando}
                    title="Opcional, si tu cuenta aún no está verificada"
                  >
                    Reenviar verificación
                  </button>
                </div>
              </form>
            </div>
          </div>

          <p className="text-center text-muted mt-3">
            ¿Ya tienes el token? Ve a <a href="/reset">/reset</a>
          </p>
        </div>
      </div>
    </div>
  );
}
