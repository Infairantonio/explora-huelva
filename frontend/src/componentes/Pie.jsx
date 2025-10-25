// src/componentes/Pie.jsx
// Footer moderno con redes, enlaces, newsletter y barra legal.
// Solo usa Bootstrap y bootstrap-icons.

import { useState } from "react";
import { Link } from "react-router-dom";

export default function Pie() {
  const [email, setEmail] = useState("");

  const suscribir = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    alert("¡Gracias! Te avisaremos de las novedades 😊");
    setEmail("");
  };

  // Hacer scroll al inicio con animación suave
  const goTop = () => window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

  return (
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
                aria-label="Instagram"
                title="Instagram"
              >
                <i className="bi bi-instagram" />
              </a>
              <a
                className="btn btn-outline-light btn-sm rounded-circle"
                href="https://twitter.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                title="Twitter"
              >
                <i className="bi bi-twitter" />
              </a>
              <a
                className="btn btn-outline-light btn-sm rounded-circle"
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
              >
                <i className="bi bi-facebook" />
              </a>
              <a
                className="btn btn-outline-light btn-sm rounded-circle"
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                title="YouTube"
              >
                <i className="bi bi-youtube" />
              </a>
              <a
                className="btn btn-outline-light btn-sm rounded-circle"
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <i className="bi bi-whatsapp" />
              </a>
            </nav>
          </div>

          {/* Enlaces: Explorar */}
          <div className="col-6 col-md-2">
            <h6 className="text-uppercase text-secondary fw-bold small">Explorar</h6>
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
                <a className="link-light link-opacity-75-hover d-inline-block py-1" href="#" onClick={goTop}>
                  Mapa
                </a>
              </li>
            </ul>
          </div>

          {/* Enlaces: Compañía */}
          <div className="col-6 col-md-2">
            <h6 className="text-uppercase text-secondary fw-bold small">Compañía</h6>
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
                <a className="link-light link-opacity-75-hover d-inline-block py-1" href="#" onClick={goTop}>
                  Contacto
                </a>
              </li>
              <li>
                <a className="link-light link-opacity-75-hover d-inline-block py-1" href="#" onClick={goTop}>
                  Ayuda
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter + “badges” */}
          <div className="col-12 col-md-4">
            <h6 className="text-uppercase text-secondary fw-bold small">Novedades</h6>
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
              />
              <button className="btn btn-primary">Suscribirme</button>
            </form>

            <div className="d-flex flex-wrap gap-2 mt-3">
              <a className="btn btn-outline-light btn-sm px-3" href="#" role="button" title="App Store (próximamente)" onClick={goTop}>
                <i className="bi bi-apple me-1" /> App Store
              </a>
              <a className="btn btn-outline-light btn-sm px-3" href="#" role="button" title="Google Play (próximamente)" onClick={goTop}>
                <i className="bi bi-google-play me-1" /> Google Play
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior legal */}
      <div className="border-top border-secondary">
        <div className="container py-3 d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
          <div className="small text-secondary">
            © {new Date().getFullYear()} Explora Huelva ·
            <a className="link-light link-opacity-75-hover ms-2 me-2" href="#" onClick={goTop}>Privacidad</a>·
            <a className="link-light link-opacity-75-hover ms-2" href="#" onClick={goTop}>Términos</a>
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
  );
}
