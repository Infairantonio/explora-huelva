// src/paginas/AdminTarjetas.jsx
// Panel de administración: listar, filtrar, eliminar (soft) y restaurar tarjetas

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
// 👇 IMPORT CORREGIDO: usamos el nombre del servicio que exportamos
import { adminTarjetasApi as adminTarjetas } from "../servicios/adminTarjetas";
import { logout } from "../utils/auth";

export default function AdminTarjetas() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState({
    cargando: true,
    error: "",
    items: [],
    total: 0,
  });

  // Filtros / parámetros de consulta
  const [f, setF] = useState({
    q: "",
    et: "",
    vis: "",
    incDel: true,
    page: 1,
    limit: 25,
    orden: "-createdAt", // -createdAt = más nuevas primero
  });

  const aborter = useRef(null);

  const cargar = async (params = f) => {
    setEstado((s) => ({ ...s, cargando: true, error: "" }));
    aborter.current?.abort?.();
    const ctrl = new AbortController();
    aborter.current = ctrl;

    try {
      const filtros = {
        ...params,
        incDel: params.incDel ? 1 : 0,
      };

      // 👇 aquí pasamos bien los dos argumentos: filtros + opciones (signal)
      const r = await adminTarjetas.listar(filtros, { signal: ctrl.signal });

      setEstado({
        cargando: false,
        error: "",
        items: r.items || [],
        total: r.total || 0,
      });
    } catch (e) {
      if (e?.name === "AbortError") return;

      if (e?.status === 401) {
        logout();
        navigate("/login", {
          replace: true,
          state: { from: { pathname: "/admin/tarjetas" } },
        });
        return;
      }
      if (e?.status === 403) {
        setEstado({
          cargando: false,
          error: "No tienes permisos de administrador.",
          items: [],
          total: 0,
        });
        return;
      }
      setEstado({
        cargando: false,
        error: e?.message || "Error al cargar",
        items: [],
        total: 0,
      });
    }
  };

  useEffect(() => {
    cargar(f);
    return () => aborter.current?.abort?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    const p = { ...f, page: 1 };
    setF(p);
    cargar(p);
  };

  const paginas = useMemo(
    () => Math.max(1, Math.ceil((estado.total || 0) / (f.limit || 25))),
    [estado.total, f.limit]
  );

  const irPagina = (n) => {
    const p = { ...f, page: n };
    setF(p);
    cargar(p);
  };

  const eliminar = async (id) => {
    const motivo = window.prompt(
      "Motivo de eliminación (soft delete):",
      "Contenido incoherente"
    );
    if (motivo === null) return;
    try {
      await adminTarjetas.eliminar(id, motivo);
      cargar(f);
    } catch (e) {
      alert(e?.message || "No se pudo eliminar");
    }
  };

  const restaurar = async (id) => {
    try {
      await adminTarjetas.restaurar(id);
      cargar(f);
    } catch (e) {
      alert(e?.message || "No se pudo restaurar");
    }
  };

  // Badge para visibilidad (incluye 'amigos')
  const VisBadge = ({ vis }) => {
    const v = String(vis || "").toLowerCase();
    if (v === "publico")
      return <span className="badge bg-success">Público</span>;
    if (v === "amigos")
      return <span className="badge bg-info text-dark">Amigos</span>;
    if (v === "privado")
      return <span className="badge bg-secondary">Privado</span>;
    return <span className="badge bg-light text-dark">{vis || "—"}</span>;
  };

  // Pequeño resumen local de estado
  const resumen = useMemo(() => {
    const arr = estado.items || [];
    let activas = 0;
    let eliminadas = 0;
    arr.forEach((it) => {
      if (it.eliminado) eliminadas++;
      else activas++;
    });
    return { activas, eliminadas };
  }, [estado.items]);

  return (
    <div className="container py-4">
      {/* Cabecera panel */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 mb-1">Panel de administración · Tarjetas</h1>
          <p className="text-muted small mb-0">
            Revisa, filtra y modera todas las publicaciones de la plataforma.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate("/admin/usuarios")}
        >
          <i className="bi bi-people me-1" />
          Gestión de usuarios
        </button>
      </div>

      {/* Resumen rápido */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-sm-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body py-2">
              <div className="text-muted small">Total tarjetas (consulta)</div>
              <div className="fw-semibold fs-5">{estado.total}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body py-2">
              <div className="text-muted small">Activas en la tabla</div>
              <div className="fw-semibold fs-5">{resumen.activas}</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-sm-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body py-2">
              <div className="text-muted small">Eliminadas en la tabla</div>
              <div className="fw-semibold fs-5">{resumen.eliminadas}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <form
        className="card card-body shadow-sm border-0 mb-3"
        onSubmit={onSubmit}
      >
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label">Buscar</label>
            <input
              value={f.q}
              onChange={(e) => setF({ ...f, q: e.target.value })}
              className="form-control"
              placeholder="título, descripción, usuario…"
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Etiqueta</label>
            <select
              value={f.et}
              onChange={(e) => setF({ ...f, et: e.target.value })}
              className="form-select"
            >
              <option value="">(todas)</option>
              <option value="lugares">Lugares</option>
              <option value="experiencias">Experiencias</option>
              <option value="rutas">Rutas</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Visibilidad</label>
            <select
              value={f.vis}
              onChange={(e) => setF({ ...f, vis: e.target.value })}
              className="form-select"
            >
              <option value="">(todas)</option>
              <option value="publico">Público</option>
              <option value="amigos">Amigos</option>
              <option value="privado">Privado</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Orden</label>
            <select
              value={f.orden}
              onChange={(e) => setF({ ...f, orden: e.target.value })}
              className="form-select"
            >
              <option value="-createdAt">Más nuevas primero</option>
              <option value="createdAt">Más antiguas primero</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Tamaño página</label>
            <select
              value={f.limit}
              onChange={(e) =>
                setF({ ...f, limit: Number(e.target.value), page: 1 })
              }
              className="form-select"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2 form-check mt-4">
            <input
              id="incDel"
              type="checkbox"
              className="form-check-input"
              checked={!!f.incDel}
              onChange={(e) => setF({ ...f, incDel: e.target.checked })}
            />
            <label htmlFor="incDel" className="form-check-label">
              Incluir eliminadas
            </label>
          </div>

          <div className="col-12 col-md-2 ms-auto">
            <button
              className="btn btn-primary w-100"
              disabled={estado.cargando}
              type="submit"
            >
              {estado.cargando ? "Cargando…" : "Filtrar"}
            </button>
          </div>
        </div>
      </form>

      {/* Estados */}
      {estado.error && (
        <div className="alert alert-danger" role="alert">
          {estado.error}
        </div>
      )}

      {/* Tabla */}
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead>
            <tr>
              <th>Título</th>
              <th>Usuario</th>
              <th>Visibilidad</th>
              <th>Etiquetas</th>
              <th>Estado</th>
              <th>Creada</th>
              <th style={{ width: 220 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {estado.cargando ? (
              <tr>
                <td colSpan={7}>Cargando…</td>
              </tr>
            ) : (estado.items || []).length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted">
                  Sin resultados
                </td>
              </tr>
            ) : (
              (estado.items || []).map((it) => (
                <tr
                  key={it._id}
                  className={it.eliminado ? "table-warning" : ""}
                >
                  <td className="fw-semibold">{it.titulo}</td>
                  <td>
                    {it.usuario?.nombre || ""}
                    <div className="text-muted small">
                      {it.usuario?.email || ""}
                    </div>
                  </td>
                  <td>
                    <VisBadge vis={it.visibilidad} />
                  </td>
                  <td>{(it.etiquetas || []).join(", ")}</td>
                  <td>
                    {it.eliminado ? (
                      <span className="badge bg-warning text-dark">
                        Eliminada
                      </span>
                    ) : (
                      <span className="badge bg-success">Activa</span>
                    )}
                  </td>
                  <td>{new Date(it.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      {!it.eliminado ? (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => eliminar(it._id)}
                        >
                          <i className="bi bi-trash" /> Eliminar
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => restaurar(it._id)}
                        >
                          <i className="bi bi-arrow-counterclockwise" />{" "}
                          Restaurar
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                          window.open(`/tarjetas/${it._id}`, "_blank")
                        }
                        title="Ver detalle público"
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación simple */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted small">Total: {estado.total}</div>
        <div className="btn-group">
          <button
            className="btn btn-outline-secondary"
            disabled={f.page <= 1 || estado.cargando}
            onClick={() => irPagina(f.page - 1)}
          >
            Anterior
          </button>
          <span className="btn btn-outline-secondary disabled">
            {f.page}
          </span>
          <button
            className="btn btn-outline-secondary"
            disabled={f.page >= paginas || estado.cargando}
            onClick={() => irPagina(f.page + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
