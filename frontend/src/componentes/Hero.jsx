export default function Hero({ titulo, subtitulo, botonPrincipal, botonSecundario, fondo }) {
  const estiloFondo = {
  backgroundImage: `
  linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)),
  url(${fondo})
`,

  backgroundSize: 'cover',
  backgroundPosition: 'center',
};


  return (
    <section className="hero d-flex align-items-center text-center text-white" style={estiloFondo}>
      <div className="container">
        <h1 className="display-4 fw-bold mb-3">{titulo}</h1>
        <p className="lead mb-4">{subtitulo}</p>
        {botonPrincipal && (
          <a href={botonPrincipal.href} className="btn btn-primary btn-lg me-2">
            {botonPrincipal.texto}
          </a>
        )}
        {botonSecundario && (
          <a href={botonSecundario.href} className="btn btn-outline-light btn-lg">
            {botonSecundario.texto}
          </a>
        )}
      </div>
    </section>
  );
}
