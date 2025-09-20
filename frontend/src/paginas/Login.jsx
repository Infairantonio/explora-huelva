// src/paginas/Login.jsx
// Pantalla de acceso “estilo Facebook” que:
// - Envía email/contraseña a la API
// - Guarda el token JWT en localStorage
// - Redirige al panel si todo va bien
// - Muestra mensajes de carga/errores

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

// URL de la API: usa la variable de entorno de Vite si existe, si no localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5174";

export default function Login() {
  // Campos del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI/estado
  const [cargando, setCargando] = useState(false); // desactiva el botón mientras envía
  const [mensaje, setMensaje] = useState("");      // área de alertas (errores/info)

  // Para navegar al panel una vez autenticado
  const navegar = useNavigate();

  // Handler de envío del formulario
  const enviar = async (e) => {
    e.preventDefault();        // evita recarga de la página
    if (cargando) return;      // evita doble clics seguidos

    setMensaje("");
    setCargando(true);

    try {
      // Petición a la API de login
      const r = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Enviamos las credenciales en JSON
        body: JSON.stringify({ email, password }),
      });

      // Intentamos parsear la respuesta como JSON
      const data = await r.json().catch(() => ({}));

      // Si no es 2xx, levantamos un Error con el mensaje que venga del backend
      if (!r.ok) throw new Error(data.mensaje || "Credenciales incorrectas");

      // Guardamos el JWT para futuras llamadas (Authorization: Bearer ...)
      localStorage.setItem("token", data.token);

      // Redirigimos al panel (replace para no dejar el login en el historial)
      navegar("/panel", { replace: true });
    } catch (err) {
      // Mostramos un mensaje de error amable
      setMensaje("❌ " + (err.message || "Error al iniciar sesión"));
    } finally {
      // Siempre liberamos el estado de “cargando”
      setCargando(false);
    }
  };

  return (
    // auth-wrap + auth-layout posicionan y dan el alto justo para que el footer se vea sin scroll
    <div className="auth-wrap">
      <div className="container">
        <div className="auth-layout">
          {/* Columna izquierda: copy/branding */}
          <div className="auth-copy">
            <h2>Explora Huelva</h2>
            <p>Descubre rutas y experiencias cerca de ti.</p>
          </div>

          {/* Columna derecha: tarjeta/formulario de acceso */}
          <div className="card auth-card shadow border-0 ms-auto">
            <div className="card-body">
              <h1 className="card-title fw-bold text-primary mb-3">Iniciar sesión</h1>

              {/* Zona de mensajes (éxito/error/info) */}
              {mensaje && <div className="alert alert-info">{mensaje}</div>}

              {/* Formulario controlado por estado */}
              <form onSubmit={enviar}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    className="form-control"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus           // mejora UX: foco al cargar
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Contraseña</label>
                  <input
                    id="password"
                    className="form-control"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {/* Botones de acción */}
                <div className="d-flex align-items-center gap-2">
                  <button type="submit" className="btn btn-primary px-4" disabled={cargando}>
                    {cargando ? "Entrando…" : "Entrar"}
                  </button>

                  {/* Volver a la home sin recargar la página */}
                  <Link to="/" className="btn btn-link">Volver</Link>
                </div>
              </form>
            </div>
          </div>
          {/* Fin tarjeta */}
        </div>
      </div>
    </div>
  );
}
