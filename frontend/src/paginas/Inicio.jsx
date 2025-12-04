// src/paginas/Inicio.jsx
// Página principal pública de Explora Huelva.
// Incluye buscador moderno estilo Google.

import { useEffect, useState } from 'react';
import Hero from '../componentes/Hero';
import TarjetaCard from '../componentes/TarjetaCard.jsx';
import { tarjetasApi } from '../servicios/tarjetas';
import { API_URL, getToken } from '../servicios/api';
import banner from '../imagenes/banner.jpg';

export default function Inicio() {
  // Salud del backend (diagnóstico)
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

  // Buscador
  const [busqueda, setBusqueda] = useState("");

  // Saber si hay sesión
  const token = getToken();

  const botonPrincipalHero = {
    texto: 'Ver rutas',
    href: '/explorar/rutas',
  };

  const botonSecundarioHero = token
    ? { texto: 'Ir a mi panel', href: '/panel' }
    : { texto: 'Iniciar sesión', href: '/login' };

  useEffect(() => {
    // Salud backend
    fetch(`${API_URL}/salud`)
      .then((r) => r.json())
      .then(setSalud)
      .catch((err) => setErrorSalud(err.message));

    // Tarjetas públicas
    tarjetasApi.publicas()
      .then((r) => {
        if (!r.ok)
          throw new Error(r.mensaje || 'No se pudieron cargar las tarjetas públicas');
        setPub({ cargando: false, error: '', items: r.items || [] });
      })
      .catch((e) => {
        setPub({ cargando: false, error: e.message, items: [] });
      });

    // Tarjetas de amigos
    const t = getToken();
    if (t) {
      setAmg((s) => ({ ...s, cargando: true, intentado: true }));
      tarjetasApi.amigos()
        .then((r) => {
          if (!r.ok)
            throw new Error(r.mensaje || 'No se pudieron cargar tarjetas de amigos');
          setAmg({ cargando: false, error: '', items: r.items || [], intentado: true });
        })
        .catch((e) => {
          const msg = e?.status === 401 ? '' : e.message || 'Error al cargar tarjetas de amigos';
          setAmg({ cargando: false, error: msg, items: [], intentado: true });
        });
    }
  }, []);

  // Filtrado de seguridad
  const pubVisibles = (pub.items || []).filter((t) => !t?.eliminado);
  const amgVisibles = (amg.items || []).filter((t) => !t?.eliminado);

  // Combinado final
  const todas = [...pubVisibles, ...amgVisibles];

  // FILTRO BUSCADOR
  const filtradas = todas.filter((t) => {
    const txt = busqueda.toLowerCase();
    return (
      t.titulo?.toLowerCase().includes(txt) ||
      t.descripcion?.toLowerCase().includes(txt) ||
      t.tags?.join(" ").toLowerCase().includes(txt)
    );
  });

  const cargandoGlobal = pub.cargando || (amg.intentado && amg.cargando);

  return (
    <>
      {/* HERO PRINCIPAL */}
      <Hero
        titulo="Explora Huelva"
        subtitulo="Descubre rutas, lugares y experiencias únicas"
        botonPrincipal={botonPrincipalHero}
        botonSecundario={botonSecundarioHero}
        fondo={banner}
      />

      {/* LISTADO */}
      <div className="container my-4">

        {/* TÍTULO */}
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h2 className="mb-0 text-primary fw-bold">Explora Huelva</h2>
        </div>

        {/* CONTADOR */}
        <p className="text-muted small mb-3">
          Públicas: <strong>{pubVisibles.length}</strong> · Amigos:{' '}
          <strong>{amgVisibles.length}</strong>
        </p>

        {/* === BUSCADOR ESTILO GOOGLE === */}
        <div className="d-flex justify-content-center mb-4">
          <div className="position-relative" style={{ width: "100%", maxWidth: "500px" }}>
            <i
              className="bi bi-search position-absolute text-secondary"
              style={{
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "1.1rem"
              }}
            ></i>

            <input
              type="text"
              className="form-control shadow-sm"
              style={{
                paddingLeft: "40px",
                height: "45px",
                borderRadius: "12px",
              }}
              placeholder="Buscar rutas, lugares o experiencias..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
        {/* === FIN BUSCADOR === */}

        {/* ERRORES */}
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

        {/* LISTADO FINAL */}
        {cargandoGlobal ? (
          <div className="d-flex align-items-center gap-2">
            <div className="spinner-border" role="status" />
            <span>Cargando tarjetas…</span>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="alert alert-info">
            No se encontraron resultados para: <strong>{busqueda}</strong>
          </div>
        ) : (
          <div className="row g-3">
            {filtradas.map((it) => (
              <div key={it._id} className="col-12 col-sm-6 col-lg-4">
                <TarjetaCard item={it} detalleHref={`/tarjetas/${it._id}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PANEL OCULTO (DEBUG) */}
      {/* 
      <div className="container mb-5">
        <h3 className="mb-3 text-primary fw-bold">Panel de Estado</h3>
        <div className="card shadow-sm border-0" style={{ backgroundColor: 'var(--azul-claro)' }}>
          <div className="card-body">
            <p><strong>API_URL efectiva:</strong> {API_URL}</p>

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
      */}
    </>
  );
}
