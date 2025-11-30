// backend/src/rutas/amigos.ruta.js
// ————————————————————————————————————————————————————
// Rutas REST para gestión de amigos
// Prefijo final: /api/amigos/*
// Funcionalidades:
//   - Buscar usuarios para añadir como amigos
//   - Enviar / aceptar / rechazar / cancelar solicitudes
//   - Listar amigos
//   - Eliminar amistad
// Requiere autenticación JWT
// ————————————————————————————————————————————————————

import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import autenticacion from '../middleware/autenticacion.js';
import * as ctrl from '../controladores/amigos.controlador.js';

const router = Router();

// Middleware de validación reutilizable
const validar = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ ok: false, errores: errors.array() });
  }
  next();
};

// ————————————————————————————————————————————————————
// GET /api/amigos/buscar-usuarios
// Buscar posibles usuarios para enviar amistad
// (excluye al propio usuario y relaciones ya creadas)
// ————————————————————————————————————————————————————
router.get(
  '/buscar-usuarios',
  autenticacion,
  [
    query('q').optional().isString().isLength({ max: 80 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  validar,
  ctrl.buscarUsuarios
);

// ————————————————————————————————————————————————————
// GET /api/amigos
// Lista de amigos ya aceptados
// ————————————————————————————————————————————————————
router.get('/', autenticacion, ctrl.listarAmigos);

// ————————————————————————————————————————————————————
// GET /api/amigos/pendientes
// Solicitudes enviadas y recibidas en estado "pendiente"
// ————————————————————————————————————————————————————
router.get('/pendientes', autenticacion, ctrl.listarPendientes);

// ————————————————————————————————————————————————————
// POST /api/amigos/solicitar
// Enviar solicitud a otro usuario
// ————————————————————————————————————————————————————
router.post(
  '/solicitar',
  autenticacion,
  [body('usuarioId').isString().trim().isLength({ min: 1 }).withMessage('usuarioId requerido')],
  validar,
  ctrl.enviarSolicitud
);

// ————————————————————————————————————————————————————
// POST /api/amigos/cancelar
// Cancelar una solicitud que YO he enviado (si sigue pendiente)
// ————————————————————————————————————————————————————
router.post(
  '/cancelar',
  autenticacion,
  [body('usuarioId').isString().trim().isLength({ min: 1 })],
  validar,
  ctrl.cancelarSolicitud
);

// ————————————————————————————————————————————————————
// POST /api/amigos/aceptar
// Aceptar una solicitud recibida de otro usuario
// ————————————————————————————————————————————————————
router.post(
  '/aceptar',
  autenticacion,
  [body('usuarioId').isString().trim().isLength({ min: 1 })],
  validar,
  ctrl.aceptarSolicitud
);

// ————————————————————————————————————————————————————
// POST /api/amigos/rechazar
// Rechazar solicitud recibida
// ————————————————————————————————————————————————————
router.post(
  '/rechazar',
  autenticacion,
  [body('usuarioId').isString().trim().isLength({ min: 1 })],
  validar,
  ctrl.rechazarSolicitud
);

// ————————————————————————————————————————————————————
// DELETE /api/amigos/:usuarioId
// Eliminar amistad ya aceptada
// ————————————————————————————————————————————————————
router.delete(
  '/:usuarioId',
  autenticacion,
  [param('usuarioId').isString().trim().isLength({ min: 1 })],
  validar,
  ctrl.eliminarAmigo
);

export default router;
