// src/App.jsx
// -------------------------------------------------------------
// Layout base de la aplicación (header → contenido → footer).
// - Muestra la navegación y el pie en TODAS las rutas.
// - <Outlet /> es el espacio donde React Router renderiza la
//   página correspondiente (Inicio, Login, Panel, etc.).
// - Se usa Bootstrap (flex) para que el footer quede siempre
//   al final de la pantalla incluso con poco contenido.
// - Incluye el banner de cookies global.
// -------------------------------------------------------------

import { Outlet } from "react-router-dom";
import Navegacion from "./componentes/Navegacion";
import Pie from "./componentes/Pie";
import BannerCookies from "./componentes/BannerCookies";

export default function App() {
  return (
    // min-vh-100 → ocupa el alto completo de la ventana
    // d-flex flex-column → estructura vertical
    <div className="d-flex flex-column min-vh-100">

      {/* Cabecera fija (navbar) visible en todas las páginas */}
      <Navegacion />

      {/* Contenido principal.
          flex-grow-1 → empuja el footer hacia abajo (sticky footer) */}
      <main className="flex-grow-1">
        <Outlet />
      </main>

      {/* Pie en todas las páginas */}
      <Pie />

      {/* Banner de cookies global */}
      <BannerCookies />
    </div>
  );
}
