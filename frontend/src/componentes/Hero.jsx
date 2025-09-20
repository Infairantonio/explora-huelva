// Componente Hero: cabecera visual con fondo, título, subtítulo y botones opcionales.
export default function Hero({
  titulo,           // Texto grande principal
  subtitulo,        // Texto descriptivo bajo el título
  botonPrincipal,   // { texto, href }  (opcional)
  botonSecundario,  // { texto, href }  (opcional)
  fondo             // URL de la imagen de fondo
}) {
  // Estilo en línea para el fondo:
  // - Usamos la sintaxis shorthand de `background` para definir:
  //   * un degradado oscuro (overlay) que mejora el contraste del texto
  //   * la imagen `fondo`
  //   * centrado y `cover` para cubrir toda el área
  // - `minHeight` y `padding` crean un bloque alto y con aire alrededor del contenido
  const estiloFondo = {
    background: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url("${fondo}") center / cover no-repeat`,
    minHeight: "60vh",
    padding: "6rem 1rem"
  };

  return (
    // Sección con clases Bootstrap:
    // - d-flex + align-items-center: centra verticalmente el contenido
    // - text-center: centra el texto
    // - text-white: texto en blanco, contrasta con el overlay oscuro
    // Aplicamos `estiloFondo` para renderizar la imagen + overlay.
    <section className="hero d-flex align-items-center text-center text-white" style={estiloFondo}>
      {/* `container` de Bootstrap para limitar el ancho del contenido */}
      <div className="container">
        {/* Título principal grande y negrita */}
        <h1 className="display-4 fw-bold mb-3">{titulo}</h1>

        {/* Subtítulo de apoyo con espaciado inferior */}
        <p className="lead mb-4">{subtitulo}</p>

        {/* Botón primario (si viene la prop) */}
        {botonPrincipal && (
          <a href={botonPrincipal.href} className="btn btn-primary btn-lg me-2">
            {botonPrincipal.texto}
          </a>
        )}

        {/* Botón secundario (si viene la prop) */}
        {botonSecundario && (
          <a href={botonSecundario.href} className="btn btn-outline-light btn-lg">
            {botonSecundario.texto}
          </a>
        )}
      </div>
    </section>
  );
}
