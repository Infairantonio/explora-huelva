// src/paginas/Contacto.jsx
import { useState } from "react";

export default function Contacto() {
  const [form, setForm] = useState({ nombre: "", email: "", asunto: "", mensaje: "" });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    // De momento estático: solo mostramos un aviso.
    alert("¡Gracias! Hemos recibido tu mensaje (demo).");
    setForm({ nombre: "", email: "", asunto: "", mensaje: "" });
  };

  return (
    <div className="bg-light">
      <header className="bg-white border-bottom">
        <div className="container py-5">
          <h1 className="display-6 fw-bold mb-2">Contacto</h1>
          <p className="text-muted mb-0">
            ¿Tienes dudas, propuestas o incidencias? Escríbenos y te responderemos lo antes posible.
          </p>
        </div>
      </header>

      <section className="container py-5">
        <div className="row g-4">
          {/* Datos de contacto */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h2 className="h6 text-uppercase text-secondary mb-3">Información</h2>
                <p className="mb-2">
                  <i className="bi bi-envelope me-2" />
                  soporte@explorahuelva.demo
                </p>
                <p className="mb-2">
                  <i className="bi bi-geo-alt me-2" />
                  Huelva, España
                </p>
                <p className="mb-0">
                  <i className="bi bi-clock me-2" />
                  L-V · 9:00–18:00
                </p>

                <hr className="my-4" />
                <h3 className="h6 text-uppercase text-secondary mb-3">Redes</h3>
                <div className="d-flex flex-wrap gap-2">
                  <a className="btn btn-outline-secondary btn-sm" href="https://www.instagram.com" target="_blank" rel="noreferrer">
                    <i className="bi bi-instagram me-1" /> Instagram
                  </a>
                  <a className="btn btn-outline-secondary btn-sm" href="https://twitter.com" target="_blank" rel="noreferrer">
                    <i className="bi bi-twitter me-1" /> Twitter
                  </a>
                  <a className="btn btn-outline-secondary btn-sm" href="https://www.facebook.com" target="_blank" rel="noreferrer">
                    <i className="bi bi-facebook me-1" /> Facebook
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario (demo) */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h2 className="h6 text-uppercase text-secondary mb-3">Envíanos un mensaje</h2>
                <form className="row g-3" onSubmit={onSubmit}>
                  <div className="col-md-6">
                    <label className="form-label">Nombre</label>
                    <input
                      name="nombre"
                      value={form.nombre}
                      onChange={onChange}
                      type="text"
                      className="form-control"
                      placeholder="Tu nombre"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      type="email"
                      className="form-control"
                      placeholder="tucorreo@ejemplo.com"
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Asunto</label>
                    <input
                      name="asunto"
                      value={form.asunto}
                      onChange={onChange}
                      type="text"
                      className="form-control"
                      placeholder="Motivo del mensaje"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Mensaje</label>
                    <textarea
                      name="mensaje"
                      value={form.mensaje}
                      onChange={onChange}
                      className="form-control"
                      rows={5}
                      placeholder="Cuéntanos en qué podemos ayudarte"
                      required
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button className="btn btn-primary">
                      <i className="bi bi-send me-1" /> Enviar (demo)
                    </button>
                  </div>
                </form>

                <div className="text-muted small mt-3">
                  * Esta página es una demostración: el formulario no envía datos a un servidor todavía.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
