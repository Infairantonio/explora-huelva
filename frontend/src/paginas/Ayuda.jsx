// src/paginas/Ayuda.jsx · Página de ayuda y preguntas frecuentes de Explora Huelva

import { Link } from "react-router-dom";

export default function Ayuda() {
  return (
    <main className="container py-4">
      <header className="mb-4">
        <h1 className="h4 fw-bold mb-1">
          <i className="bi bi-question-circle me-2" />
          Ayuda · Explora Huelva
        </h1>
        <p className="text-muted mb-0">
          Resolvemos las dudas más habituales sobre cómo usar la plataforma.
        </p>
      </header>

      {/* Primeros pasos en la plataforma */}
      <section className="mb-4">
        <h2 className="h5 fw-bold mb-3">Primeros pasos</h2>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <p className="mb-2">
              <strong>¿Puedo usar Explora Huelva sin registrarme?</strong>
            </p>
            <p className="text-muted">
              Sí. Cualquier persona puede navegar por las rutas, lugares y
              experiencias públicas sin necesidad de crear una cuenta.
            </p>

            <hr />

            <p className="mb-2">
              <strong>¿Qué gano si creo una cuenta?</strong>
            </p>
            <p className="text-muted mb-0">
              Al registrarte podrás guardar tus lugares favoritos, crear tus
              propias rutas y llevar un registro de las experiencias que vayas
              viviendo en la provincia de Huelva.
            </p>
          </div>
        </div>
      </section>

      {/* Información sobre panel y favoritos */}
      <section className="mb-4">
        <h2 className="h5 fw-bold mb-3">Mi panel y favoritos</h2>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <p className="mb-2">
              <strong>¿Qué es el panel de usuario?</strong>
            </p>
            <p className="text-muted">
              Es tu espacio personal dentro de Explora Huelva. Desde ahí podrás
              ver tus lugares guardados, tus rutas y cualquier contenido que
              hayas marcado como favorito.
            </p>

            <hr />

            <p className="mb-2">
              <strong>¿Cómo guardo un lugar o ruta?</strong>
            </p>
            <p className="text-muted mb-0">
              Cuando veas una ficha de lugar o ruta, usa el botón de “Guardar”
              o “Añadir a favoritos”. El contenido aparecerá después en tu
              panel cuando inicies sesión.
            </p>
          </div>
        </div>
      </section>

      {/* Incidencias habituales de uso */}
      <section className="mb-4">
        <h2 className="h5 fw-bold mb-3">Problemas frecuentes</h2>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <p className="mb-2">
              <strong>No puedo iniciar sesión</strong>
            </p>
            <p className="text-muted">
              Revisa que el correo y la contraseña sean correctos. Si sigues con
              problemas, prueba a restablecer tu contraseña desde la pantalla de
              acceso.
            </p>

            <hr />

            <p className="mb-2">
              <strong>No se cargan bien las rutas o el mapa</strong>
            </p>
            <p className="text-muted mb-0">
              Asegúrate de tener conexión a Internet y de permitir la
              geolocalización si el navegador lo solicita. Si el problema
              continúa, prueba con otro navegador o dispositivo.
            </p>
          </div>
        </div>
      </section>

      {/* Derivamos a la página de contacto para dudas adicionales */}
      <section className="mb-4">
        <h2 className="h5 fw-bold mb-3">¿Sigues con dudas?</h2>
        <div className="alert alert-secondary-subtle border">
          <p className="mb-2">
            Si algo no te queda claro o has encontrado un problema, puedes
            escribirnos directamente.
          </p>
          <p className="mb-0">
            Ve a la página de{" "}
            <Link to="/contacto" className="fw-semibold">
              contacto
            </Link>{" "}
            y cuéntanos qué necesitas. Intentaremos ayudarte lo antes posible.
          </p>
        </div>
      </section>
    </main>
  );
}
