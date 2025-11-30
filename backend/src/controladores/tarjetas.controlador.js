// backend/src/controladores/tarjetas.controlador.js
// ————————————————————————————————————————————————————————
// Controlador de "Tarjetas" (lugares/experiencias/rutas) con CRUD,
// subida de media y listados paginados.
// Soporta visibilidades: 'publico' | 'privado' | 'amigos'.
// Incluye detalle público: publicaUna (GET /api/tarjetas/publicas/:id)
// y listado de amigos: amigos (GET /api/tarjetas/amigos).
// ————————————————————————————————————————————————————————

import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Tarjeta from '../modelos/tarjeta.modelo.js';
import Amigo from '../modelos/amigo.modelo.js';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// ---------- helpers ----------
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Única fuente local para filtrar entrada (coherente con el modelo)
const ETIQUETAS_PERMITIDAS = ['lugares', 'experiencias', 'rutas'];

const uniq = (arr) => [...new Set(arr)];
const toArray = (v) => (Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]));

// Normaliza string "publico|privado|amigos"
function normalizarVisibilidad(v) {
  return v === 'publico' ? 'publico' : v === 'amigos' ? 'amigos' : 'privado';
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

// A partir de req.files (multer.fields), genera URLs públicas
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

/* ====== helpers de salida para imágenes ====== */

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
  // si no parece de /uploads, se deja tal cual (p.ej. YouTube)
  return v;
};

// serializa doc (Mongoose o POJO) aplicando mapping de imagenes/video
const serializeTarjeta = (doc) => {
  const o = doc?.toObject ? doc.toObject() : { ...doc };
  o.imagenes = mapImagenes(o.imagenes);
  if (o.imagen) o.imagen = toPublicUrl(o.imagen);          // legacy
  if (o.imagenUrl) o.imagenUrl = toPublicUrl(o.imagenUrl); // legacy
  if (o.videoUrl) o.videoUrl = mapVideo(o.videoUrl);
  return o;
};

/* ====== helper amistad ====== */
async function sonAmigos(userIdA, userIdB) {
  if (!userIdA || !userIdB) return false;
  if (String(userIdA) === String(userIdB)) return true; // propietario
  const rel = await Amigo.findOne({
    estado: 'aceptada',
    $or: [
      { solicitante: userIdA, receptor: userIdB },
      { solicitante: userIdB, receptor: userIdA },
    ],
  })
    .select({ _id: 1 })
    .lean();
  return !!rel;
}

// ---------- Crear ----------
export async function crear(req, res) {
  try {
    // Validaciones definidas en la ruta (express-validator)
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

    // Lat/Lng opcionales; solo se guardan si llegan las dos
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

    // Respuesta con URLs públicas normalizadas
    return res.status(201).json({ ok: true, tarjeta: serializeTarjeta(doc) });
  } catch (e) {
    if (e?.name === 'ValidationError') {
      return res
        .status(422)
        .json({ ok: false, mensaje: 'Datos inválidos', errores: mapValidationError(e) });
    }
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error creando tarjeta', error: e.message });
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
        // Incluye datos básicos del usuario creador
        .populate({
          path: 'usuario',
          select: 'nombre _id',
        })
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
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error listando tarjetas', error: e.message });
  }
}

// ---------- Listar públicas (sin token) ----------
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
        // Incluye datos básicos del usuario creador en tarjetas públicas
        .populate({
          path: 'usuario',
          select: 'nombre _id',
        })
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
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error listando públicas', error: e.message });
  }
}

/* ---------- Listar tarjetas de AMIGOS (requiere token) ----------
   Devuelve tarjetas con visibilidad 'amigos' de usuarios
   con amistad aceptada con el usuario autenticado.
*/
export async function amigos(req, res) {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 12, 1, 50);
    const uid = req.usuario.id;

    // IDs de amigos (estado aceptada)
    const relaciones = await Amigo.find({
      estado: 'aceptada',
      $or: [{ solicitante: uid }, { receptor: uid }],
    })
      .select({ solicitante: 1, receptor: 1 })
      .lean();

    const friendIds = new Set();
    for (const r of relaciones) {
      const a = String(r.solicitante);
      const b = String(r.receptor);
      if (a !== uid) friendIds.add(a);
      if (b !== uid) friendIds.add(b);
    }

    if (friendIds.size === 0) {
      return res.json({
        ok: true,
        items: [],
        meta: { page, limit, total: 0, pages: 0 },
      });
    }

    const filtro = {
      visibilidad: 'amigos',
      usuario: { $in: Array.from(friendIds) },
      eliminado: { $ne: true },
    };

    const [items, total] = await Promise.all([
      Tarjeta.find(filtro)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        // Incluye datos básicos del usuario creador en tarjetas de amigos
        .populate({
          path: 'usuario',
          select: 'nombre _id',
        })
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
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error listando amigos', error: e.message });
  }
}

// ---------- Detalle público (sin token) ----------
export async function publicaUna(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID inválido' });
    }

    const doc = await Tarjeta.findById(id)
      // Incluye datos básicos del usuario en el detalle público
      .populate({
        path: 'usuario',
        select: 'nombre _id',
      })
      .lean();

    // Por privacidad, se responde 404 si no existe o no es pública
    if (!doc || doc.visibilidad !== 'publico') {
      return res.status(404).json({ ok: false, mensaje: 'No encontrada' });
    }

    return res.json({ ok: true, tarjeta: serializeTarjeta(doc) });
  } catch (e) {
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error obteniendo tarjeta', error: e.message });
  }
}

// ---------- Obtener una (privada: exige token) ----------
export async function una(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ ok: false, mensaje: 'ID inválido' });

    const doc = await Tarjeta.findById(id)
      // Incluye datos básicos del usuario en el detalle privado
      .populate({
        path: 'usuario',
        select: 'nombre _id',
      });

    if (!doc) return res.status(404).json({ ok: false, mensaje: 'No encontrada' });

    const esMia = req.usuario && String(doc.usuario._id || doc.usuario) === req.usuario.id;

    if (!esMia) {
      // Pública → OK
      if (doc.visibilidad === 'publico') {
        return res.json({ ok: true, tarjeta: serializeTarjeta(doc) });
      }
      // Amigos → comprobar relación
      if (doc.visibilidad === 'amigos') {
        const okAmigo = await sonAmigos(req.usuario.id, doc.usuario._id || doc.usuario);
        if (!okAmigo) return res.status(403).json({ ok: false, mensaje: 'Sin permiso' });
      } else {
        // Privado y no es del usuario
        return res.status(403).json({ ok: false, mensaje: 'Sin permiso' });
      }
    }

    return res.json({ ok: true, tarjeta: serializeTarjeta(doc) });
  } catch (e) {
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error obteniendo tarjeta', error: e.message });
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
      return res
        .status(422)
        .json({ ok: false, mensaje: 'Datos inválidos', errores: mapValidationError(e) });
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
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error eliminando', error: e.message });
  }
}

// ---------- Subir 1 imagen (multipart/form-data, campo "file") ----------
// Optimiza la imagen con sharp (tamaño y peso) antes de exponerla.
export async function subirImagen(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: 'No se recibió archivo' });
    }

    // Ruta al fichero original guardado por multer
    const originalPath = req.file.path || path.join(UPLOAD_DIR, req.file.filename);

    // Base del nombre (sin extensión)
    const originalName = req.file.filename || `img-${Date.now()}`;
    const baseName = originalName.replace(/\.[^.]+$/, '');

    // Nombres de salida optimizados
    const optimizedName = `${baseName}-opt.jpg`;
    const thumbName = `${baseName}-thumb.jpg`;

    const optimizedPath = path.join(UPLOAD_DIR, optimizedName);
    const thumbPath = path.join(UPLOAD_DIR, thumbName);

    // Imagen principal (máx 1600x1600)
    await sharp(originalPath)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(optimizedPath);

    // Miniatura para listados (400x300)
    await sharp(originalPath)
      .rotate()
      .resize({
        width: 400,
        height: 300,
        fit: 'cover',
      })
      .jpeg({ quality: 70, mozjpeg: true })
      .toFile(thumbPath);

    // Opcional: borrar el original para ahorrar espacio
    try {
      await fs.unlink(originalPath);
    } catch {
      // Si falla el borrado no se interrumpe la respuesta
    }

    // Construir URLs públicas
    const base = baseUploads(req); // ej: https://tu-dominio/uploads
    const url = `${base}/${optimizedName}`;
    const publicUrl = `/api/uploads/${optimizedName}`;
    const thumbUrl = `/api/uploads/${thumbName}`;

    // Tamaño del fichero optimizado (informativo)
    let size = null;
    try {
      const stats = await fs.stat(optimizedPath);
      size = stats.size;
    } catch {
      size = null;
    }

    return res.status(201).json({
      ok: true,
      mensaje: 'Imagen subida y optimizada',
      url,          // URL absoluta basada en host
      publicUrl,    // URL relativa que usa el front
      thumbUrl,     // miniatura por si se quiere usar
      filename: optimizedName,
      mimetype: 'image/jpeg',
      size,
    });
  } catch (e) {
    console.error('Error en subirImagen:', e);
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error subiendo imagen', error: e.message });
  }
}
