// src/paginas/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { login, getPerfil } from "../servicios/api";
import { soyAdmin } from "../servicios/adminTarjetas";

export default function Login() {
  const [email, setEmail] = useState("");      // ← corregido
  const [password, setPassword] = useState("");

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const next = params.get("next") || "/panel";
  const fromState = location.state?.from?.pathname;

  // Decide a dónde enviar tras validar sesión según permisos
  const irSegunPermisos = async () => {
    try {
      const esAdmin = await soyAdmin(); // consulta /api/admin/tarjetas con el token
      if (esAdmin) {
        navigate("/admin/tarjetas", { replace: true });
      } else {
        navigate(fromState || next, { replace: true });
      }
    } catch {
      // ante fallo de red, seguimos el flujo normal
      navigate(fromState || next, { replace: true });
    }
  };

  // Si ya hay token válido, saltamos el login directamente
  useEffect(() => {
    (async () => {
      try {
        const me = await getPerfil(); // lanza si no autorizado
        if (me?.ok) await irSegunPermisos();
      } catch {
        /* no autorizado */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enviar = async (e) => {
    e.preventDefault();
    if (cargando) return;

    setMensaje("");
    setCargando(true);
    try {
      const data = await login({ email, password }); // guarda token
      if (!data?.ok) throw new Error("Credenciales incorrectas");
      await irSegunPermisos();
    } catch (err) {
      const msg = err?.message || "Error al iniciar sesión";
      setMensaje("❌ " + msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="container">
        <div className="auth-layout">
          {/* Izquierda: copy/branding */}
          <div className="auth-copy">
            <h2>Explora Huelva</h2>
            <p>Descubre rutas y experiencias cerca de ti.</p>
          </div>

          {/* Derecha: tarjeta/formulario */}
          <div className="card auth-card shadow border-0 ms-auto">
            <div className="card-body">
              <h1 className="card-title fw-bold text-primary mb-3">Iniciar sesión</h1>

              {mensaje && <div className="alert alert-info">{mensaje}</div>}

              <form onSubmit={enviar} noValidate>
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
                    autoFocus
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

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={cargando || !email || !password}
                  >
                    {cargando ? "Entrando…" : "Entrar"}
                  </button>
                  <Link to="/registro" className="btn btn-outline-primary">Crear cuenta</Link>
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
