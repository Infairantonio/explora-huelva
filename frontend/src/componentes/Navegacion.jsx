export default function Navegacion() {
  return (
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark shadow-sm fixed-top">

      <div className="container">
        {/* Logo */}
        <a className="navbar-brand fw-bold" href="#">
          <i className="bi bi-map-fill me-2"></i> Explora Huelva
        </a>

        {/* Botón para móviles */}
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu">
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Enlaces */}
        <div className="collapse navbar-collapse" id="menu">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link active" aria-current="page" href="#">
                Inicio
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Lugares
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Experiencias
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                Rutas
              </a>
            </li>
          </ul>

          {/* Botón de login */}
          <a href="/login" className="btn btn-primary ms-lg-3">
  <i className="bi bi-person-circle me-1"></i> Entrar
</a>


        </div>
      </div>
    </nav>
  );
}
