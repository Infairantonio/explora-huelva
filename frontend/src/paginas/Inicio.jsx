// src/paginas/Inicio.jsx
// Página principal pública de Explora Huelva.
// Muestra el hero y un listado combinado:
// - Tarjetas públicas
// - Tarjetas de amigos (si hay sesión)
// El backend controla el acceso al detalle.

// Carga salud del backend (diagnóstico simple).
// Mantiene los comentarios esenciales sin tecnicismos.

import { useEffect, useState } from 'react';
import Hero from '../componentes/Hero';
import TarjetaCard from '../componentes/TarjetaCard.jsx';
import { tarjetasApi } from '../servicios/tarjetas';
import { API_URL, getToken } from '../servicios/api';
import banner from '../imagenes/banner.jpg';

export default function Inicio() {
  // Estado para /api/salud (diagnóstico)
  const [salud, setSalud] = useState(null);
  const [errorSalud, setErrorSalud] = useState('');

  // Tarjetas públicas
  const [pub, setPub] = useState({
    cargando: true,
    error: '',
    items: [],
  });

  // Tarjetas de amigos
  const [amg, setAmg] = useState({
    cargando: false,
    error: '',
    items: [],
    intentado: false,
  });

  // Saber si hay sesión para decidir botones del hero
  const token = getToken();

  const botonPrincipalHero = {
    texto: 'Ver rutas',
    href: '/explorar/rutas',
  };

  const botonSecundarioHero = token
    ? { texto: 'Ir a mi panel', href: '/panel' }
    : { texto: 'Iniciar sesión', href: '/login' };

  useEffect(() => {
    // Salud del backend
    fetch(`${API_URL}/salud`)
      .then((r) => r.json())
      .then(setSalud)
      .catch((err) => setErrorSalud(err.message));

    // Tarjetas públicas
    tarjetasApi
      .publicas()
      .then((r) => {
        if (!r.ok)
          throw new Error(r.mensaje || 'No se pudieron cargar las tarjetas públicas');
        setPub({ cargando: false, error: '', items: r.items || [] });
      })
      .catch((e) => {
        setPub({ cargando: false, error: e.message, items: [] });
      });

    // Tarjetas de amigos (solo si hay token)
    const t = getToken();
    if (t) {
      setAmg((s) => ({ ...s, cargando: true, intentado: true }));
      tarjetasApi
        .amigos()
        .then((r) => {
          if (!r.ok)
            throw new Error(r.mensaje || 'No se pudieron cargar tarjetas de amigos');
          setAmg({ cargando: false, error: '', items: r.items || [], intentado: true });
        })
        .catch((e) => {
          const msg =
            e?.status === 401 ? '' : e.message || 'Error al cargar tarjetas de amigos';
          setAmg({ cargando: false, error: msg, items: [], intentado: true });
        });
    } else {
      setAmg({ cargando: false, error: '', items: [], intentado: false });
    }
  }, []);

  // Filtrado de seguridad
  const pubVisibles = (pub.items || []).filter((t) => !t?.eliminado);
  const amgVisibles = (amg.items || []).filter((t) => !t?.eliminado);

  // Combinado final
  const todas = [...pubVisibles, ...amgVisibles];

  const cargandoGlobal = pub.cargando || (amg.intentado && amg.cargando);

  return (
    <>
      {/* HERO principal */}
      <Hero
        titulo="Explora Huelva"
        subtitulo="Descubre rutas, lugares y experiencias únicas"
        botonPrincipal={botonPrincipalHero}
        botonSecundario={botonSecundarioHero}
        fondo={banner}
      />

      {/* LISTADO */}
      <div className="container my-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h2 className="mb-0 text-primary fw-bold">Explora todas las rutas</h2>
        </div>

        <p className="text-muted small mb-3">
          Públicas: <strong>{pubVisibles.length}</strong> · Amigos:{' '}
          <strong>{amgVisibles.length}</strong>
        </p>

        {pub.error && (
          <div className="alert alert-danger py-2">
            Error al cargar tarjetas públicas: {pub.error}
          </div>
        )}

        {amg.error && (
          <div className="alert alert-warning py-2">
            No se pudieron cargar las tarjetas de amigos.
            <br />
            {amg.error}
          </div>
        )}

        {/* Estados */}
        {cargandoGlobal ? (
          <div className="d-flex align-items-center gap-2">
            <div className="spinner-border" role="status" />
            <span>Cargando tarjetas…</span>
          </div>
        ) : todas.length === 0 ? (
          <div className="alert alert-info">Aún no hay tarjetas para mostrar.</div>
        ) : (
          <div className="row g-3">
            {todas.map((it) => (
              <div key={it._id} className="col-12 col-sm-6 col-lg-4">
                {/* Siempre mostrar el enlace de detalle.
                   El backend decide si el usuario puede verlo. */}
                <TarjetaCard item={it} detalleHref={`/tarjetas/${it._id}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PANEL DE ESTADO (puede ocultarse en el futuro si lo deseas) */}
      <div className="container mb-5">
        <h3 className="mb-3 text-primary fw-bold">Panel de Estado</h3>
        <div
          className="card shadow-sm border-0"
          style={{ backgroundColor: 'var(--azul-claro)' }}
        >
          <div className="card-body">
            <p>
              <strong>API_URL efectiva:</strong> {API_URL}
            </p>

            {errorSalud && <div className="alert alert-danger">Error: {errorSalud}</div>}

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
