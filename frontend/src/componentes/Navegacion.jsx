// Barra de navegación superior fija con Bootstrap + React Router.
// - <Link> y <NavLink> evitan recargar la página y marcan activo el enlace.
// - Colapsable en móviles con el botón hamburguesa.

import { Link, NavLink } from "react-router-dom";

export default function Navegacion() {
  return (
    // fixed-top: se queda pegada arriba; navbar-dark + bg-dark: tema oscuro; shadow-sm: sombrita
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark shadow-sm fixed-top">
      <div className="container">
        {/* Logo: vuelve siempre al inicio (/) */}
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-map-fill me-2"></i> Explora Huelva
        </Link>

        {/* Botón hamburguesa para abrir/cerrar el menú en pantallas pequeñas */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#menu"
          aria-controls="menu"
          aria-expanded="false"
          aria-label="Alternar navegación"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Contenedor colapsable del menú */}
        <div className="collapse navbar-collapse" id="menu">
          {/* ms-auto empuja los items a la derecha */}
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              {/* `end` hace que solo esté activo en "/" exacto, no en subrutas */}
              <NavLink
                to="/"
                end
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                aria-current={({ isActive }) => (isActive ? "page" : undefined)}
              >
                Inicio
              </NavLink>
            </li>

            {/* Los siguientes enlaces son placeholders de secciones futuras */}
            <li className="nav-item">
              <NavLink
                to="/lugares"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              >
                Lugares
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/experiencias"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              >
                Experiencias
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                to="/rutas"
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              >
                Rutas
              </NavLink>
            </li>
          </ul>

          {/* Botón de acceso al login (lado derecho) */}
          <Link to="/login" className="btn btn-primary ms-lg-3">
            <i className="bi bi-person-circle me-1"></i> Entrar
          </Link>
        </div>
      </div>
    </nav>
  );
}
