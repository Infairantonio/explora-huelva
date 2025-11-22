// src/componentes/Pie.jsx
// Footer moderno con redes, enlaces, newsletter, barra legal y modal profesional.

import { useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../servicios/api";

export default function Pie() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  // 🔹 Estado del modal "Próximamente"
  const [showModal, setShowModal] = useState(false);

  const abrirModal = () => setShowModal(true);
  const cerrarModal = () => setShowModal(false);

  // --- Enviar email al backend ---
  const suscribir = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    if (!email.trim()) return;

    try {
      setEnviando(true);

      const res = await fetch(`${API_URL}/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          mensaje: "Nueva suscripción a novedades desde el footer.",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.mensaje || "Error al enviar");
      }

      setOkMsg("¡Gracias! Te hemos apuntado a las novedades 😊");
      setEmail("");
    } catch (err) {
      setErrMsg(err.message || "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  };

  // Subir arriba
  const goTop = () =>
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

  return (
    <>
      {/* ======================= */}
      {/*       FOOTER           */}
      {/* ======================= */}
      <footer className="mt-auto bg-dark text-light border-top border-secondary">
        {/* Zona principal */}
        <div className="container py-5">
          <div className="row g-4">
            {/* Marca + redes */}
            <div className="col-12 col-md-4">
              <h5 className="fw-bold">Explora Huelva</h5>
              <p className="text-secondary mb-3">
                Descubre rutas, lugares y experiencias únicas en la provincia.
                Comparte momentos y encuentra tu próxima aventura.
              </p>

              <nav aria-label="Redes sociales" className="d-flex gap-2">
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-instagram" />
                </a>
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://twitter.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-twitter" />
                </a>
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://www.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-facebook" />
                </a>
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://www.youtube.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-youtube" />
                </a>
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://wa.me/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-whatsapp" />
                </a>
              </nav>
            </div>

            {/* Enlaces: Explorar */}
            <div className="col-6 col-md-2">
              <h6 className="text-uppercase text-secondary fw-bold small">
                Explorar
              </h6>
              <ul className="list-unstyled mb-0">
                <li>
                  <Link
                    className="link-light link-opacity-75-hover d-inline-block py-1"
                    to="/explorar/rutas"
                    onClick={goTop}
                  >
                    Rutas
                  </Link>
                </li>
                <li>
                  <Link
                    className="link-light link-opacity-75-hover d-inline-block py-1"
                    to="/explorar/lugares"
                    onClick={goTop}
                  >
                    Lugares
                  </Link>
                </li>
                <li>
                  <Link
                    className="link-light link-opacity-75-hover d-inline-block py-1"
                    to="/explorar/experiencias"
                    onClick={goTop}
                  >
                    Experiencias
                  </Link>
                </li>
                <li>
                  <a
                    className="link-light link-opacity-75-hover d-inline-block py-1"
                    href="mapa"
                    onClick={goTop}
                  >
                    Mapa
                  </a>
                </li>
              </ul>
            </div>

            {/* Enlaces: Compañía */}
            <div className="col-6 col-md-2">
              <h6 className="text-uppercase text-secondary fw-bold small">
                Compañía
              </h6>
              <ul className="list-unstyled mb-0">
                <li>
                  <Link
                    className="link-light link-opacity-75-hover d-inline-block py-1"
                    to="/sobre"
                    onClick={goTop}
                  >
                    Sobre nosotros
                  </Link>
                </li>
                <li>
                  <Link
                    className="link-light link-opacity-75-hover d-inline-block py-1"
                    to="/blog"
                    onClick={goTop}
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    className="link-light link-opacity-75-hover d-inline-block py-1"
                    to="/contacto"
                    onClick={goTop}
                  >
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link
                    className="link-light link-opacity-75-hover d-inline-block py-1"
                    to="/ayuda"
                    onClick={goTop}
                  >
                    Ayuda
                  </Link>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="col-12 col-md-4">
              <h6 className="text-uppercase text-secondary fw-bold small">
                Novedades
              </h6>
              <p className="text-secondary">
                Suscríbete para recibir rutas y lugares destacados.
              </p>

              <form className="d-flex gap-2" onSubmit={suscribir}>
                <input
                  type="email"
                  className="form-control bg-dark text-light border-secondary"
                  placeholder="Tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={enviando}
                />
                <button className="btn btn-primary" disabled={enviando}>
                  {enviando ? "Enviando..." : "Suscribirme"}
                </button>
              </form>

              {okMsg && <p className="text-success small mt-2">{okMsg}</p>}
              {errMsg && <p className="text-danger small mt-2">{errMsg}</p>}

              <div className="d-flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-light btn-sm px-3"
                  onClick={abrirModal}
                >
                  <i className="bi bi-apple me-1" /> App Store
                </button>

                <button
                  type="button"
                  className="btn btn-outline-light btn-sm px-3"
                  onClick={abrirModal}
                >
                  <i className="bi bi-google-play me-1" /> Google Play
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="border-top border-secondary">
          <div className="container py-3 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
            <div className="small text-secondary">
              © {new Date().getFullYear()} Explora Huelva ·
              <Link
                className="link-light link-opacity-75-hover ms-2 me-2"
                to="/privacidad"
                onClick={goTop}
              >
                Privacidad
              </Link>
              ·
              <Link
                className="link-light link-opacity-75-hover ms-2"
                to="/terminos"
                onClick={goTop}
              >
                Términos
              </Link>
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="small text-secondary">Idioma</span>
              <select
                className="form-select form-select-sm bg-dark text-light border-secondary w-auto"
                aria-label="Seleccionar idioma"
                onChange={(e) => localStorage.setItem("lang", e.target.value)}
                defaultValue={localStorage.getItem("lang") || "es"}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </footer>

      {/* ======================= */}
      {/*     MODAL PROFESIONAL   */}
      {/* ======================= */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">
                  🚧 Disponible próximamente
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cerrarModal}
                ></button>
              </div>

              <div className="modal-body text-center">
                <p className="text-secondary mb-3">
                  Las apps oficiales de <strong>Explora Huelva</strong> estarán
                  disponibles muy pronto.
                </p>

                <i className="bi bi-phone display-4 text-primary"></i>

                <p className="mt-3 small text-secondary">
                  Podrás descargarlas en App Store y Google Play.
                </p>
              </div>

              <div className="modal-footer border-secondary">
                <button
                  className="btn btn-primary px-4"
                  onClick={cerrarModal}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
