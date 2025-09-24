// Barra de navegación superior con estado de sesión (Entrar / Panel + Salir)

import { Link, NavLink, useNavigate } from "react-router-dom";
import { isAuth, logout } from "../utils/auth";
import { useCallback } from "react";

export default function Navegacion() {
  const navigate = useNavigate();

  // Cierra el menú colapsable (útil en móvil) cuando se pulsa un link/botón
  const closeMenu = useCallback(() => {
    const collapse = document.getElementById("menu");
    // Usa window.bootstrap (lo inyecta main.jsx)
    if (collapse?.classList.contains("show") && window.bootstrap) {
      const bsCollapse =
        window.bootstrap.Collapse.getInstance(collapse) ||
        new window.bootstrap.Collapse(collapse, { toggle: false });
      bsCollapse.hide();
    }
  }, []);

  const salir = () => {
    logout();
    closeMenu();
    navigate("/login", { replace: true });
  };

  const autenticado = isAuth();

  return (
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark shadow-sm fixed-top">
      <div className="container">
        {/* Logo */}
        <Link className="navbar-brand fw-bold" to="/" onClick={closeMenu}>
          <i className="bi bi-map-fill me-2"></i> Explora Huelva
        </Link>

        {/* Hamburguesa */}
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

        {/* Menú colapsable */}
        <div className="collapse navbar-collapse" id="menu">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                aria-current={({ isActive }) => (isActive ? "page" : undefined)}
                onClick={closeMenu}
              >
                Inicio
              </NavLink>
            </li>

            {/* Secciones públicas */}
            <li className="nav-item">
              <NavLink to="/explorar/lugares" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} onClick={closeMenu}>
                Lugares
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/explorar/experiencias" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} onClick={closeMenu}>
                Experiencias
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/explorar/rutas" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} onClick={closeMenu}>
                Rutas
              </NavLink>
            </li>

            {autenticado ? (
              <>
                <li className="nav-item">
                  <NavLink to="/panel" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")} onClick={closeMenu}>
                    Panel
                  </NavLink>
                </li>
                <li className="nav-item ms-lg-3">
                  <button type="button" className="btn btn-outline-light" onClick={salir}>
                    <i className="bi bi-box-arrow-right me-1"></i> Salir
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item ms-lg-3">
                  <Link to="/login" className="btn btn-primary" onClick={closeMenu}>
                    <i className="bi bi-person-circle me-1"></i> Entrar
                  </Link>
                </li>
                {/* Si usas registro:
                <li className="nav-item ms-lg-2">
                  <Link to="/registro" className="btn btn-outline-light" onClick={closeMenu}>
                    Crear cuenta
                  </Link>
                </li> */}
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
