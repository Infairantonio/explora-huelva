// Inicio.jsx
// Portada pública:
// 1) Hero con el claim de la web
// 2) Grid con tarjetas PÚBLICAS (visibilidad = 'publico')
// 3) (opcional) Panel de estado para diagnosticar la API

import { useEffect, useState } from 'react';
import Hero from '../componentes/Hero';
import TarjetaCard from '../componentes/TarjetaCard.jsx';
import { tarjetasApi } from '../servicios/tarjetas';

// Para el Panel de Estado (ping a /api/salud)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

export default function Inicio() {
  // Estado para /api/salud (solo diagnóstico)
  const [salud, setSalud] = useState(null);
  const [error, setError] = useState('');

  // Estado para las tarjetas públicas
  const [pub, setPub] = useState({
    cargando: true,
    error: '',
    items: [],
  });

  useEffect(() => {
    // 1) Llamada de salud (diagnóstico)
    fetch(`${API_URL}/api/salud`)
      .then((r) => r.json())
      .then(setSalud)
      .catch((err) => setError(err.message));

    // 2) Carga de tarjetas públicas
    //    No requiere token. Si en el futuro quieres filtrar por etiqueta o búsqueda:
    //    tarjetasApi.publicas({ etiqueta: 'rutas', q: 'marismas', page: 1 })
    tarjetasApi.publicas()
      .then((r) => {
        if (!r.ok) throw new Error(r.mensaje || 'No se pudieron cargar las tarjetas públicas');
        setPub({ cargando: false, error: '', items: r.items || [] });
      })
      .catch((e) => setPub({ cargando: false, error: e.message, items: [] }));
  }, []);

  return (
    <>
      {/* Hero superior con un fondo bonito */}
      <Hero
        titulo="Explora Huelva"
        subtitulo="Descubre rutas, lugares y experiencias únicas 🌊🌅"
        botonPrincipal={{ texto: 'Ver rutas', href: '#' }}
        botonSecundario={{ texto: 'Iniciar sesión', href: '/login' }}
        fondo="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80"
      />

      {/* Bloque tarjetas públicas (portada) */}
      <div className="container my-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="mb-0 text-primary fw-bold">Descubre contenido público</h2>
        </div>

        {/* Estados de carga / error / vacío / listado */}
        {pub.cargando ? (
          <div className="d-flex align-items-center gap-2">
            <div className="spinner-border" role="status" />
            <span>Cargando tarjetas…</span>
          </div>
        ) : pub.error ? (
          <div className="alert alert-danger">Error: {pub.error}</div>
        ) : pub.items.length === 0 ? (
          <div className="alert alert-info">Aún no hay tarjetas públicas.</div>
        ) : (
          <div className="row g-3">
            {pub.items.map((it) => (
              <div key={it._id} className="col-12 col-sm-6 col-lg-4">
                {/* En portada no damos acciones, así que no pasamos onEdit/onDelete */}
                <TarjetaCard item={it} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel de Estado (opcional). Útil mientras desarrollamos. */}
      <div className="container mb-5">
        <h3 className="mb-3 text-primary fw-bold">Panel de Estado</h3>
        <div className="card shadow-sm border-0" style={{ backgroundColor: 'var(--azul-claro)' }}>
          <div className="card-body">
            <p><strong>VITE_API_URL:</strong> {API_URL}</p>

            {/* Estado de la llamada a /api/salud */}
            {error && <div className="alert alert-danger">Error: {error}</div>}
            {!salud ? (
              <div className="d-flex align-items-center gap-2">
                <div className="spinner-border" role="status" />
                <span>Cargando…</span>
              </div>
            ) : (
              <pre className="pre-json mb-0">{JSON.stringify(salud, null, 2)}</pre>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
