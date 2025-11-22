// src/paginas/AdminUsuarios.jsx
// Panel de administración de USUARIOS:
// - Listar y filtrar usuarios
// - Cambiar rol
// - Bloquear / desbloquear
// - Eliminar (soft) y restaurar

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// 👇 IMPORT CORRECTO, igual que hicimos con tarjetas
import { adminUsuariosApi as adminUsuarios } from "../servicios/adminUsuarios";

import { logout } from "../utils/auth";

export default function AdminUsuarios() {
  const navigate = useNavigate();

  const [estado, setEstado] = useState({
    cargando: true,
    error: "",
    items: [],
    total: 0,
  });

  // Filtros / parámetros
  const [f, setF] = useState({
    q: "",
    rol: "",
    estado: "",
    page: 1,
    limit: 25,
    orden: "-createdAt",
  });

  const aborter = useRef(null);

  const cargar = async (params = f) => {
    setEstado((s) => ({ ...s, cargando: true, error: "" }));
    aborter.current?.abort?.();
    const ctrl = new AbortController();
    aborter.current = ctrl;

    try {
      // 👇 pasamos filtros y opciones (signal) como 2º argumento
      const r = await adminUsuarios.listar(params, { signal: ctrl.signal });

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
          state: { from: { pathname: "/admin/usuarios" } },
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
        error: e?.message || "Error al cargar usuarios",
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

  const paginasTexto = useMemo(
    () => Math.max(1, Math.ceil((estado.total || 0) / (f.limit || 25))),
    [estado.total, f.limit]
  );

  const irPagina = (n) => {
    const p = { ...f, page: n };
    setF(p);
    cargar(p);
  };

  // Acciones

  const cambiarRol = async (id, rol) => {
    if (!window.confirm(`¿Cambiar rol de este usuario a "${rol}"?`)) return;
    try {
      await adminUsuarios.cambiarRol(id, rol);
      cargar(f);
    } catch (e) {
      alert(e?.message || "No se pudo cambiar el rol");
    }
  };

  const bloquear = async (id) => {
    if (!window.confirm("¿Bloquear la cuenta de este usuario?")) return;
    try {
      await adminUsuarios.bloquear(id);
      cargar(f);
    } catch (e) {
      alert(e?.message || "No se pudo bloquear");
    }
  };

  const desbloquear = async (id) => {
    try {
      await adminUsuarios.desbloquear(id);
      cargar(f);
    } catch (e) {
      alert(e?.message || "No se pudo desbloquear");
    }
  };

  const eliminar = async (id) => {
    const motivo = window.prompt(
      "Motivo de eliminación (soft delete):",
      "Incumplimiento de normas"
    );
    if (motivo === null) return;
    try {
      await adminUsuarios.eliminar(id, motivo);
      cargar(f);
    } catch (e) {
      alert(e?.message || "No se pudo eliminar");
    }
  };

  const restaurar = async (id) => {
    try {
      await adminUsuarios.restaurar(id);
      cargar(f);
    } catch (e) {
      alert(e?.message || "No se pudo restaurar");
    }
  };

  // Helpers UI

  const resumen = useMemo(() => {
    const arr = estado.items || [];
    let activos = 0;
    let bloqueados = 0;
    let eliminados = 0;

    arr.forEach((u) => {
      if (u.eliminado) eliminados++;
      else if (u.bloqueado) bloqueados++;
      else activos++;
    });

    return { activos, bloqueados, eliminados };
  }, [estado.items]);

  const estadoLabel = (u) => {
    if (u.eliminado) return "Eliminado";
    if (u.bloqueado) return "Bloqueado";
    return "Activo";
  };

  const estadoBadgeClass = (u) => {
    if (u.eliminado) return "badge bg-warning text-dark";
    if (u.bloqueado) return "badge bg-danger";
    return "badge bg-success";
  };

  const rolesDisponibles = ["usuario", "admin"];

  return (
    <div className="container py-4">
      {/* Cabecera */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 mb-1">Panel de administración · Usuarios</h1>
          <p className="text-muted small mb-0">
            Gestiona roles, bloqueos y eliminaciones de cuentas.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => navigate("/admin/tarjetas")}
        >
          <i className="bi bi-card-image me-1" />
          Ir a tarjetas
        </button>
      </div>

      {/* Resumen */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-sm-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body py-2">
              <div className="text-muted small">Total (consulta)</div>
              <div className="fw-semibold fs-5">{estado.total}</div>
            </div>
          </div>
        </div>
        <div className="col-4 col-sm-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body py-2">
              <div className="text-muted small">Activos</div>
              <div className="fw-semibold fs-5">{resumen.activos}</div>
            </div>
          </div>
        </div>
        <div className="col-4 col-sm-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body py-2">
              <div className="text-muted small">Bloqueados</div>
              <div className="fw-semibold fs-5">{resumen.bloqueados}</div>
            </div>
          </div>
        </div>
        <div className="col-4 col-sm-4 col-lg-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body py-2">
              <div className="text-muted small">Eliminados</div>
              <div className="fw-semibold fs-5">{resumen.eliminados}</div>
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
              placeholder="nombre o email"
            />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Rol</label>
            <select
              value={f.rol}
              onChange={(e) => setF({ ...f, rol: e.target.value })}
              className="form-select"
            >
              <option value="">(todos)</option>
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Estado</label>
            <select
              value={f.estado}
              onChange={(e) => setF({ ...f, estado: e.target.value })}
              className="form-select"
            >
              <option value="">(todos)</option>
              <option value="activo">Activo</option>
              <option value="bloqueado">Bloqueado</option>
              <option value="eliminado">Eliminado</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label">Orden</label>
            <select
              value={f.orden}
              onChange={(e) => setF({ ...f, orden: e.target.value })}
              className="form-select"
            >
              <option value="-createdAt">Más nuevos</option>
              <option value="createdAt">Más antiguos</option>
              <option value="nombre">Nombre (A-Z)</option>
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

      {/* Error */}
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
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Creado</th>
              <th>Último acceso</th>
              <th style={{ width: 260 }}>Acciones</th>
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
              (estado.items || []).map((u) => {
                const rolActual = u.rol || "usuario";
                const ultimoAcceso = u.lastLoginAt || u.ultimoAcceso;

                return (
                  <tr
                    key={u._id || u.id}
                    className={u.eliminado ? "table-warning" : ""}
                  >
                    <td className="fw-semibold">
                      {u.nombre || "(sin nombre)"}
                    </td>
                    <td>{u.email || ""}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={rolActual}
                        onChange={(e) =>
                          cambiarRol(u._id || u.id, e.target.value)
                        }
                      >
                        {rolesDisponibles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={estadoBadgeClass(u)}>
                        {estadoLabel(u)}
                      </span>
                    </td>
                    <td>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      {ultimoAcceso
                        ? new Date(ultimoAcceso).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        {!u.eliminado && (
                          <>
                            {u.bloqueado ? (
                              <button
                                className="btn btn-sm btn-outline-success"
                                onClick={() =>
                                  desbloquear(u._id || u.id)
                                }
                              >
                                <i className="bi bi-unlock" /> Desbloquear
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() =>
                                  bloquear(u._id || u.id)
                                }
                              >
                                <i className="bi bi-lock" /> Bloquear
                              </button>
                            )}

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => eliminar(u._id || u.id)}
                            >
                              <i className="bi bi-trash" /> Eliminar
                            </button>
                          </>
                        )}

                        {u.eliminado && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => restaurar(u._id || u.id)}
                          >
                            <i className="bi bi-arrow-counterclockwise" />{" "}
                            Restaurar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted small">
          Total: {estado.total} · Página {f.page} de {paginasTexto}
        </div>
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
            disabled={f.page >= paginasTexto || estado.cargando}
            onClick={() => irPagina(f.page + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
