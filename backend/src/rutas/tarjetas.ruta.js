// backend/src/rutas/tarjetas.ruta.js
// ————————————————————————————————————————————————————
// Rutas para Tarjetas: públicas, privadas y subida de media.
// Valida creación: título/descripcion/visibilidad/≥1 etiqueta/≥1 imagen.
// Vídeo opcional. Lat/Lng opcionales (si envías uno, envía el otro).
// Incluye detalle público por ID: GET /api/tarjetas/publicas/:id
// Añadido: listado de amigos GET /api/tarjetas/amigos
// ————————————————————————————————————————————————————

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import autenticacion from '../middleware/autenticacion.js';
import upload from '../middleware/subidas.js';
import * as ctrl from '../controladores/tarjetas.controlador.js';
import { ETIQUETAS_PERMITIDAS, VISIBILIDADES_PERMITIDAS } from '../modelos/tarjeta.modelo.js';

const router = Router();

// ——— util validar ———
const validar = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    return res.status(422).json({ ok: false, errores: errs.array() });
  }
  next();
};

// ——— helpers de parsing ———
const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    // Soporta JSON ["a","b"] o CSV "a,b"
    try { const parsed = JSON.parse(s); if (Array.isArray(parsed)) return parsed; } catch {}
    return s.split(',').map(x => x.trim()).filter(Boolean);
  }
  return [];
};

// Acepta http/https o rutas relativas tipo /uploads/...
const urlOk = (s) => typeof s === 'string' && /^(https?:\/\/|\/)/i.test(s);

// ——— validación de ubicación (lat/lng opcionales, en rango, en pareja) ———
const reglasLatLng = [
  body('lat')
    .optional({ checkFalsy: true })
    .toFloat()
    .isFloat({ min: -90, max: 90 }).withMessage('Latitud inválida')
    .custom((v, { req }) => {
      const hasLat = v !== undefined && v !== '' && v !== null;
      const hasLng = req.body?.lng !== undefined && req.body.lng !== '' && req.body.lng !== null;
      if (hasLat && !hasLng) throw new Error('Si envías lat debes enviar también lng');
      return true;
    }),
  body('lng')
    .optional({ checkFalsy: true })
    .toFloat()
    .isFloat({ min: -180, max: 180 }).withMessage('Longitud inválida')
    .custom((v, { req }) => {
      const hasLng = v !== undefined && v !== '' && v !== null;
      const hasLat = req.body?.lat !== undefined && req.body.lat !== '' && req.body.lat !== null;
      if (hasLng && !hasLat) throw new Error('Si envías lng debes enviar también lat');
      return true;
    }),
];

// ——— reglas de validación para CREAR ———
// Nota: Colocamos las reglas **después** de multer `upload.fields` para
// poder contar también los ficheros subidos en req.files.
const reglasCrear = [
  body('titulo')
    .isString().withMessage('Título inválido')
    .trim()
    .isLength({ min: 1, max: 120 }).withMessage('El título es obligatorio y máx. 120 caracteres'),
  body('descripcion')
    .isString().withMessage('Descripción inválida')
    .trim()
    .isLength({ min: 1, max: 1000 }).withMessage('La descripción es obligatoria y máx. 1000 caracteres'),
  body('visibilidad')
    // acepta 'publico' | 'privado' | 'amigos'
    .isIn(VISIBILIDADES_PERMITIDAS).withMessage('Visibilidad inválida'),
  body('videoUrl')
    .optional({ checkFalsy: true })
    .custom(v => !v || urlOk(v)).withMessage('URL de vídeo no válida'),
  body('etiquetas')
    .custom((value, { req }) => {
      const arr = toArray(value);
      if (arr.length < 1) throw new Error('Selecciona al menos una etiqueta');
      const invalid = arr.filter(t => !ETIQUETAS_PERMITIDAS.includes(String(t).toLowerCase()));
      if (invalid.length) throw new Error('Alguna etiqueta no es válida');
      return true;
    }),
  body('imagenes')
    .custom((value, { req }) => {
      // imágenes pueden venir como URLs en body o como ficheros en req.files.imagenes
      const urls = toArray(value).filter(Boolean);
      const files = Array.isArray(req.files?.imagenes) ? req.files.imagenes : [];
      const legacy = typeof req.body?.imagenUrl === 'string' && req.body.imagenUrl.trim();

      const total = urls.length + files.length + (legacy ? 1 : 0);
      if (total < 1) throw new Error('Añade al menos una imagen');

      // Validar URLs (las subidas por archivo no necesitan URL)
      const bad = urls.filter(u => !urlOk(u));
      if (bad.length) throw new Error('Alguna imagen no es una URL válida');
      return true;
    }),
  ...reglasLatLng,
];

// ===== PÚBLICAS (sin token) =====
router.get('/', ctrl.publicas);           // alias listado público en /api/tarjetas
router.get('/publicas', ctrl.publicas);
// Detalle público por ID (solo tarjetas con visibilidad 'publico')
router.get('/publicas/:id', ctrl.publicaUna);

// ===== SUBIDA RÁPIDA DE 1 IMAGEN (privada) =====
router.post('/subir-imagen', autenticacion, upload.single('file'), ctrl.subirImagen);

// ===== PRIVADAS (requieren token) =====
router.get('/mias', autenticacion, ctrl.mias);

// ===== AMIGOS (requiere token) =====
router.get('/amigos', autenticacion, ctrl.amigos);

// Crear tarjeta (valida requeridos). Acepta JSON o multipart.
// multipart: campos "imagenes" (hasta 10) y "video" (hasta 1) gestionados por el middleware de subidas.
router.post(
  '/',
  autenticacion,
  upload.fields([
    { name: 'imagenes', maxCount: 10 },
    { name: 'video',    maxCount: 1  },
  ]),
  reglasCrear,
  validar,
  ctrl.crear
);

// Obtener 1 tarjeta por ID (privado: exige token; respeta visibilidad público/amigos/privado)
router.get('/:id', autenticacion, ctrl.una);

// Actualizar tarjeta (solo propietario). Acepta mismas medias que crear.
// Aquí no forzamos los requeridos por ruta porque la actualización puede ser parcial;
// pero sí validamos lat/lng si vienen.
router.put(
  '/:id',
  autenticacion,
  upload.fields([
    { name: 'imagenes', maxCount: 10 },
    { name: 'video',    maxCount: 1  },
  ]),
  reglasLatLng,
  validar,
  ctrl.actualizar
);

// Eliminar
router.delete('/:id', autenticacion, ctrl.eliminar);

export default router;
