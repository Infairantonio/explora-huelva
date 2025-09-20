// src/App.jsx
// -------------------------------------------------------------
// Componente layout/base de la aplicación.
// - Pinta la navegación superior y el pie de página en TODAS
//   las rutas.
// - El <Outlet /> es el “hueco” donde React Router renderiza
//   la página hija que corresponda (Inicio, Login, Panel…).
// - Usamos utilidades de Bootstrap (flex) para que el footer
//   quede al fondo incluso con poco contenido (sticky footer).
// -------------------------------------------------------------

import { Outlet } from "react-router-dom";
import Navegacion from "./componentes/Navegacion";
import Pie from "./componentes/Pie";

export default function App() {
  return (
    // min-vh-100 -> el contenedor ocupa al menos el 100% del alto de la ventana
    // d-flex flex-column -> disposición vertical: header / main / footer
    <div className="d-flex flex-column min-vh-100">
      {/* Cabecera fija (navbar) visible en todas las páginas */}
      <Navegacion />

      {/* El main crece para empujar el footer al fondo (sticky footer) */}
      <main className="flex-grow-1">
        {/* Aquí React Router inserta el componente de la ruta activa */}
        <Outlet />
      </main>

      {/* Pie visible en todas las páginas */}
      <Pie />
    </div>
  );
}
