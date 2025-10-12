// backend/src/controladores/tarjetas.controlador.js
// ————————————————————————————————————————————————————————
// Controlador de "Tarjetas" (lugares/experiencias/rutas) con CRUD,
// subida de media y listados paginados.
// Incluye detalle público: publicaUna (GET /api/tarjetas/publicas/:id)
// ————————————————————————————————————————————————————————

import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Tarjeta from '../modelos/tarjeta.modelo.js';

// ---------- helpers ----------
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Única fuente local para filtrar entrada (en modelo también existe)
const ETIQUETAS_PERMITIDAS = ['lugares', 'experiencias', 'rutas'];

const uniq = (arr) => [...new Set(arr)];
const toArray = (v) => (Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]));

// Normaliza string "publico|privado"
function normalizarVisibilidad(v) {
  return v === 'publico' ? 'publico' : 'privado';
}

// Filtra a etiquetas permitidas
function normalizarEtiquetas(v) {
  const lista = toArray(v)
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean)
    .filter((x) => ETIQUETAS_PERMITIDAS.includes(x));
  return uniq(lista);
}

// Números opcionales (''/undefined/null -> null; inválidos -> null)
function parseNum(v) {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Construye la URL pública base para /uploads
function baseUploads(req) {
  const envBase = process.env.PUBLIC_UPLOAD_URL;
  if (envBase) return envBase.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');
  return `${proto}://${host}/uploads`;
}

// A partir de req.files (multer.fields), genera URLs públicas (se usan SOLO para guardado actual)
function extraerMediaDesdeFiles(req) {
  const base = baseUploads(req);
  const imagenesSubidas = (req.files?.imagenes || []).map((f) => `${base}/${f.filename}`);
  const videoSubido = (req.files?.video || [])[0];
  const videoUrlSubido = videoSubido ? `${base}/${videoSubido.filename}` : '';
  return { imagenesSubidas, videoUrlSubido };
}

// Normaliza imágenes combinando subidas y URLs del body (incluye legado imagenUrl)
function normalizarImagenes({ imagenesFiles, imagenesBody, imagenUrlBody }) {
  const lista = [
    ...toArray(imagenesFiles).map((x) => String(x).trim()).filter(Boolean),
    ...toArray(imagenesBody).map((x) => String(x).trim()).filter(Boolean),
    ...toArray(imagenUrlBody).map((x) => String(x).trim()).filter(Boolean),
  ];
  return uniq(lista).slice(0, 10);
}

// Paginación segura
const parsePage = (v, def = 1) => Math.max(parseInt(String(v || def), 10) || def, 1);
const parseLimit = (v, def = 12, min = 1, max = 50) => {
  const n = parseInt(String(v || def), 10) || def;
  return Math.min(Math.max(n, min), max);
};

// Formatea ValidationError de Mongoose → array de { campo, mensaje }
function mapValidationError(err) {
  return Object.values(err?.errors || {}).map((e) => ({
    campo: e.path,
    mensaje: e.message,
  }));
}

/* ====== NUEVO: helpers de salida para imágenes ====== */

// extrae solo el nombre de archivo de una url/ruta
const fileNameFrom = (u) => {
  if (!u) return null;
  try {
    const s = String(u);
    const sinQuery = s.split('?')[0].split('#')[0];
    const parts = sinQuery.split('/');
    const name = parts[parts.length - 1];
    return name || null;
  } catch {
    return null;
  }
};

// convierte nombre o url a /api/uploads/<filename>
const toPublicUrl = (nameOrUrl) => {
  const name = fileNameFrom(nameOrUrl);
  return name ? `/api/uploads/${name}` : null;
};

const mapImagenes = (arr) =>
  Array.isArray(arr) ? arr.map(toPublicUrl).filter(Boolean) : [];

const mapVideo = (v) => {
  if (!v) return v;
  // si viene como /uploads/xxx → /api/uploads/xxx
  if (String(v).startsWith('/uploads/')) return `/api${v}`;
  // si es absoluta y contiene /uploads/, usa basename
  if (/\/uploads\//i.test(String(v))) return toPublicUrl(v);
  // si no parece de /uploads, la dejamos tal cual (p.ej. YouTube)
  return v;
};

// serializa doc (Mongoose o POJO) aplicando mapping de imagenes/video
const serializeTarjeta = (doc) => {
  const o = doc?.toObject ? doc.toObject() : { ...doc };
  o.imagenes = mapImagenes(o.imagenes);
  if (o.imagen) o.imagen = toPublicUrl(o.imagen);        // por si tienes campo legacy
  if (o.imagenUrl) o.imagenUrl = toPublicUrl(o.imagenUrl); // legacy string única
  if (o.videoUrl) o.videoUrl = mapVideo(o.videoUrl);
  return o;
};

// ---------- Crear ----------
export async function crear(req, res) {
  try {
    // Red de seguridad: por si cambian middlewares en la ruta
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(422).json({ ok: false, errores: errores.array() });
    }

    const {
      titulo,
      descripcion = '',
      imagenes = [],
      imagenUrl = '',
      videoUrl = '',
      visibilidad = 'privado',
      etiquetas = [],
      lat: latRaw,
      lng: lngRaw,
    } = req.body || {};

    const { imagenesSubidas, videoUrlSubido } = extraerMediaDesdeFiles(req);

    // Lat/Lng: opcionales; si vienen ambos, se guardan; si no, se omiten.
    const lat = parseNum(latRaw);
    const lng = parseNum(lngRaw);
    const incluirUbicacion = lat != null && lng != null;

    const doc = await Tarjeta.create({
      usuario: req.usuario.id,
      titulo: String(titulo ?? '').trim(),
      descripcion: String(descripcion ?? '').trim(),
      imagenes: normalizarImagenes({
        imagenesFiles: imagenesSubidas,
        imagenesBody: imagenes,
        imagenUrlBody: imagenUrl,
      }),
      videoUrl: String(videoUrlSubido || videoUrl || '').trim(),
      visibilidad: normalizarVisibilidad(visibilidad),
      etiquetas: normalizarEtiquetas(etiquetas),
      ...(incluirUbicacion ? { lat, lng } : {}),
    });

    // ⇣⇣ respuesta con URLs públicas normalizadas
    return res.status(201).json({ ok: true, tarjeta: serializeTarjeta(doc) });
  } catch (e) {
    if (e?.name === 'ValidationError') {
      return res.status(422).json({ ok: false, mensaje: 'Datos inválidos', errores: mapValidationError(e) });
    }
    return res.status(500).json({ ok: false, mensaje: 'Error creando tarjeta', error: e.message });
  }
}

// ---------- Listar mías ----------
export async function mias(req, res) {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 12, 1, 50);
    const filtro = { usuario: req.usuario.id };

    const [items, total] = await Promise.all([
      Tarjeta.find(filtro)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Tarjeta.countDocuments(filtro),
    ]);

    const itemsOut = items.map(serializeTarjeta);

    return res.json({
      ok: true,
      items: itemsOut,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error listando tarjetas', error: e.message });
  }
}

// ---------- Listar públicas ----------
export async function publicas(req, res) {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 12, 1, 50);

    const filtro = { visibilidad: 'publico' };
    if (req.query.q) filtro.$text = { $search: String(req.query.q) };

    if (req.query.etiqueta) {
      const et = String(req.query.etiqueta).trim().toLowerCase();
      if (ETIQUETAS_PERMITIDAS.includes(et)) filtro.etiquetas = et;
      else return res.status(400).json({ ok: false, mensaje: 'Etiqueta no válida' });
    }

    const [items, total] = await Promise.all([
      Tarjeta.find(filtro)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Tarjeta.countDocuments(filtro),
    ]);

    const itemsOut = items.map(serializeTarjeta);

    return res.json({
      ok: true,
      items: itemsOut,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error listando públicas', error: e.message });
  }
}

// ---------- Detalle público (sin token) ----------
export async function publicaUna(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    }

    const doc = await Tarjeta.findById(id).lean();
    // Por privacidad, respondemos 404 si no existe o no es pública
    if (!doc || doc.visibilidad !== 'publico') {
      return res.status(404).json({ ok: false, mensaje: 'No encontrada' });
    }

    return res.json({ ok: true, tarjeta: serializeTarjeta(doc) });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo tarjeta', error: e.message });
  }
}

// ---------- Obtener una (privada: exige token) ----------
export async function una(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido' });

    const doc = await Tarjeta.findById(id);
    if (!doc) return res.status(404).json({ ok: false, mensaje: 'No encontrada' });

    const esMia = req.usuario && String(doc.usuario) === req.usuario.id;
    if (!esMia && doc.visibilidad !== 'publico') {
      return res.status(403).json({ ok: false, mensaje: 'Sin permiso' });
    }

    return res.json({ ok: true, tarjeta: serializeTarjeta(doc) });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error obteniendo tarjeta', error: e.message });
  }
}

// ---------- Actualizar (solo propietario) ----------
export async function actualizar(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ ok: false, mensaje: 'ID no válido' });
  }

  // Cargamos el doc primero (para tratar lat/lng como pareja)
  let doc = await Tarjeta.findOne({ _id: id, usuario: req.usuario.id });
  if (!doc) return res.status(404).json({ ok: false, mensaje: 'Tarjeta no encontrada' });

  const body = req.body || {};
  const {
    titulo,
    descripcion,
    imagenes,
    imagenUrl,
    videoUrl,
    visibilidad,
    etiquetas,
    lat: latRaw,
    lng: lngRaw,
  } = body;

  const { imagenesSubidas, videoUrlSubido } = extraerMediaDesdeFiles(req);

  // ——— Campos simples ———
  if (titulo !== undefined) doc.titulo = String(titulo).trim();
  if (descripcion !== undefined) doc.descripcion = String(descripcion).trim();
  if (visibilidad !== undefined) doc.visibilidad = normalizarVisibilidad(visibilidad);
  if (etiquetas !== undefined) doc.etiquetas = normalizarEtiquetas(etiquetas);

  // ——— Imágenes ———
  if (imagenesSubidas.length || imagenes !== undefined || imagenUrl !== undefined) {
    doc.imagenes = normalizarImagenes({
      imagenesFiles: imagenesSubidas,
      imagenesBody: imagenes,
      imagenUrlBody: imagenUrl,
    });
  }

  // ——— Vídeo ———
  if (videoUrlSubido || videoUrl !== undefined) {
    doc.videoUrl = String(videoUrlSubido || videoUrl || '').trim();
  }

  // ——— Ubicación (pareja lat/lng) ———
  const latProvided = Object.prototype.hasOwnProperty.call(body, 'lat');
  const lngProvided = Object.prototype.hasOwnProperty.call(body, 'lng');

  if (latProvided || lngProvided) {
    const latParsed = latProvided ? parseNum(latRaw) : doc.lat;
    const lngParsed = lngProvided ? parseNum(lngRaw) : doc.lng;

    const latFinal = latParsed == null ? undefined : latParsed;
    const lngFinal = lngParsed == null ? undefined : lngParsed;

    const unoSinOtro = (latFinal === undefined) !== (lngFinal === undefined);
    if (unoSinOtro) {
      return res.status(422).json({
        ok: false,
        mensaje: 'Debes proporcionar lat y lng juntos o ninguno',
        errores: [{ campo: 'lat/lng', mensaje: 'Par incompleto' }],
      });
    }

    doc.lat = latFinal;
    doc.lng = lngFinal;
  }

  try {
    await doc.save(); // ejecuta validaciones del esquema
    return res.json({ ok: true, tarjeta: serializeTarjeta(doc) });
  } catch (e) {
    if (e?.name === 'ValidationError') {
      return res.status(422).json({ ok: false, mensaje: 'Datos inválidos', errores: mapValidationError(e) });
    }
    return res.status(500).json({ ok: false, mensaje: e.message });
  }
}

// ---------- Eliminar (solo propietario) ----------
export async function eliminar(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido' });

    const doc = await Tarjeta.findById(id);
    if (!doc) return res.status(404).json({ ok: false, mensaje: 'No encontrada' });
    if (String(doc.usuario) !== req.usuario.id)
      return res.status(403).json({ ok: false, mensaje: 'Sin permiso' });

    await doc.deleteOne();
    return res.json({ ok: true, mensaje: 'Eliminada' });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error eliminando', error: e.message });
  }
}

// ---------- Subir 1 imagen (multipart/form-data, campo "file") ----------
export async function subirImagen(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: 'No se recibió archivo' });
    }
    const base = baseUploads(req);
    const filename = req.file.filename;
    const url = `${base}/${filename}`;
    const publicUrl = `/api/uploads/${filename}`; // útil directamente para el front

    return res.status(201).json({
      ok: true,
      mensaje: 'Imagen subida',
      url,
      publicUrl,
      filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error subiendo imagen', error: e.message });
  }
}
