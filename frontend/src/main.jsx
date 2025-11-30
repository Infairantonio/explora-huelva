// src/main.jsx
// Punto de entrada del frontend (Vite): estilos globales, router y rutas principales.

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./estilos/base.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import App from "./App.jsx";

// Páginas públicas
import Inicio from "./paginas/Inicio.jsx";
import Login from "./paginas/Login.jsx";
import Registro from "./paginas/Registro.jsx";
import TarjetaPublica from "./paginas/TarjetaPublica.jsx";
import Lugares from "./paginas/Lugares.jsx";
import Contacto from "./paginas/Contacto.jsx";
import Blog from "./paginas/Blog.jsx";
import SobreNosotros from "./paginas/SobreNosotros.jsx";
import Ayuda from "./paginas/Ayuda.jsx";
import Privacidad from "./paginas/Privacidad.jsx";
import Terminos from "./paginas/Terminos.jsx";
import Cookies from "./paginas/Cookies.jsx";
import Mapa from "./paginas/Mapa.jsx";

// Newsletter
import ConfirmarNewsletter from "./paginas/ConfirmarNewsletter.jsx";
import BajaNewsletter from "./paginas/BajaNewsletter.jsx";

// Autenticación avanzada
import Verifica from "./paginas/Verifica.jsx";
import Olvide from "./paginas/Olvide.jsx";
import Reset from "./paginas/Reset.jsx";

// Zonas privadas y panel
import Panel from "./paginas/Panel.jsx";
import EditorTarjeta from "./paginas/EditorTarjeta.jsx";
import RutaPrivada from "./componentes/RutaProtegida.jsx";
import Amigos from "./paginas/Amigos.jsx";

// Administración
import AdminTarjetas from "./paginas/AdminTarjetas.jsx";
import AdminUsuarios from "./paginas/AdminUsuarios.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Layout principal (navbar + footer + <Outlet />) */}
        <Route path="/" element={<App />}>
          {/* Rutas públicas */}
          <Route index element={<Inicio />} />
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Registro />} />
          <Route path="tarjetas/:id" element={<TarjetaPublica />} />
          <Route path="sobre" element={<SobreNosotros />} />
          <Route path="blog" element={<Blog />} />
          <Route path="ayuda" element={<Ayuda />} />
          <Route path="privacidad" element={<Privacidad />} />
          <Route path="terminos" element={<Terminos />} />
          <Route path="cookies" element={<Cookies />} />
          <Route path="mapa" element={<Mapa />} />
          <Route path="contacto" element={<Contacto />} />

          {/* Newsletter */}
          <Route
            path="confirmar-newsletter"
            element={<ConfirmarNewsletter />}
          />
          <Route path="baja-newsletter" element={<BajaNewsletter />} />

          {/* Autenticación avanzada */}
          <Route path="verifica" element={<Verifica />} />
          <Route path="olvide" element={<Olvide />} />
          <Route path="reset" element={<Reset />} />

          {/* Explorar por tipo */}
          <Route path="explorar/:etiqueta" element={<Lugares />} />
          <Route
            path="lugares"
            element={<Navigate to="/explorar/lugares" replace />}
          />
          <Route
            path="experiencias"
            element={<Navigate to="/explorar/experiencias" replace />}
          />
          <Route
            path="rutas"
            element={<Navigate to="/explorar/rutas" replace />}
          />

          {/* Panel privado */}
          <Route
            path="panel"
            element={
              <RutaPrivada>
                <Panel />
              </RutaPrivada>
            }
          />
          <Route
            path="panel/amigos"
            element={
              <RutaPrivada>
                <Amigos />
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

          {/* Panel admin */}
          <Route
            path="admin/tarjetas"
            element={
              <RutaPrivada>
                <AdminTarjetas />
              </RutaPrivada>
            }
          />
          <Route
            path="admin/usuarios"
            element={
              <RutaPrivada>
                <AdminUsuarios />
              </RutaPrivada>
            }
          />

          {/* Fallback: cualquier ruta desconocida lleva a Inicio */}
          <Route path="*" element={<Inicio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
