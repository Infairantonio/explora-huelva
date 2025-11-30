// src/paginas/BajaNewsletter.jsx
// Página para darse de baja de la newsletter introduciendo el email.

import { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../servicios/api";

export default function BajaNewsletter() {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    if (cargando) return;

    setOkMsg("");
    setErrMsg("");

    const correo = email.trim();
    if (!correo) {
      setErrMsg("Por favor, introduce el correo con el que te suscribiste.");
      return;
    }

    try {
      setCargando(true);

      const res = await fetch(`${API_URL}/newsletter/baja`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.mensaje ||
            "No ha sido posible tramitar la baja. Verifica el correo o inténtalo más tarde."
        );
      }

      setOkMsg(
        "Hemos tramitado tu baja de la newsletter. Es posible que todavía recibas algún correo que ya estuviera en cola, pero no seguirás recibiendo nuevas comunicaciones."
      );
      setEmail("");
    } catch (e) {
      setErrMsg(
        e?.message ||
          "No ha sido posible tramitar la baja en este momento. Inténtalo otra vez más tarde."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="container">
        <div className="auth-layout">
          <div className="auth-copy">
            <h2>Explora Huelva</h2>
            <p>Gestiona tus suscripciones de forma sencilla.</p>
          </div>

          <div className="card auth-card shadow border-0 ms-auto">
            <div className="card-body">
              <h1 className="card-title fw-bold text-primary mb-3">
                Darse de baja de la newsletter
              </h1>

              <p className="text-muted small">
                Introduce el mismo correo con el que te suscribiste a las
                novedades. Dejarás de recibir emails promocionales y de
                contenidos, pero podrás seguir usando Explora Huelva normalmente.
              </p>

              {okMsg && <div className="alert alert-success">{okMsg}</div>}
              {errMsg && <div className="alert alert-danger">{errMsg}</div>}

              <form onSubmit={enviar} noValidate>
                <div className="mb-3">
                  <label className="form-label">Correo electrónico</label>
                  <input
                    className="form-control"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    required
                  />
                  <div className="form-text">
                    Solo usaremos este dato para localizar tu suscripción y
                    tramitar la baja.
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-danger px-4"
                    type="submit"
                    disabled={cargando || !email}
                  >
                    {cargando ? "Procesando…" : "Confirmar baja"}
                  </button>

                  <Link to="/" className="btn btn-link">
                    Volver a la página principal
                  </Link>
                </div>
              </form>

              <hr />

              <p className="small text-muted mb-0">
                Si cambias de opinión, puedes volver a suscribirte desde el
                footer de la web o desde tu panel de usuario cuando habilitemos
                la gestión de comunicaciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
