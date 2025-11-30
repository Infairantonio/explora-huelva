// backend/src/rutas/tarjetas.ruta.js
// ————————————————————————————————————————————————————
// Rutas para tarjetas (lugares, experiencias y rutas).
// Soporta:
//  - Listado público y detalle público.
//  - Listado privado del usuario.
//  - Listado de tarjetas de amigos.
//  - Crear, actualizar y eliminar tarjetas.
//  - Subida de imágenes y vídeo opcional.
// ————————————————————————————————————————————————————

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import autenticacion from '../middleware/autenticacion.js';
import upload from '../middleware/subidas.js';
import * as ctrl from '../controladores/tarjetas.controlador.js';
import { ETIQUETAS_PERMITIDAS, VISIBILIDADES_PERMITIDAS } from '../modelos/tarjeta.modelo.js';

const router = Router();

// ——— helper de validación genérico ———
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
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return s.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
};

// Acepta http/https o rutas relativas tipo /uploads/...
const urlOk = (s) => typeof s === 'string' && /^(https?:\/\/|\/)/i.test(s);

// ——— validación de ubicación (lat/lng opcionales, pero siempre en pareja) ———
const reglasLatLng = [
  body('lat')
    .optional({ checkFalsy: true })
    .toFloat()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida')
    .custom((v, { req }) => {
      const hasLat = v !== undefined && v !== '' && v !== null;
      const hasLng = req.body?.lng !== undefined && req.body.lng !== '' && req.body.lng !== null;
      if (hasLat && !hasLng) throw new Error('Si envías lat debes enviar también lng');
      return true;
    }),
  body('lng')
    .optional({ checkFalsy: true })
    .toFloat()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida')
    .custom((v, { req }) => {
      const hasLng = v !== undefined && v !== '' && v !== null;
      const hasLat = req.body?.lat !== undefined && req.body.lat !== '' && req.body.lat !== null;
      if (hasLng && !hasLat) throw new Error('Si envías lng debes enviar también lat');
      return true;
    }),
];

// ——— reglas de validación para CREAR ———
// Se aplican después de multer para poder contar también las imágenes subidas.
const reglasCrear = [
  body('titulo')
    .isString()
    .withMessage('Título inválido')
    .trim()
    .isLength({ min: 1, max: 120 })
    .withMessage('El título es obligatorio y máx. 120 caracteres'),
  body('descripcion')
    .isString()
    .withMessage('Descripción inválida')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('La descripción es obligatoria y máx. 1000 caracteres'),
  body('visibilidad')
    .isIn(VISIBILIDADES_PERMITIDAS)
    .withMessage('Visibilidad inválida'),
  body('videoUrl')
    .optional({ checkFalsy: true })
    .custom((v) => !v || urlOk(v))
    .withMessage('URL de vídeo no válida'),
  body('etiquetas').custom((value) => {
    const arr = toArray(value);
    if (arr.length < 1) throw new Error('Selecciona al menos una etiqueta');
    const invalid = arr.filter(
      (t) => !ETIQUIETAS_PERMITIDAS.includes(String(t).toLowerCase())
    );
    if (invalid.length) throw new Error('Alguna etiqueta no es válida');
    return true;
  }),
  body('imagenes').custom((value, { req }) => {
    // Pueden venir como URLs o como ficheros
    const urls = toArray(value).filter(Boolean);
    const files = Array.isArray(req.files?.imagenes) ? req.files.imagenes : [];
    const legacy =
      typeof req.body?.imagenUrl === 'string' && req.body.imagenUrl.trim();

    const total = urls.length + files.length + (legacy ? 1 : 0);
    if (total < 1) throw new Error('Añade al menos una imagen');

    const bad = urls.filter((u) => !urlOk(u));
    if (bad.length) throw new Error('Alguna imagen no es una URL válida');
    return true;
  }),
  ...reglasLatLng,
];

// ===== PÚBLICAS (sin token) =====

// Listado público (todas las tarjetas con visibilidad "publico")
router.get('/', ctrl.publicas);           // alias /api/tarjetas
router.get('/publicas', ctrl.publicas);

// Detalle público por ID (solo si la tarjeta es "publico")
router.get('/publicas/:id', ctrl.publicaUna);

// ===== SUBIDA RÁPIDA DE 1 IMAGEN (requiere login) =====
router.post('/subir-imagen', autenticacion, upload.single('file'), ctrl.subirImagen);

// ===== TARJETAS PRIVADAS (requiere login) =====
router.get('/mias', autenticacion, ctrl.mias);

// ===== TARJETAS DE AMIGOS (requiere login) =====
router.get('/amigos', autenticacion, ctrl.amigos);

// Crear tarjeta (JSON o multipart con imágenes/vídeo)
router.post(
  '/',
  autenticacion,
  upload.fields([
    { name: 'imagenes', maxCount: 10 },
    { name: 'video', maxCount: 1 },
  ]),
  reglasCrear,
  validar,
  ctrl.crear
);

// Detalle privado (respeta visibilidad: publico / amigos / privado)
router.get('/:id', autenticacion, ctrl.una);

// Actualizar tarjeta (solo propietario; actualización parcial)
router.put(
  '/:id',
  autenticacion,
  upload.fields([
    { name: 'imagenes', maxCount: 10 },
    { name: 'video', maxCount: 1 },
  ]),
  reglasLatLng,
  validar,
  ctrl.actualizar
);

// Eliminar tarjeta (solo propietario)
router.delete('/:id', autenticacion, ctrl.eliminar);

export default router;
