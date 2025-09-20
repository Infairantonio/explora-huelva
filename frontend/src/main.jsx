// src/main.jsx
// ---------------------------------------------------------------------------------
// Punto de entrada del frontend (Vite).
// - Carga estilos globales y JS de Bootstrap (para collapse, offcanvas, etc.).
// - Monta React en #root.
// - Configura React Router con un layout principal (<App/>) y rutas hijas.
// ---------------------------------------------------------------------------------

// Estilos (el orden importa: primero CSS, luego el bundle JS de Bootstrap)
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./estilos/base.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // necesarias las features JS (navbar colapsable, etc.)

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Inicio from "./paginas/Inicio.jsx";
import Login from "./paginas/Login.jsx";
import Panel from "./paginas/Panel.jsx";
import EditorTarjeta from "./paginas/EditorTarjeta.jsx";
import RutaPrivada from "./componentes/RutaProtegida.jsx";

// Montaje de la app.
// <BrowserRouter> habilita la navegación SPA.
// Definimos rutas anidadas: la ruta "/" renderiza <App/> como layout (navbar+footer)
// y dentro de <Outlet/> se insertan las páginas hijas (Inicio, Login, Panel, ...).
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Si despliegas bajo subruta, puedes usar basename:
        <BrowserRouter basename={import.meta.env.BASE_URL}> */}
    <BrowserRouter>
      <Routes>
        {/* Layout principal */}
        <Route path="/" element={<App />}>
          {/* Públicas */}
          <Route index element={<Inicio />} />
          <Route path="login" element={<Login />} />

          {/* Privadas (requiere token) */}
          <Route
            path="panel"
            element={
              <RutaPrivada>
                <Panel />
              </RutaPrivada>
            }
          />
          <Route
            path="panel/nuevo"
            element={
              <RutaPrivada>
                <EditorTarjeta />
              </RutaPrivada>
            }
          />
          <Route
            path="panel/editar/:id"
            element={
              <RutaPrivada>
                <EditorTarjeta />
              </RutaPrivada>
            }
          />

          {/* Fallback: cualquier ruta desconocida vuelve a la portada */}
          <Route path="*" element={<Inicio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
