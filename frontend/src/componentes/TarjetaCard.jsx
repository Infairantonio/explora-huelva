// src/componentes/TarjetaCard.jsx
import React from 'react';

/**
 * Convierte una URL de vídeo (YouTube / Vimeo) en su URL embebible (<iframe>).
 * - Acepta urls tipo:
 *   - https://www.youtube.com/watch?v=ID
 *   - https://youtu.be/ID
 *   - https://vimeo.com/ID
 * - Devuelve null si no reconoce el dominio o no puede extraer el ID.
 */
function toEmbedUrl(url = '') {
  if (!url) return null;
  try {
    const u = new URL(url);

    // YouTube (formato estándar con ?v=)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    // YouTube (short: youtu.be/ID)
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    // Vimeo (vimeo.com/ID)
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }

    // Otros dominios: no se embebe
    return null;
  } catch {
    // Si la URL no es válida, devolvemos null
    return null;
  }
}

/**
 * Devuelve clases de Bootstrap diferentes según la etiqueta.
 * (esto es puramente estético)
 */
const etiquetaBadgeClass = (tag) => {
  switch ((tag || '').toLowerCase()) {
    case 'lugares': return 'bg-primary';
    case 'experiencias': return 'bg-warning text-dark';
    case 'rutas': return 'bg-info text-dark';
    default: return 'bg-light text-dark';
  }
};

/**
 * TarjetaCard
 * Muestra una tarjeta con:
 *  - Media (prioridad): vídeo embebido > mp4 nativo > imagen de portada
 *  - Título + badge de visibilidad (público/privado)
 *  - Descripción
 *  - Etiquetas (badges de color)
 *  - Mini-galería (si hay más imágenes)
 *  - Botones Editar / Eliminar (si llegan callbacks)
 */
export default function TarjetaCard({ item, onEdit, onDelete }) {
  // Compatibilidad con el campo legado `imagenUrl`:
  // si no hay item.imagenes (array), usamos una lista con imagenUrl (si existe).
  const imagenes = Array.isArray(item.imagenes)
    ? item.imagenes
    : (item.imagenUrl ? [item.imagenUrl] : []);

  // Primera imagen como portada (si existe)
  const portada = imagenes[0] || null;

  // Intentamos embebido (YouTube/Vimeo)
  const embed = toEmbedUrl(item.videoUrl);

  // Si no es embebible, comprobamos si es un mp4 directo
  const esMp4 = typeof item.videoUrl === 'string' && item.videoUrl.toLowerCase().endsWith('.mp4');

  return (
    <div className="card h-100 shadow-sm">
      {/* === MEDIA ===
          Orden de prioridad:
          1) iframe (YouTube/Vimeo) con relación 16:9
          2) <video> nativo si es .mp4
          3) Imagen de portada si no hay vídeo
      */}
      {embed ? (
        <div className="ratio ratio-16x9">
          <iframe
            src={embed}
            title={item.titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 0 }}
          />
        </div>
      ) : esMp4 ? (
        <video
          className="w-100"
          style={{ maxHeight: 220, objectFit: 'cover' }}
          controls
          src={item.videoUrl}
        />
      ) : portada ? (
        <img
          src={portada}
          className="card-img-top"
          alt={item.titulo}
          style={{ objectFit: 'cover', height: 180 }}
        />
      ) : null}

      {/* === CUERPO DE TARJETA === */}
      <div className="card-body">
        {/* Título + badge de visibilidad */}
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-1">{item.titulo}</h5>
          <span className={`badge ${item.visibilidad === 'publico' ? 'bg-success' : 'bg-secondary'}`}>
            {item.visibilidad}
          </span>
        </div>

        {/* Descripción (texto corto; si no hay, mostramos un placeholder) */}
        <p className="card-text mt-2 small text-muted">
          {item.descripcion || 'Sin descripción.'}
        </p>

        {/* Etiquetas (si hay) */}
        {item.etiquetas?.length ? (
          <div className="small mt-2">
            {item.etiquetas.map((t) => (
              <span key={t} className={`badge me-1 ${etiquetaBadgeClass(t)}`}>{t}</span>
            ))}
          </div>
        ) : null}

        {/* Mini-galería: si hay más de una imagen, mostramos miniaturas.
           - Se enseñan como máximo 4 miniaturas extra.
           - Si hay > 5 en total, aparece un contador “+N”.
        */}
        {imagenes.length > 1 && (
          <div className="d-flex gap-2 mt-3 flex-wrap">
            {imagenes.slice(1, 5).map((src, i) => (
              <img
                key={src + i}
                src={src}
                alt={`${item.titulo} ${i + 2}`}
                style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }}
              />
            ))}
            {imagenes.length > 5 && (
              <span className="badge bg-light text-dark align-self-center">
                +{imagenes.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer con acciones (solo si pasas los handlers) */}
      {(onEdit || onDelete) && (
        <div className="card-footer bg-white border-0 d-flex gap-2">
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
