// src/paginas/Terminos.jsx
// Página de términos legales y condiciones de uso de Explora Huelva.

import { Link } from "react-router-dom";

export default function Terminos() {
  return (
    <main className="container py-4">
      {/* Cabecera */}
      <header className="mb-4">
        <h1 className="h4 fw-bold mb-2">
          <i className="bi bi-file-earmark-text me-2" />
          Términos y Condiciones de Uso
        </h1>
        <p className="text-muted">
          Información legal y condiciones que regulan el uso de Explora Huelva.
        </p>
      </header>

      {/* Contenido principal */}
      <article className="card border-0 shadow-sm p-4">
        {/* 1. Información del titular */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">1. Información del titular</h2>
          <p className="text-muted">
            Este sitio web es gestionado por:
          </p>

          <ul className="text-muted mb-0">
            <li><strong>Nombre:</strong> Explora Huelva (proyecto personal)</li>
            <li><strong>Email de contacto:</strong> contacto@explorahuelva.com</li>
            <li>
              <strong>Finalidad:</strong> plataforma informativa y social sobre rutas,
              lugares y experiencias de la provincia de Huelva.
            </li>
          </ul>
        </section>

        {/* 2. Aceptación */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">2. Aceptación de las condiciones</h2>
          <p className="text-muted">
            El acceso y uso de esta web implica la aceptación plena de los
            presentes Términos y Condiciones. Si no estás de acuerdo, debes
            abstenerte de usar la plataforma.
          </p>
        </section>

        {/* 3. Uso permitido */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">3. Uso permitido de la plataforma</h2>
          <p className="text-muted">Como usuario te comprometes a:</p>

          <ul className="text-muted">
            <li>Hacer un uso adecuado, legal y respetuoso de los contenidos.</li>
            <li>No publicar contenido ofensivo, violento, difamatorio o ilegal.</li>
            <li>No utilizar Explora Huelva para actividades fraudulentas.</li>
            <li>No interferir con el funcionamiento técnico de la plataforma.</li>
            <li>No crear múltiples cuentas para manipular interacciones.</li>
          </ul>
        </section>

        {/* 4. Registro de usuarios */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">4. Registro de usuarios</h2>
          <p className="text-muted">
            Para acceder a determinadas funciones (como guardar lugares o crear
            contenido) es necesario registrarse.
          </p>

          <ul className="text-muted">
            <li>El usuario debe proporcionar información veraz.</li>
            <li>El usuario es responsable de mantener la confidencialidad de su cuenta.</li>
            <li>El administrador podrá suspender o eliminar cuentas en caso de uso indebido.</li>
          </ul>
        </section>

        {/* 5. Propiedad intelectual */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">5. Propiedad intelectual</h2>
          <p className="text-muted">
            Todos los textos, imágenes, rutas, diseño, código y contenido
            publicado en esta web pertenecen a Explora Huelva o a sus
            respectivos autores.
          </p>

          <p className="text-muted">
            Queda prohibida la reproducción total o parcial sin autorización.
          </p>
        </section>

        {/* 6. Contenidos de usuarios */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">6. Contenidos enviados por los usuarios</h2>
          <p className="text-muted">
            Si publicas o compartes contenido en Explora Huelva (fotos, rutas, comentarios…):
          </p>

          <ul className="text-muted">
            <li>Garantizas que eres el autor o tienes derechos para publicarlo.</li>
            <li>
              Concedes a Explora Huelva una licencia no exclusiva de uso y
              exhibición dentro de la plataforma.
            </li>
            <li>El contenido podrá ser eliminado si infringe estas condiciones.</li>
          </ul>
        </section>

        {/* 7. Enlaces externos */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">7. Enlaces externos</h2>
          <p className="text-muted">
            Explora Huelva puede incluir enlaces a páginas de terceros.
            No nos responsabilizamos de su contenido ni de su política de privacidad.
          </p>
        </section>

        {/* 8. Responsabilidad */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">8. Exoneración de responsabilidad</h2>
          <p className="text-muted">
            Aunque intentamos mantener la información actualizada, Explora
            Huelva no garantiza la exactitud completa de todos los datos
            (horarios, accesos, rutas, estado del terreno, etc.).
          </p>

          <p className="text-muted mb-0">
            El uso de esta web se realiza bajo tu propia responsabilidad.
          </p>
        </section>

        {/* 9. Suspensión del servicio */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">9. Suspensión del servicio</h2>
          <p className="text-muted mb-0">
            Nos reservamos el derecho a interrumpir temporal o definitivamente
            la plataforma por motivos técnicos, legales, de mantenimiento o de
            seguridad.
          </p>
        </section>

        {/* 10. Ley aplicable */}
        <section className="mb-2">
          <h2 className="h5 fw-bold mb-3">10. Legislación aplicable</h2>
          <p className="text-muted mb-0">
            Los presentes términos se rigen por la legislación española.
            En caso de conflicto, las partes se someten a los juzgados y
            tribunales de Huelva (España).
          </p>
        </section>
      </article>

      {/* Enlace de vuelta */}
      <div className="mt-4">
        <Link className="btn btn-secondary" to="/">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
