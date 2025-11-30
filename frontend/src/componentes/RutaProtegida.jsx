// src/componentes/RutaProtegida.jsx
// Componente que protege páginas privadas. Si no hay sesión activa,
// redirige al login y recuerda desde dónde venía el usuario.

import { Navigate, useLocation } from "react-router-dom";
import { isAuth } from "../utils/auth";

export default function RutaProtegida({ children, redirectTo = "/login" }) {
  const location = useLocation();

  // Si no hay sesión válida → redirección al login
  if (!isAuth()) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: location }} // guarda la ruta previa
      />
    );
  }

  // Si está autenticado → renderiza la página normal
  return children;
}
