// frontend/src/componentes/Pie.jsx
// Pie de página con enlaces, redes, newsletter y soporte PWA (instalar app).

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { newsletterApi } from "../servicios/newsletter";

export default function Pie() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  // Estado del modal informativo sobre la app / PWA
  const [showModal, setShowModal] = useState(false);

  const abrirModal = () => setShowModal(true);
  const cerrarModal = () => setShowModal(false);

  // --- Soporte PWA: botón "Instalar app" ---
  const [eventoInstalar, setEventoInstalar] = useState(null);
  const [mostrarBotonInstalar, setMostrarBotonInstalar] = useState(false);
  const [esIOS, setEsIOS] = useState(false);

  // ¿La app ya está instalada como PWA?
  const estaInstalada = () => {
    if (typeof window === "undefined") return false;

    // Estándar
    if (
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      return true;
    }

    // iOS antiguo
    if (navigator.standalone) return true;

    return false;
  };

  // Detectar dispositivo y capturar beforeinstallprompt (Android / Chrome)
  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }

    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setEsIOS(ios);

    // Si ya está instalada, no mostramos botón
    if (estaInstalada()) {
      setMostrarBotonInstalar(false);
      return;
    }

    // iOS nunca dispara beforeinstallprompt, pero queremos enseñar el botón
    if (ios) {
      setMostrarBotonInstalar(true);
    }

    const handler = (e) => {
      // Android / navegadores compatibles
      e.preventDefault();
      setEventoInstalar(e);
      setMostrarBotonInstalar(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const instalarApp = async () => {
    // iOS o navegadores sin evento: mostramos instrucciones en el modal
    if (esIOS || !eventoInstalar) {
      setShowModal(true);
      return;
    }

    // Android / Chrome con beforeinstallprompt
    eventoInstalar.prompt();
    const { outcome } = await eventoInstalar.userChoice;

    if (outcome === "accepted") {
      console.log("Usuario aceptó instalar la PWA");
      setMostrarBotonInstalar(false);
      setEventoInstalar(null);
    } else {
      console.log("Usuario rechazó la instalación de la PWA");
    }
  };

  // Validación sencilla de email
  const esEmailValido = (valor) => {
    const v = valor.trim();
    if (!v) return false;
    // regex sencilla para validar formato básico
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  };

  // Enviar email al backend (newsletter con doble opt-in)
  const suscribir = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    const valor = email.trim();

    if (!esEmailValido(valor)) {
      setErrMsg("Por favor, introduce un correo electrónico válido.");
      return;
    }

    try {
      setEnviando(true);

      // Llamamos a la API de newsletter
      const data = await newsletterApi.suscribir(valor);

      if (!data?.ok) {
        throw new Error(
          data?.mensaje ||
            "No se ha podido procesar la suscripción en este momento."
        );
      }

      setOkMsg(
        "Te hemos enviado un correo para confirmar tu suscripción. Revisa también la carpeta de Spam o correo no deseado."
      );
      setEmail("");
    } catch (err) {
      setErrMsg(
        err?.message ||
          "No ha sido posible completar la suscripción. Inténtalo de nuevo en unos minutos."
      );
    } finally {
      setEnviando(false);
    }
  };

  // Desplaza la página al inicio
  const goTop = () =>
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

  return (
    <>
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

              <nav
                aria-label="Redes sociales"
                className="d-flex gap-2 flex-wrap"
              >
                {/* Instagram */}
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://www.instagram.com/explorahuelva"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram de Explora Huelva"
                >
                  <i className="bi bi-instagram" />
                </a>

                {/* X / Twitter */}
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://x.com/explorahuelva"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Perfil en X (Twitter) de Explora Huelva"
                >
                  <i className="bi bi-twitter" />
                </a>

                {/* Facebook */}
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://www.facebook.com/explorahuelva"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook de Explora Huelva"
                >
                  <i className="bi bi-facebook" />
                </a>

                {/* YouTube */}
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://www.youtube.com/@explorahuelva"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Canal de YouTube de Explora Huelva"
                >
                  <i className="bi bi-youtube" />
                </a>

                {/* TikTok */}
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://www.tiktok.com/@explorahuelva"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok de Explora Huelva"
                >
                  <i className="bi bi-tiktok" />
                </a>

                {/* WhatsApp */}
                <a
                  className="btn btn-outline-light btn-sm rounded-circle"
                  href="https://wa.me/34697315553"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contactar por WhatsApp con Explora Huelva"
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

            {/* Newsletter + apps */}
            <div className="col-12 col-md-4">
              <h6 className="text-uppercase text-secondary fw-bold small">
                Novedades
              </h6>
              <p className="text-secondary mb-2">
                Recibe rutas, planes y lugares destacados en tu correo.
                Podrás darte de baja cuando quieras.
              </p>

              <form
                className="d-flex flex-column flex-sm-row gap-2"
                onSubmit={suscribir}
              >
                <div className="flex-grow-1">
                  <input
                    type="email"
                    className="form-control bg-dark text-light border-secondary"
                    placeholder="tuemail@ejemplo.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrMsg(""); // limpiamos error al teclear
                      setOkMsg("");
                    }}
                    required
                    disabled={enviando}
                  />
                  <div className="form-text text-secondary">
                    Te enviaremos un email para{" "}
                    <strong>confirmar la suscripción</strong>.
                  </div>
                </div>
                <div>
                  <button
                    className="btn btn-primary w-100"
                    disabled={enviando || !esEmailValido(email)}
                  >
                    {enviando ? "Enviando…" : "Suscribirme"}
                  </button>
                </div>
              </form>

              {okMsg && (
                <p className="text-success small mt-2 mb-0">{okMsg}</p>
              )}
              {errMsg && (
                <p className="text-danger small mt-2 mb-0">{errMsg}</p>
              )}

              <div className="d-flex flex-wrap gap-2 mt-3">
                {/* Botón principal para instalar la app (PWA) */}
                {mostrarBotonInstalar && (
                  <button
                    type="button"
                    className="btn btn-success btn-sm px-3"
                    onClick={instalarApp}
                  >
                    <i className="bi bi-phone me-1" />
                    Instalar app
                  </button>
                )}

                {/* Botones informativos de tiendas (siguen abriendo el modal) */}
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

                {/* Descarga directa del APK de Android (opcional) */}
                <a
                  href="/.explorahuelva.apk"
                  className="btn btn-outline-success btn-sm px-3"
                  download
                >
                  <i className="bi bi-android2 me-1" />
                  APK Android
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Barra legal inferior */}
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
                className="link-light link-opacity-75-hover ms-2 me-2"
                to="/terminos"
                onClick={goTop}
              >
                Términos
              </Link>
              ·
              <Link
                className="link-light link-opacity-75-hover ms-2"
                to="/cookies"
                onClick={goTop}
              >
                Cookies
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

      {/* Modal informativo sobre la app / PWA */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.6)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-light">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">📱 Explora Huelva en tu móvil</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cerrarModal}
                ></button>
              </div>

              <div className="modal-body text-center">
                <p className="text-secondary mb-3">
                  <strong>Explora Huelva</strong> funciona como{" "}
                  <strong>aplicación web progresiva (PWA)</strong>.
                </p>

                <p className="text-secondary mb-3">
                  Para instalarla en tu dispositivo:
                </p>

                <ul className="text-start small text-secondary mb-3">
                  <li>
                    En <strong>Android</strong>: pulsa el botón{" "}
                    <strong>&quot;Instalar app&quot;</strong> cuando lo veas en
                    la parte inferior o usa el menú del navegador →
                    &quot;Añadir a pantalla de inicio&quot;.
                  </li>
                  <li>
                    En <strong>iPhone / iPad</strong>: abre la web en Safari,
                    pulsa el botón <strong>Compartir</strong> y elige{" "}
                    <strong>&quot;Añadir a pantalla de inicio&quot;</strong>.
                  </li>
                </ul>

                <p className="small text-secondary mb-0">
                  Una vez instalada, podrás abrir <strong>Explora Huelva</strong>{" "}
                  como si fuera una app más, con su icono en la pantalla de
                  inicio.
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
