// src/paginas/Inicio.jsx
// Portada pública:
// 1) Hero con el claim de la web
// 2) Grid con tarjetas PÚBLICAS (visibilidad = 'publico')
// 3) (Nuevo) Grid con tarjetas de AMIGOS si el usuario está autenticado
// 4) Panel de estado para diagnosticar la API (ping a /api/salud)

import { useEffect, useState } from 'react';
import Hero from '../componentes/Hero';
import TarjetaCard from '../componentes/TarjetaCard.jsx';
import { tarjetasApi } from '../servicios/tarjetas';
import { API_URL, getToken } from '../servicios/api'; // ✅ usa la misma base + detecta login
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

  // Estado para las tarjetas de amigos (solo si hay token)
  const [amg, setAmg] = useState({
    cargando: false,
    error: '',
    items: [],
    intentado: false, // sabemos si intentamos cargar amigos (para no mostrar nada si no hay login)
  });

  useEffect(() => {
    // 1) Llamada de salud (diagnóstico)
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

    // 3) (Nuevo) Carga de tarjetas de amigos si hay token
    const t = getToken();
    if (t) {
      setAmg((s) => ({ ...s, cargando: true, intentado: true }));
      tarjetasApi.amigos()
        .then((r) => {
          if (!r.ok) throw new Error(r.mensaje || 'No se pudieron cargar las tarjetas de amigos');
          setAmg({ cargando: false, error: '', items: r.items || [], intentado: true });
        })
        .catch((e) => {
          // Si 401, no mostramos bloque (usuario no autenticado o token caducado)
          setAmg({ cargando: false, error: e?.status === 401 ? '' : (e.message || 'Error'), items: [], intentado: true });
        });
    } else {
      // Sin token, ni siquiera intentamos: no mostramos bloque de amigos
      setAmg({ cargando: false, error: '', items: [], intentado: false });
    }
  }, []);

  // Red de seguridad en cliente: no mostrar tarjetas marcadas como eliminadas
  const pubVisibles = (pub.items || []).filter((t) => !t?.eliminado);
  const amgVisibles = (amg.items || []).filter((t) => !t?.eliminado);

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
        ) : pubVisibles.length === 0 ? (
          <div className="alert alert-info">Aún no hay tarjetas públicas.</div>
        ) : (
          <div className="row g-3">
            {pubVisibles.map((it) => (
              <div key={it._id} className="col-12 col-sm-6 col-lg-4">
                <TarjetaCard item={it} detalleHref={`/tarjetas/${it._id}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* (Nuevo) Bloque tarjetas de amigos — solo si intentamos (hay token) */}
      {amg.intentado && (
        <div className="container my-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="mb-0 text-primary fw-bold">De tus amigos</h2>
          </div>

          {amg.cargando ? (
            <div className="d-flex align-items-center gap-2">
              <div className="spinner-border" role="status" />
              <span>Cargando tarjetas de amigos…</span>
            </div>
          ) : amg.error ? (
            <div className="alert alert-warning">No se pudieron cargar las tarjetas de amigos.</div>
          ) : amgVisibles.length === 0 ? (
            <div className="alert alert-info">
              Tus amigos aún no han publicado tarjetas (o no tienes amistades aceptadas).
            </div>
          ) : (
            <div className="row g-3">
              {amgVisibles.map((it) => (
                <div key={it._id} className="col-12 col-sm-6 col-lg-4">
                  {/* Nota: TarjetaCard ya muestra el badge "Amigos" y no habilita 'detalle' para no públicas */}
                  <TarjetaCard item={it} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
