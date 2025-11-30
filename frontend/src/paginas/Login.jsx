// src/paginas/Login.jsx
// Pantalla de acceso de Explora Huelva.
// Gestiona el inicio de sesión, redirecciona según el rol
// y muestra avisos de verificación/reset de contraseña.

import { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
  useLocation,
  Link,
} from "react-router-dom";
import { login, getPerfil } from "../servicios/api";

export default function Login() {
  // Campos del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");   // ← corregido: antes estaba `true`
  const [remember, setRemember] = useState(true);

  // Estado general
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  // Ruta a la que volver tras login
  const next = params.get("next") || "/panel";
  const fromState = location.state?.from?.pathname;

  /**
   * Decide dónde llevar al usuario según su rol:
   * - admin → panel de administración
   * - usuario normal → panel o página previa
   */
  const irSegunPermisos = (perfil) => {
    const rol =
      perfil?.usuario?.rol ||
      perfil?.rol ||
      "";

    if (rol === "admin") {
      navigate("/admin/tarjetas", { replace: true });
    } else {
      navigate(fromState || next, { replace: true });
    }
  };

  // Si ya hay sesión válida, entrar directamente
  useEffect(() => {
    (async () => {
      try {
        const me = await getPerfil();
        if (me?.ok) irSegunPermisos(me);
      } catch {
        // No hay sesión, seguimos en login
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Avisos cuando venimos desde otras pantallas
  useEffect(() => {
    if (params.get("reset") === "ok") {
      setMensaje("✅ Contraseña restablecida correctamente. Inicia sesión.");
    } else if (params.get("verifica") === "ok") {
      setMensaje("✅ Email verificado. Ya puedes iniciar sesión.");
    }
  }, [params]);

  // Enviar formulario
  const enviar = async (e) => {
    e.preventDefault();
    if (cargando) return;

    setMensaje("");
    setCargando(true);

    try {
      const data = await login({ email, password, remember });
      if (!data?.ok) throw new Error("Credenciales incorrectas");

      // Tras hacer login, pedimos el perfil para saber el rol
      const perfil = await getPerfil();
      irSegunPermisos(perfil);
    } catch (err) {
      const raw = err?.message || "";
      let msg = raw || "Error al iniciar sesión";

      if (/403/.test(raw) || /verific/i.test(raw)) {
        msg =
          "Tu email no está verificado. Revisa tu correo o solicita un nuevo enlace.";
      } else if (/401/.test(raw)) {
        msg = "Credenciales inválidas. Revisa tu email y contraseña.";
      }

      setMensaje("❌ " + msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="container">
        <div className="auth-layout">
          {/* Columna de presentación */}
          <div className="auth-copy">
            <h2>Explora Huelva</h2>
            <p>Descubre rutas y experiencias cerca de ti.</p>
          </div>

          {/* Tarjeta de login */}
          <div className="card auth-card shadow border-0 ms-auto">
            <div className="card-body">
              <h1 className="card-title fw-bold text-primary mb-3">
                Iniciar sesión
              </h1>

              {mensaje && <div className="alert alert-info">{mensaje}</div>}

              <form onSubmit={enviar} noValidate>
                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    className="form-control"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Contraseña
                  </label>
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

                {/* Recordar */}
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="remember">
                    Recordarme en este dispositivo
                  </label>
                </div>

                {/* Botones */}
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={cargando || !email || !password}
                  >
                    {cargando ? "Entrando…" : "Entrar"}
                  </button>
                  <Link to="/registro" className="btn btn-outline-primary">
                    Crear cuenta
                  </Link>
                  <Link to="/" className="btn btn-link">
                    Volver
                  </Link>
                </div>

                <div className="mt-3">
                  <Link to="/olvide" className="small">
                    ¿Has olvidado tu contraseña o no te llegó la verificación?
                  </Link>
                </div>
              </form>
            </div>
          </div>
          {/* End card */}
        </div>
      </div>
    </div>
  );
}
