// src/paginas/Contacto.jsx
import { useState } from "react";
import { API_URL } from "../servicios/api";

export default function Contacto() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const enviar = async (e) => {
    e.preventDefault();
    setOkMsg("");
    setErrMsg("");

    if (!nombre.trim() || !email.trim() || !mensaje.trim()) {
      setErrMsg("Por favor, rellena todos los campos.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch(`${API_URL}/contacto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          mensaje: mensaje.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.mensaje || "No se pudo enviar el mensaje.";
        throw new Error(msg);
      }

      setOkMsg("Mensaje enviado correctamente. ¡Gracias por escribir! 😊");
      setNombre("");
      setEmail("");
      setMensaje("");
    } catch (err) {
      setErrMsg(err.message || "Error al enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="container py-4" role="main">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          {/* Cabecera */}
          <header className="mb-4">
            <h1 className="h3 fw-bold mb-2">Contacto</h1>
            <p className="text-muted mb-0">
              Si tienes dudas, propuestas de rutas o ideas para Explora Huelva,
              puedes escribirnos por este formulario o por los medios de contacto.
            </p>
          </header>

          <div className="row g-4">
            {/* Datos de contacto directos */}
            <section className="col-12 col-md-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h5 mb-3">Cómo puedes encontrarnos</h2>

                  <ul className="list-unstyled mb-3">
                    <li className="mb-3 d-flex align-items-start gap-2">
                      <i className="bi bi-envelope-open text-primary mt-1" />
                      <div>
                        <div className="fw-semibold">Correo electrónico</div>
                        <a
                          href="mailto:hola@explorahuelva.test"
                          className="link-primary link-offset-1"
                        >
                          hola@explorahuelva.test
                        </a>
                      </div>
                    </li>

                    <li className="mb-3 d-flex align-items-start gap-2">
                      <i className="bi bi-whatsapp text-success mt-1" />
                      <div>
                        <div className="fw-semibold">WhatsApp (solo mensajes)</div>
                        <a
                          href="https://wa.me/34600000000"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-primary link-offset-1"
                        >
                          +34 600 00 00 00
                        </a>
                      </div>
                    </li>

                    <li className="mb-3 d-flex align-items-start gap-2">
                      <i className="bi bi-instagram text-danger mt-1" />
                      <div>
                        <div className="fw-semibold">Instagram</div>
                        <a
                          href="https://www.instagram.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-primary link-offset-1"
                        >
                          @explorahuelva
                        </a>
                      </div>
                    </li>
                  </ul>

                  <p className="small text-muted mb-0">
                    Normalmente respondemos en un plazo de 24-48 horas laborables.
                  </p>
                </div>
              </div>
            </section>

            {/* Formulario de contacto REAL (via backend) */}
            <section className="col-12 col-md-7">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h5 mb-3">Escríbenos un mensaje</h2>
                  <p className="text-muted">
                    Tu mensaje se enviará a nuestro correo de contacto.
                  </p>

                  {okMsg && (
                    <div className="alert alert-success py-2">{okMsg}</div>
                  )}
                  {errMsg && (
                    <div className="alert alert-danger py-2">{errMsg}</div>
                  )}

                  <form onSubmit={enviar} noValidate>
                    <div className="mb-3">
                      <label htmlFor="contacto-nombre" className="form-label">
                        Nombre
                      </label>
                      <input
                        id="contacto-nombre"
                        type="text"
                        className="form-control"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                        disabled={enviando}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="contacto-email" className="form-label">
                        Correo electrónico
                      </label>
                      <input
                        id="contacto-email"
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={enviando}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="contacto-mensaje" className="form-label">
                        Mensaje
                      </label>
                      <textarea
                        id="contacto-mensaje"
                        className="form-control"
                        rows={4}
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        required
                        disabled={enviando}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={enviando}
                    >
                      {enviando ? "Enviando..." : "Enviar mensaje"}
                    </button>
                  </form>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
