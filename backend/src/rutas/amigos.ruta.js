// ————————————————————————————————————————————————————
// Rutas REST para "amigos"
// Prefijo: /api/amigos
// ————————————————————————————————————————————————————
import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import autenticacion from '../middleware/autenticacion.js';
import * as ctrl from '../controladores/amigos.controlador.js';

const router = Router();

const validar = (req, res, next) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(422).json({ ok: false, errores: errs.array() });
  next();
};

// Buscar usuarios (excluye a ti y relaciones ya existentes)
router.get(
  '/buscar-usuarios',
  autenticacion,
  [
    query('q').optional().isString().isLength({ max: 80 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validar,
  ],
  ctrl.buscarUsuarios
);

// Listar mis amigos
router.get('/', autenticacion, ctrl.listarAmigos);

// Listar solicitudes pendientes (recibidas y enviadas)
router.get('/pendientes', autenticacion, ctrl.listarPendientes);

// Enviar solicitud
router.post(
  '/solicitar',
  autenticacion,
  [body('usuarioId').isString().trim().isLength({ min: 1 }).withMessage('usuarioId requerido')],
  validar,
  ctrl.enviarSolicitud
);

// Cancelar mi solicitud (la que YO envié y aún está pendiente)
router.post(
  '/cancelar',
  autenticacion,
  [body('usuarioId').isString().trim().isLength({ min: 1 })],
  validar,
  ctrl.cancelarSolicitud
);

// Aceptar solicitud recibida (la que ELLOS me enviaron)
router.post(
  '/aceptar',
  autenticacion,
  [body('usuarioId').isString().trim().isLength({ min: 1 })],
  validar,
  ctrl.aceptarSolicitud
);

// Rechazar solicitud recibida
router.post(
  '/rechazar',
  autenticacion,
  [body('usuarioId').isString().trim().isLength({ min: 1 })],
  validar,
  ctrl.rechazarSolicitud
);

// Eliminar amistad (si ya estaba aceptada)
router.delete(
  '/:usuarioId',
  autenticacion,
  [param('usuarioId').isString().trim().isLength({ min: 1 })],
  validar,
  ctrl.eliminarAmigo
);

export default router;
