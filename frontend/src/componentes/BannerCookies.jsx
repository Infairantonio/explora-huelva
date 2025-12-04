// src/componentes/BannerCookies.jsx
// -------------------------------------------------------------
// Banner flotante de cookies (cumplimiento RGPD básico).
// - Informa de tipos de cookies (técnicas y analíticas).
// - Permite aceptar todas o solo las necesarias (rechazar analíticas).
// - Guarda la decisión en sessionStorage (dura solo la sesión):
//      • cookies-consent: "all" | "necessary"
//      • cookies-opcionales: "true" | "false"
// - Se muestra al menos una vez en cada sesión del navegador.
// -------------------------------------------------------------

import { useEffect, useState } from "react";

export default function BannerCookies() {
  const [visible, setVisible] = useState(false);

  // Mostrar el banner si en esta sesión aún no se ha elegido
  useEffect(() => {
    try {
      const consent = sessionStorage.getItem("cookies-consent");
      if (!consent) setVisible(true);
    } catch {
      // Si sessionStorage falla por alguna razón, mostramos el banner igualmente
      setVisible(true);
    }
  }, []);

  // Aceptar todas las cookies (técnicas + analíticas)
  const aceptarTodo = () => {
    try {
      sessionStorage.setItem("cookies-consent", "all");
      sessionStorage.setItem("cookies-opcionales", "true"); // listo para Analytics
    } catch {
      // si falla, no pasa nada grave; simplemente no recordará la elección
    }
    setVisible(false);
  };

  // Aceptar solo las necesarias (rechazar analíticas)
  const soloNecesarias = () => {
    try {
      sessionStorage.setItem("cookies-consent", "necessary");
      sessionStorage.setItem("cookies-opcionales", "false");
    } catch {
      //
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="position-fixed bottom-0 start-0 end-0 bg-dark text-light p-3 shadow-lg"
      style={{ zIndex: 1080 }}
      role="dialog"
      aria-modal="true"
      aria-label="Aviso de cookies"
    >
      <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        {/* Texto del aviso */}
        <div className="small">
          En <strong>Explora Huelva</strong> utilizamos{" "}
          <strong>cookies técnicas necesarias</strong> para que la web
          funcione correctamente y, de forma opcional,{" "}
          <strong>cookies de análisis</strong> para obtener estadísticas de uso
          y mejorar nuestros servicios.
          <br />
          Puedes aceptar todas las cookies o conservar solo las necesarias.
          En cualquier momento puedes obtener más información en nuestra{" "}
          <a
            href="/cookies"
            className="link-light text-decoration-underline"
          >
            Política de Cookies
          </a>{" "}
          y en la{" "}
          <a
            href="/privacidad"
            className="link-light text-decoration-underline"
          >
            Política de Privacidad
          </a>.
        </div>

        {/* Botones de acción */}
        <div className="d-flex gap-2 flex-shrink-0">
          <button
            type="button"
            className="btn btn-outline-light btn-sm"
            onClick={soloNecesarias}
          >
            Solo necesarias
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={aceptarTodo}
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}
