import { useEffect, useRef, useState } from 'react';
import { amigosApi } from '../servicios/amigos';
import { logout } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function Amigos() {
  const navigate = useNavigate();

  const [estado, setEstado] = useState({
    cargando: true,
    err: '',
    amigos: [],
    pendientes: [], // [{_id, tipo: 'recibida'|'enviada', usuario:{_id,nombre,email}}]
  });

  // Buscador
  const [q, setQ] = useState('');
  const [busca, setBusca] = useState({
    cargando: false,
    err: '',
    items: [],
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  const abortRef = useRef(null);
  const abortBuscaRef = useRef(null);

  const cargar = async () => {
    setEstado((s) => ({ ...s, cargando: true, err: '' }));
    abortRef.current?.abort?.();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const [a, p] = await Promise.all([amigosApi.listar(), amigosApi.pendientes()]);
      setEstado({
        cargando: false,
        err: '',
        amigos: a.items || [],
        pendientes: p.items || [],
      });
    } catch (e) {
      if (e?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setEstado({ cargando: false, err: e?.message || 'Error', amigos: [], pendientes: [] });
    }
  };

  useEffect(() => {
    cargar();
    return () => abortRef.current?.abort?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hacerBusqueda = async (page = 1) => {
    abortBuscaRef.current?.abort?.();
    const ctrl = new AbortController();
    abortBuscaRef.current = ctrl;
    try {
      setBusca((s) => ({ ...s, cargando: true, err: '' }));
      const r = await amigosApi.buscarUsuarios(q, { page, limit: busca.limit });
      setBusca({
        cargando: false,
        err: '',
        items: r.items || [],
        page: r.meta?.page || 1,
        pages: r.meta?.pages || 1,
        total: r.meta?.total || 0,
        limit: r.meta?.limit || busca.limit,
      });
    } catch (e) {
      if (e?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setBusca((s) => ({ ...s, cargando: false, err: e?.message || 'Error buscando' }));
    }
  };

  const onBuscar = (e) => {
    e.preventDefault();
    hacerBusqueda(1);
  };

  const solicitar = async (usuarioId) => {
    try {
      await amigosApi.solicitarPorId(usuarioId);
      alert('Solicitud enviada');
      // Refrescar pendientes (yo aparezco como “enviada”)
      cargar();
      // Limpiar de resultados actuales para UX
      setBusca((s) => ({ ...s, items: s.items.filter((u) => u._id !== usuarioId) }));
    } catch (e) {
      alert(e?.message || 'No se pudo enviar la solicitud');
    }
  };

  const aceptar = async (usuarioId) => {
    try {
      await amigosApi.aceptar(usuarioId);
      cargar();
    } catch (e) {
      alert(e?.message || 'No se pudo aceptar');
    }
  };

  const rechazar = async (usuarioId) => {
    if (!window.confirm('¿Rechazar esta solicitud?')) return;
    try {
      await amigosApi.rechazar(usuarioId);
      cargar();
    } catch (e) {
      alert(e?.message || 'No se pudo rechazar');
    }
  };

  const cancelar = async (usuarioId) => {
    if (!window.confirm('¿Cancelar tu solicitud?')) return;
    try {
      await amigosApi.cancelar(usuarioId);
      cargar();
    } catch (e) {
      alert(e?.message || 'No se pudo cancelar');
    }
  };

  const romper = async (usuarioId) => {
    if (!window.confirm('¿Dejar de ser amigos?')) return;
    try {
      await amigosApi.eliminar(usuarioId);
      cargar();
    } catch (e) {
      alert(e?.message || 'No se pudo eliminar la amistad');
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h5 mb-0"><i className="bi bi-people me-2" />Amigos</h1>
        <button className="btn btn-outline-secondary" onClick={cargar} disabled={estado.cargando}>
          {estado.cargando ? 'Cargando…' : 'Recargar'}
        </button>
      </div>

      {estado.err && <div className="alert alert-danger">{estado.err}</div>}

      {/* Buscador */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <form className="row g-2" onSubmit={onBuscar}>
            <div className="col-12 col-md-6">
              <label className="form-label">Buscar usuarios</label>
              <input
                className="form-control"
                placeholder="Nombre o email"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-3 align-self-end">
              <button className="btn btn-primary w-100" disabled={busca.cargando}>
                {busca.cargando ? 'Buscando…' : 'Buscar'}
              </button>
            </div>
            <div className="col-12 col-md-3 align-self-end">
              <div className="text-muted small">
                Solo aparecen usuarios con los que aún no tienes relación.
              </div>
            </div>
          </form>

          {busca.err && <div className="alert alert-danger mt-3">{busca.err}</div>}

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
                        <button className="btn btn-sm btn-outline-primary" onClick={() => solicitar(u._id)}>
                          Solicitar amistad
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación */}
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
                  <span className="btn btn-outline-secondary btn-sm disabled">{busca.page} / {busca.pages}</span>
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
            <div className="text-muted mt-3">Sin resultados para “{q}”.</div>
          )}
        </div>
      </div>

      {/* Pendientes */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <h2 className="h6 mb-3">Solicitudes</h2>
          {estado.cargando ? (
            <div className="d-flex align-items-center gap-2">
              <div className="spinner-border" role="status" /><span>Cargando…</span>
            </div>
          ) : (estado.pendientes || []).length === 0 ? (
            <div className="text-muted">No tienes solicitudes pendientes.</div>
          ) : (
            <ul className="list-group list-group-flush">
              {estado.pendientes.map((s) => (
                <li key={s._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{s.usuario?.nombre || 'Usuario'}</strong>
                    <div className="small text-muted">{s.usuario?.email}</div>
                    <span className={`badge ms-2 ${s.tipo === 'recibida' ? 'bg-info text-dark' : 'bg-light text-dark'}`}>
                      {s.tipo === 'recibida' ? 'Recibida' : 'Enviada'}
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    {s.tipo === 'recibida' ? (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => aceptar(s.usuario._id)}>
                          Aceptar
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => rechazar(s.usuario._id)}>
                          Rechazar
                        </button>
                      </>
                    ) : (
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => cancelar(s.usuario._id)}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Amigos */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h2 className="h6 mb-3">Mis amigos</h2>
          {estado.cargando ? (
            <div className="d-flex align-items-center gap-2">
              <div className="spinner-border" role="status" /><span>Cargando…</span>
            </div>
          ) : (estado.amigos || []).length === 0 ? (
            <div className="text-muted">Aún no tienes amigos añadidos.</div>
          ) : (
            <ul className="list-group list-group-flush">
              {estado.amigos.map((a) => (
                <li key={a._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{a.amigo?.nombre || 'Usuario'}</strong>
                    <div className="small text-muted">{a.amigo?.email}</div>
                  </div>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => romper(a.amigo?._id)}>
                    Eliminar amistad
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
