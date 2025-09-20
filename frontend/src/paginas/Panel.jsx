// src/paginas/Panel.jsx
// Panel privado del usuario donde gestiona sus tarjetas:
// - Carga las tarjetas del usuario autenticado
// - Permite refrescar la lista
// - Navegar a crear/editar
// - Eliminar con borrado optimista

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tarjetasApi } from '../servicios/tarjetas';
import TarjetaCard from '../componentes/TarjetaCard.jsx';

export default function Panel() {
  // Estado: lista de tarjetas, mensaje de error y flag de carga
  const [items, setItems] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  // Para redirecciones (p.ej. si expira el token)
  const navigate = useNavigate();

  // Función que trae "mis tarjetas" desde la API
  // useCallback evita recrearla en cada render y que el useEffect se dispare sin necesidad
  const cargar = useCallback(async () => {
    setMensaje('');
    setCargando(true);
    try {
      const r = await tarjetasApi.mias();

      // Si el backend responde 401 (token inválido/expirado), mandamos a login
      if (r.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      // Cualquier otro error de API
      if (!r.ok) {
        setMensaje(r.mensaje || 'No se pudieron cargar tus tarjetas');
        return;
      }

      // Guardamos la lista (normalizamos a array)
      setItems(Array.isArray(r.items) ? r.items : []);
    } catch (e) {
      // Errores de red, parseo, etc.
      setMensaje(e.message || 'Error de red');
    } finally {
      setCargando(false);
    }
  }, [navigate]);

  // Cargamos al montar el componente (y cuando cambie "cargar")
  useEffect(() => { cargar(); }, [cargar]);

  // Eliminar con borrado optimista:
  // 1) Quitamos de la UI inmediatamente
  // 2) Llamamos a la API; si falla, revertimos
  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta tarjeta?')) return;

    const previo = items;                           // backup por si hay que revertir
    setItems(prev => prev.filter(i => i._id !== id));

    const r = await tarjetasApi.eliminar(id);
    if (!r.ok) {
      setItems(previo);                             // revertir
      alert(r.mensaje || 'No se pudo eliminar');
    }
  };

  return (
    <div className="container py-4">
      {/* Cabecera con título, recargar y crear nueva */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Mis tarjetas</h1>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={cargar} disabled={cargando}>
            <i className="bi bi-arrow-clockwise me-1" /> Recargar
          </button>
          <Link to="/panel/nuevo" className="btn btn-primary">
            <i className="bi bi-plus-lg me-1" /> Nueva
          </Link>
        </div>
      </div>

      {/* Mensaje de error general, si existe */}
      {mensaje && <div className="alert alert-danger">{mensaje}</div>}

      {/* Estados de la lista: cargando / vacía / con datos */}
      {cargando ? (
        <div className="d-flex align-items-center gap-2">
          <div className="spinner-border" role="status" />
          <span>Cargando…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="alert alert-info">
          Aún no tienes tarjetas. Crea la primera con el botón <strong>Nueva</strong>.
        </div>
      ) : (
        <div className="row g-3">
          {items.map((it) => (
            <div key={it._id} className="col-12 col-sm-6 col-lg-4">
              <TarjetaCard
                item={it}
                onEdit={() => navigate(`/panel/editar/${it._id}`)}
                onDelete={() => eliminar(it._id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
