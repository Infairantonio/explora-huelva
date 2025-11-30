// src/paginas/Privacidad.jsx
// Página de Política de Privacidad de Explora Huelva con lenguaje claro y sencillo.

import { Link } from "react-router-dom";

export default function Privacidad() {
  return (
    <main className="container py-4">
      {/* Cabecera */}
      <header className="mb-4">
        <h1 className="h4 fw-bold mb-2">
          <i className="bi bi-shield-lock me-2" />
          Política de Privacidad
        </h1>
        <p className="text-muted">
          Información sobre cómo recogemos, usamos y protegemos tus datos personales.
        </p>
      </header>

      {/* Contenido */}
      <article className="card border-0 shadow-sm p-4">

        {/* 1. Responsable */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">1. Responsable del tratamiento</h2>
          <p className="text-muted mb-1">El responsable del sitio es:</p>
          <ul className="text-muted mb-0">
            <li><strong>Nombre:</strong> Explora Huelva</li>
            <li><strong>Email:</strong> contacto@explorahuelva.com</li>
            <li><strong>Actividad:</strong> plataforma informativa sobre lugares y experiencias de Huelva.</li>
          </ul>
        </section>

        {/* 2. Datos recogidos */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">2. Datos que recogemos</h2>
          <ul className="text-muted">
            <li><strong>Datos de registro:</strong> email y contraseña cifrada.</li>
            <li><strong>Datos de uso:</strong> lugares guardados, interacciones o actividad dentro del panel.</li>
            <li><strong>Datos enviados en formularios:</strong> mensajes o solicitudes.</li>
            <li><strong>Datos técnicos:</strong> IP, navegador y datos básicos de sesión.</li>
          </ul>
        </section>

        {/* 3. Finalidades */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">3. Para qué usamos tus datos</h2>
          <ul className="text-muted">
            <li>Gestionar tu cuenta y tu contenido.</li>
            <li>Permitir que guardes y consultes lugares o rutas.</li>
            <li>Responder consultas enviadas por email o formulario.</li>
            <li>Enviar avisos solo si das tu consentimiento.</li>
            <li>Mantener la seguridad de la plataforma.</li>
          </ul>
        </section>

        {/* 4. Base legal */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">4. Base legal</h2>
          <ul className="text-muted">
            <li><strong>Consentimiento:</strong> formularios o avisos voluntarios.</li>
            <li><strong>Ejecución del servicio:</strong> funcionamiento normal del sitio como usuario registrado.</li>
            <li><strong>Interés legítimo:</strong> seguridad y prevención de fraude.</li>
          </ul>
        </section>

        {/* 5. Destinatarios */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">5. Destinatarios</h2>
          <p className="text-muted">
            No vendemos tus datos. Solo se comparten con proveedores necesarios:
          </p>
          <ul className="text-muted">
            <li>Servicios de hosting.</li>
            <li>Servicios de email si envías un formulario.</li>
            <li>Herramientas básicas de seguridad.</li>
          </ul>
          <p className="text-muted mb-0">Todos cumplen el RGPD.</p>
        </section>

        {/* 6. Conservación */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">6. Tiempo de conservación</h2>
          <ul className="text-muted">
            <li>Mientras tengas la cuenta activa.</li>
            <li>Hasta que solicites eliminar tus datos.</li>
            <li>Las consultas se guardan solo lo necesario para gestionarlas.</li>
          </ul>
        </section>

        {/* 7. Derechos */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">7. Tus derechos</h2>
          <p className="text-muted">Puedes pedir en cualquier momento:</p>
          <ul className="text-muted">
            <li>Acceder a tus datos.</li>
            <li>Rectificarlos.</li>
            <li>Eliminarlos.</li>
            <li>Oponerte a un tratamiento.</li>
            <li>Portabilidad de tus datos.</li>
            <li>Retirar tu consentimiento.</li>
          </ul>
          <p className="text-muted mb-0">
            Escríbenos a: <strong>contacto@explorahuelva.com</strong>
          </p>
        </section>

        {/* 8. Seguridad */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">8. Seguridad</h2>
          <p className="text-muted">
            Utilizamos medidas para proteger tu información.  
            Las contraseñas se guardan cifradas y el sitio funciona bajo HTTPS.
          </p>
        </section>

        {/* 9. Menores */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">9. Menores</h2>
          <p className="text-muted">
            Explora Huelva no está dirigida a menores de 14 años.  
            Si detectamos una cuenta de un menor, será eliminada.
          </p>
        </section>

        {/* 10. Cambios */}
        <section className="mb-2">
          <h2 className="h5 fw-bold mb-3">10. Cambios en esta política</h2>
          <p className="text-muted mb-0">
            Podemos actualizar esta política para cumplir la normativa o mejorar la información.  
            Avisaremos si los cambios son importantes.
          </p>
        </section>
      </article>

      {/* Botón para volver */}
      <div className="mt-4">
        <Link className="btn btn-secondary" to="/">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
