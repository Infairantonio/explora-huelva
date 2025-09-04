import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

export default function App() {
  const [salud, setSalud] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/salud`)
      .then(r => r.json())
      .then(setSalud)
      .catch(err => setError(err.message));
  }, []);

  return (
    <>
      {/* Cabecera / navegación */}
      <nav className="navbar navbar-expand-lg bg-dark navbar-dark">
        <div className="container">
          <a className="navbar-brand" href="#">Explora Huelva</a>
          <span className="navbar-text">
            Proyecto demo
          </span>
        </div>
      </nav>

      {/* Contenido */}
      <main className="container my-4">
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">Comprobación de la API</h5>

                <p className="mb-2">
                  <strong>VITE_API_URL:</strong> {API_URL}
                </p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    Error: {error}
                  </div>
                )}

                {!salud ? (
                  <div className="d-flex align-items-center gap-2">
                    <div className="spinner-border" role="status" aria-hidden="true"></div>
                    <span>Cargando salud del servidor…</span>
                  </div>
                ) : (
                  <pre className="pre-json mb-0">
{JSON.stringify(salud, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">¡Bienvenido/a! 👋</h5>
                <p className="card-text">
                  Este es el punto de partida. A continuación añadiremos inicio de sesión,
                  publicaciones y un mapa con lugares interesantes de Huelva.
                </p>
                <button className="btn btn-primary" disabled>
                  Próximamente
                </button>
              </div>
            </div>

            <div className="card border-0 shadow-sm mt-3">
              <div className="card-body">
                <h6 className="card-subtitle mb-2 text-muted">Estado</h6>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item">Docker: activo</li>
                  <li className="list-group-item">API: {salud ? 'OK' : 'cargando…'}</li>
                  <li className="list-group-item">MongoDB: (se conectará en segundo plano)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pie */}
      <footer className="border-top py-3">
        <div className="container small text-muted">
          © {new Date().getFullYear()} Explora Huelva
        </div>
      </footer>
    </>
  );
}
