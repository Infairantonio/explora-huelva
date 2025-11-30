// frontend/src/paginas/Verifica.jsx
// Pantalla de verificación de email a partir de un token en la URL.

import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

export default function Verifica() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState({
    cargando: true,
    ok: false,
    msg: "",
  });

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setEstado({
        cargando: false,
        ok: false,
        msg: "Falta el token en la URL.",
      });
      return;
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/auth/verificar-email?token=${encodeURIComponent(token)}`
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.ok) {
          throw new Error(
            data?.mensaje || "No se pudo verificar el email."
          );
        }

        setEstado({
          cargando: false,
          ok: true,
          msg: "¡Email verificado correctamente!",
        });

        setTimeout(() => navigate("/login", { replace: true }), 1200);
      } catch (e) {
        setEstado({
          cargando: false,
          ok: false,
          msg: e?.message || "Error al verificar.",
        });
      }
    })();
  }, [params, navigate]);

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h1 className="h4 mb-3">Verificación de email</h1>

              {estado.cargando && (
                <div className="alert alert-info">Verificando…</div>
              )}

              {!estado.cargando && estado.ok && (
                <div className="alert alert-success">{estado.msg}</div>
              )}

              {!estado.cargando && !estado.ok && (
                <div className="alert alert-danger">{estado.msg}</div>
              )}

              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-primary">
                  Ir al login
                </Link>
                <Link to="/olvide" className="btn btn-outline-secondary">
                  ¿Reenviar enlace?
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-muted mt-3">
            Si no te llega el correo, revisa “Spam” o solicita uno nuevo.
          </p>
        </div>
      </div>
    </div>
  );
}
