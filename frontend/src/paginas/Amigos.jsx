// src/paginas/Amigos.jsx
// · Gestión de amigos: buscar usuarios, enviar solicitudes y administrar amistades.

import { useEffect, useRef, useState } from "react";
import { amigosApi } from "../servicios/amigos";
import { logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function Amigos() {
  const navigate = useNavigate();

  const [estado, setEstado] = useState({
    cargando: true,
    err: "",
    amigos: [],
    pendientes: [], // [{_id, tipo: 'recibida'|'enviada', usuario:{_id,nombre,email}}]
  });

  // Mensajes globales (éxito / error)
  const [flash, setFlash] = useState({ tipo: "", texto: "" });

  // Modal de confirmación
  const [confirm, setConfirm] = useState({
    visible: false,
    titulo: "",
    mensaje: "",
    onConfirm: null,
  });

  // Estado de búsqueda de nuevos amigos
  const [q, setQ] = useState("");
  const [busca, setBusca] = useState({
    cargando: false,
    err: "",
    items: [],
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  const abortRef = useRef(null);
  const abortBuscaRef = useRef(null);

  const mostrarMensaje = (texto, tipo = "info") => {
    setFlash({ tipo, texto });
    // opcional: limpiar mensaje después de unos segundos
    // setTimeout(() => setFlash({ tipo: "", texto: "" }), 4000);
  };

  const pedirConfirmacion = (titulo, mensaje, onConfirm) => {
    setConfirm({
      visible: true,
      titulo,
      mensaje,
      onConfirm,
    });
  };

  const cerrarConfirmacion = () => {
    setConfirm({
      visible: false,
      titulo: "",
      mensaje: "",
      onConfirm: null,
    });
  };

  // Carga amigos y solicitudes pendientes
  const cargar = async () => {
    setEstado((s) => ({ ...s, cargando: true, err: "" }));
    abortRef.current?.abort?.();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const [a, p] = await Promise.all([
        amigosApi.listar(),
        amigosApi.pendientes(),
      ]);

      setEstado({
        cargando: false,
        err: "",
        amigos: a.items || [],
        pendientes: p.items || [],
      });
    } catch (e) {
      if (e?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setEstado({
        cargando: false,
        err: e?.message || "Se ha producido un error al cargar tus amigos.",
        amigos: [],
        pendientes: [],
      });
    }
  };

  useEffect(() => {
    cargar();
    return () => abortRef.current?.abort?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Búsqueda paginada de usuarios
  const hacerBusqueda = async (page = 1) => {
    abortBuscaRef.current?.abort?.();
    const ctrl = new AbortController();
    abortBuscaRef.current = ctrl;

    try {
      setBusca((s) => ({ ...s, cargando: true, err: "" }));

      const r = await amigosApi.buscarUsuarios(q, {
        page,
        limit: busca.limit,
      });

      setBusca({
        cargando: false,
        err: "",
        items: r.items || [],
        page: r.meta?.page || 1,
        pages: r.meta?.pages || 1,
        total: r.meta?.total || 0,
        limit: r.meta?.limit || busca.limit,
      });
    } catch (e) {
      if (e?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setBusca((s) => ({
        ...s,
        cargando: false,
        err:
          e?.message ||
          "Se ha producido un error al buscar usuarios. Inténtalo de nuevo en unos minutos.",
      }));
    }
  };

  const onBuscar = (e) => {
    e.preventDefault();
    hacerBusqueda(1);
  };

  // Enviar o gestionar solicitudes de amistad
  const solicitar = async (usuarioId) => {
    try {
      await amigosApi.solicitarPorId(usuarioId);
      mostrarMensaje(
        "Tu solicitud de amistad se ha enviado correctamente.",
        "success"
      );
      cargar(); // refresca pendientes
      setBusca((s) => ({
        ...s,
        items: s.items.filter((u) => u._id !== usuarioId),
      }));
    } catch (e) {
      mostrarMensaje(
        e?.message ||
          "No ha sido posible enviar la solicitud de amistad. Inténtalo de nuevo en unos minutos.",
        "danger"
      );
    }
  };

  const aceptar = async (usuarioId) => {
    try {
      await amigosApi.aceptar(usuarioId);
      mostrarMensaje("Has aceptado la solicitud de amistad.", "success");
      cargar();
    } catch (e) {
      mostrarMensaje(
        e?.message ||
          "No ha sido posible aceptar la solicitud. Inténtalo de nuevo en unos minutos.",
        "danger"
      );
    }
  };

  const rechazar = (usuarioId) => {
    pedirConfirmacion(
      "Rechazar solicitud de amistad",
      "¿Seguro que quieres rechazar esta solicitud de amistad? Esta acción no se puede deshacer.",
      async () => {
        try {
          await amigosApi.rechazar(usuarioId);
          mostrarMensaje(
            "La solicitud de amistad ha sido rechazada.",
            "success"
          );
          cargar();
        } catch (e) {
          mostrarMensaje(
            e?.message ||
              "No ha sido posible rechazar la solicitud. Inténtalo de nuevo en unos minutos.",
            "danger"
          );
        } finally {
          cerrarConfirmacion();
        }
      }
    );
  };

  const cancelar = (usuarioId) => {
    pedirConfirmacion(
      "Cancelar solicitud de amistad",
      "¿Quieres cancelar la solicitud de amistad que has enviado a esta persona?",
      async () => {
        try {
          await amigosApi.cancelar(usuarioId);
          mostrarMensaje(
            "Tu solicitud de amistad se ha cancelado correctamente.",
            "success"
          );
          cargar();
        } catch (e) {
          mostrarMensaje(
            e?.message ||
              "No ha sido posible cancelar la solicitud. Inténtalo de nuevo en unos minutos.",
            "danger"
          );
        } finally {
          cerrarConfirmacion();
        }
      }
    );
  };

  const romper = (usuarioId) => {
    pedirConfirmacion(
      "Eliminar amistad",
      "¿Seguro que quieres eliminar esta amistad? Siempre podréis volver a conectaros más adelante.",
      async () => {
        try {
          await amigosApi.eliminar(usuarioId);
          mostrarMensaje(
            "La amistad se ha eliminado correctamente.",
            "success"
          );
          cargar();
        } catch (e) {
          mostrarMensaje(
            e?.message ||
              "No ha sido posible eliminar la amistad. Inténtalo de nuevo en unos minutos.",
            "danger"
          );
        } finally {
          cerrarConfirmacion();
        }
      }
    );
  };

  return (
    <>
      <div className="container py-4">
        {/* Cabecera + recarga */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h5 mb-0">
            <i className="bi bi-people me-2" />
            Amigos
          </h1>
          <button
            className="btn btn-outline-secondary"
            onClick={cargar}
            disabled={estado.cargando}
          >
            {estado.cargando ? "Actualizando…" : "Actualizar listado"}
          </button>
        </div>

        {/* Mensaje global */}
        {flash.texto && (
          <div
            className={`alert alert-${flash.tipo} alert-dismissible fade show`}
            role="alert"
          >
            {flash.texto}
            <button
              type="button"
              className="btn-close"
              onClick={() => setFlash({ tipo: "", texto: "" })}
            ></button>
          </div>
        )}

        {estado.err && <div className="alert alert-danger">{estado.err}</div>}

        {/* Bloque buscador de usuarios */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <form className="row g-2" onSubmit={onBuscar}>
              <div className="col-12 col-md-6">
                <label className="form-label">Buscar usuarios</label>
                <input
                  className="form-control"
                  placeholder="Introduce un nombre o email"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-3 align-self-end">
                <button
                  className="btn btn-primary w-100"
                  disabled={busca.cargando}
                >
                  {busca.cargando ? "Buscando…" : "Buscar"}
                </button>
              </div>
              <div className="col-12 col-md-3 align-self-end">
                <div className="text-muted small">
                  Solo se muestran usuarios con los que aún no tienes ninguna
                  relación.
                </div>
              </div>
            </form>

            {busca.err && (
              <div className="alert alert-danger mt-3">{busca.err}</div>
            )}

            {/* Resultados de búsqueda */}
            {!busca.cargando && busca.items.length > 0 && (
              <div className="table-responsive mt-3">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th style={{ width: 180 }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {busca.items.map((u) => (
                      <tr key={u._id}>
                        <td>{u.nombre}</td>
                        <td className="text-muted small">{u.email}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => solicitar(u._id)}
                          >
                            Enviar solicitud
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Paginación búsqueda */}
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small">Total: {busca.total}</div>
                  <div className="btn-group">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={busca.page <= 1 || busca.cargando}
                      onClick={() => hacerBusqueda(busca.page - 1)}
                    >
                      Anterior
                    </button>
                    <span className="btn btn-outline-secondary btn-sm disabled">
                      {busca.page} / {busca.pages}
                    </span>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={busca.page >= busca.pages || busca.cargando}
                      onClick={() => hacerBusqueda(busca.page + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!busca.cargando && busca.items.length === 0 && q.trim() && (
              <div className="text-muted mt-3">
                No se han encontrado usuarios para “{q}”.
              </div>
            )}
          </div>
        </div>

        {/* Bloque solicitudes pendientes */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <h2 className="h6 mb-3">Solicitudes</h2>
            {estado.cargando ? (
              <div className="d-flex align-items-center gap-2">
                <div className="spinner-border" role="status" />
                <span>Cargando…</span>
              </div>
            ) : (estado.pendientes || []).length === 0 ? (
              <div className="text-muted">
                No tienes solicitudes de amistad pendientes.
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {estado.pendientes.map((s) => (
                  <li
                    key={s._id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>{s.usuario?.nombre || "Usuario"}</strong>
                      <div className="small text-muted">
                        {s.usuario?.email}
                      </div>
                      <span
                        className={`badge ms-2 ${
                          s.tipo === "recibida"
                            ? "bg-info text-dark"
                            : "bg-light text-dark"
                        }`}
                      >
                        {s.tipo === "recibida"
                          ? "Solicitud recibida"
                          : "Solicitud enviada"}
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      {s.tipo === "recibida" ? (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => aceptar(s.usuario._id)}
                          >
                            Aceptar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => rechazar(s.usuario._id)}
                          >
                            Rechazar
                          </button>
                        </>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => cancelar(s.usuario._id)}
                        >
                          Cancelar solicitud
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Bloque amigos actuales */}
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h2 className="h6 mb-3">Mis amigos</h2>
            {estado.cargando ? (
              <div className="d-flex align-items-center gap-2">
                <div className="spinner-border" role="status" />
                <span>Cargando…</span>
              </div>
            ) : (estado.amigos || []).length === 0 ? (
              <div className="text-muted">
                Todavía no tienes amigos añadidos en Explora Huelva.
              </div>
            ) : (
              <ul className="list-group list-group-flush">
                {estado.amigos.map((a) => (
                  <li
                    key={a._id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <strong>{a.amigo?.nombre || "Usuario"}</strong>
                      <div className="small text-muted">{a.amigo?.email}</div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => romper(a.amigo?._id)}
                    >
                      Eliminar amistad
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmación personalizado */}
      {confirm.visible && (
        <>
          <div
            className="modal fade show"
            tabIndex="-1"
            style={{ display: "block" }}
            aria-modal="true"
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header">
                  <h5 className="modal-title">{confirm.titulo}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={cerrarConfirmacion}
                  ></button>
                </div>
                <div className="modal-body">
                  <p className="mb-0">{confirm.mensaje}</p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={cerrarConfirmacion}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => confirm.onConfirm && confirm.onConfirm()}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Backdrop */}
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </>
  );
}
