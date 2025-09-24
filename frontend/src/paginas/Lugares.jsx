// src/paginas/Lugares.jsx
// ————————————————————————————————————————————————
// Listado público filtrado por etiqueta: /explorar/:etiqueta
// Etiquetas válidas: lugares | experiencias | rutas
// ————————————————————————————————————————————————

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import TarjetaCard from "../componentes/TarjetaCard.jsx";
import { tarjetasApi } from "../servicios/tarjetas";

const OPCIONES_ETIQUETAS = ["lugares", "experiencias", "rutas"];
const LIMIT = 12;

function tituloBonito(slug = "") {
  const s = String(slug).toLowerCase();
  if (s === "lugares") return "Lugares";
  if (s === "experiencias") return "Experiencias";
  if (s === "rutas") return "Rutas";
  return "Explorar";
}

export default function Lugares() {
  const { etiqueta: etiquetaParam } = useParams();
  const navigate = useNavigate();

  // Fallback defensivo
  const etiqueta = (etiquetaParam || "lugares").toLowerCase();

  const [params, setParams] = useSearchParams();
  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);

  const etiquetaValida = useMemo(
    () => OPCIONES_ETIQUETAS.includes(etiqueta),
    [etiqueta]
  );

  const [estado, setEstado] = useState({
    cargando: true,
    error: "",
    items: [],
    meta: { page: 1, pages: 1, total: 0, limit: LIMIT },
  });

  // Redirige si etiqueta inválida
  useEffect(() => {
    if (!etiquetaValida) {
      navigate("/explorar/lugares", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etiquetaValida]);

  // Carga de tarjetas
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!etiquetaValida) return;
      setEstado((e) => ({ ...e, cargando: true, error: "" }));
      try {
        const r = await tarjetasApi.publicas({ etiqueta, page, limit: LIMIT });
        if (cancel) return;
        if (!r?.ok) throw new Error(r?.mensaje || "No se pudieron cargar las tarjetas");
        setEstado({
          cargando: false,
          error: "",
          items: Array.isArray(r.items) ? r.items : [],
          meta: r.meta || { page, pages: 1, total: 0, limit: LIMIT },
        });
      } catch (e) {
        if (cancel) return;
        setEstado({
          cargando: false,
          error: e.message || "Error de red",
          items: [],
          meta: { page: 1, pages: 1, total: 0, limit: LIMIT },
        });
      }
    })();
    return () => { cancel = true; };
  }, [etiqueta, etiquetaValida, page]);

  const irPagina = (p) => {
    const n = Math.max(1, Math.min(p, estado.meta.pages || 1));
    setParams((cur) => {
      const next = new URLSearchParams(cur);
      next.set("page", String(n));
      return next;
    });
  };

  return (
    <div className="container py-4">
      {/* Tabs de categorías */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <h1 className="h4 mb-0">{tituloBonito(etiqueta)}</h1>
        <ul className="nav nav-pills">
          {OPCIONES_ETIQUETAS.map((t) => {
            const active = t === etiqueta;
            return (
              <li key={t} className="nav-item">
                <Link className={`nav-link ${active ? "active" : ""}`} to={`/explorar/${t}`}>
                  {tituloBonito(t)}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Estados */}
      {estado.cargando ? (
        <div className="d-flex align-items-center gap-2">
          <div className="spinner-border" role="status" />
          <span>Cargando {tituloBonito(etiqueta).toLowerCase()}…</span>
        </div>
      ) : estado.error ? (
        <div className="alert alert-danger">Error: {estado.error}</div>
      ) : estado.items.length === 0 ? (
        <div className="alert alert-info">
          Aún no hay {tituloBonito(etiqueta).toLowerCase()} públicos.
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="row g-3">
            {estado.items.map((it) => (
              <div key={it._id} className="col-12 col-sm-6 col-lg-4">
                {/* El botón va dentro de la card mediante 'detalleHref' */}
                <TarjetaCard item={it} detalleHref={`/tarjetas/${it._id}`} />
              </div>
            ))}
          </div>

          {/* Paginación */}
          {estado.meta.pages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => irPagina(page - 1)}
                disabled={page <= 1}
              >
                ← Anterior
              </button>
              <span className="small text-muted">
                Página {estado.meta.page} de {estado.meta.pages} · {estado.meta.total} resultados
              </span>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => irPagina(page + 1)}
                disabled={page >= estado.meta.pages}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
