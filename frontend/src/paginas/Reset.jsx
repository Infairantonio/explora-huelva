// src/paginas/Reset.jsx
// Pantalla para restablecer la contraseña a partir del token recibido por email.

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../servicios/api";

export default function Reset() {
  const [params] = useSearchParams();
  const token = useMemo(() => params.get("token") || "", [params]);

  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMsg("");
  }, [password1, password2]);

  if (!token) {
    return (
      <div className="container py-4">
        <h1 className="mb-3">Restablecer contraseña</h1>
        <div className="alert alert-danger">Falta el token en la URL.</div>
        <Link to="/login" className="btn btn-primary">
          Ir al login
        </Link>
      </div>
    );
  }

  const puedeEnviar =
    !loading && password1.length >= 6 && password1 === password2;

  const enviar = async (e) => {
    e.preventDefault();
    if (!puedeEnviar) return;

    setLoading(true);
    setMsg("");
    try {
      // El backend espera un objeto con { token, newPassword }
      const data = await resetPassword({ token, newPassword: password1 });
      if (data?.ok) {
        navigate("/login?reset=ok", { replace: true });
      } else {
        throw new Error("No se pudo restablecer");
      }
    } catch (err) {
      const detalle =
        err?.payload?.mensaje ||
        (Array.isArray(err?.payload?.errores) &&
          err.payload.errores[0]?.msg) ||
        err?.message ||
        "Error al restablecer";
      setMsg("❌ " + detalle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 520 }}>
      <h1 className="mb-3">Restablecer contraseña</h1>

      {msg && <div className="alert alert-warning">{msg}</div>}

      <form onSubmit={enviar} noValidate>
        <div className="mb-3">
          <label className="form-label">Nueva contraseña</label>
          <input
            type="password"
            className="form-control"
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            minLength={6}
            required
          />
          <div className="form-text">Mínimo 6 caracteres.</div>
        </div>

        <div className="mb-3">
          <label className="form-label">Repite la contraseña</label>
          <input
            type="password"
            className="form-control"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </div>

        {password1 && password2 && password1 !== password2 && (
          <div className="text-danger mb-2">
            Las contraseñas no coinciden.
          </div>
        )}

        <button className="btn btn-primary" disabled={!puedeEnviar}>
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </div>
  );
}
