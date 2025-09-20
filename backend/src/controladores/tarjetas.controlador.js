// backend/src/controladores/tarjetas.controlador.js
// ————————————————————————————————————————————————————————
// Controlador de "Tarjetas" (lugares/experiencias/rutas) con CRUD,
// subida de media y listados paginados. Comentado y con mejoras ligeras
// que no rompen el contrato actual de respuestas.
// ————————————————————————————————————————————————————————

import { validationResult } from 'express-validator'; // recoge errores de validación (si usas middlewares)
import mongoose from 'mongoose'; // para validar ObjectId y consultas
import Tarjeta from '../modelos/tarjeta.modelo.js'; // modelo Mongoose

// ---------- helpers ----------
// Atajo para validar IDs de Mongo
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Etiquetas permitidas (recorta la taxonomía a un set controlado)
const ETIQUETAS_PERMITIDAS = ['lugares', 'experiencias', 'rutas'];

// utilidades funcionales pequeñas
const uniq = (arr) => [...new Set(arr)];
const toArray = (v) => (Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]));

// Normaliza visibilidad a dos valores canónicos
function normalizarVisibilidad(v) {
  return v === 'publico' ? 'publico' : 'privado';
}

// Normaliza y filtra etiquetas a la lista permitida
function normalizarEtiquetas(v) {
  const lista = toArray(v)
    .map((x) => String(x).trim().toLowerCase())
    .filter(Boolean)
    .filter((x) => ETIQUETAS_PERMITIDAS.includes(x));
  return uniq(lista);
}

// Construye la URL pública base para /uploads
function baseUploads(req) {
  const envBase = process.env.PUBLIC_UPLOAD_URL;
  if (envBase) return envBase.replace(/\/+$/, ''); // recorta barras finales
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host'); // p.ej. localhost:5174
  return `${proto}://${host}/uploads`;
}

// A partir de req.files (multer.fields), genera URLs públicas de imágenes y video
function extraerMediaDesdeFiles(req) {
  const base = baseUploads(req);
  const imagenesSubidas = (req.files?.imagenes || []).map((f) => `${base}/${f.filename}`);
  const videoSubido = (req.files?.video || [])[0];
  const videoUrlSubido = videoSubido ? `${base}/${videoSubido.filename}` : '';
  return { imagenesSubidas, videoUrlSubido };
}

// Normaliza imágenes combinando subidas y (por compatibilidad) URLs en body
function normalizarImagenes({ imagenesFiles, imagenesBody, imagenUrlBody }) {
  const lista = [
    ...toArray(imagenesFiles).map((x) => String(x).trim()).filter(Boolean),
    ...toArray(imagenesBody).map((x) => String(x).trim()).filter(Boolean),
    ...toArray(imagenUrlBody).map((x) => String(x).trim()).filter(Boolean), // legado
  ];
  return uniq(lista).slice(0, 10); // límite de seguridad (máx. 10 URLs)
}

// Pequeña utilidad para paginación segura
const parsePage = (v, def = 1) => Math.max(parseInt(String(v || def), 10) || def, 1);
const parseLimit = (v, def = 12, min = 1, max = 50) => {
  const n = parseInt(String(v || def), 10) || def;
  return Math.min(Math.max(n, min), max);
};

// ---------- Crear ----------
export async function crear(req, res) {
  try {
    // Si has registrado validaciones con express-validator, recoge errores
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ ok: false, errores: errores.array() });
    }

    // Extrae campos con defaults suaves
    const {
      titulo,
      descripcion = '',
      imagenes = [],
      imagenUrl = '',
      videoUrl = '',
      visibilidad = 'privado',
      etiquetas = [],
    } = req.body || {};

    // Extrae media recién subida por multer
    const { imagenesSubidas, videoUrlSubido } = extraerMediaDesdeFiles(req);

    // Crea documento normalizando campos
    const doc = await Tarjeta.create({
      usuario: req.usuario.id, // asume middleware auth que pobló req.usuario
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
    });

    return res.status(201).json({ ok: true, tarjeta: doc });
  } catch (e) {
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
        .lean(),
      Tarjeta.countDocuments(filtro),
    ]);

    return res.json({
      ok: true,
      items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error listando tarjetas', error: e.message });
  }
}

// ---------- Listar públicas ----------
export async function publicas(req, res) {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 12, 1, 50);

    const filtro = { visibilidad: 'publico' };

    // Búsqueda de texto si existe índice de texto en el modelo
    if (req.query.q) filtro.$text = { $search: String(req.query.q) };

    // Filtro por etiqueta validada
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

    return res.json({
      ok: true,
      items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error listando públicas', error: e.message });
  }
}

// ---------- Obtener una ----------
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

    return res.json({ ok: true, tarjeta: doc });
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

  // Extrae body con compat de campos opcionales/legados
  const body = req.body || {};
  const {
    titulo,
    descripcion,
    imagenes,     // opcional (compat body)
    imagenUrl,    // opcional (compat legado)
    videoUrl,     // opcional (compat body)
    visibilidad,
    etiquetas,
  } = body;

  // Extrae posibles subidas de media (imagenes/video)
  const { imagenesSubidas, videoUrlSubido } = extraerMediaDesdeFiles(req);

  // Construye update solo con los campos presentes (parches idempotentes)
  const update = {};
  if (titulo !== undefined) update.titulo = String(titulo).trim();
  if (descripcion !== undefined) update.descripcion = String(descripcion).trim();

  // Solo tocamos imágenes si llegan nuevas o si el body trae cambios explícitos
  if (imagenesSubidas.length || imagenes !== undefined || imagenUrl !== undefined) {
    update.imagenes = normalizarImagenes({
      imagenesFiles: imagenesSubidas,
      imagenesBody: imagenes,
      imagenUrlBody: imagenUrl,
    });
  }

  // Video: prioriza archivo subido; si no, usa texto del body (si viene)
  if (videoUrlSubido || videoUrl !== undefined) {
    update.videoUrl = String(videoUrlSubido || videoUrl || '').trim();
  }

  if (visibilidad !== undefined) update.visibilidad = normalizarVisibilidad(visibilidad);
  if (etiquetas !== undefined) update.etiquetas = normalizarEtiquetas(etiquetas);

  try {
    const doc = await Tarjeta.findOneAndUpdate(
      { _id: id, usuario: req.usuario.id }, // asegura propiedad
      update,
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ ok: false, mensaje: 'Tarjeta no encontrada' });
    return res.json({ ok: true, tarjeta: doc });
  } catch (e) {
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
export async function subirImagen(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, mensaje: 'No se recibió archivo' });
    }
    const base = baseUploads(req);
    const url = `${base}/${req.file.filename}`;

    return res.status(201).json({
      ok: true,
      mensaje: 'Imagen subida',
      url,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (e) {
    return res
      .status(500)
      .json({ ok: false, mensaje: 'Error subiendo imagen', error: e.message });
  }
}
