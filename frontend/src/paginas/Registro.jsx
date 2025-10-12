import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../servicios/api";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje]   = useState("");

  const navigate = useNavigate();

  const enviar = async (e) => {
    e.preventDefault();
    if (cargando) return;
    setMensaje(""); setCargando(true);
   try {
  const data = await register({ nombre, email, password }); // NO debe guardar token
  if (data?.ok && data?.necesitaVerificar) {
    // manda a la pantalla de verificación con el email
    navigate(`/verifica?enviado=1&email=${encodeURIComponent(email)}`, { replace: true });
  } else if (data?.ok && data?.token) {
    // fallback por si en algún entorno sigues emitiendo token en el registro
    navigate("/panel", { replace: true });
  } else {
    throw new Error("No se pudo completar el registro");
  }
} catch (err) {
  const detalle =
    err?.payload?.mensaje ||
    (Array.isArray(err?.payload?.errores) && err.payload.errores[0]?.msg) ||
    err?.message || "Error al registrar";
  setMensaje("❌ " + detalle);
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
            <p>Crea tu cuenta en un minuto.</p>
          </div>
          <div className="card auth-card shadow border-0 ms-auto">
            <div className="card-body">
              <h1 className="card-title fw-bold text-primary mb-3">Crear cuenta</h1>
              {mensaje && <div className="alert alert-info">{mensaje}</div>}
              <form onSubmit={enviar} noValidate>
                <div className="mb-3">
  <label className="form-label">Nombre</label>
  <input
    className="form-control"
    value={nombre}
    onChange={(e) => setNombre(e.target.value)}
    required
    minLength={2}  // igual que la validación del backend
  />
</div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={email}
                         onChange={(e)=>setEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contraseña</label>
                  <input className="form-control" type="password" value={password}
                         onChange={(e)=>setPassword(e.target.value)} required />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-primary px-4" disabled={cargando || !nombre || !email || !password}>
                    {cargando ? "Creando…" : "Crear cuenta"}
                  </button>
                  <Link to="/login" className="btn btn-link">Ya tengo cuenta</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
