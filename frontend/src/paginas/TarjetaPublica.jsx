// src/paginas/TarjetaPublica.jsx
// ---------------------------------------------------------------------------
// DETALLE DE TARJETA + COMENTARIOS
// Nueva regla: si el usuario está logueado, puede comentar SIEMPRE,
// ya que si ve la tarjeta es porque el backend le dio permiso.
// Visitantes solo comentan públicas.
// ---------------------------------------------------------------------------

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { comentariosApi } from "../servicios/comentarios";
import { getPerfil } from "../servicios/api";
import { tarjetasApi } from "../servicios/tarjetas";

// ------------------------- Helpers ---------------------------- //

const sanitizeUrl = (url = "") => {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol) ? url : "";
  } catch {
    return "";
  }
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
  } catch {
    return null;
  }
};

const buildMapsUrl = (lat, lng) => {
  const la = Number(lat),
    ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${la},${ln}`
  )}`;
};

const isAbortError = (e) =>
  e?.name === "AbortError" ||
  e?.code === "ERR_CANCELED" ||
  /abort(ed)?/i.test(e?.message || "");

// ----------------------------- Lightbox ----------------------------- //

function Lightbox({ open, imagenes, index, onClose, onPrev, onNext }) {
  if (!open || !imagenes?.length) return null;
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
      aria-modal="true"
      role="dialog"
    >
      <button
        className="btn btn-light position-absolute top-0 end-0 m-3"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ✕
      </button>

      <button
        className="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-3"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
      >
        ‹
      </button>

      <img
        src={src}
        alt=""
        className="position-absolute top-50 start-50 translate-middle"
        style={{
          maxWidth: "95%",
          maxHeight: "90%",
          objectFit: "contain",
        }}
        onClick={(e) => e.stopPropagation()}
      />

      <button
        className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-3"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
      >
        ›
      </button>
    </div>
  );
}

// ====================================================================
//                    COMPONENTE PRINCIPAL
// ====================================================================

export default function TarjetaPublica() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Math.max(parseInt(params.get("page") || "1", 10), 1);

  const [tarjeta, setTarjeta] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [yo, setYo] = useState(null);

  const [cargandoTarjeta, setCargandoTarjeta] = useState(true);
  const [cargandoComentarios, setCargandoComentarios] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [msgTarjeta, setMsgTarjeta] = useState("");
  const [msgComentarios, setMsgComentarios] = useState("");

  const [texto, setTexto] = useState("");
  const abortRef = useRef(null);

  const [showBackFab, setShowBackFab] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowBackFab(window.scrollY > 220);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ------------------------------ Lightbox ------------------------------ //

  const imagenes = useMemo(
    () =>
      Array.isArray(tarjeta?.imagenes)
        ? tarjeta.imagenes.filter(Boolean)
        : [],
    [tarjeta]
  );

  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  const openLightbox = (idx) => {
    setLbIndex(idx);
    setLbOpen(true);
  };
  const closeLightbox = () => setLbOpen(false);

  const prevLb = useCallback(
    () => setLbIndex((i) => (i - 1 + imagenes.length) % imagenes.length),
    [imagenes.length]
  );

  const nextLb = useCallback(
    () => setLbIndex((i) => (i + 1) % imagenes.length),
    [imagenes.length]
  );

  // ====================================================================
  //                      CARGAR TARJETA
  // ====================================================================

  useEffect(() => {
    let cancel = false;

    (async () => {
      setCargandoTarjeta(true);
      setMsgTarjeta("");

      try {
        const rPriv = await tarjetasApi.una(id);
        if (!cancel) {
          setTarjeta(rPriv.tarjeta || rPriv.item || rPriv);
          setCargandoTarjeta(false);
          return;
        }
      } catch (e) {
        if (isAbortError(e) || cancel) return;
        if (![401, 403, 404].includes(e?.status)) {
          setMsgTarjeta(e.message || "No se pudo cargar la tarjeta");
          setCargandoTarjeta(false);
          return;
        }
      }

      try {
        const rPub = await tarjetasApi.publicaUna(id);
        if (!cancel) setTarjeta(rPub.tarjeta || rPub.item || rPub);
      } catch (e2) {
        if (!cancel && !isAbortError(e2)) {
          setMsgTarjeta(e2.message || "No se pudo cargar la tarjeta");
        }
      } finally {
        if (!cancel) setCargandoTarjeta(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [id]);

  // ====================================================================
  //                 CARGAR PERFIL DEL USUARIO
  // ====================================================================

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

    return () => {
      cancel = true;
    };
  }, []);

  // ====================================================================
  //                 CARGAR COMENTARIOS (REGLA NUEVA)
  // ====================================================================

  useEffect(() => {
    if (!tarjeta) return;

    const vis = (tarjeta.visibilidad || "").toLowerCase();
    const usuarioLogueado = Boolean(yo);

    // 🔥 REGLA NUEVA:
    // - Si estás logueado → puedes comentar SIEMPRE.
    // - Si no estás logueado → solo públicas.
    const usuarioPuedeComentar = usuarioLogueado || vis === "publico";

    if (!usuarioPuedeComentar) {
      abortRef.current?.abort?.();
      setComentarios([]);
      setMeta({ page: 1, pages: 1, total: 0, limit: 20 });
      setCargandoComentarios(false);
      return;
    }

    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    setCargandoComentarios(true);
    setMsgComentarios("");

    (async () => {
      try {
        const r = await comentariosApi.listar(
          id,
          { page, limit: 20 },
          { signal: controller.signal }
        );
        setComentarios(r.items || []);
        setMeta(r.meta || { page, pages: 1, total: 0, limit: 20 });
      } catch (e) {
        if (!isAbortError(e)) {
          setMsgComentarios(e.message || "Error cargando comentarios");
        }
      } finally {
        if (!controller.signal.aborted) setCargandoComentarios(false);
      }
    })();

    return () => controller.abort();
  }, [id, page, tarjeta, yo]);

  // ====================================================================
  //                    ENVIAR COMENTARIO
  // ====================================================================

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
      if (!isAbortError(e2)) {
        setMsgComentarios(e2.message || "No se pudo publicar");
      }
    } finally {
      setEnviando(false);
    }
  };

  // ====================================================================
  //                             BORRAR
  // ====================================================================

  const puedeBorrar = useMemo(() => {
    if (!yo || !tarjeta) return () => false;

    const ownerId = String(tarjeta.usuario?._id || tarjeta.usuario || "");

    return (c) => {
      const autorId = String(c?.usuario?._id || c?.usuario || "");
      return yo?.usuario?.id === autorId || yo?.usuario?.id === ownerId;
    };
  }, [yo, tarjeta]);

  const borrarComentario = async (comentarioId) => {
    if (!window.confirm("¿Eliminar este comentario?")) return;

    try {
      await comentariosApi.eliminar(comentarioId);
      setComentarios((prev) =>
        prev.filter((c) => c._id !== comentarioId)
      );
      setMeta((m) => ({
        ...m,
        total: Math.max((m.total || 1) - 1, 0),
      }));
    } catch (e) {
      if (!isAbortError(e)) alert(e.message || "No se pudo eliminar");
    }
  };

  // ====================================================================
  //                           PAGINACIÓN
  // ====================================================================

  const irPagina = (p) => {
    const n = Math.max(1, Math.min(p, meta.pages || 1));
    setParams((cur) => {
      const next = new URLSearchParams(cur);
      next.set("page", String(n));
      return next;
    });
  };

  // ----------------------------------------------------------------------

  const portada = imagenes[0] || "";
  const vis = (tarjeta?.visibilidad || "").toLowerCase();
  const visTexto =
    vis === "publico"
      ? "Público"
      : vis === "amigos"
      ? "Solo amigos"
      : "Privado";
  const visClass =
    vis === "publico"
      ? "bg-success"
      : vis === "amigos"
      ? "bg-primary"
      : "bg-secondary";

  const usuarioLogueado = Boolean(yo);

  const usuarioPuedeComentar = usuarioLogueado || vis === "publico";

  const mapsUrl = buildMapsUrl(tarjeta?.lat, tarjeta?.lng);
  const embed = toEmbedUrl(tarjeta?.videoUrl);
  const autorNombre = tarjeta?.usuario?.nombre || null;
  const createdDate = tarjeta?.createdAt
    ? new Date(tarjeta.createdAt)
    : null;

  // ====================================================================
  //                             RENDER
  // ====================================================================

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left" />
          <span>Volver</span>
        </button>
      </div>

      {/* ---------------- TARJETA ---------------- */}
      {cargandoTarjeta ? (
        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="spinner-border" />
          <span>Cargando tarjeta…</span>
        </div>
      ) : !tarjeta ? (
        <div className="alert alert-warning">
          {msgTarjeta || "No encontrada"}
        </div>
      ) : (
        <section className="row justify-content-center mb-4">
          <article className="col-12 col-lg-9 col-xl-8">
            <div className="card border-0 shadow-sm">
              {/* ---- Cabecera ---- */}
              <header className="card-body border-bottom d-flex align-items-start justify-content-between gap-3">
                <div className="d-flex align-items-start gap-2">
                  <div
                    className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: 40, height: 40 }}
                  >
                    {(autorNombre || "E").charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h1 className="h5 mb-1">{tarjeta.titulo}</h1>

                    <p className="mb-1 small text-muted">
                      {autorNombre && <strong>{autorNombre}</strong>}
                      {createdDate && (
                        <>
                          {" · "}
                          <time dateTime={createdDate.toISOString()}>
                            {createdDate.toLocaleDateString()}
                          </time>
                        </>
                      )}
                    </p>

                    <div className="d-flex flex-wrap gap-2">
                      <span className={`badge ${visClass}`}>
                        {visTexto}
                      </span>

                      {Array.isArray(tarjeta.etiquetas) &&
                        tarjeta.etiquetas.map((t, i) => (
                          <span
                            key={t + i}
                            className="badge bg-light text-dark"
                          >
                            {t}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary rounded-pill d-inline-flex align-items-center gap-1"
                  >
                    <i className="bi bi-geo-alt-fill" />
                    <span>Ver en mapa</span>
                  </a>
                )}
              </header>

              {/* ---- Imagen ---- */}
              {portada && (
                <div className="bg-dark">
                  <img
                    src={portada}
                    className="w-100"
                    style={{ maxHeight: 420, objectFit: "cover" }}
                    alt=""
                  />
                </div>
              )}

              {/* ---- Cuerpo ---- */}
              <div className="card-body">
                {/* ⬇️ Aquí respetamos los saltos de línea */}
                <p className="mb-3 descripcion-tarjeta">
                  {tarjeta.descripcion || "—"}
                </p>

                {imagenes.length > 1 && (
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-2">
                      {imagenes.slice(1).map((src, i) => (
                        <button
                          key={src + i}
                          className="p-0 border-0 bg-transparent"
                          style={{ width: 110, height: 110 }}
                          onClick={() => openLightbox(i + 1)}
                        >
                          <img
                            src={src}
                            className="rounded"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            alt=""
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {embed && (
                  <div className="mt-3">
                    <div className="ratio ratio-16x9">
                      <iframe
                        src={embed}
                        title="video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        </section>
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

      {/* ------------------ COMENTARIOS ------------------ */}
      <section className="row justify-content-center mt-4">
        <div className="col-12 col-lg-9 col-xl-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h2 className="h5 mb-0">Comentarios</h2>
                <span className="text-muted small">
                  {meta.total} en total
                </span>
              </div>

              {/* Si NO puede comentar */}
              {!usuarioPuedeComentar ? (
                <div className="alert alert-info">
                  Comentarios no disponibles para esta tarjeta.
                  <br />
                  <Link to={`/login?next=/tarjetas/${id}`}>
                    Inicia sesión
                  </Link>{" "}
                  para comentar si tienes permiso.
                </div>
              ) : (
                <>
                  {/* Formulario */}
                  {yo && (
                    <form onSubmit={enviarComentario} className="mb-4">
                      {msgComentarios && (
                        <div className="alert alert-danger py-2">
                          {msgComentarios}
                        </div>
                      )}

                      <textarea
                        className="form-control mb-2"
                        rows={3}
                        placeholder="Escribe tu comentario…"
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        maxLength={800}
                        required
                      />

                      <button
                        className="btn btn-primary"
                        disabled={enviando || !texto.trim()}
                      >
                        {enviando ? "Publicando…" : "Publicar"}
                      </button>
                    </form>
                  )}

                  {/* Si es público y no logueado */}
                  {!yo && vis === "publico" && (
                    <div className="alert alert-info">
                      Para comentar necesitas iniciar sesión.{" "}
                      <Link to={`/login?next=/tarjetas/${id}`}>
                        Entrar
                      </Link>
                    </div>
                  )}

                  {/* Lista */}
                  {cargandoComentarios ? (
                    <div className="d-flex align-items-center gap-2">
                      <div className="spinner-border" />
                      <span>Cargando comentarios…</span>
                    </div>
                  ) : comentarios.length === 0 ? (
                    <div className="text-muted">
                      Sé el primero en comentar.
                    </div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {comentarios.map((c) => (
                        <li key={c._id} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="d-flex align-items-start gap-2">
                              <div
                                className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center"
                                style={{ width: 32, height: 32 }}
                              >
                                {(c.usuario?.nombre || "A")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <div className="small">
                                  <strong>{c.usuario?.nombre}</strong>{" "}
                                  <span className="text-muted">
                                    {new Date(
                                      c.createdAt
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                {/* ⬇️ Comentario con saltos de línea */}
                                <div className="mt-1 descripcion-tarjeta">
                                  {c.texto}
                                </div>
                              </div>
                            </div>

                            {puedeBorrar(c) && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => borrarComentario(c._id)}
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
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAB volver */}
      {showBackFab && (
        <button
          className="btn btn-primary rounded-pill position-fixed d-flex align-items-center justify-content-center"
          style={{
            bottom: "1.5rem",
            right: "1.5rem",
            boxShadow: "0 8px 20px rgba(0,0,0,.3)",
            paddingInline: "0.9rem",
            height: "2.75rem",
            zIndex: 1060,
          }}
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left" />
          <span className="d-none d-sm-inline">Volver</span>
        </button>
      )}
    </main>
  );
}
