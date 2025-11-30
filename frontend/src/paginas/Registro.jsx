// src/paginas/Registro.jsx
// Pantalla de alta de usuario con verificación de correo y aceptación legal.

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../servicios/api";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Aceptación de privacidad y términos
  const [aceptaLegal, setAceptaLegal] = useState(false);

  // Flujo de interfaz: formulario inicial o pantalla de correo enviado
  const [paso, setPaso] = useState("form"); // "form" | "enviado"
  const [cuentaEmail, setCuentaEmail] = useState("");
  const [reenviando, setReenviando] = useState(false);
  const [info, setInfo] = useState(null);

  const navigate = useNavigate();

  const enviar = async (e) => {
    e.preventDefault();
    if (cargando) return;

    setMensaje("");
    setInfo(null);
    setCargando(true);

    try {
      const data = await register({ nombre, email, password });

      // Registro con verificación obligatoria de correo
      if (data?.ok && data?.necesitaVerificar) {
        setCuentaEmail(email);
        setPaso("enviado");
        setInfo(
          "Te enviamos un correo con un enlace para verificar tu cuenta. Revisa también Spam."
        );
      }
      // Registro que devuelve token directo (por si se usa en otro flujo)
      else if (data?.ok && data?.token) {
        navigate("/panel", { replace: true });
      } else {
        throw new Error("No se pudo completar el registro");
      }
    } catch (err) {
      const detalle =
        err?.payload?.mensaje ||
        (Array.isArray(err?.payload?.errores) &&
          err.payload.errores[0]?.msg) ||
        err?.message ||
        "Error al registrar";
      setMensaje("❌ " + detalle);
    } finally {
      setCargando(false);
    }
  };

  // Reenvío del correo de verificación
  const reenviar = async () => {
    try {
      setReenviando(true);
      setInfo(null);
      setMensaje("");

      const correo = (cuentaEmail || email || "").trim();

      const res = await fetch("/api/auth/reenviar-verificacion", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: correo }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.mensaje || "No se pudo reenviar el correo."
        );
      }

      setInfo(
        "Hemos reenviado el correo de verificación. Revisa tu bandeja."
      );
    } catch (e) {
      setMensaje(
        "❌ " + (e?.message || "Error al reenviar verificación.")
      );
    } finally {
      setReenviando(false);
    }
  };

  // --- Reglas de la contraseña (para mostrar ayuda visual) ---
  const requisitosPassword = {
    longitud: password.length >= 10,
    minuscula: /[a-z]/.test(password),
    mayuscula: /[A-Z]/.test(password),
    numero: /[0-9]/.test(password),
    simbolo: /[^A-Za-z0-9]/.test(password), // incluye punto, guion, etc.
  };

  const renderCheck = (ok) => (
    <span className={ok ? "text-success me-1" : "text-muted me-1"}>
      {ok ? "✔" : "•"}
    </span>
  );

  // Pantalla informativa cuando ya se ha enviado el email de verificación
  if (paso === "enviado") {
    const correo = (cuentaEmail || email || "").trim();
    const dominio = correo.split("@")[1] || "";

    const enlaces = {
      "gmail.com": "https://mail.google.com/",
      "hotmail.com": "https://outlook.live.com/",
      "outlook.com": "https://outlook.live.com/",
      "yahoo.es": "https://mail.yahoo.com/",
      "yahoo.com": "https://mail.yahoo.com/",
      "icloud.com": "https://www.icloud.com/mail",
    };

    const abrirBuzon = enlaces[dominio] || null;

    return (
      <div className="auth-wrap">
        <div className="container">
          <div className="auth-layout">
            <div className="auth-copy">
              <h2>Explora Huelva</h2>
              <p>Confirma tu email para activar la cuenta.</p>
            </div>

            <div className="card auth-card shadow border-0 ms-auto">
              <div className="card-body">
                <h1 className="card-title fw-bold text-primary mb-3">
                  Verifica tu correo
                </h1>

                {info && <div className="alert alert-info">{info}</div>}
                {mensaje && (
                  <div className="alert alert-danger">{mensaje}</div>
                )}

                <p className="mb-2">
                  Enviamos un enlace de verificación a:
                </p>
                <p className="fw-bold">{correo || "(tu correo)"}</p>

                <ul className="small text-muted">
                  <li>
                    Pulsa <strong>“Verificar mi cuenta”</strong> en el
                    email.
                  </li>
                  <li>
                    Revisa también <strong>Spam</strong> o{" "}
                    <strong>No deseado</strong>.
                  </li>
                  <li>
                    El enlace es válido durante <strong>24 horas</strong>.
                  </li>
                </ul>

                <div className="d-flex align-items-center gap-2 mt-2">
                  <button
                    className="btn btn-secondary"
                    onClick={reenviar}
                    disabled={reenviando}
                  >
                    {reenviando
                      ? "Reenviando…"
                      : "Reenviar verificación"}
                  </button>

                  {abrirBuzon && (
                    <a
                      className="btn btn-outline-primary"
                      href={abrirBuzon}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir mi correo
                    </a>
                  )}

                  <Link to="/login" className="btn btn-link ms-auto">
                    Ir a iniciar sesión
                  </Link>
                </div>

                <hr />

                <p className="small mb-0">
                  Si no te llega, también puedes pedir otro enlace desde{" "}
                  <Link to="/olvide">
                    “¿Olvidaste tu contraseña?”
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de registro
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
              <h1 className="card-title fw-bold text-primary mb-3">
                Crear cuenta
              </h1>

              {mensaje && (
                <div className="alert alert-info">{mensaje}</div>
              )}

              <form onSubmit={enviar} noValidate>
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-control"
                    placeholder="Cómo quieres que te vean (ej. Antonio)"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Contraseña</label>
                  <input
                    className="form-control"
                    type="password"
                    placeholder="Elige una contraseña segura"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="form-text mt-1">
                    <div className="small mb-1">
                      Tu contraseña debe cumplir todos estos puntos:
                    </div>
                    <ul className="small ps-3 mb-0">
                      <li>
                        {renderCheck(requisitosPassword.longitud)}
                        Mínimo <strong>10 caracteres</strong>.
                      </li>
                      <li>
                        {renderCheck(requisitosPassword.minuscula)}
                        Al menos <strong>una letra minúscula</strong>.
                      </li>
                      <li>
                        {renderCheck(requisitosPassword.mayuscula)}
                        Al menos <strong>una letra mayúscula</strong>.
                      </li>
                      <li>
                        {renderCheck(requisitosPassword.numero)}
                        Al menos <strong>un número</strong>.
                      </li>
                      <li>
                        {renderCheck(requisitosPassword.simbolo)}
                        Al menos <strong>un símbolo</strong> (no letra ni
                        número), por ejemplo: <code>! @ # $ % .</code>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Aceptación de privacidad y términos */}
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="aceptaLegal"
                    checked={aceptaLegal}
                    onChange={(e) =>
                      setAceptaLegal(e.target.checked)
                    }
                    required
                  />
                  <label
                    className="form-check-label small"
                    htmlFor="aceptaLegal"
                  >
                    He leído y acepto la{" "}
                    <Link to="/privacidad" target="_blank">
                      Política de Privacidad
                    </Link>{" "}
                    y los{" "}
                    <Link to="/terminos" target="_blank">
                      Términos y Condiciones
                    </Link>
                    .
                  </label>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-primary px-4"
                    disabled={
                      cargando ||
                      !nombre ||
                      !email ||
                      !password ||
                      !aceptaLegal
                    }
                  >
                    {cargando ? "Creando…" : "Crear cuenta"}
                  </button>

                  <Link to="/login" className="btn btn-link">
                    Ya tengo cuenta
                  </Link>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
