// backend/src/rutas/comentarios.ruta.js
// ————————————————————————————————————————————————————
// Rutas de comentarios.
// - GET    /api/tarjetas/:id/comentarios
//      → listar (público si la tarjeta es “publico”)
//        * Para “amigos” o “privado”: requiere usuario con acceso
// - POST   /api/tarjetas/:id/comentarios
//      → crear (requiere auth + acceso permitido)
// - DELETE /api/comentarios/:id
//      → eliminar (solo autor o dueño de la tarjeta)
// ————————————————————————————————————————————————————

import { Router } from 'express';
import autenticacion, {
  autenticacionOpcional,
} from '../middleware/autenticacion.js';
import * as comentarios from '../controladores/comentarios.controlador.js';

const router = Router();

/**
 * GET /api/tarjetas/:id/comentarios
 * 
 * - Tarjetas "publico": cualquiera puede listar comentarios.
 *   * Si el usuario envía Authorization, autenticacionOpcional
 *     añadirá req.usuario para que el backend pueda aplicar reglas.
 *
 * - Tarjetas "amigos" o "privado":
 *   * El controlador valida si req.usuario tiene permiso de acceso.
 */
router.get(
  '/tarjetas/:id/comentarios',
  autenticacionOpcional, // autenticación no obligatoria
  comentarios.listar
);

/**
 * POST /api/tarjetas/:id/comentarios
 * Crear comentario → requiere usuario autenticado
 */
router.post(
  '/tarjetas/:id/comentarios',
  autenticacion, // obligatoría
  comentarios.crear
);

/**
 * DELETE /api/comentarios/:id
 * Eliminar comentario → solo autor o dueño de la tarjeta
 */
router.delete(
  '/comentarios/:id',
  autenticacion, // obligatoria
  comentarios.eliminar
);

export default router;
