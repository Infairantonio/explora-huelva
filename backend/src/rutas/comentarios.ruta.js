// backend/src/rutas/comentarios.ruta.js
// ————————————————————————————————————————————————————
// Rutas de comentarios (solo en tarjetas públicas).
// - GET    /api/tarjetas/:id/comentarios   -> listar (público)
// - POST   /api/tarjetas/:id/comentarios   -> crear (requiere auth)
// - DELETE /api/comentarios/:id            -> borrar (autor o dueño)
// ————————————————————————————————————————————————————

import { Router } from 'express';
import autenticacion from '../middleware/autenticacion.js';
import * as comentarios from '../controladores/comentarios.controlador.js';

const router = Router();

// Listar comentarios de una tarjeta pública (paginado)
router.get('/tarjetas/:id/comentarios', comentarios.listar);

// Crear comentario en tarjeta pública (usuario autenticado)
router.post('/tarjetas/:id/comentarios', autenticacion, comentarios.crear);

// Eliminar comentario (autor del comentario o dueño de la tarjeta)
router.delete('/comentarios/:id', autenticacion, comentarios.eliminar);

export default router;
