// backend/src/rutas/comentarios.ruta.js
// ————————————————————————————————————————————————————
// Rutas de comentarios.
// - GET    /api/tarjetas/:id/comentarios
//      -> listar
//         * público para tarjetas "publico"
//         * requiere usuario con acceso para "amigos"/"privado"
// - POST   /api/tarjetas/:id/comentarios
//      -> crear (requiere auth)
// - DELETE /api/comentarios/:id
//      -> borrar (autor o dueño de la tarjeta)
// ————————————————————————————————————————————————————

import { Router } from 'express';
// 👇 mantenemos la auth normal y añadimos la opcional
import autenticacion, {
  autenticacionOpcional,
} from '../middleware/autenticacion.js';
import * as comentarios from '../controladores/comentarios.controlador.js';

const router = Router();

/**
 * Listar comentarios de una tarjeta.
 *
 * - Para tarjetas "publico": cualquiera puede verlos.
 *   Si viene token en Authorization, autenticacionOpcional
 *   rellenará req.usuario, y el backend sabrá quién eres.
 *
 * - Para tarjetas "amigos" o "privado":
 *   el controlador comprobará si req.usuario tiene acceso.
 */
router.get(
  '/tarjetas/:id/comentarios',
  autenticacionOpcional,    // ⬅️ clave: auth opcional
  comentarios.listar
);

// Crear comentario (usuario autenticado, con acceso a la tarjeta)
router.post(
  '/tarjetas/:id/comentarios',
  autenticacion,            // auth obligatoria
  comentarios.crear
);

// Eliminar comentario (autor del comentario o dueño de la tarjeta)
router.delete(
  '/comentarios/:id',
  autenticacion,            // auth obligatoria
  comentarios.eliminar
);

export default router;
