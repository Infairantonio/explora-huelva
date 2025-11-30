// frontend/src/Hero.jsx
// Componente de cabecera principal con imagen de fondo, título, texto y botones opcionales.
// Se usa como sección visual destacada en la página de inicio u otras pantallas.

export default function Hero({
  titulo,          // Texto principal
  subtitulo,       // Texto secundario
  botonPrincipal,  // { texto, href } opcional
  botonSecundario, // { texto, href } opcional
  fondo            // URL de la imagen de fondo
}) {
  // Fondo con overlay oscuro para mejorar la legibilidad del texto
  const estiloFondo = {
    background: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url("${fondo}") center / cover no-repeat`,
    minHeight: "60vh",
    padding: "6rem 1rem",
  };

  return (
    <section
      className="hero d-flex align-items-center text-center text-white"
      style={estiloFondo}
    >
      <div className="container">
        <h1 className="display-4 fw-bold mb-3">{titulo}</h1>
        <p className="lead mb-4">{subtitulo}</p>

        {botonPrincipal && (
          <a
            href={botonPrincipal.href}
            className="btn btn-primary btn-lg me-2"
          >
            {botonPrincipal.texto}
          </a>
        )}

        {botonSecundario && (
          <a
            href={botonSecundario.href}
            className="btn btn-outline-light btn-lg"
          >
            {botonSecundario.texto}
          </a>
        )}
      </div>
    </section>
  );
}
