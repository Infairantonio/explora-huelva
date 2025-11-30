// src/paginas/Panel.jsx
// Panel privado del usuario para gestionar sus tarjetas:
// - Lista las tarjetas propias
// - Permite recargar, crear, editar y eliminar
// - Muestra botón de panel de administración si el usuario es admin

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { tarjetasApi } from "../servicios/tarjetas";
import { logout } from "../utils/auth";
import TarjetaCard from "../componentes/TarjetaCard.jsx";
import { getPerfil } from "../servicios/api";

// Devuelve una imagen principal para mostrar en la tarjeta
const pickFoto = (t) => {
  if (!t) return null;
  const arr = Array.isArray(t.imagenes) ? t.imagenes : [];
  if (arr.length && typeof arr[0] === "string") return arr[0];
  if (t.imagenUrl && typeof t.imagenUrl === "string") return t.imagenUrl;
  return null;
};

export default function Panel() {
  const [items, setItems] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);

  const navigate = useNavigate();
  const abortRef = useRef(null);

  // Carga las tarjetas del usuario
  const cargar = useCallback(async () => {
    setMensaje("");
    setCargando(true);

    // Cancela peticiones anteriores en curso
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const r = await tarjetasApi.mias({}, { signal: controller.signal });
      const arr = Array.isArray(r.items) ? r.items : [];
      setItems(arr);
    } catch (e) {
      if (e?.name === "AbortError") return;

      if (e?.status === 401) {
        logout();
        navigate("/login", {
          replace: true,
          state: { from: { pathname: "/panel" } },
        });
        return;
      }

      setMensaje(e?.message || "Error de red");
      setItems([]);
    } finally {
      setCargando(false);
    }
  }, [navigate]);

  useEffect(() => {
    // 1) Tarjetas del usuario
    cargar();

    // 2) Perfil para saber si tiene rol administrador
    (async () => {
      try {
        const perfil = await getPerfil();
        const rol = perfil?.usuario?.rol || perfil?.rol;
        if (rol === "admin") setEsAdmin(true);
      } catch {
        // Si falla, simplemente no mostramos el botón de administración
      }
    })();

    // Al desmontar, cancelar la petición en curso
    return () => abortRef.current?.abort();
  }, [cargar]);

  // Elimina una tarjeta con borrado optimista
  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta tarjeta?")) return;

    const copia = items;
    setItems((prev) => prev.filter((i) => i._id !== id));

    try {
      const r = await tarjetasApi.eliminar(id);
      if (!r?.ok) {
        setItems(copia);
        alert(r?.mensaje || "No se pudo eliminar");
      }
    } catch (e) {
      setItems(copia);
      alert(e?.message || "Error de red al eliminar");
    }
  };

  // No se muestran tarjetas marcadas como eliminadas
  const visibles = (items || []).filter((it) => !it?.eliminado);

  return (
    <div className="container py-4">
      {/* Cabecera */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-2 mb-sm-0">
          Mis tarjetas{" "}
          {visibles?.length ? (
            <small className="text-muted">({visibles.length})</small>
          ) : null}
        </h1>
        <div className="d-flex gap-2">
          {/* Botón de panel de administración solo para usuarios con rol admin */}
          {esAdmin && (
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={() => navigate("/admin/tarjetas")}
            >
              <i className="bi bi-shield-lock me-1" /> Panel admin
            </button>
          )}

          {/* Sección de amigos */}
          <Link
            to="/panel/amigos"
            className={`btn btn-outline-primary ${cargando ? "disabled" : ""}`}
            aria-disabled={cargando}
          >
            <i className="bi bi-people me-1" /> Amigos
          </Link>

          {/* Recargar listado */}
          <button
            className="btn btn-outline-secondary"
            onClick={cargar}
            disabled={cargando}
          >
            <i className="bi bi-arrow-clockwise me-1" />{" "}
            {cargando ? "Cargando…" : "Recargar"}
          </button>

          {/* Crear nueva tarjeta */}
          <Link
            to="/panel/nuevo"
            className={`btn btn-primary ${cargando ? "disabled" : ""}`}
            aria-disabled={cargando}
          >
            <i className="bi bi-plus-lg me-1" /> Nueva
          </Link>
        </div>
      </div>

      {/* Mensaje de error general */}
      {mensaje && <div className="alert alert-danger">{mensaje}</div>}

      {/* Contenido principal según estado */}
      {cargando ? (
        <div
          className="d-flex align-items-center gap-2"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="spinner-border" role="status" aria-label="Cargando" />
          <span>Cargando…</span>
        </div>
      ) : visibles.length === 0 ? (
        <div className="alert alert-info">
          Aún no tienes tarjetas. Crea la primera con el botón{" "}
          <strong>Nueva</strong>.
        </div>
      ) : (
        <div className="row g-3">
          {visibles.map((it) => (
            <div key={it._id} className="col-12 col-sm-6 col-lg-4">
              <TarjetaCard
                item={it}
                detalleHref={`/tarjetas/${it._id}`}
                onEdit={() => navigate(`/panel/editar/${it._id}`)}
                onDelete={() => eliminar(it._id)}
                // Si en el futuro TarjetaCard acepta una prop "imagen",
                // se podría usar: imagen={pickFoto(it)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
