// src/paginas/Inicio.jsx
// Portada pública:
// 1) Hero con el claim de la web
// 2) Grid con tarjetas PÚBLICAS (visibilidad = 'publico')
// 3) Panel de estado para diagnosticar la API (ping a /api/salud)

import { useEffect, useState } from 'react';
import Hero from '../componentes/Hero';
import TarjetaCard from '../componentes/TarjetaCard.jsx';
import { tarjetasApi } from '../servicios/tarjetas';
import { API_URL } from '../servicios/api'; // ✅ usa la misma base que el resto de servicios
import banner from '../imagenes/banner.jpg';

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
    // 1) Llamada de salud (diagnóstico) — evita /api/api usando API_URL común
    fetch(`${API_URL}/salud`)
      .then((r) => r.json())
      .then(setSalud)
      .catch((err) => setError(err.message));

    // 2) Carga de tarjetas públicas (sin token)
    tarjetasApi.publicas()
      .then((r) => {
        if (!r.ok) throw new Error(r.mensaje || 'No se pudieron cargar las tarjetas públicas');
        setPub({ cargando: false, error: '', items: r.items || [] });
      })
      .catch((e) => setPub({ cargando: false, error: e.message, items: [] }));
  }, []);

  // Red de seguridad en cliente: no mostrar tarjetas marcadas como eliminadas
  const visibles = (pub.items || []).filter((t) => !t?.eliminado);

  return (
    <>
      {/* Hero superior con un fondo bonito */}
      <Hero
        titulo="Explora Huelva"
        subtitulo="Descubre rutas, lugares y experiencias únicas"
        botonPrincipal={{ texto: 'Ver rutas', href: '#' }}
        botonSecundario={{ texto: 'Iniciar sesión', href: '/login' }}
        fondo={banner}
      />

      {/* Bloque tarjetas públicas (portada) */}
      <div className="container my-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 className="mb-0 text-primary fw-bold">Descubre Huelva</h2>
        </div>

        {/* Estados de carga / error / vacío / listado */}
        {pub.cargando ? (
          <div className="d-flex align-items-center gap-2">
            <div className="spinner-border" role="status" />
            <span>Cargando tarjetas…</span>
          </div>
        ) : pub.error ? (
          <div className="alert alert-danger">Error: {pub.error}</div>
        ) : visibles.length === 0 ? (
          <div className="alert alert-info">Aún no hay tarjetas públicas.</div>
        ) : (
          <div className="row g-3">
            {visibles.map((it) => (
              <div key={it._id} className="col-12 col-sm-6 col-lg-4">
                <TarjetaCard item={it} detalleHref={`/tarjetas/${it._id}`} />
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
            <p><strong>API_URL efectiva:</strong> {API_URL}</p>

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
