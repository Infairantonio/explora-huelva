// src/paginas/EditorTarjeta.jsx
// Pantalla para crear o editar una tarjeta.
// Nota importante: las imágenes se aceptan tal cual las sube el usuario,
// pero la optimización "de verdad" (tamaño y peso) se hace en el backend
// usando sharp. Aquí solo avisamos si el fichero es muy grande.

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { tarjetasApi } from '../servicios/tarjetas';
// ❌ ya no necesitamos transformar URLs aquí: la API devuelve /api/uploads/...
// import { urlImagen } from '../servicios/api';
import { logout } from '../utils/auth';

const OPCIONES_ETIQUETAS = ['lugares', 'experiencias', 'rutas'];
const OPCIONES_VISIBILIDAD = ['privado', 'publico', 'amigos'];

// Acepta solo http/https (por si en el futuro se vuelve a usar para vídeo, etc.)
const sanitizeUrl = (url = '') => {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol) ? url : '';
  } catch {
    return '';
  }
};

// Límite "blando" solo para avisar al usuario en el frontend.
// No bloquea la subida: el backend es quien optimiza/limita realmente.
const MAX_IMG_MB = 8;

// Normaliza números desde input (admite coma decimal). '' -> null
const toNum = (s) => {
  const str = String(s ?? '').replace(',', '.').trim();
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : NaN;
};

// Detecta cancelación para no ensuciar la UI
const isAbortError = (e) =>
  e?.name === 'AbortError' ||
  e?.code === 'ERR_CANCELED' ||
  /abort(ed)?/i.test(e?.message || '');

export default function EditorTarjeta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    imagenes: [],
    videoUrl: '',
    visibilidad: 'privado',
    etiquetas: [],
    lat: '',
    lng: '',
  });

  const [mensaje, setMensaje] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [locating, setLocating] = useState(false);
  const [accuracy, setAccuracy] = useState(null); // precisión en metros

  const fileRef = useRef(null);
  const loadAbortRef = useRef(null);
  const uploadAbortRef = useRef(null);

  // Cargar tarjeta en modo edición
  const cargar = useCallback(async () => {
    if (!id) return;
    setMensaje('');

    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    try {
      const r = await tarjetasApi.una(id, { signal: controller.signal });
      const t = r.tarjeta || {};
      setForm({
        titulo: t.titulo || '',
        descripcion: t.descripcion || '',
        // La API ya normaliza a "/api/uploads/...", úsalo tal cual
        imagenes: Array.isArray(t.imagenes)
          ? t.imagenes
          : t.imagenUrl
          ? [t.imagenUrl]
          : [],
        videoUrl: t.videoUrl || '',
        visibilidad: t.visibilidad || 'privado',
        etiquetas: Array.isArray(t.etiquetas) ? t.etiquetas : [],
        lat:
          (t.lat ?? '') === '' || t.lat == null ? '' : String(t.lat),
        lng:
          (t.lng ?? '') === '' || t.lng == null ? '' : String(t.lng),
      });
      setAccuracy(null);
    } catch (e) {
      if (isAbortError(e)) return;
      if (e?.status === 401) {
        logout();
        navigate('/login', {
          replace: true,
          state: { from: location },
        });
        return;
      }
      setMensaje(e?.message || 'No se pudo cargar');
    }
  }, [id, navigate, location]);

  useEffect(() => {
    cargar();
    return () => loadAbortRef.current?.abort();
  }, [cargar]);

  // Handlers básicos
  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const seleccionarArchivo = () => fileRef.current?.click();

  // Subir una imagen (deja subir cualquier tamaño razonable,
  // solo avisa si es muy grande; el backend la optimiza con sharp).
  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // resetea siempre el input para permitir re-seleccionar
    if (!f) return;

    setMensaje('');

    // 1) Validamos que realmente sea una imagen
    if (!f.type.startsWith('image/')) {
      setMensaje('El archivo debe ser una imagen.');
      return;
    }

    // 2) Si supera el tamaño "blando", solo mostramos un aviso,
    //    pero NO bloqueamos la subida. El trabajo serio lo hace el backend.
    if (f.size > MAX_IMG_MB * 1024 * 1024) {
      setMensaje(
        `Ojo: la imagen es muy pesada (más de ${MAX_IMG_MB}MB), ` +
          'la optimizaremos en el servidor para que la web siga yendo fluida.'
      );
      // No hay return aquí: dejamos pasar el fichero.
    }

    // Cancelamos subida anterior si la hubiera
    uploadAbortRef.current?.abort();
    const controller = new AbortController();
    uploadAbortRef.current = controller;

    try {
      setSubiendo(true);

      // Enviamos el fichero original: el backend (sharp) lo redimensiona y lo comprime.
      const r = await tarjetasApi.subirImagen(f, {
        signal: controller.signal,
      });

      // ⬇️ La API devuelve { publicUrl, filename, url }. Para el front usamos publicUrl.
      const nueva = r.publicUrl || r.url; // fallback por si el backend no está actualizado
      if (!nueva)
        throw new Error('Respuesta inesperada al subir imagen');

      // Añadir URL evitando duplicados (por si el usuario sube la misma varias veces)
      setForm((prev) => {
        const set = new Set([
          ...(prev.imagenes || []),
          nueva,
        ].filter(Boolean));
        return { ...prev, imagenes: Array.from(set) };
      });
    } catch (e2) {
      if (isAbortError(e2)) return;
      if (e2?.status === 401) {
        logout();
        navigate('/login', {
          replace: true,
          state: { from: location },
        });
        return;
      }
      setMensaje(e2?.message || 'Error subiendo la imagen');
    } finally {
      setSubiendo(false);
    }
  };

  const quitarImagen = (idx) =>
    setForm((prev) => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== idx),
    }));

  const toggleEtiqueta = (tag) => {
    setForm((f) => {
      const sel = new Set(f.etiquetas || []);
      sel.has(tag) ? sel.delete(tag) : sel.add(tag);
      return { ...f, etiquetas: Array.from(sel) };
    });
  };

  // Reglas de obligatoriedad (vídeo es opcional pero lo ocultamos)
  const faltan = {
    titulo: !form.titulo.trim(),
    descripcion: !form.descripcion.trim(),
    visibilidad: !OPCIONES_VISIBILIDAD.includes(form.visibilidad),
    etiquetas: (form.etiquetas || []).length === 0,
    imagenes: (form.imagenes || []).length === 0,
  };
  const obligatorioOk =
    !faltan.titulo &&
    !faltan.descripcion &&
    !faltan.visibilidad &&
    !faltan.etiquetas &&
    !faltan.imagenes;

  // Validación de ubicación (oculta lat/lng pero mantenemos la lógica para no romper)
  const latProvided = String(form.lat ?? '').trim() !== '';
  const lngProvided = String(form.lng ?? '').trim() !== '';
  const latNum = toNum(form.lat);
  const lngNum = toNum(form.lng);
  const latInRange =
    latNum === null ||
    (latNum !== null &&
      !Number.isNaN(latNum) &&
      latNum >= -90 &&
      latNum <= 90);
  const lngInRange =
    lngNum === null ||
    (lngNum !== null &&
      !Number.isNaN(lngNum) &&
      lngNum >= -180 &&
      lngNum <= 180);
  const ubicacionOk =
    (!latProvided && !lngProvided) ||
    (latProvided &&
      lngProvided &&
      !Number.isNaN(latNum) &&
      !Number.isNaN(lngNum) &&
      latInRange &&
      lngInRange);

  // Botón: Usar mi ubicación (Geolocation API) — mantenemos el botón, ocultamos inputs
  const usarMiUbicacion = () => {
    setMensaje('');
    setAccuracy(null);

    if (!('geolocation' in navigator)) {
      setMensaje('Tu navegador no soporta geolocalización.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setForm((f) => ({
          ...f,
          lat: String(latitude.toFixed(6)),
          lng: String(longitude.toFixed(6)),
        }));
        setAccuracy(Math.round(acc || 0));
        setLocating(false);
      },
      (err) => {
        let msg = 'No se pudo obtener tu ubicación.';
        if (err?.code === err.PERMISSION_DENIED)
          msg = 'Permiso de ubicación denegado.';
        else if (err?.code === err.POSITION_UNAVAILABLE)
          msg = 'Ubicación no disponible.';
        else if (err?.code === err.TIMEOUT)
          msg =
            'Tiempo de espera agotado al obtener ubicación.';
        setMensaje(msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Guardar (crear/actualizar)
  const enviar = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (!obligatorioOk) {
      setMensaje(
        'Completa los campos obligatorios: título, descripción, visibilidad, al menos 1 etiqueta y 1 imagen.'
      );
      return;
    }
    if (!ubicacionOk) {
      setMensaje(
        'Si indicas ubicación, debes rellenar lat y lng con valores válidos (lat -90..90, lng -180..180).'
      );
      return;
    }
    if (subiendo) {
      setMensaje('Espera a que termine la subida de la imagen.');
      return;
    }

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      visibilidad: form.visibilidad,
      // La API ya acepta arrays de strings; pueden ser /api/uploads/... y los normaliza.
      imagenes: (form.imagenes || [])
        .map((s) => s.trim())
        .filter(Boolean),
      etiquetas: (form.etiquetas || []).filter((t) =>
        OPCIONES_ETIQUETAS.includes((t || '').toLowerCase())
      ),
      ...(latProvided &&
      lngProvided &&
      ubicacionOk
        ? { lat: Number(latNum), lng: Number(lngNum) }
        : {}),
    };

    try {
      setGuardando(true);
      if (id) await tarjetasApi.actualizar(id, payload);
      else await tarjetasApi.crear(payload);
      navigate('/panel', { replace: true });
    } catch (e2) {
      if (e2?.status === 401) {
        logout();
        navigate('/login', {
          replace: true,
          state: { from: location },
        });
        return;
      }
      setMensaje(e2?.message || 'Error guardando');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h1 className="h4 mb-3">
                {id ? 'Editar' : 'Nueva'} tarjeta
              </h1>

              {mensaje && (
                <div
                  className="alert alert-danger"
                  role="alert"
                  aria-live="assertive"
                >
                  {mensaje}
                </div>
              )}

              <form onSubmit={enviar} className="row g-3" noValidate>
                {/* Título */}
                <div className="col-12">
                  <label
                    className="form-label"
                    htmlFor="campo-titulo"
                  >
                    Título{' '}
                    <span className="text-danger">*</span>
                  </label>
                  <input
                    id="campo-titulo"
                    className={`form-control ${
                      !form.titulo.trim()
                        ? 'is-invalid'
                        : ''
                    }`}
                    name="titulo"
                    value={form.titulo}
                    onChange={cambiar}
                    maxLength={120}
                    required
                    aria-invalid={!form.titulo.trim()}
                    aria-describedby="ayuda-titulo"
                  />
                  <div id="ayuda-titulo" className="form-text">
                    Sé claro y descriptivo. Máx. 120 caracteres.
                  </div>
                  {!form.titulo.trim() && (
                    <div className="invalid-feedback">
                      El título es obligatorio.
                    </div>
                  )}
                </div>

                {/* Descripción */}
                <div className="col-12">
                  <label
                    className="form-label"
                    htmlFor="campo-descripcion"
                  >
                    Descripción{' '}
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="campo-descripcion"
                    className={`form-control ${
                      !form.descripcion.trim()
                        ? 'is-invalid'
                        : ''
                    }`}
                    rows={4}
                    name="descripcion"
                    value={form.descripcion}
                    onChange={cambiar}
                    maxLength={1000}
                    required
                    aria-invalid={!form.descripcion.trim()}
                    aria-describedby="ayuda-descripcion"
                  />
                  <div
                    id="ayuda-descripcion"
                    className="form-text"
                  >
                    Cuenta qué hace especial este lugar o
                    experiencia. Máx. 1000 caracteres.
                  </div>
                  {!form.descripcion.trim() && (
                    <div className="invalid-feedback">
                      La descripción es obligatoria.
                    </div>
                  )}
                </div>

                {/* Imágenes */}
                <div className="col-12">
                  <div className="d-flex align-items-center justify-content-between">
                    <label className="form-label mb-0">
                      Imágenes{' '}
                      <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={seleccionarArchivo}
                        disabled={subiendo}
                        title="Subir imagen"
                      >
                        {subiendo
                          ? 'Subiendo…'
                          : 'Añadir imagen'}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={onFileChange}
                        aria-label="Seleccionar una imagen para subir"
                      />
                    </div>
                  </div>

                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {(form.imagenes || []).map((url, i) => (
                      <div
                        key={url + i}
                        className="position-relative"
                        aria-label={`Imagen ${i + 1}`}
                      >
                        <img
                          // La API ya devuelve una URL lista para <img src>, úsala sin transformaciones
                          src={url}
                          alt=""
                          style={{
                            width: 120,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 6,
                          }}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.style.display =
                              'none';
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 translate-middle"
                          onClick={() => quitarImagen(i)}
                          title="Quitar imagen"
                          aria-label={`Quitar imagen ${i + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {(form.imagenes || []).length === 0 && (
                    <div className="text-danger small mt-2">
                      Añade al menos una imagen.
                    </div>
                  )}
                </div>

                {/* ⛔ VÍDEO OCULTO (conservado para el futuro) */}
                {/*
                <div className="col-12">
                  <label className="form-label">
                    Vídeo (YouTube/Vimeo/MP4) <small className="text-muted">(opcional)</small>
                  </label>
                  <input
                    className="form-control"
                    name="videoUrl"
                    value={form.videoUrl}
                    onChange={cambiar}
                    placeholder="https://youtu.be/... o https://.../video.mp4"
                  />
                </div>
                */}

                {/* Visibilidad */}
                <div className="col-12 col-md-4">
                  <label
                    className="form-label"
                    htmlFor="sel-visibilidad"
                  >
                    Visibilidad{' '}
                    <span className="text-danger">*</span>
                  </label>
                  <select
                    id="sel-visibilidad"
                    className={`form-select ${
                      !OPCIONES_VISIBILIDAD.includes(
                        form.visibilidad
                      )
                        ? 'is-invalid'
                        : ''
                    }`}
                    name="visibilidad"
                    value={form.visibilidad}
                    onChange={cambiar}
                    required
                    aria-invalid={
                      !OPCIONES_VISIBILIDAD.includes(
                        form.visibilidad
                      )
                    }
                  >
                    <option value="privado">
                      Privado
                    </option>
                    <option value="publico">
                      Público
                    </option>
                    <option value="amigos">
                      Amigos
                    </option>
                  </select>
                  {!OPCIONES_VISIBILIDAD.includes(
                    form.visibilidad
                  ) && (
                    <div className="invalid-feedback">
                      Selecciona una visibilidad.
                    </div>
                  )}
                </div>

                {/* Etiquetas */}
                <div className="col-12 col-md-8">
                  <fieldset>
                    <legend className="form-label mb-2">
                      Etiquetas{' '}
                      <span className="text-danger">*</span>
                    </legend>
                    <div className="d-flex gap-3 flex-wrap">
                      {OPCIONES_ETIQUETAS.map((tag) => (
                        <div
                          className="form-check"
                          key={tag}
                        >
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`chk-${tag}`}
                            checked={form.etiquetas.includes(
                              tag
                            )}
                            onChange={() =>
                              toggleEtiqueta(tag)
                            }
                            aria-describedby="ayuda-etiquetas"
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`chk-${tag}`}
                          >
                            {tag}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div
                      id="ayuda-etiquetas"
                      className="form-text"
                    >
                      Elige al menos una categoría.
                    </div>
                    {(form.etiquetas || []).length === 0 && (
                      <div className="text-danger small mt-1">
                        Selecciona al menos una etiqueta.
                      </div>
                    )}
                  </fieldset>
                </div>

                {/* Ubicación — dejamos SOLO el botón (inputs lat/lng ocultos) */}
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-1">
                      Ubicación{' '}
                      <small className="text-muted">
                        (opcional)
                      </small>
                    </label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={usarMiUbicacion}
                      disabled={locating}
                      title="Usar mi ubicación actual"
                      aria-live="polite"
                    >
                      {locating
                        ? 'Obteniendo…'
                        : 'Usar mi ubicación'}
                    </button>
                  </div>

                  {/* Inputs lat/lng siguen existiendo en el estado,
                      pero no se muestran en el formulario. */}

                  {accuracy != null && (
                    <div className="form-text">
                      Precisión aprox.: ±{accuracy} m
                    </div>
                  )}

                  {!ubicacionOk && (
                    <div className="text-danger small mt-1">
                      Si indicas ubicación, debes rellenar{' '}
                      <strong>lat</strong> y{' '}
                      <strong>lng</strong> con valores
                      válidos.
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="col-12 d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      guardando ||
                      subiendo ||
                      !obligatorioOk ||
                      !ubicacionOk
                    }
                    aria-busy={guardando}
                  >
                    {guardando
                      ? 'Guardando…'
                      : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={guardando}
                    title="Volver atrás"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
