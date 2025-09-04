import { useEffect, useState } from 'react';
import Navegacion from './componentes/Navegacion';
import Pie from './componentes/Pie';
import Hero from './componentes/Hero';   // 👈 nuevo import

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
    <div className="d-flex flex-column min-vh-100">
      <Navegacion />

      {/* Hero */}
      <Hero
  titulo="Explora Huelva"
  subtitulo="Descubre rutas, lugares y experiencias únicas en la provincia de Huelva 🌊🌅"
  botonPrincipal={{ texto: 'Ver rutas', href: '#' }}
  botonSecundario={{ texto: 'Iniciar sesión', href: '#' }}
  fondo="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
/>


      <main className="container my-4 flex-grow-1">
        <h2 className="mb-4 text-primary fw-bold">Panel de Estado</h2>

        <div className="row g-4">
          {/* Card: API */}
          <div className="col-12 col-lg-8">
            <div
              className="card shadow-sm border-0"
              style={{ backgroundColor: 'var(--azul-claro)' }}
            >
              <div className="card-body">
                <h5 className="card-title mb-3">Comprobación de la API</h5>
                <p><strong>VITE_API_URL:</strong> {API_URL}</p>

                {error && <div className="alert alert-danger">Error: {error}</div>}

                {!salud ? (
                  <div className="d-flex align-items-center gap-2">
                    <div className="spinner-border" role="status"></div>
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

          {/* Card: Bienvenida */}
          <div className="col-12 col-lg-4">
            <div
              className="card shadow-sm border-0"
              style={{ backgroundColor: 'var(--azul-claro)' }}
            >
              <div className="card-body">
                <h5 className="card-title">¡Bienvenido/a! 👋</h5>
                <p>
                  Este es el punto de partida. A continuación añadiremos inicio de sesión,
                  publicaciones y un mapa con lugares interesantes de Huelva.
                </p>
                <button className="btn btn-primary" disabled>
                  Próximamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Pie />
    </div>
  );
}
