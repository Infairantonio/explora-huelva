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

// Emojis y chips modernos para 2025 😎
const EMOJIS_MODERNOS = ['📍', '✨', '🌅', '🏖️', '🚶‍♀️', '🚴‍♂️', '🍽️', '🌲'];

// Pequeñas plantillas de texto para rellenar rápido la descripción
const PLANTILLAS_DESC = [
  {
    id: 'basica',
    label: 'Plantilla básica',
    texto:
      '📍 Cómo llegar:\n\n' +
      '🕒 Mejor momento para ir:\n\n' +
      '✨ Lo que más me gustó:\n\n' +
      '💡 Consejos:\n',
  },
  {
    id: 'ruta',
    label: 'Plantilla ruta',
    texto:
      '🚶‍♀️ Tipo de ruta (lineal/circular):\n\n' +
      '📏 Distancia aproximada:\n\n' +
      '⛰️ Dificultad (baja/media/alta):\n\n' +
      '⏱️ Duración aproximada:\n\n' +
      '💡 Recomendaciones (agua, calzado, etc.):\n',
  },
  {
    id: 'playa',
    label: 'Plantilla playa',
    texto:
      '🏖️ Tipo de playa (arena, roca, calas…):\n\n' +
      '🌊 Oleaje y viento:\n\n' +
      '🅿️ Aparcamiento / acceso:\n\n' +
      '🍽️ Bares / chiringuitos cerca:\n\n' +
      '✨ Truco personal:\n',
  },
];

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

  const esEdicion = Boolean(id);

  // 👉 helper para insertar emojis / texto en la descripción
  const insertarTextoDescripcion = (trozo) => {
    setForm((f) => ({
      ...f,
      descripcion:
        (f.descripcion || '') +
        (f.descripcion ? '\n' : '') +
        trozo,
    }));
  };

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
        const set = new Set(
          [...(prev.imagenes || []), nueva].filter(Boolean)
        );
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
          msg = 'Tiempo de espera agotado al obtener ubicación.';
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

  const longitudDesc = form.descripcion.length;
  const cercaLimite = longitudDesc > 900; // a partir de 900/1000 ponemos el numerito en rojo

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9">
          {/* Cabecera visual tipo “wizard” */}
          <div className="mb-3">
            <span className="badge rounded-pill text-bg-primary me-2">
              {esEdicion ? 'Editar tarjeta' : 'Nueva tarjeta'}
            </span>
            <span className="badge rounded-pill text-bg-light text-muted">
              Paso 1 · Detalles básicos
            </span>
          </div>

          <div className="card shadow border-0">
            {/* Cinta superior colorida */}
            <div className="card-header border-0 bg-gradient bg-primary text-light py-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h1 className="h5 mb-1">
                    {esEdicion ? 'Edita tu experiencia' : 'Comparte un lugar o experiencia'}
                  </h1>
                  <p className="mb-0 small text-light opacity-75">
                    Añade un título claro, una buena foto y marca si es un lugar, ruta o experiencia.
                  </p>
                </div>
                <div className="text-end small">
                  <span className="d-block fw-semibold">
                    Explora Huelva
                  </span>
                  <span className="text-light opacity-75">
                    Tu mapa personal de recuerdos
                  </span>
                </div>
              </div>
            </div>

            <div className="card-body">
              {mensaje && (
                <div
                  className="alert alert-danger"
                  role="alert"
                  aria-live="assertive"
                >
                  {mensaje}
                </div>
              )}

              <form onSubmit={enviar} className="row g-4" noValidate>
                {/* SECCIÓN 1: Información básica */}
                <div className="col-12">
                  <h2 className="h6 text-uppercase text-muted mb-2">
                    1. Información básica
                  </h2>
                  <div className="row g-3">
                    {/* Título */}
                    <div className="col-12">
                      <label
                        className="form-label"
                        htmlFor="campo-titulo"
                      >
                        Título <span className="text-danger">*</span>
                      </label>
                      <input
                        id="campo-titulo"
                        className={`form-control ${
                          !form.titulo.trim() ? 'is-invalid' : ''
                        }`}
                        name="titulo"
                        value={form.titulo}
                        onChange={cambiar}
                        maxLength={120}
                        required
                        aria-invalid={!form.titulo.trim()}
                        aria-describedby="ayuda-titulo"
                        placeholder="Atardecer en la Punta del Sebo, ruta por el Andévalo..."
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

                    {/* Descripción con emojis + plantillas + contador */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
                        <label
                          className="form-label mb-0"
                          htmlFor="campo-descripcion"
                        >
                          Descripción <span className="text-danger">*</span>
                        </label>

                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          {/* Emojis rápidos */}
                          <div className="d-flex flex-wrap gap-1 small align-items-center">
                            <span className="text-muted me-1">Emojis:</span>
                            {EMOJIS_MODERNOS.map((em) => (
                              <button
                                key={em}
                                type="button"
                                className="btn btn-sm btn-light border-0"
                                onClick={() => insertarTextoDescripcion(em)}
                                title="Insertar emoji"
                              >
                                {em}
                              </button>
                            ))}
                          </div>

                          {/* Plantillas rápidas */}
                          <div className="small">
                            <select
                              className="form-select form-select-sm"
                              defaultValue=""
                              onChange={(e) => {
                                const idPlat = e.target.value;
                                if (!idPlat) return;
                                const plat = PLANTILLAS_DESC.find(
                                  (p) => p.id === idPlat
                                );
                                if (plat) {
                                  insertarTextoDescripcion(plat.texto);
                                }
                                e.target.value = '';
                              }}
                            >
                              <option value="">Plantillas…</option>
                              {PLANTILLAS_DESC.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <textarea
                        id="campo-descripcion"
                        className={`form-control ${
                          !form.descripcion.trim() ? 'is-invalid' : ''
                        }`}
                        rows={4}
                        name="descripcion"
                        value={form.descripcion}
                        onChange={cambiar}
                        maxLength={1000}
                        required
                        aria-invalid={!form.descripcion.trim()}
                        aria-describedby="ayuda-descripcion"
                        placeholder="Cuenta qué viste, cómo llegaste, trucos, mejores horas para ir..."
                      />
                      <div
                        id="ayuda-descripcion"
                        className="d-flex justify-content-between align-items-center mt-1"
                      >
                        <span className="form-text">
                          Usa emojis y, si quieres, una plantilla para estructurar la experiencia.
                        </span>
                        <span
                          className={`small ${
                            cercaLimite ? 'text-danger fw-semibold' : 'text-muted'
                          }`}
                        >
                          {longitudDesc} / 1000
                        </span>
                      </div>
                      {!form.descripcion.trim() && (
                        <div className="invalid-feedback">
                          La descripción es obligatoria.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: Imágenes */}
                <div className="col-12">
                  <h2 className="h6 text-uppercase text-muted mb-2">
                    2. Imágenes
                  </h2>
                  <div className="d-flex align-items-center justify-content-between">
                    <label className="form-label mb-0">
                      Imágenes <span className="text-danger">*</span>
                    </label>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={seleccionarArchivo}
                        disabled={subiendo}
                        title="Subir imagen"
                      >
                        <i className="bi bi-cloud-arrow-up me-1" />
                        {subiendo ? 'Subiendo…' : 'Añadir imagen'}
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
                            width: 130,
                            height: 90,
                            objectFit: 'cover',
                            borderRadius: 8,
                          }}
                          loading="lazy"
                          decoding="async"
                          className="border"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
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

                  <div className="alert alert-light border mt-3 small mb-0">
                    <i className="bi bi-shield-check me-2" />
                    Evita subir fotos con datos personales sensibles o de otras personas
                    sin su consentimiento. Las imágenes se optimizan en el servidor para
                    que la app vaya fluida.
                  </div>
                </div>

                {/* SECCIÓN 3: Visibilidad y etiquetas */}
                <div className="col-12">
                  <h2 className="h6 text-uppercase text-muted mb-2">
                    3. Visibilidad y etiquetas
                  </h2>
                  <div className="row g-3 align-items-start">
                    {/* Visibilidad */}
                    <div className="col-12 col-md-4">
                      <label
                        className="form-label"
                        htmlFor="sel-visibilidad"
                      >
                        Visibilidad <span className="text-danger">*</span>
                      </label>
                      <select
                        id="sel-visibilidad"
                        className={`form-select ${
                          !OPCIONES_VISIBILIDAD.includes(form.visibilidad)
                            ? 'is-invalid'
                            : ''
                        }`}
                        name="visibilidad"
                        value={form.visibilidad}
                        onChange={cambiar}
                        required
                        aria-invalid={
                          !OPCIONES_VISIBILIDAD.includes(form.visibilidad)
                        }
                      >
                        <option value="privado">Privado</option>
                        <option value="publico">Público</option>
                        <option value="amigos">Amigos</option>
                      </select>
                      <div className="form-text">
                        Elige quién puede ver esta tarjeta en Explora Huelva.
                      </div>
                      {!OPCIONES_VISIBILIDAD.includes(form.visibilidad) && (
                        <div className="invalid-feedback">
                          Selecciona una visibilidad.
                        </div>
                      )}
                    </div>

                    {/* Etiquetas */}
                    <div className="col-12 col-md-8">
                      <fieldset>
                        <legend className="form-label mb-2">
                          Etiquetas <span className="text-danger">*</span>
                        </legend>
                        <div className="d-flex gap-3 flex-wrap">
                          {OPCIONES_ETIQUETAS.map((tag) => (
                            <div
                              className="form-check form-check-inline"
                              key={tag}
                            >
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`chk-${tag}`}
                                checked={form.etiquetas.includes(tag)}
                                onChange={() => toggleEtiqueta(tag)}
                                aria-describedby="ayuda-etiquetas"
                              />
                              <label
                                className="form-check-label text-capitalize"
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
                          Esto ayuda a clasificar tu tarjeta en el buscador
                          (Lugares, Rutas, Experiencias).
                        </div>
                        {(form.etiquetas || []).length === 0 && (
                          <div className="text-danger small mt-1">
                            Selecciona al menos una etiqueta.
                          </div>
                        )}
                      </fieldset>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 4: Ubicación */}
                <div className="col-12">
                  <h2 className="h6 text-uppercase text-muted mb-2">
                    4. Ubicación (opcional)
                  </h2>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <p className="mb-1 small text-muted">
                        Asocia la tarjeta a tu posición actual para verla en el
                        mapa de Explora Huelva.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={usarMiUbicacion}
                      disabled={locating}
                      title="Usar mi ubicación actual"
                      aria-live="polite"
                    >
                      <i className="bi bi-geo-alt me-1" />
                      {locating ? 'Obteniendo…' : 'Usar mi ubicación'}
                    </button>
                  </div>

                  {accuracy != null && (
                    <div className="form-text mt-1">
                      Precisión aprox.: ±{accuracy} m
                    </div>
                  )}

                  {!ubicacionOk && (
                    <div className="text-danger small mt-1">
                      Si indicas ubicación, debes rellenar{' '}
                      <strong>lat</strong> y <strong>lng</strong> con valores
                      válidos.
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="col-12 d-flex flex-wrap gap-2 justify-content-between align-items-center">
                  <div className="d-flex gap-2">
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
                      {guardando ? 'Guardando…' : 'Guardar tarjeta'}
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
                  <span className="small text-muted mt-2 mt-md-0">
                    Los campos marcados con <span className="text-danger">*</span> son obligatorios.
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
