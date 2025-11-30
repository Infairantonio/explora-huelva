// src/paginas/Cookies.jsx
// Página de política de cookies de Explora Huelva.

export default function Cookies() {
  return (
    <div className="container mt-4 mb-5">
      <h2>Política de Cookies</h2>

      <p>
        En <strong>Explora Huelva</strong> utilizamos cookies y tecnologías 
        similares para garantizar el funcionamiento correcto del sitio web, 
        mejorar la experiencia del usuario y, en algunos casos, analizar el uso 
        del sitio para mejorar nuestros servicios. Esta política explica qué 
        cookies utilizamos, para qué sirven y cómo puedes gestionarlas.
      </p>

      <h3>1. ¿Qué son las cookies?</h3>
      <p>
        Las cookies son pequeños archivos que se almacenan en tu dispositivo 
        cuando visitas un sitio web. Algunas son necesarias para el funcionamiento 
        técnico, y otras sirven para análisis, personalización o medición.
      </p>

      <h3>2. Tipos de cookies que utilizamos</h3>

      <h4>2.1 Cookies técnicas (obligatorias)</h4>
      <p>
        Son necesarias para que el sitio web funcione correctamente. Permiten:
      </p>
      <ul>
        <li>Iniciar sesión y mantener la sesión del usuario.</li>
        <li>Mostrar contenido protegido o personalizado.</li>
        <li>Recordar configuraciones básicas (idioma, preferencias).</li>
      </ul>
      <p>
        Estas cookies <strong>no necesitan consentimiento</strong>, según el RGPD y la LSSI.
      </p>

      <h4>2.2 Cookies de análisis (opcionales)</h4>
      <p>
        Solo se utilizan si el usuario otorga su consentimiento expreso en el banner.
        Sirven para conocer cómo se navega por la web y mejorar las funcionalidades. 
        Ejemplos:
      </p>
      <ul>
        <li>Google Analytics (si se habilita en el futuro)</li>
        <li>Mapas interactivos (Leaflet, Mapbox, Google Maps)</li>
        <li>Servicios de vídeo (YouTube, Vimeo)</li>
      </ul>

      <h4>2.3 Tecnologías similares: LocalStorage</h4>
      <p>
        Explora Huelva también utiliza <strong>localStorage</strong> para almacenar 
        información necesaria del usuario, como:
      </p>
      <ul>
        <li>Preferencias de idioma.</li>
        <li>Token de sesión para iniciar sesión.</li>
        <li>Aceptación del banner de cookies.</li>
      </ul>
      <p>
        Estas tecnologías se consideran equivalentes a cookies técnicas.
      </p>

      <h3>3. ¿Cómo puedo gestionar o desactivar las cookies?</h3>
      <p>
        Puedes permitir, bloquear o eliminar las cookies instaladas en tu 
        dispositivo configurando las opciones de tu navegador. A continuación 
        se ofrecen enlaces directos a las guías de los navegadores más usados:
      </p>

      <ul>
        <li>
          <strong>Google Chrome:</strong>{" "}
          <a
            href="https://support.google.com/chrome/answer/95647"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://support.google.com/chrome/answer/95647
          </a>
        </li>
        <li>
          <strong>Mozilla Firefox:</strong>{" "}
          <a
            href="https://support.mozilla.org/es/kb/Deshabilitar%20cookies"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://support.mozilla.org/es/kb/Deshabilitar%20cookies
          </a>
        </li>
        <li>
          <strong>Safari (Apple):</strong>{" "}
          <a
            href="https://support.apple.com/es-es/guide/safari/sfri11471/mac"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://support.apple.com/es-es/guide/safari
          </a>
        </li>
        <li>
          <strong>Microsoft Edge:</strong>{" "}
          <a
            href="https://support.microsoft.com/es-es/windows/731"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://support.microsoft.com/es-es/windows/731
          </a>
        </li>
      </ul>

      <h3>4. ¿Cómo revocar el consentimiento?</h3>
      <p>
        Si deseas retirar tu consentimiento para las cookies no técnicas, 
        puedes borrar las cookies del navegador o usar la opción “Reiniciar 
        consentimiento” disponible en el banner (si está implementado).
      </p>

      <h3>5. Servicios de terceros</h3>
      <p>
        Explora Huelva puede integrar servicios de terceros que utilicen sus 
        propias cookies, por ejemplo:
      </p>
      <ul>
        <li>Mapbox o Leaflet para mapas interactivos.</li>
        <li>YouTube para vídeos incrustados.</li>
        <li>Google Analytics (si se activa en el futuro).</li>
      </ul>
      <p>
        Estos proveedores pueden instalar cookies una vez el usuario da su consentimiento.
      </p>

      <h3>6. Responsable del tratamiento</h3>
      <p>
        <strong>Explora Huelva — Proyecto personal</strong><br />
        Email de contacto:{" "}
        <strong>explorahuelva.contacto@gmail.com</strong>
      </p>

      <p className="mt-4">
        Última actualización: Enero 2025
      </p>
    </div>
  );
}
