// backend/src/rutas/admin.tarjetas.ruta.js
// ——————————————————————————————————————————————————————————
// Rutas de administración de TARJETAS (solo rol "admin").
// Permite:
//   - Listar con filtros y paginación
//   - Ver detalle por id
//   - Marcar como eliminada (soft delete)
//   - Restaurar una tarjeta eliminada
// Requiere: autenticacion + requiereRol('admin').
// ——————————————————————————————————————————————————————————

import { Router } from 'express';
import Tarjeta from '../modelos/tarjeta.modelo.js';
import autenticacion from '../middleware/autenticacion.js';
import requiereRol from '../middleware/requiereRol.js';
// Alternativa si quieres: import requiereAdmin from '../middleware/requiereAdmin.js';

const router = Router();

// Helper simple para enteros
const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};

// GET /admin/tarjetas
// Filtros (query):
//   q        → texto (título/descripcion, usa $text si hay índice)
//   vis      → 'publico' | 'privado' (opcional)
//   et       → etiqueta (ej. 'lugares') (opcional)
//   incDel   → '1' incluye eliminadas; por defecto solo no eliminadas
//   desde    → fecha ISO (createdAt >=)
//   hasta    → fecha ISO (createdAt <=)
//   page     → nº página (>=1)
//   pageSize → tamaño de página (por defecto 25, máx. 100)
//   orden    → 'creadoDesc' (defecto) | 'creadoAsc' | 'actualizadoDesc' | 'actualizadoAsc'
router.get(
  '/admin/tarjetas',
  autenticacion,
  requiereRol('admin'),
  async (req, res) => {
    try {
      const {
        q = '',
        vis = '',
        et = '',
        incDel = '0',
        desde = '',
        hasta = '',
        page = '1',
        pageSize = '25',
        orden = 'creadoDesc',
      } = req.query;

      const filtro = {};

      // Por defecto se excluyen eliminadas
      if (incDel !== '1') {
        filtro.eliminado = false;
      }

      // Visibilidad
      if (vis === 'publico' || vis === 'privado') {
        filtro.visibilidad = vis;
      }

      // Etiqueta
      if (et) {
        filtro.etiquetas = et;
      }

      // Rango de fechas (createdAt)
      if (desde || hasta) {
        filtro.createdAt = {};
        if (desde && !Number.isNaN(Date.parse(desde))) {
          filtro.createdAt.$gte = new Date(desde);
        }
        if (hasta && !Number.isNaN(Date.parse(hasta))) {
          filtro.createdAt.$lte = new Date(hasta);
        }
        if (Object.keys(filtro.createdAt).length === 0) {
          delete filtro.createdAt;
        }
      }

      // Búsqueda de texto
      if (q && q.trim().length > 0) {
        filtro.$or = [
          { $text: { $search: q } },
          { titulo: { $regex: q, $options: 'i' } },
          { descripcion: { $regex: q, $options: 'i' } },
        ];
      }

      // Paginación
      const pageNum = Math.max(1, toInt(page, 1));
      const size = Math.min(100, toInt(pageSize, 25));
      const skip = (pageNum - 1) * size;

      // Orden
      const mapOrden = {
        creadoDesc: { createdAt: -1 },
        creadoAsc: { createdAt: 1 },
        actualizadoDesc: { updatedAt: -1 },
        actualizadoAsc: { updatedAt: 1 },
      };
      const sort = mapOrden[orden] || mapOrden.creadoDesc;

      // Consulta principal
      const [total, items] = await Promise.all([
        Tarjeta.countDocuments(filtro),
        Tarjeta.find(filtro)
          .sort(sort)
          .skip(skip)
          .limit(size)
          .select(
            'titulo visibilidad etiquetas eliminado createdAt updatedAt usuario'
          )
          .populate('usuario', 'nombre email')
          .lean(),
      ]);

      return res.json({
        ok: true,
        total,
        page: pageNum,
        pageSize: size,
        items,
      });
    } catch (err) {
      console.error('GET /admin/tarjetas error:', err);
      return res
        .status(500)
        .json({ ok: false, mensaje: 'Error listando tarjetas' });
    }
  }
);

// GET /admin/tarjetas/:id  (detalle)
router.get(
  '/admin/tarjetas/:id',
  autenticacion,
  requiereRol('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await Tarjeta.findById(id)
        .populate('usuario', 'nombre email')
        .lean();

      if (!doc) {
        return res
          .status(404)
          .json({ ok: false, mensaje: 'Tarjeta no encontrada' });
      }

      return res.json({ ok: true, item: doc });
    } catch (err) {
      console.error('GET /admin/tarjetas/:id error:', err);
      return res
        .status(500)
        .json({ ok: false, mensaje: 'Error obteniendo detalle' });
    }
  }
);

// DELETE /admin/tarjetas/:id  (soft delete)
router.delete(
  '/admin/tarjetas/:id',
  autenticacion,
  requiereRol('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const motivo = (req.body?.motivo || '').toString().slice(0, 300);

      const actualizado = await Tarjeta.findByIdAndUpdate(
        id,
        {
          $set: {
            eliminado: true,
            eliminadoPor: req.usuario.id, // admin que elimina
            eliminadoEn: new Date(),
            motivoEliminacion: motivo,
          },
        },
        { new: true }
      )
        .populate('usuario', 'nombre email')
        .lean();

      if (!actualizado) {
        return res
          .status(404)
          .json({ ok: false, mensaje: 'Tarjeta no encontrada' });
      }

      return res.json({ ok: true, item: actualizado });
    } catch (err) {
      console.error('DELETE /admin/tarjetas/:id error:', err);
      return res
        .status(500)
        .json({ ok: false, mensaje: 'Error al eliminar tarjeta' });
    }
  }
);

// POST /admin/tarjetas/:id/restaurar  (quitar soft delete)
router.post(
  '/admin/tarjetas/:id/restaurar',
  autenticacion,
  requiereRol('admin'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const restaurada = await Tarjeta.findByIdAndUpdate(
        id,
        {
          $set: {
            eliminado: false,
            motivoEliminacion: '',
          },
          $unset: {
            eliminadoPor: 1,
            eliminadoEn: 1,
          },
        },
        { new: true }
      )
        .populate('usuario', 'nombre email')
        .lean();

      if (!restaurada) {
        return res
          .status(404)
          .json({ ok: false, mensaje: 'Tarjeta no encontrada' });
      }

      return res.json({ ok: true, item: restaurada });
    } catch (err) {
      console.error('POST /admin/tarjetas/:id/restaurar error:', err);
      return res
        .status(500)
        .json({ ok: false, mensaje: 'Error al restaurar tarjeta' });
    }
  }
);

export default router;
