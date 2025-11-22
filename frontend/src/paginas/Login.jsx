// src/paginas/Login.jsx
import { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
  useLocation,
  Link,
} from "react-router-dom";
import { login, getPerfil } from "../servicios/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(true);
  const [remember, setRemember] = useState(true);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const next = params.get("next") || "/panel";
  const fromState = location.state?.from?.pathname;

  // 👉 Decide a dónde ir según el rol del usuario
  const irSegunPermisos = (perfil) => {
    const rol =
      perfil?.usuario?.rol ||
      perfil?.rol ||
      ""; // por si cambia la forma de respuesta

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
        if (me?.ok) {
          irSegunPermisos(me);
        }
      } catch {
        /* no autorizado, seguimos en login */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Mostrar avisos cuando venimos de reset/verificación
  useEffect(() => {
    if (params.get("reset") === "ok") {
      setMensaje("✅ Contraseña restablecida correctamente. Inicia sesión.");
    } else if (params.get("verifica") === "ok") {
      setMensaje("✅ Email verificado. Ya puedes iniciar sesión.");
    }
  }, [params]);

  const enviar = async (e) => {
    e.preventDefault();
    if (cargando) return;

    setMensaje("");
    setCargando(true);
    try {
      const data = await login({ email, password, remember });
      if (!data?.ok) throw new Error("Credenciales incorrectas");

      // 🔁 Después del login, pedimos el perfil y miramos el rol
      const perfil = await getPerfil();
      irSegunPermisos(perfil);
    } catch (err) {
      const raw = err?.message || "";
      let msg = raw || "Error al iniciar sesión";
      if (/403/.test(raw) || /verific/i.test(raw))
        msg =
          "Tu email no está verificado. Revisa tu correo o solicita un nuevo enlace.";
      else if (/401/.test(raw))
        msg = "Credenciales inválidas. Revisa tu email y contraseña.";
      setMensaje("❌ " + msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="container">
        <div className="auth-layout">
          <div className="auth-copy">
            <h2>Explora Huelva</h2>
            <p>Descubre rutas y experiencias cerca de ti.</p>
          </div>

          <div className="card auth-card shadow border-0 ms-auto">
            <div className="card-body">
              <h1 className="card-title fw-bold text-primary mb-3">
                Iniciar sesión
              </h1>

              {mensaje && <div className="alert alert-info">{mensaje}</div>}

              <form onSubmit={enviar} noValidate>
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
          {/* Fin tarjeta */}
        </div>
      </div>
    </div>
  );
}
