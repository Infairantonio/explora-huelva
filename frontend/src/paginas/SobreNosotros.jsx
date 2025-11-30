// src/paginas/SobreNosotros.jsx
// Página estática "Sobre nosotros" con diseño claro y contenido informativo.

import { Link } from "react-router-dom";

export default function SobreNosotros() {
  return (
    <div className="container py-5">

      {/* Encabezado principal */}
      <section className="text-center mb-5">
        <h1 className="display-6 fw-semibold">Sobre nosotros</h1>
        <p className="text-muted mx-auto" style={{ maxWidth: 720 }}>
          Explora Huelva es un proyecto creado para descubrir lugares, rutas y 
          experiencias únicas en la provincia. Nuestro objetivo es facilitar 
          que cualquier persona pueda explorar, compartir y disfrutar de planes auténticos.
        </p>
      </section>

      {/* Valores principales */}
      <section className="row g-4 mb-5">
        <div className="col-12 col-md-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <div className="mb-2 fs-3"><i className="bi bi-map"></i></div>
              <h3 className="h5">Local y cercano</h3>
              <p className="text-muted mb-0">
                Pensado para la gente de Huelva y quienes la visitan. Información útil,
                práctica y actualizada por la comunidad.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <div className="mb-2 fs-3"><i className="bi bi-people"></i></div>
              <h3 className="h5">Comunidad primero</h3>
              <p className="text-muted mb-0">
                Las mejores recomendaciones vienen de personas reales. Fomentamos 
                un espacio respetuoso y colaborativo.
              </p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card h-100 shadow-sm border-0">
            <div className="card-body">
              <div className="mb-2 fs-3"><i className="bi bi-compass"></i></div>
              <h3 className="h5">Explorar es fácil</h3>
              <p className="text-muted mb-0">
                Crear tarjetas, añadir imágenes y organizar tus rutas es rápido y 
                sencillo desde el panel personal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Equipo (placeholder simple) */}
      <section className="mb-5">
        <h2 className="h4 mb-3">Quiénes somos</h2>

        <div className="row g-3">
          {[
            { nombre: "María", rol: "Contenido y comunidad" },
            { nombre: "Juan", rol: "Diseño y producto" },
            { nombre: "Alex", rol: "Tecnología" },
          ].map((p, i) => (
            <div key={i} className="col-12 col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body d-flex align-items-center">
                  <div className="me-3">
                    <span
                      className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light"
                      style={{ width: 56, height: 56 }}
                    >
                      <i className="bi bi-person fs-4 text-secondary"></i>
                    </span>
                  </div>
                  <div>
                    <div className="fw-semibold">{p.nombre}</div>
                    <div className="text-muted small">{p.rol}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="mb-5">
        <h2 className="h4 mb-3">Preguntas frecuentes</h2>

        <div className="accordion" id="faqSobre">

          <div className="accordion-item">
            <h2 className="accordion-header" id="faq1h">
              <button
                className="accordion-button"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#faq1"
                aria-expanded="true"
                aria-controls="faq1"
              >
                ¿Cómo creo una tarjeta?
              </button>
            </h2>
            <div
              id="faq1"
              className="accordion-collapse collapse show"
              aria-labelledby="faq1h"
              data-bs-parent="#faqSobre"
            >
              <div className="accordion-body">
                Entra en tu <strong>Panel</strong> y pulsa <em>Nueva</em>. 
                Rellena la información y guarda. En segundos estará publicada.
              </div>
            </div>
          </div>

          <div className="accordion-item">
            <h2 className="accordion-header" id="faq2h">
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#faq2"
                aria-expanded="false"
                aria-controls="faq2"
              >
                ¿Es gratis?
              </button>
            </h2>

            <div
              id="faq2"
              className="accordion-collapse collapse"
              aria-labelledby="faq2h"
              data-bs-parent="#faqSobre"
            >
              <div className="accordion-body">
                Sí, es totalmente gratuito. En el futuro podrá haber funciones 
                premium opcionales, pero la parte básica seguirá siendo libre.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Llamada a la acción */}
      <section className="text-center">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h3 className="h5">¿Te unes?</h3>
            <p className="text-muted mb-3">
              Regístrate y empieza a explorar la provincia de una forma diferente.
            </p>
            <Link to="/registro" className="btn btn-primary me-2">
              Crear cuenta
            </Link>
            <Link to="/explorar/lugares" className="btn btn-outline-secondary">
              Explorar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
