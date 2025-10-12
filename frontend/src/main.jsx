// src/main.jsx
// ---------------------------------------------------------------------------------
// Punto de entrada del frontend (Vite).
// ---------------------------------------------------------------------------------

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./estilos/base.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import App from "./App.jsx";
import Inicio from "./paginas/Inicio.jsx";
import Login from "./paginas/Login.jsx";
import Registro from "./paginas/Registro.jsx";
import Panel from "./paginas/Panel.jsx";
import EditorTarjeta from "./paginas/EditorTarjeta.jsx";
import RutaPrivada from "./componentes/RutaProtegida.jsx";
import TarjetaPublica from "./paginas/TarjetaPublica.jsx";
import Lugares from "./paginas/Lugares.jsx";
import AdminTarjetas from "./paginas/AdminTarjetas.jsx";

// 🔹 Nuevas páginas de autenticación avanzada
import Verifica from "./paginas/Verifica.jsx";
import Olvide from "./paginas/Olvide.jsx";
import Reset from "./paginas/Reset.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Layout principal (navbar + footer + <Outlet/>) */}
        <Route path="/" element={<App />}>
          {/* Públicas */}
          <Route index element={<Inicio />} />
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Registro />} />
          <Route path="tarjetas/:id" element={<TarjetaPublica />} />

          {/* 🔹 Nuevas rutas de autenticación */}
          <Route path="verifica" element={<Verifica />} />
          <Route path="olvide" element={<Olvide />} />
          <Route path="reset" element={<Reset />} />

          {/* EXPLORAR */}
          <Route path="explorar/:etiqueta" element={<Lugares />} />
          <Route path="lugares" element={<Navigate to="/explorar/lugares" replace />} />
          <Route path="experiencias" element={<Navigate to="/explorar/experiencias" replace />} />
          <Route path="rutas" element={<Navigate to="/explorar/rutas" replace />} />

          {/* Privadas */}
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

          {/* Admin */}
          <Route
            path="admin/tarjetas"
            element={
              <RutaPrivada>
                <AdminTarjetas />
              </RutaPrivada>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Inicio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
