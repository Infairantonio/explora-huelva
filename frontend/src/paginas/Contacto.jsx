// src/paginas/Contacto.jsx
// Página de contacto 100% frontend usando FormSubmit
// Envía directamente al correo asociado al token de FormSubmit

import { useState } from "react";

export default function Contacto() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const enviar = (e) => {
    if (!nombre.trim() || !email.trim() || !mensaje.trim()) {
      e.preventDefault();
      setErrMsg("Por favor, rellena todos los campos.");
      return;
    }

    setEnviando(true);
    setOkMsg("");
    setErrMsg("");

    // Esta parte es solo “feedback local”.
    // Después de enviar, FormSubmit redirigirá a _next (tu propia web).
    setTimeout(() => {
      setOkMsg("Mensaje enviado correctamente. ¡Gracias por escribir! 😊");
      setNombre("");
      setEmail("");
      setMensaje("");
      setEnviando(false);
    }, 1500);
  };

  return (
    <main className="container py-4" role="main">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10">
          <header className="mb-4">
            <h1 className="h3 fw-bold mb-2">Contacto</h1>
            <p className="text-muted mb-0">
              Si tienes dudas, propuestas o ideas para Explora Huelva,
              puedes escribirnos por aquí.
            </p>
          </header>

          <div className="row g-4">
            {/* Información de contacto directa - SOLO EMAIL + DECORACIÓN */}
            <section className="col-12 col-md-5">
              <div
                className="card border-0 shadow-sm h-100"
                style={{
                  background:
                    "linear-gradient(135deg, #f7f9fc 0%, #eef3f9 100%)",
                }}
              >
                <div className="card-body">
                  <h2 className="h5 mb-3 d-flex align-items-center gap-2">
                    <i className="bi bi-chat-dots text-primary" />
                    Información de contacto
                  </h2>

                  <ul className="list-unstyled mb-4">
                    <li className="mb-3 d-flex align-items-start gap-2">
                      <i className="bi bi-envelope-open text-primary mt-1" />
                      <div>
                        <div className="fw-semibold">Correo electrónico</div>
                        <a
                          href="mailto:antoniojoseromeromendez@gmail.com"
                          className="link-primary link-offset-1"
                        >
                          antoniojoseromeromendez@gmail.com
                        </a>
                      </div>
                    </li>
                  </ul>

                  {/* Decoración */}
                  <div className="mt-4 p-3 rounded text-center bg-white shadow-sm">
                    <i className="bi bi-send-fill text-primary fs-3"></i>
                    <p className="text-muted small mt-2 mb-0">
                      Respondemos normalmente en 24–48 horas.
                      ¡Gracias por confiar en Explora Huelva!
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Formulario */}
            <section className="col-12 col-md-7">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h2 className="h5 mb-3">Escríbenos un mensaje</h2>
                  <p className="text-muted">
                    Este mensaje se enviará directamente a nuestro correo.
                  </p>

                  {okMsg && (
                    <div className="alert alert-success py-2">{okMsg}</div>
                  )}
                  {errMsg && (
                    <div className="alert alert-danger py-2">{errMsg}</div>
                  )}

                  <form
                    // 👉 Usamos el token de FormSubmit en lugar del email
                    action="https://formsubmit.co/e398bc3dcfcb0891bdce69227afcb1b5"
                    method="POST"
                    onSubmit={enviar}
                  >
                    {/* Configuración oculta */}
                    <input type="hidden" name="_captcha" value="false" />
                    <input type="hidden" name="_template" value="table" />
                    <input
                      type="hidden"
                      name="_subject"
                      value="Nuevo mensaje desde Explora Huelva"
                    />
                    {/* 👉 Después de enviar, vuelve a tu propia página */}
                    <input
                      type="hidden"
                      name="_next"
                      value="https://explorahuelva.es/contacto"
                    />

                    <div className="mb-3">
                      <label htmlFor="contacto-nombre" className="form-label">
                        Nombre
                      </label>
                      <input
                        id="contacto-nombre"
                        type="text"
                        name="nombre"
                        className="form-control"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        disabled={enviando}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="contacto-email" className="form-label">
                        Correo electrónico
                      </label>
                      <input
                        id="contacto-email"
                        type="email"
                        name="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={enviando}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="contacto-mensaje" className="form-label">
                        Mensaje
                      </label>
                      <textarea
                        id="contacto-mensaje"
                        name="mensaje"
                        className="form-control"
                        rows={4}
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        disabled={enviando}
                        required
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
