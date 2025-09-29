// src/componentes/TarjetaCard.jsx
import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/** Solo permite http/https; evita esquemas raros (javascript:, data:, file:, etc.) */
function sanitizeUrl(url = '') {
  try {
    const u = new URL(url);
    if (['http:', 'https:'].includes(u.protocol)) return url;
  } catch { /* noop */ }
  return null;
}

/**
 * Convierte una URL de vídeo (YouTube / Vimeo) en su URL embebible (<iframe>).
 * Soporta:
 *  - https://www.youtube.com/watch?v=ID
 *  - https://youtu.be/ID (con o sin ?t=…)
 *  - https://www.youtube.com/shorts/ID
 *  - https://vimeo.com/ID o /channels/.../ID
 */
function toEmbedUrl(url = '') {
  const safe = sanitizeUrl(url);
  if (!safe) return null;
  try {
    const u = new URL(safe);
    const host = u.hostname.replace(/^www\./, '');

    // YouTube estándar
    if (host.includes('youtube.com')) {
      // shorts
      if (u.pathname.startsWith('/shorts/')) {
        const id = u.pathname.split('/').filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const v = u.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    // YouTube corto
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    // Vimeo
    if (host.includes('vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts.pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Badge de etiqueta estética */
const etiquetaBadgeClass = (tag) => {
  switch ((tag || '').toLowerCase()) {
    case 'lugares': return 'bg-primary';
    case 'experiencias': return 'bg-warning text-dark';
    case 'rutas': return 'bg-info text-dark';
    default: return 'bg-light text-dark';
  }
};

// Construye una URL segura de Google Maps "Cómo llegar"
function buildMapsUrl(lat, lng) {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  if (latNum < -90 || latNum > 90) return null;
  if (lngNum < -180 || lngNum > 180) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${latNum},${lngNum}`)}`;
}

function TarjetaCard({ item, onEdit, onDelete, detalleHref, abrirEnNuevaPestana = false }) {
  // No renderizar tarjetas marcadas como eliminadas (red de seguridad)
  if (item?.eliminado) return null;

  const imagenes = Array.isArray(item?.imagenes)
    ? item.imagenes
    : (item?.imagenUrl ? [item.imagenUrl] : []);

  const portada = sanitizeUrl(imagenes[0] || '');
  const embed = toEmbedUrl(item?.videoUrl);
  const videoUrl = sanitizeUrl(item?.videoUrl);
  const esMp4 = typeof videoUrl === 'string' && videoUrl.toLowerCase().endsWith('.mp4');

  const vis = (item?.visibilidad || '').toLowerCase();
  const esPublica = vis === 'publico';
  const visTexto = esPublica ? 'Público' : vis === 'privado' ? 'Privado' : '—';
  const visClass = esPublica ? 'bg-success' : vis === 'privado' ? 'bg-secondary' : 'bg-light text-dark';

  // URL de "Cómo llegar" si hay coordenadas válidas
  const mapsUrl = buildMapsUrl(item?.lat, item?.lng);

  return (
    <div className="card h-100 shadow-sm">
      {/* MEDIA: 1) iframe 2) video mp4 3) imagen */}
      {embed ? (
        <div className="ratio ratio-16x9">
          <iframe
            src={embed}
            title={item?.titulo || 'video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ border: 0 }}
          />
        </div>
      ) : esMp4 ? (
        <video
          className="w-100"
          style={{ maxHeight: 220, objectFit: 'cover' }}
          controls
          preload="metadata"
          src={videoUrl || undefined}
        />
      ) : portada ? (
        <img
          src={portada}
          className="card-img-top"
          alt={item?.titulo || 'portada'}
          style={{ objectFit: 'cover', height: 180 }}
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : null}

      {/* CUERPO */}
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-1">{item?.titulo || 'Sin título'}</h5>
          <span className={`badge ${visClass}`}>{visTexto}</span>
        </div>

        <p className="card-text mt-2 small text-muted">
          {item?.descripcion || 'Sin descripción.'}
        </p>

        {/* Etiquetas */}
        {Array.isArray(item?.etiquetas) && item.etiquetas.length > 0 && (
          <div className="small mt-2">
            {item.etiquetas.map((t, idx) => {
              const txt = String(t || '').trim();
              if (!txt) return null;
              return (
                <span key={`${txt}-${idx}`} className={`badge me-1 ${etiquetaBadgeClass(txt)}`}>
                  {txt}
                </span>
              );
            })}
          </div>
        )}

        {/* Mini-galería */}
        {imagenes.length > 1 && (
          <div className="d-flex gap-2 mt-3 flex-wrap">
            {imagenes.slice(1, 5).map((src, i) => {
              const safe = sanitizeUrl(src);
              if (!safe) return null;
              return (
                <img
                  key={`${safe}-${i}`}
                  src={safe}
                  alt={`${item?.titulo || 'imagen'} ${i + 2}`}
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
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

      {/* FOOTER acciones */}
      {(mapsUrl || onEdit || onDelete || (esPublica && detalleHref)) && (
        <div className="card-footer bg-white border-0 d-flex gap-2 flex-wrap">
          {mapsUrl && (
            <a
              className="btn btn-sm btn-outline-success"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Cómo llegar"
            >
              <i className="bi bi-geo-alt me-1" /> Cómo llegar
            </a>
          )}

          {/* Ver detalle (solo si pública y tenemos ruta) */}
          {esPublica && detalleHref && (
            abrirEnNuevaPestana ? (
              <a
                className="btn btn-sm btn-outline-secondary"
                href={detalleHref}
                target="_blank"
                rel="noopener noreferrer"
                title="Ver detalle"
              >
                <i className="bi bi-box-arrow-up-right me-1" /> Ver detalle
              </a>
            ) : (
              <Link className="btn btn-sm btn-outline-secondary" to={detalleHref}>
                <i className="bi bi-box-arrow-up-right me-1" /> Ver detalle
              </Link>
            )
          )}

          {onEdit && (
            <button className="btn btn-sm btn-outline-primary" onClick={onEdit}>
              <i className="bi bi-pencil me-1" /> Editar
            </button>
          )}
          {onDelete && (
            <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
              <i className="bi bi-trash me-1" /> Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

TarjetaCard.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    titulo: PropTypes.string,
    descripcion: PropTypes.string,
    visibilidad: PropTypes.string, // 'publico' | 'privado'
    etiquetas: PropTypes.arrayOf(PropTypes.string),
    imagenes: PropTypes.arrayOf(PropTypes.string),
    imagenUrl: PropTypes.string,     // compat
    videoUrl: PropTypes.string,
    lat: PropTypes.number,           // opcional
    lng: PropTypes.number,           // opcional
    eliminado: PropTypes.bool,       // ⬅️ nuevo (soft delete)
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  /** Ruta al detalle público, p.ej. `/tarjetas/${item._id}` */
  detalleHref: PropTypes.string,
  /** Si true, abre el detalle en nueva pestaña */
  abrirEnNuevaPestana: PropTypes.bool,
};

export default memo(TarjetaCard);
