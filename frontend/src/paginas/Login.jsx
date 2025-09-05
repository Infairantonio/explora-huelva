import { useState } from 'react';
import Navegacion from '../componentes/Navegacion';
import Pie from '../componentes/Pie';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true); setError(''); setOk('');
    try {
      const r = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.mensaje || 'Error de autenticación');

      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      setOk('Inicio de sesión correcto. ¡Bienvenido/a!');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navegacion />
      <main className="container my-5 flex-grow-1" style={{ maxWidth: 480 }}>
        <h1 className="mb-4 text-primary">Iniciar sesión</h1>

        {error && <div className="alert alert-danger">{error}</div>}
        {ok && <div className="alert alert-success">{ok}</div>}

        <form onSubmit={enviar} className="card border-0 shadow-sm p-4" style={{ backgroundColor: 'var(--azul-claro)' }}>
          <div className="mb-3">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              className="form-control"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary w-100" disabled={cargando}>
            {cargando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </main>
      <Pie />
    </div>
  );
}
