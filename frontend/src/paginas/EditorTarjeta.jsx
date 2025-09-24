// src/paginas/EditorTarjeta.jsx
// Pantalla para crear o editar una tarjeta (todos los campos obligatorios salvo vídeo y lat/lng).

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { tarjetasApi } from '../servicios/tarjetas';
import { logout } from '../utils/auth';

const OPCIONES_ETIQUETAS = ['lugares', 'experiencias', 'rutas'];

// Acepta solo http/https
const sanitizeUrl = (url = '') => {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol) ? url : '';
  } catch { return ''; }
};

const MAX_IMG_MB = 8;

// Normaliza números desde input (admite coma decimal). '' -> null
const toNum = (s) => {
  const str = String(s ?? '').replace(',', '.').trim();
  if (!str) return null;
  const n = Number(str);
  return Number.isFinite(n) ? n : NaN;
};

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

    const r = await tarjetasApi.una(id, { signal: controller.signal });

    if (r.status === 401) {
      logout();
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }
    if (!r.ok) {
      setMensaje(r.mensaje || 'No se pudo cargar');
      return;
    }

    const t = r.tarjeta || {};
    setForm({
      titulo: t.titulo || '',
      descripcion: t.descripcion || '',
      imagenes: Array.isArray(t.imagenes) ? t.imagenes : (t.imagenUrl ? [t.imagenUrl] : []),
      videoUrl: t.videoUrl || '',
      visibilidad: t.visibilidad || 'privado',
      etiquetas: Array.isArray(t.etiquetas) ? t.etiquetas : [],
      lat: (t.lat ?? '') === '' || t.lat == null ? '' : String(t.lat),
      lng: (t.lng ?? '') === '' || t.lng == null ? '' : String(t.lng),
    });
    setAccuracy(null);
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

  // Subir una imagen
  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // resetea siempre
    if (!f) return;

    setMensaje('');

    if (!f.type.startsWith('image/')) {
      setMensaje('El archivo debe ser una imagen.');
      return;
    }
    if (f.size > MAX_IMG_MB * 1024 * 1024) {
      setMensaje(`La imagen excede ${MAX_IMG_MB}MB.`);
      return;
    }

    uploadAbortRef.current?.abort();
    const controller = new AbortController();
    uploadAbortRef.current = controller;

    setSubiendo(true);
    const r = await tarjetasApi.subirImagen(f, { signal: controller.signal });
    setSubiendo(false);

    if (r.status === 401) {
      logout();
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }
    if (!r.ok || !r.url) {
      setMensaje(r.mensaje || 'Error subiendo la imagen');
      return;
    }

    // Añadir URL evitando duplicados
    setForm((prev) => {
      const set = new Set([...(prev.imagenes || []), r.url]);
      return { ...prev, imagenes: Array.from(set) };
    });
  };

  const quitarImagen = (idx) =>
    setForm((prev) => ({ ...prev, imagenes: prev.imagenes.filter((_, i) => i !== idx) }));

  const toggleEtiqueta = (tag) => {
    setForm((f) => {
      const sel = new Set(f.etiquetas || []);
      sel.has(tag) ? sel.delete(tag) : sel.add(tag);
      return { ...f, etiquetas: Array.from(sel) };
    });
  };

  // Reglas de obligatoriedad (vídeo es opcional)
  const faltan = {
    titulo: !form.titulo.trim(),
    descripcion: !form.descripcion.trim(),
    visibilidad: !['publico', 'privado'].includes(form.visibilidad),
    etiquetas: (form.etiquetas || []).length === 0,
    imagenes: (form.imagenes || []).length === 0,
  };
  const obligatorioOk =
    !faltan.titulo && !faltan.descripcion && !faltan.visibilidad && !faltan.etiquetas && !faltan.imagenes;

  // Validación de ubicación (opcional pero pareja consistente y en rango)
  const latProvided = String(form.lat ?? '').trim() !== '';
  const lngProvided = String(form.lng ?? '').trim() !== '';
  const latNum = toNum(form.lat);
  const lngNum = toNum(form.lng);
  const latInRange = latNum === null || (latNum !== null && !Number.isNaN(latNum) && latNum >= -90 && latNum <= 90);
  const lngInRange = lngNum === null || (lngNum !== null && !Number.isNaN(lngNum) && lngNum >= -180 && lngNum <= 180);

  const ubicacionOk =
    (!latProvided && !lngProvided)
    || (latProvided && lngProvided && !Number.isNaN(latNum) && !Number.isNaN(lngNum) && latInRange && lngInRange);

  // Botón: Usar mi ubicación (Geolocation API)
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
        // 6 decimales (~11 cm); más que suficiente
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
        if (err?.code === err.PERMISSION_DENIED) msg = 'Permiso de ubicación denegado.';
        else if (err?.code === err.POSITION_UNAVAILABLE) msg = 'Ubicación no disponible.';
        else if (err?.code === err.TIMEOUT) msg = 'Tiempo de espera agotado al obtener ubicación.';
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
      setMensaje('Completa los campos obligatorios: título, descripción, visibilidad, al menos 1 etiqueta y 1 imagen.');
      return;
    }
    if (!ubicacionOk) {
      setMensaje('Si indicas ubicación, debes rellenar lat y lng con valores válidos (lat -90..90, lng -180..180).');
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
      videoUrl: sanitizeUrl(form.videoUrl.trim()),
      imagenes: (form.imagenes || []).map((s) => s.trim()).filter(Boolean),
      etiquetas: (form.etiquetas || []).filter((t) =>
        OPCIONES_ETIQUETAS.includes((t || '').toLowerCase())
      ),
      ...(latProvided && lngProvided && ubicacionOk
        ? { lat: Number(latNum), lng: Number(lngNum) }
        : {}),
    };

    setGuardando(true);
    const r = id
      ? await tarjetasApi.actualizar(id, payload)
      : await tarjetasApi.crear(payload);
    setGuardando(false);

    if (r.status === 401) {
      logout();
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }
    if (!r.ok) {
      setMensaje(r.mensaje || 'Error guardando');
      return;
    }

    navigate('/panel', { replace: true });
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h1 className="h4 mb-3">{id ? 'Editar' : 'Nueva'} tarjeta</h1>

              {mensaje && <div className="alert alert-danger">{mensaje}</div>}

              <form onSubmit={enviar} className="row g-3" noValidate>
                {/* Título */}
                <div className="col-12">
                  <label className="form-label">Título</label>
                  <input
                    className={`form-control ${faltan.titulo ? 'is-invalid' : ''}`}
                    name="titulo"
                    value={form.titulo}
                    onChange={cambiar}
                    maxLength={120}
                    required
                  />
                  {faltan.titulo && <div className="invalid-feedback">El título es obligatorio.</div>}
                </div>

                {/* Descripción */}
                <div className="col-12">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className={`form-control ${faltan.descripcion ? 'is-invalid' : ''}`}
                    rows={4}
                    name="descripcion"
                    value={form.descripcion}
                    onChange={cambiar}
                    maxLength={1000}
                    required
                  />
                  {faltan.descripcion && <div className="invalid-feedback">La descripción es obligatoria.</div>}
                </div>

                {/* Imágenes */}
                <div className="col-12">
                  <div className="d-flex align-items-center justify-content-between">
                    <label className="form-label mb-0">Imágenes</label>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={seleccionarArchivo}
                        disabled={subiendo}
                      >
                        {subiendo ? 'Subiendo…' : 'Subir imagen'}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={onFileChange}
                      />
                    </div>
                  </div>

                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {(form.imagenes || []).map((url, i) => (
                      <div key={url + i} className="position-relative">
                        <img
                          src={url}
                          alt={`img-${i}`}
                          style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 translate-middle"
                          onClick={() => quitarImagen(i)}
                          title="Quitar"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {faltan.imagenes && (
                    <div className="text-danger small mt-2">Añade al menos una imagen.</div>
                  )}
                </div>

                {/* Vídeo (opcional) */}
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

                {/* Visibilidad */}
                <div className="col-12 col-md-4">
                  <label className="form-label">Visibilidad</label>
                  <select
                    className={`form-select ${faltan.visibilidad ? 'is-invalid' : ''}`}
                    name="visibilidad"
                    value={form.visibilidad}
                    onChange={cambiar}
                    required
                  >
                    <option value="privado">Privado</option>
                    <option value="publico">Público</option>
                  </select>
                  {faltan.visibilidad && <div className="invalid-feedback">Selecciona una visibilidad.</div>}
                </div>

                {/* Etiquetas */}
                <div className="col-12 col-md-8">
                  <label className="form-label d-block">Etiquetas (elige al menos una)</label>
                  <div className="d-flex gap-3 flex-wrap">
                    {OPCIONES_ETIQUETAS.map((tag) => (
                      <div className="form-check" key={tag}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`chk-${tag}`}
                          checked={form.etiquetas.includes(tag)}
                          onChange={() => toggleEtiqueta(tag)}
                        />
                        <label className="form-check-label" htmlFor={`chk-${tag}`}>
                          {tag}
                        </label>
                      </div>
                    ))}
                  </div>
                  {faltan.etiquetas && (
                    <div className="text-danger small mt-1">Selecciona al menos una etiqueta.</div>
                  )}
                </div>

                {/* Ubicación (opcional) */}
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-1">
                      Ubicación <small className="text-muted">(opcional)</small>
                    </label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={usarMiUbicacion}
                      disabled={locating}
                      title="Usar mi ubicación actual"
                    >
                      {locating ? 'Obteniendo…' : (<><i className="bi bi-geo-alt me-1" /> Usar mi ubicación</>)}
                    </button>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <input
                        type="number"
                        step="any"
                        min={-90}
                        max={90}
                        className={`form-control ${!ubicacionOk && latProvided ? 'is-invalid' : ''}`}
                        name="lat"
                        value={form.lat}
                        onChange={cambiar}
                        placeholder="Latitud (-90 a 90)"
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="number"
                        step="any"
                        min={-180}
                        max={180}
                        className={`form-control ${!ubicacionOk && lngProvided ? 'is-invalid' : ''}`}
                        name="lng"
                        value={form.lng}
                        onChange={cambiar}
                        placeholder="Longitud (-180 a 180)"
                      />
                    </div>
                  </div>

                  {accuracy != null && (
                    <div className="form-text">Precisión aprox.: ±{accuracy} m</div>
                  )}

                  {!ubicacionOk && (
                    <div className="text-danger small mt-1">
                      Si indicas ubicación, debes rellenar <strong>lat</strong> y <strong>lng</strong> con valores válidos.
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="col-12 d-flex gap-2">
                  <button
                    className="btn btn-primary"
                    disabled={guardando || subiendo || !obligatorioOk || !ubicacionOk}
                  >
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={guardando}
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
