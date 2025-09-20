// EditorTarjeta.jsx
// Pantalla para crear o editar una tarjeta.
// Soporta: título, descripción, subir imágenes (al backend), URL de vídeo,
// visibilidad y etiquetas (lugares / experiencias / rutas).

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tarjetasApi } from '../servicios/tarjetas';

// Etiquetas permitidas que pintamos como checkboxes
const OPCIONES_ETIQUETAS = ['lugares', 'experiencias', 'rutas'];

export default function EditorTarjeta() {
  // Si existe :id en la ruta => modo edición; si no, modo creación
  const { id } = useParams();
  const navigate = useNavigate();

  // Estado del formulario
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    imagenes: [],      // guardamos URLs devueltas por la API de subida
    videoUrl: '',
    visibilidad: 'privado',
    etiquetas: [],
  });

  // Estado para feedback y spinner de subida
  const [mensaje, setMensaje] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  // Ref al input[type=file] oculto
  const fileRef = useRef(null);

  // Si estamos en modo edición, cargar la tarjeta existente
  useEffect(() => {
    if (!id) return; // en alta no hay nada que cargar

    (async () => {
      const r = await tarjetasApi.una(id);
      if (!r.ok) return setMensaje(r.mensaje || 'No se pudo cargar');

      const t = r.tarjeta || {};
      setForm({
        titulo: t.titulo || '',
        descripcion: t.descripcion || '',
        // compatibilidad por si existen tarjetas antiguas con imagenUrl única
        imagenes: Array.isArray(t.imagenes) ? t.imagenes : (t.imagenUrl ? [t.imagenUrl] : []),
        videoUrl: t.videoUrl || '',
        visibilidad: t.visibilidad || 'privado',
        etiquetas: Array.isArray(t.etiquetas) ? t.etiquetas : [],
      });
    })();
  }, [id]);

  // Handler genérico de inputs controlados
  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // Abre el selector de archivos
  const seleccionarArchivo = () => fileRef.current?.click();

  // Cuando el usuario selecciona un archivo de imagen
  const onFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setMensaje('');
    setSubiendo(true);

    // Llamamos a la API para subir UNA imagen (multipart/form-data)
    const r = await tarjetasApi.subirImagen(f);

    setSubiendo(false);
    e.target.value = ''; // resetea el input file (permite elegir la misma imagen otra vez)

    if (!r.ok || !r.url) {
      return setMensaje(r.mensaje || 'Error subiendo la imagen');
    }

    // Añadimos la URL recibida a la lista de imágenes
    setForm((prev) => ({ ...prev, imagenes: [...(prev.imagenes || []), r.url] }));
  };

  // Quitar una imagen ya subida de la lista
  const quitarImagen = (idx) =>
    setForm((prev) => ({ ...prev, imagenes: prev.imagenes.filter((_, i) => i !== idx) }));

  // Envío del formulario (crear o actualizar)
  const enviar = async (e) => {
    e.preventDefault();
    setMensaje('');

    // Payload limpio (trim y filtrado básico)
    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      visibilidad: form.visibilidad,
      videoUrl: form.videoUrl.trim(),
      imagenes: (form.imagenes || []).map((s) => s.trim()).filter(Boolean),
      etiquetas: (form.etiquetas || []).filter((t) =>
        OPCIONES_ETIQUETAS.includes((t || '').toLowerCase())
      ),
    };

    // Llamada a crear o actualizar según corresponda
    const r = id ? await tarjetasApi.actualizar(id, payload) : await tarjetasApi.crear(payload);
    if (!r.ok) return setMensaje(r.mensaje || 'Error guardando');

    // Volver al panel al terminar
    navigate('/panel');
  };

  // Añadir/Quitar etiqueta en el array del formulario
  const toggleEtiqueta = (tag) => {
    setForm((f) => {
      const sel = new Set(f.etiquetas || []);
      sel.has(tag) ? sel.delete(tag) : sel.add(tag);
      return { ...f, etiquetas: Array.from(sel) };
    });
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h1 className="h4 mb-3">{id ? 'Editar' : 'Nueva'} tarjeta</h1>
              {mensaje && <div className="alert alert-danger">{mensaje}</div>}

              <form onSubmit={enviar} className="row g-3">
                {/* Título */}
                <div className="col-12">
                  <label className="form-label">Título</label>
                  <input
                    className="form-control"
                    name="titulo"
                    value={form.titulo}
                    onChange={cambiar}
                    maxLength={120}
                    required
                  />
                </div>

                {/* Descripción */}
                <div className="col-12">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    name="descripcion"
                    value={form.descripcion}
                    onChange={cambiar}
                    maxLength={1000}
                  />
                </div>

                {/* Subida y listado de imágenes */}
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

                      {/* Input file oculto */}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={onFileChange}
                      />
                    </div>
                  </div>

                  {/* Previews de imágenes con botón para quitar */}
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {(form.imagenes || []).map((url, i) => (
                      <div key={i} className="position-relative">
                        <img
                          src={url}
                          alt={`img-${i}`}
                          style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 6 }}
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
                </div>

                {/* Vídeo (solo URL) */}
                <div className="col-12">
                  <label className="form-label">Vídeo (YouTube/Vimeo/MP4)</label>
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
                    className="form-select"
                    name="visibilidad"
                    value={form.visibilidad}
                    onChange={cambiar}
                  >
                    <option value="privado">Privado</option>
                    <option value="publico">Público</option>
                  </select>
                </div>

                {/* Etiquetas (checkbox) */}
                <div className="col-12 col-md-8">
                  <label className="form-label d-block">Etiquetas</label>
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
                </div>

                {/* Acciones */}
                <div className="col-12 d-flex gap-2">
                  <button className="btn btn-primary">Guardar</button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
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
