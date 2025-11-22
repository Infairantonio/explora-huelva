// src/paginas/Privacidad.jsx
// Política de Privacidad conforme al RGPD y la LOPDGDD para Explora Huelva.

import { Link } from "react-router-dom";

export default function Privacidad() {
  return (
    <main className="container py-4">
      {/* CABECERA */}
      <header className="mb-4">
        <h1 className="h4 fw-bold mb-2">
          <i className="bi bi-shield-lock me-2" />
          Política de Privacidad
        </h1>
        <p className="text-muted">
          Información sobre cómo recogemos, usamos y protegemos tus datos
          personales en Explora Huelva.
        </p>
      </header>

      {/* CONTENIDO */}
      <article className="card border-0 shadow-sm p-4">
        {/* 1. Responsable */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">1. Responsable del tratamiento</h2>
          <p className="text-muted mb-1">
            El responsable del tratamiento de tus datos personales es:
          </p>
          <ul className="text-muted mb-0">
            <li><strong>Nombre:</strong> Explora Huelva (proyecto personal)</li>
            <li><strong>Email de contacto:</strong> contacto@explorahuelva.com</li>
            <li><strong>Finalidad del sitio:</strong> plataforma informativa y social sobre rutas, lugares y experiencias de Huelva.</li>
          </ul>
        </section>

        {/* 2. Datos que recogemos */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">2. Datos que recogemos</h2>
          <p className="text-muted">Tratamos los siguientes tipos de datos:</p>
          <ul className="text-muted">
            <li><strong>Datos de registro:</strong> email, contraseña (cifrada), nombre si se proporciona.</li>
            <li><strong>Datos de uso:</strong> rutas guardadas, favoritos, interacciones dentro de la plataforma.</li>
            <li><strong>Datos enviados por formularios:</strong> mensajes de contacto, solicitudes de soporte o suscripción a novedades.</li>
            <li><strong>Datos técnicos:</strong> dirección IP, navegador, identificadores de sesión.</li>
          </ul>
        </section>

        {/* 3. Finalidades */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">3. Finalidades del tratamiento</h2>
          <p className="text-muted">Usamos tus datos para:</p>
          <ul className="text-muted">
            <li>Gestionar tu cuenta como usuario.</li>
            <li>Permitir que guardes lugares, rutas o experiencias.</li>
            <li>Responder a mensajes enviados desde el formulario de contacto.</li>
            <li>Enviar comunicaciones informativas (solo si das tu consentimiento).</li>
            <li>Garantizar la seguridad de la plataforma.</li>
          </ul>
        </section>

        {/* 4. Base legal */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">4. Base legal para el tratamiento</h2>
          <p className="text-muted">Las bases legales son:</p>
          <ul className="text-muted">
            <li><strong>Consentimiento:</strong> suscripción a novedades, formularios o comunicaciones.</li>
            <li><strong>Ejecución de contrato:</strong> uso de la plataforma como usuario registrado.</li>
            <li><strong>Interés legítimo:</strong> mantener la seguridad y evitar usos fraudulentos.</li>
          </ul>
        </section>

        {/* 5. Destinatarios */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">5. Destinatarios de los datos</h2>
          <p className="text-muted">
            Tus datos no se venden ni se ceden a terceros.  
            Solo se comparten con proveedores estrictamente necesarios:
          </p>

          <ul className="text-muted">
            <li>Servicios de alojamiento web (hosting).</li>
            <li>Servicios de envío de email (solo si envías formularios).</li>
            <li>Herramientas de seguridad o analítica básica.</li>
          </ul>

          <p className="text-muted mb-0">
            Todos los proveedores cumplen con el RGPD.
          </p>
        </section>

        {/* 6. Conservación */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">6. Plazos de conservación</h2>
          <p className="text-muted">Conservamos los datos:</p>
          <ul className="text-muted">
            <li>Mientras tengas una cuenta activa.</li>
            <li>Hasta que solicites su eliminación.</li>
            <li>
              Los datos de comunicaciones o soporte se guardan el tiempo
              necesario para resolver la consulta.
            </li>
          </ul>
        </section>

        {/* 7. Derechos */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">7. Tus derechos</h2>
          <p className="text-muted">
            Puedes ejercer los siguientes derechos según el RGPD:
          </p>
          <ul className="text-muted">
            <li>Acceder a tus datos.</li>
            <li>Rectificarlos.</li>
            <li>Solicitar su eliminación.</li>
            <li>Oponerte a determinados tratamientos.</li>
            <li>Solicitar la portabilidad.</li>
            <li>Retirar tu consentimiento en cualquier momento.</li>
          </ul>

          <p className="text-muted mb-0">
            Para ejercerlos, escríbenos a:  
            <strong>contacto@explorahuelva.com</strong>
          </p>
        </section>

        {/* 8. Seguridad */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">8. Seguridad de los datos</h2>
          <p className="text-muted">
            Aplicamos medidas de seguridad para evitar accesos no autorizados,
            alteraciones o pérdida de datos.  
            Las contraseñas están cifradas y la plataforma usa protocolos
            seguros (HTTPS).
          </p>
        </section>

        {/* 9. Menores */}
        <section className="mb-4">
          <h2 className="h5 fw-bold mb-3">9. Menores de edad</h2>
          <p className="text-muted">
            Explora Huelva no está dirigida a menores de 14 años.  
            Si detectamos una cuenta creada por un menor, será eliminada de
            forma segura.
          </p>
        </section>

        {/* 10. Cambios */}
        <section className="mb-2">
          <h2 className="h5 fw-bold mb-3">10. Cambios en esta política</h2>
          <p className="text-muted mb-0">
            Podremos actualizar esta política para cumplir la normativa o
            mejorar su claridad.  
            Si los cambios son importantes, te avisaremos en la plataforma.
          </p>
        </section>
      </article>

      {/* Enlace de vuelta */}
      <div className="mt-4">
        <Link className="btn btn-secondary" to="/" >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
