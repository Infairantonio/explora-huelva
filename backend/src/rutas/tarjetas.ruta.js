// backend/src/rutas/tarjetas.ruta.js
// ————————————————————————————————————————————————————
// Rutas para Tarjetas: públicas, privadas y subida de media.
// Comentado y con mejoras suaves (ej. recordatorios y validación ligera).
// Mantiene el contrato actual de controladores y middlewares.
// ————————————————————————————————————————————————————

import { Router } from 'express';
import autenticacion from '../middleware/autenticacion.js';
import upload from '../middleware/subidas.js';
import * as ctrl from '../controladores/tarjetas.controlador.js';

const router = Router();

// ===== PÚBLICA (sin token) =====
// Listado paginado de tarjetas visibles públicamente.
// Filtros soportados en controlador: ?page, ?limit, ?q (texto), ?etiqueta
router.get('/publicas', ctrl.publicas);

// ===== SUBIDA RÁPIDA DE 1 IMAGEN (privada) =====
// Enviar como multipart/form-data con campo "file".
// Devuelve { ok, url, filename, mimetype, size }.
router.post('/subir-imagen', autenticacion, upload.single('file'), ctrl.subirImagen);

// ===== PRIVADAS (requieren token) =====
// Listado de tarjetas del usuario autenticado (paginado)
router.get('/mias', autenticacion, ctrl.mias);

// Crear tarjeta con posible media:
//  - imágenes en campo "imagenes" (hasta 10, según middleware/subidas)
//  - vídeo en campo "video" (hasta 1)
// Nota: el controlador combina imágenes subidas + URLs del body para compatibilidad
router.post(
  '/',
  autenticacion,
  upload.fields([
    { name: 'imagenes', maxCount: 10 },
    { name: 'video',    maxCount: 1  },
  ]),
  ctrl.crear
);

// Obtener 1 tarjeta por ID (si no es mía y es privada → 403)
router.get('/:id', autenticacion, ctrl.una);

// Actualizar parcial (solo propietario). Acepta mismas medias que crear.
router.put(
  '/:id',
  autenticacion,
  upload.fields([
    { name: 'imagenes', maxCount: 10 },
    { name: 'video',    maxCount: 1  },
  ]),
  ctrl.actualizar
);

// Eliminar (solo propietario)
router.delete('/:id', autenticacion, ctrl.eliminar);

export default router;
