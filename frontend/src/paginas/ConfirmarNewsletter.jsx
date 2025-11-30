// src/paginas/ConfirmarNewsletter.jsx
// Página que confirma la suscripción a la newsletter usando el token de la URL.

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { API_URL } from "../servicios/api";

export default function ConfirmarNewsletter() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [estado, setEstado] = useState({
    cargando: true,
    ok: false,
    mensaje: "",
  });

  useEffect(() => {
    // Si no hay token en la URL, NO llamamos al backend
    if (!token) {
      setEstado({
        cargando: false,
        ok: false,
        mensaje:
          "El enlace de confirmación es incorrecto o está incompleto. Vuelve a solicitar la suscripción desde la web.",
      });
      return;
    }

    // Llamada al backend para confirmar la suscripción
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/newsletter/confirmar?token=${encodeURIComponent(
            token
          )}`
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          throw new Error(
            data?.mensaje ||
              "No se ha podido confirmar la suscripción. Es posible que el enlace haya caducado."
          );
        }

        setEstado({
          cargando: false,
          ok: true,
          mensaje:
            "¡Suscripción confirmada correctamente! A partir de ahora recibirás rutas, planes y lugares destacados en tu correo.",
        });
      } catch (e) {
        setEstado({
          cargando: false,
          ok: false,
          mensaje:
            e?.message ||
            "No se ha podido confirmar la suscripción. Vuelve a intentarlo más tarde.",
        });
      }
    })();
  }, [token]);

  return (
    <div className="auth-wrap">
      <div className="container">
        <div className="auth-layout">
          {/* Columna texto */}
          <div className="auth-copy">
            <h2>Explora Huelva</h2>
            <p>
              Recibe rutas, planes y lugares destacados directamente en tu
              correo. Podrás darte de baja cuando quieras.
            </p>
          </div>

          {/* Tarjeta principal */}
          <div className="card auth-card shadow border-0 ms-auto">
            <div className="card-body">
              <h1 className="card-title fw-bold text-primary mb-3">
                Confirmación de suscripción
              </h1>

              {estado.cargando && (
                <div className="d-flex align-items-center gap-2">
                  <div className="spinner-border" role="status" />
                  <span>Confirmando tu suscripción…</span>
                </div>
              )}

              {!estado.cargando && (
                <>
                  <div
                    className={
                      "alert " +
                      (estado.ok ? "alert-success" : "alert-warning")
                    }
                  >
                    {estado.mensaje}
                  </div>

                  {estado.ok ? (
                    <p className="small text-muted mb-3">
                      Podrás darte de baja en cualquier momento desde los
                      enlaces que aparecerán al final de cada correo.
                    </p>
                  ) : (
                    <p className="small text-muted mb-3">
                      Si el enlace ha caducado o no funciona, puedes volver a
                      introducir tu email en el formulario del pie de página y
                      solicitar una nueva suscripción.
                    </p>
                  )}

                  <div className="d-flex flex-wrap gap-2">
                    <Link to="/" className="btn btn-primary">
                      Ir a la página principal
                    </Link>
                    <Link to="/contacto" className="btn btn-outline-secondary">
                      Contactar con soporte
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Fin tarjeta */}
        </div>
      </div>
    </div>
  );
}
