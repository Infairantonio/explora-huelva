// src/paginas/TarjetaPublica.jsx
// ————————————————————————————————————————————————
// Detalle PÚBLICO de una tarjeta + comentarios bonitos
// ————————————————————————————————————————————————

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { comentariosApi } from "../servicios/comentarios";
import { getPerfil } from "../servicios/api";
import { tarjetasApi } from "../servicios/tarjetas";

// Helpers
const sanitizeUrl = (url = "") => {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol) ? url : "";
  } catch { return ""; }
};
const toEmbedUrl = (url = "") => {
  const safe = sanitizeUrl(url);
  if (!safe) return null;
  try {
    const u = new URL(safe);
    const host = u.hostname.replace(/^www\./, "");
    if (host.includes("youtube.com")) {
      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host.includes("vimeo.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts.pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch { return null; }
};
const buildMapsUrl = (lat, lng) => {
  const la = Number(lat), ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${la},${ln}`)}`;
};
// Mapa estático sin claves (OpenStreetMap)
const buildStaticMap = (lat, lng, w = 640, h = 300, zoom = 13) => {
  const la = Number(lat), ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${la},${ln}&zoom=${zoom}&size=${w}x${h}&markers=${la},${ln},lightblue1`;
};
// Fallback: iframe embebido de OSM si falla la imagen estática
const buildOsmEmbed = (lat, lng, zoom = 13) => {
  const la = Number(lat), ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  const dLat = 0.006, dLng = 0.01;
  const bbox = `${(ln - dLng).toFixed(6)},${(la - dLat).toFixed(6)},${(ln + dLng).toFixed(6)},${(la + dLat).toFixed(6)}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${la}%2C${ln}&zoom=${zoom}`;
};
// Detectar errores de cancelación para ignorarlos en UI
const isAbortError = (e) =>
  e?.name === "AbortError" ||
  e?.code === "ERR_CANCELED" ||
  /abort(ed)?/i.test(e?.message || "");

// Lightbox simple
function Lightbox({ open, imagenes, index, onClose, onPrev, onNext }) {
  if (!open) return null;
  const src = imagenes[index];
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100"
      style={{ background: "rgba(0,0,0,.85)", zIndex: 1055 }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "ArrowLeft") onPrev();
        if (e.key === "ArrowRight") onNext();
      }}
      tabIndex={-1}
    >
      <button
        className="btn btn-light position-absolute top-0 end-0 m-3"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Cerrar"
      >
        ✕
      </button>

      <button
        className="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-3"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Anterior"
      >
        ‹
      </button>

      <img
        src={src}
        alt={`img-${index + 1}`}
        className="position-absolute top-50 start-50 translate-middle"
        style={{ maxWidth: "95%", maxHeight: "90%", objectFit: "contain", boxShadow: "0 0 30px rgba(0,0,0,.4)" }}
        onClick={(e) => e.stopPropagation()}
      />

      <button
        className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-3"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Siguiente"
      >
        ›
      </button>
    </div>
  );
}

export default function TarjetaPublica() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);

  const [tarjeta, setTarjeta] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [yo, setYo] = useState(null);

  const [cargandoTarjeta, setCargandoTarjeta] = useState(true);
  const [cargandoComentarios, setCargandoComentarios] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // mensajes separados
  const [msgTarjeta, setMsgTarjeta] = useState("");
  const [msgComentarios, setMsgComentarios] = useState("");

  const [texto, setTexto] = useState("");
  const abortRef = useRef(null);

  // Lightbox state
  const imagenes = useMemo(
    () => (Array.isArray(tarjeta?.imagenes) ? tarjeta.imagenes.filter(Boolean) : []),
    [tarjeta]
  );
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const openLightbox = (idx) => { setLbIndex(idx); setLbOpen(true); };
  const closeLightbox = () => setLbOpen(false);
  const prevLb = useCallback(() => setLbIndex((i) => (i - 1 + imagenes.length) % imagenes.length), [imagenes.length]);
  const nextLb = useCallback(() => setLbIndex((i) => (i + 1) % imagenes.length), [imagenes.length]);

  // Mapa fallback
  const [mapBroken, setMapBroken] = useState(false);

  // permisos de borrado
  const puedeBorrar = useMemo(() => {
    if (!yo || !tarjeta) return () => false;
    const ownerId = String(tarjeta.usuario || "");
    return (c) => {
      const autorId = String(c?.usuario?._id || c?.usuario || "");
      return yo?.usuario?.id === autorId || yo?.usuario?.id === ownerId;
    };
  }, [yo, tarjeta]);

  // cargar tarjeta pública
  useEffect(() => {
    let cancel = false;
    (async () => {
      setCargandoTarjeta(true);
      setMsgTarjeta("");
      try {
        const r = await tarjetasApi.publicaUna(id);
        if (!cancel) setTarjeta(r.tarjeta || null);
      } catch (e) {
        if (!cancel && !isAbortError(e)) setMsgTarjeta(e.message || "No se pudo cargar la tarjeta");
      } finally {
        if (!cancel) setCargandoTarjeta(false);
      }
    })();
    return () => { cancel = true; };
  }, [id]);

  // cargar comentarios
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setCargandoComentarios(true);
    setMsgComentarios("");

    (async () => {
      try {
        const r = await comentariosApi.listar(id, { page, limit: 20 }, { signal: controller.signal });
        setComentarios(r.items || []);
        setMeta(r.meta || { page, pages: 1, total: 0, limit: 20 });
      } catch (e) {
        if (!isAbortError(e)) setMsgComentarios(e.message || "Error cargando comentarios");
        return;
      } finally {
        if (!controller.signal.aborted) setCargandoComentarios(false);
      }
    })();

    return () => controller.abort();
  }, [id, page]);

  // perfil (si hay sesión)
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const me = await getPerfil();
        if (!cancel) setYo(me);
      } catch {
        if (!cancel) setYo(null);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const enviarComentario = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setMsgComentarios("");
    try {
      const r = await comentariosApi.crear(id, { texto: texto.trim() });
      setComentarios((prev) => [r.comentario, ...prev]);
      setTexto("");
      setMeta((m) => ({ ...m, total: (m.total || 0) + 1 }));
    } catch (e2) {
      if (!isAbortError(e2)) setMsgComentarios(e2.message || "No se pudo publicar el comentario");
    } finally {
      setEnviando(false);
    }
  };

  const borrarComentario = async (comentarioId) => {
    if (!window.confirm("¿Eliminar este comentario?")) return;
    try {
      await comentariosApi.eliminar(comentarioId);
      setComentarios((prev) => prev.filter((c) => c._id !== comentarioId));
      setMeta((m) => ({ ...m, total: Math.max((m.total || 1) - 1, 0) }));
    } catch (e) {
      if (!isAbortError(e)) alert(e.message || "No se pudo eliminar");
    }
  };

  const irPagina = (p) => {
    const n = Math.max(1, Math.min(p, meta.pages || 1));
    setParams((cur) => {
      const next = new URLSearchParams(cur);
      next.set("page", String(n));
      return next;
    });
  };

  // Derivados de UI
  const portada = imagenes[0] || "";
  const vis = (tarjeta?.visibilidad || "").toLowerCase();
  const visTexto = vis === "publico" ? "Público" : "Privado";
  const visClass = vis === "publico" ? "bg-success" : "bg-secondary";
  const mapsUrl = buildMapsUrl(tarjeta?.lat, tarjeta?.lng);
  const staticMap = buildStaticMap(tarjeta?.lat, tarjeta?.lng, 640, 300, 13);
  const osmEmbed = buildOsmEmbed(tarjeta?.lat, tarjeta?.lng, 13);
  const embed = toEmbedUrl(tarjeta?.videoUrl);

  return (
    <div className="container py-4">

      {/* HERO / Portada */}
      {cargandoTarjeta ? (
        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="spinner-border" role="status" /><span>Cargando tarjeta…</span>
        </div>
      ) : !tarjeta ? (
        <div className="alert alert-warning">{msgTarjeta || "No se encontró la tarjeta."}</div>
      ) : (
        <div className="mb-4 rounded-3 overflow-hidden shadow-sm">
          <div
            className="position-relative"
            style={{
              height: 240,
              backgroundImage: portada ? `url(${portada})` : undefined,
              backgroundPosition: "center",
              backgroundSize: "cover",
              backgroundColor: "#f5f5f5",
            }}
          >
            <div
              className="position-absolute top-0 start-0 w-100 h-100"
              style={{
                background: "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.5) 70%, rgba(0,0,0,.65) 100%)",
              }}
            />
            <div className="position-absolute bottom-0 start-0 w-100 text-white p-3">
              <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                <div>
                  <h1 className="h3 mb-1">{tarjeta.titulo}</h1>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className={`badge ${visClass}`}>{visTexto}</span>
                    {Array.isArray(tarjeta.etiquetas) && tarjeta.etiquetas.map((t, i) => (
                      <span key={t + i} className="badge bg-light text-dark">{t}</span>
                    ))}
                  </div>
                </div>
                {mapsUrl && (
                  <a
                    className="btn btn-light btn-sm"
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className="bi bi-geo-alt me-1" /> Cómo llegar
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {tarjeta && (
        <div className="row g-4">
          {/* Galería + vídeo */}
          <div className="col-12 col-lg-8">
            {/* Galería todas las fotos */}
            {imagenes.length > 0 ? (
              <div className="row g-2">
                {imagenes.map((src, i) => (
                  <div key={src + i} className="col-6 col-md-4">
                    <button
                      type="button"
                      className="p-0 border-0 bg-transparent w-100"
                      onClick={() => openLightbox(i)}
                      title="Ver"
                    >
                      <img
                        src={src}
                        alt={`img-${i + 1}`}
                        className="w-100 rounded"
                        style={{ aspectRatio: "4/3", objectFit: "cover" }}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-light">Sin imágenes.</div>
            )}

            {/* Vídeo si existe */}
            {embed && (
              <div className="mt-3 ratio ratio-16x9">
                <iframe
                  src={embed}
                  title="video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  style={{ border: 0 }}
                />
              </div>
            )}

            {/* Descripción en móvil */}
            <div className="d-lg-none mt-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h2 className="h5">Descripción</h2>
                  <p className="mb-0">{tarjeta.descripcion || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lateral info */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h3 className="h6 text-uppercase text-muted mb-2">Información</h3>
                <p className="mb-3">{tarjeta.descripcion || "—"}</p>

                {mapsUrl && (
                  <div>
                    {/* Intento imagen estática; si falla → fallback iframe con botón a Google Maps */}
                    {staticMap && !mapBroken ? (
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                        <img
                          src={staticMap}
                          alt="Mapa"
                          className="w-100 rounded"
                          style={{ objectFit: "cover", background: "#f1f3f5" }}
                          loading="lazy"
                          decoding="async"
                          onError={() => setMapBroken(true)}
                        />
                        <div className="text-center mt-2">
                          <i className="bi bi-geo-alt me-1" />
                          <span>Abrir en Google Maps</span>
                        </div>
                      </a>
                    ) : (
                      <>
                        {osmEmbed && (
                          <div className="ratio ratio-16x9 mb-2">
                            <iframe
                              src={osmEmbed}
                              title="Mapa"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              style={{ border: 0 }}
                            />
                          </div>
                        )}
                        <div className="text-center">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm"
                          >
                            <i className="bi bi-geo-alt me-1" />
                            Abrir en Google Maps
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lbOpen}
        imagenes={imagenes}
        index={lbIndex}
        onClose={closeLightbox}
        onPrev={prevLb}
        onNext={nextLb}
      />

      {/* Comentarios */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="h5 mb-0">Comentarios</h2>
            <span className="text-muted small">{meta.total || 0} en total</span>
          </div>

          {/* Formulario comentar */}
          {yo ? (
            <form onSubmit={enviarComentario} className="mb-4">
              {msgComentarios && <div className="alert alert-danger py-2">{msgComentarios}</div>}
              <div className="mb-2">
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Escribe tu comentario…"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  maxLength={800}
                  required
                />
              </div>
              <button className="btn btn-primary" disabled={enviando || !texto.trim()}>
                {enviando ? "Publicando…" : "Publicar"}
              </button>
            </form>
          ) : (
            <div className="alert alert-info">
              <i className="bi bi-chat-dots me-1" />
              <span>Para comentar necesitas iniciar sesión. </span>
              <Link to={`/login?next=/tarjetas/${id}`}>Entrar</Link>
            </div>
          )}

          {/* Lista */}
          {cargandoComentarios ? (
            <div className="d-flex align-items-center gap-2">
              <div className="spinner-border" role="status" />
              <span>Cargando comentarios…</span>
            </div>
          ) : (comentarios || []).length === 0 ? (
            <div className="text-muted">Sé el primero en comentar.</div>
          ) : (
            <ul className="list-group list-group-flush">
              {comentarios.map((c) => (
                <li key={c._id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="d-flex align-items-start gap-2">
                      <div className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                        {(c.usuario?.nombre || "A").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="small">
                          <strong>{c.usuario?.nombre || "Anónimo"}</strong>{" "}
                          <span className="text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="mt-1">{c.texto}</div>
                      </div>
                    </div>
                    {puedeBorrar(c) && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => borrarComentario(c._id)}
                        title="Eliminar comentario"
                      >
                        <i className="bi bi-trash" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Paginación */}
          {meta.pages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => irPagina(page - 1)}
                disabled={page <= 1}
              >
                ← Anterior
              </button>
              <span className="small text-muted">
                Página {page} de {meta.pages}
              </span>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => irPagina(page + 1)}
                disabled={page >= meta.pages}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
