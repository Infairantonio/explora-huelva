// src/componentes/TarjetaCard.jsx
// Tarjeta visual para mostrar un lugar/experiencia/ruta con imagen, vídeo, etiquetas y acciones.

import React, { memo } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// Acepta solo http/https; evita esquemas peligrosos (javascript:, data:, etc.)
function sanitizeUrl(url = "") {
  try {
    const u = new URL(url);
    if (["http:", "https:"].includes(u.protocol)) return url;
  } catch {
    /* noop */
  }
  return null;
}

// Convierte URLs de YouTube/Vimeo en URLs para <iframe> embebido
function toEmbedUrl(url = "") {
  const safe = sanitizeUrl(url);
  if (!safe) return null;

  try {
    const u = new URL(safe);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube (normal o shorts)
    if (host.includes("youtube.com")) {
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }

    // YouTube corto (youtu.be)
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // Vimeo
    if (host.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts.pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

// Color de badge según etiqueta
const etiquetaBadgeClass = (tag) => {
  switch ((tag || "").toLowerCase()) {
    case "lugares":
      return "bg-primary";
    case "experiencias":
      return "bg-warning text-dark";
    case "rutas":
      return "bg-info text-dark";
    default:
      return "bg-light text-dark";
  }
};

// Construye una URL segura de Google Maps "Cómo llegar"
function buildMapsUrl(lat, lng) {
  const latNum = Number(lat);
  const lngNum = Number(lng);

  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  if (latNum < -90 || latNum > 90) return null;
  if (lngNum < -180 || lngNum > 180) return null;

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${latNum},${lngNum}`
  )}`;
}

function TarjetaCard({
  item,
  onEdit,
  onDelete,
  detalleHref,
  abrirEnNuevaPestana = false,
}) {
  // Seguridad extra: no mostramos tarjetas marcadas como eliminadas
  if (item?.eliminado) return null;

  const imagenes = Array.isArray(item?.imagenes)
    ? item.imagenes
    : item?.imagenUrl
    ? [item.imagenUrl]
    : [];

  // La API ya devuelve rutas listas (ej: "/api/uploads/xxx.jpg")
  const portada = imagenes[0] || null;

  const embed = toEmbedUrl(item?.videoUrl);
  const videoUrl = sanitizeUrl(item?.videoUrl);
  const esMp4 =
    typeof videoUrl === "string" && videoUrl.toLowerCase().endsWith(".mp4");

  const vis = (item?.visibilidad || "").toLowerCase();
  const visTexto =
    vis === "publico"
      ? "Público"
      : vis === "privado"
      ? "Privado"
      : vis === "amigos"
      ? "Amigos"
      : "—";
  const visClass =
    vis === "publico"
      ? "bg-success"
      : vis === "privado"
      ? "bg-secondary"
      : vis === "amigos"
      ? "bg-primary"
      : "bg-light text-dark";

  const mapsUrl = buildMapsUrl(item?.lat, item?.lng);
  const creadorNombre = item?.usuario?.nombre || null;

  const descripcionTexto = item?.descripcion || "Sin descripción.";
  const descripcionCorta =
    descripcionTexto.length > 180
      ? `${descripcionTexto.slice(0, 177)}…`
      : descripcionTexto;

  return (
    <article
      className="card h-100 border-0 shadow-sm"
      style={{ borderRadius: "1rem", overflow: "hidden" }}
      aria-label={item?.titulo || "Tarjeta de contenido"}
    >
      {/* Media: 1) iframe 2) vídeo mp4 3) imagen de portada */}
      {embed ? (
        <div className="ratio ratio-16x9">
          <iframe
            src={embed}
            title={item?.titulo || "Video de la tarjeta"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ border: 0 }}
          />
        </div>
      ) : esMp4 ? (
        <div className="position-relative">
          <video
            className="w-100"
            style={{ maxHeight: 220, objectFit: "cover" }}
            controls
            preload="metadata"
            src={videoUrl || undefined}
          />
        </div>
      ) : portada ? (
        <div className="position-relative">
          <img
            src={portada}
            className="card-img-top"
            alt={item?.titulo || "Imagen de la tarjeta"}
            style={{ objectFit: "cover", height: 200 }}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div
            className="position-absolute top-0 start-0 w-100"
            style={{
              height: "40%",
              backgroundImage:
                "linear-gradient(to bottom, rgba(0,0,0,.35), transparent)",
            }}
            aria-hidden="true"
          />
        </div>
      ) : null}

      {/* Cuerpo de la tarjeta */}
      <div className="card-body">
        {/* Título + visibilidad + autor */}
        <div className="d-flex align-items-start justify-content-between mb-1">
          <div className="me-2">
            <h2 className="card-title h5 mb-1">
              {item?.titulo || "Sin título"}
            </h2>

            {creadorNombre && (
              <p className="mb-0 small text-muted">
                por <span className="fw-semibold">{creadorNombre}</span>
              </p>
            )}
          </div>

          <span
            className={`badge align-self-start ${visClass}`}
            aria-label={`Visibilidad: ${visTexto}`}
          >
            {visTexto}
          </span>
        </div>

        {/* Descripción truncada para no recargar la tarjeta */}
        <p className="card-text small text-muted mt-2 descripcion-tarjeta">
          {descripcionCorta}
        </p>

        {/* Etiquetas principales */}
        {Array.isArray(item?.etiquetas) && item.etiquetas.length > 0 && (
          <div className="small mt-2" aria-label="Etiquetas de la tarjeta">
            {item.etiquetas.map((t, idx) => {
              const txt = String(t || "").trim();
              if (!txt) return null;
              return (
                <span
                  key={`${txt}-${idx}`}
                  className={`badge me-1 mb-1 ${etiquetaBadgeClass(txt)}`}
                >
                  {txt}
                </span>
              );
            })}
          </div>
        )}

        {/* Mini-galería con resto de imágenes */}
        {imagenes.length > 1 && (
          <div
            className="d-flex gap-2 mt-3 flex-wrap"
            aria-label="Imágenes adicionales"
          >
            {imagenes.slice(1, 5).map((src, i) => {
              if (!src) return null;
              return (
                <img
                  key={`${src}-${i}`}
                  src={src}
                  alt={`${item?.titulo || "Imagen"} ${i + 2}`}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              );
            })}
            {imagenes.length > 5 && (
              <span className="badge bg-light text-dark align-self-center">
                +{imagenes.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer con acciones (Mapa, detalle, editar, eliminar) */}
      {(mapsUrl || onEdit || onDelete || detalleHref) && (
        <div className="card-footer bg-white border-0 pt-0 pb-3 px-3">
          <div className="d-flex flex-wrap gap-2">
            {mapsUrl && (
              <a
                className="btn btn-sm btn-outline-success"
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir ruta en Google Maps"
                aria-label={`Cómo llegar a ${item?.titulo || "este lugar"}`}
              >
                <i className="bi bi-geo-alt me-1" /> Cómo llegar
              </a>
            )}

            {detalleHref &&
              (abrirEnNuevaPestana ? (
                <a
                  className="btn btn-sm btn-outline-secondary"
                  href={detalleHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver detalle de la tarjeta"
                  aria-label={`Ver detalle de ${
                    item?.titulo || "esta tarjeta"
                  } en una nueva pestaña`}
                >
                  <i className="bi bi-box-arrow-up-right me-1" /> Ver detalle
                </a>
              ) : (
                <Link
                  className="btn btn-sm btn-outline-secondary"
                  to={detalleHref}
                  title="Ver detalle de la tarjeta"
                  aria-label={`Ver detalle de ${item?.titulo || "esta tarjeta"}`}
                >
                  <i className="bi bi-box-arrow-up-right me-1" /> Ver detalle
                </Link>
              ))}

            {onEdit && (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={onEdit}
                type="button"
                title="Editar tarjeta"
                aria-label={`Editar tarjeta ${item?.titulo || ""}`}
              >
                <i className="bi bi-pencil me-1" /> Editar
              </button>
            )}

            {onDelete && (
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={onDelete}
                type="button"
                title="Eliminar tarjeta"
                aria-label={`Eliminar tarjeta ${item?.titulo || ""}`}
              >
                <i className="bi bi-trash me-1" /> Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

TarjetaCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    titulo: PropTypes.string,
    descripcion: PropTypes.string,
    visibilidad: PropTypes.string, // 'publico' | 'privado' | 'amigos'
    etiquetas: PropTypes.arrayOf(PropTypes.string),
    imagenes: PropTypes.arrayOf(PropTypes.string),
    imagenUrl: PropTypes.string, // compat
    videoUrl: PropTypes.string,
    lat: PropTypes.number,
    lng: PropTypes.number,
    eliminado: PropTypes.bool,
    usuario: PropTypes.shape({
      _id: PropTypes.string,
      nombre: PropTypes.string,
    }),
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  // Ruta al detalle público, por ejemplo `/tarjetas/${item._id}`
  detalleHref: PropTypes.string,
  // Si true, abre el detalle en una pestaña nueva
  abrirEnNuevaPestana: PropTypes.bool,
};

export default memo(TarjetaCard);
