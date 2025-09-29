// backend/src/rutas/admin.tarjetas.ruta.js
// ——————————————————————————————————————————————————————————
// Rutas de administración para TARJETAS (solo ADMIN).
// - Listado con filtros + paginación
// - Detalle por id
// - Eliminación lógica (soft delete)
// - Restaurar tarjeta
// Requiere: autenticacion + requiereRol('admin')
// ——————————————————————————————————————————————————————————

import { Router } from 'express';
import Tarjeta from '../modelos/tarjeta.modelo.js';
import autenticacion from '../middleware/autenticacion.js';
import requiereRol from '../middleware/requiereRol.js'; // o: requiereAdmin

const router = Router();

const toInt = (v, d) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : d;
};

// GET /admin/tarjetas  (listado con filtros)
router.get('/admin/tarjetas', autenticacion, requiereRol('admin'), async (req, res) => {
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

    if (incDel !== '1') filtro.eliminado = false;
    if (vis === 'publico' || vis === 'privado') filtro.visibilidad = vis;
    if (et) filtro.etiquetas = et;

    if (desde || hasta) {
      filtro.createdAt = {};
      if (desde && !Number.isNaN(Date.parse(desde))) filtro.createdAt.$gte = new Date(desde);
      if (hasta && !Number.isNaN(Date.parse(hasta))) filtro.createdAt.$lte = new Date(hasta);
      if (!Object.keys(filtro.createdAt).length) delete filtro.createdAt;
    }

    if (q && q.trim()) {
      filtro.$or = [
        { $text: { $search: q } },
        { titulo: { $regex: q, $options: 'i' } },
        { descripcion: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, toInt(page, 1));
    const size = Math.min(100, toInt(pageSize, 25));
    const skip = (pageNum - 1) * size;

    const mapOrden = {
      creadoDesc: { createdAt: -1 },
      creadoAsc: { createdAt: 1 },
      actualizadoDesc: { updatedAt: -1 },
      actualizadoAsc: { updatedAt: 1 },
    };
    const sort = mapOrden[orden] || mapOrden.creadoDesc;

    const [total, items] = await Promise.all([
      Tarjeta.countDocuments(filtro),
      Tarjeta.find(filtro)
        .sort(sort)
        .skip(skip)
        .limit(size)
        .select('titulo visibilidad etiquetas eliminado createdAt updatedAt usuario')
        .populate('usuario', 'nombre email')
        .lean(),
    ]);

    res.json({ ok: true, total, page: pageNum, pageSize: size, items });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /admin/tarjetas error:', err);
    res.status(500).json({ ok: false, mensaje: 'Error listando tarjetas' });
  }
});

// GET /admin/tarjetas/:id (detalle)
router.get('/admin/tarjetas/:id', autenticacion, requiereRol('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Tarjeta.findById(id).populate('usuario', 'nombre email').lean();
    if (!doc) return res.status(404).json({ ok: false, mensaje: 'Tarjeta no encontrada' });
    res.json({ ok: true, item: doc });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('GET /admin/tarjetas/:id error:', err);
    res.status(500).json({ ok: false, mensaje: 'Error obteniendo detalle' });
  }
});

// DELETE /admin/tarjetas/:id (soft delete)
router.delete('/admin/tarjetas/:id', autenticacion, requiereRol('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const motivo = (req.body?.motivo || '').toString().slice(0, 300);

    const actualizado = await Tarjeta.findByIdAndUpdate(
      id,
      {
        $set: {
          eliminado: true,
          eliminadoPor: req.usuario.id,
          eliminadoEn: new Date(),
          motivoEliminacion: motivo,
        },
      },
      { new: true }
    )
      .populate('usuario', 'nombre email')
      .lean();

    if (!actualizado) {
      return res.status(404).json({ ok: false, mensaje: 'Tarjeta no encontrada' });
    }

    res.json({ ok: true, item: actualizado });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('DELETE /admin/tarjetas/:id error:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al eliminar tarjeta' });
  }
});

// POST /admin/tarjetas/:id/restaurar (quitar soft delete)
router.post('/admin/tarjetas/:id/restaurar', autenticacion, requiereRol('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const restaurada = await Tarjeta.findByIdAndUpdate(
      id,
      {
        $set: { eliminado: false, motivoEliminacion: '' },
        $unset: { eliminadoPor: 1, eliminadoEn: 1 },
      },
      { new: true }
    )
      .populate('usuario', 'nombre email')
      .lean();

    if (!restaurada) {
      return res.status(404).json({ ok: false, mensaje: 'Tarjeta no encontrada' });
    }

    res.json({ ok: true, item: restaurada });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('POST /admin/tarjetas/:id/restaurar error:', err);
    res.status(500).json({ ok: false, mensaje: 'Error al restaurar tarjeta' });
  }
});

export default router;
