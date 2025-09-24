// backend/src/controladores/comentarios.controlador.js
// ————————————————————————————————————————————————————————
// Comentarios SOLO en tarjetas públicas.
// Endpoints previstos (ver rutas):
//  - GET    /api/tarjetas/:id/comentarios         -> listar (público, solo si la tarjeta es pública)
//  - POST   /api/tarjetas/:id/comentarios         -> crear (auth, solo si la tarjeta es pública)
//  - DELETE /api/comentarios/:id                  -> eliminar (auth: autor o dueño de la tarjeta)
// ————————————————————————————————————————————————————————

import mongoose from 'mongoose';
import Comentario from '../modelos/comentario.modelo.js';
import Tarjeta from '../modelos/tarjeta.modelo.js';

// ——— helpers ———
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const parsePage = (v, def = 1) => Math.max(parseInt(String(v || def), 10) || def, 1);
const parseLimit = (v, def = 20, min = 1, max = 100) => {
  const n = parseInt(String(v || def), 10) || def;
  return Math.min(Math.max(n, min), max);
};

/** Carga la tarjeta y exige que sea pública. Devuelve { tarjeta } o null tras responder. */
async function cargarTarjetaPublica(res, tarjetaId) {
  if (!isValidId(tarjetaId)) {
    res.status(400).json({ ok: false, mensaje: 'ID de tarjeta inválido' });
    return null;
  }
  const tarjeta = await Tarjeta.findById(tarjetaId).lean();
  if (!tarjeta) {
    res.status(404).json({ ok: false, mensaje: 'Tarjeta no encontrada' });
    return null;
  }
  if (tarjeta.visibilidad !== 'publico') {
    res.status(403).json({ ok: false, mensaje: 'Comentarios no disponibles en tarjetas privadas' });
    return null;
  }
  return { tarjeta };
}

// ——— GET /tarjetas/:id/comentarios ———
export async function listar(req, res) {
  try {
    const tarjetaId = req.params.id;
    const acceso = await cargarTarjetaPublica(res, tarjetaId);
    if (!acceso) return;

    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 20, 1, 100);

    // Hilos (opcional): ?parent=<comentarioId> para listar respuestas
    const parent = req.query.parent && isValidId(req.query.parent) ? req.query.parent : null;

    const filtro = { tarjeta: tarjetaId, parent: parent ?? null, estado: 'publicado' };

    const [items, total] = await Promise.all([
      Comentario.find(filtro)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('usuario', 'nombre email') // datos mínimos del autor
        .lean(),
      Comentario.countDocuments(filtro),
    ]);

    return res.json({
      ok: true,
      items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error listando comentarios', error: e.message });
  }
}

// ——— POST /tarjetas/:id/comentarios ———
export async function crear(req, res) {
  try {
    const tarjetaId = req.params.id;
    const acceso = await cargarTarjetaPublica(res, tarjetaId);
    if (!acceso) return;

    let { texto, parent = null } = req.body || {};
    texto = (texto || '').toString().trim();

    if (!texto) {
      return res.status(422).json({ ok: false, mensaje: 'El comentario no puede estar vacío' });
    }
    if (texto.length > 800) {
      return res.status(422).json({ ok: false, mensaje: 'El comentario supera el máximo de 800 caracteres' });
    }

    // Validar parent si llega (debe existir y pertenecer a la misma tarjeta)
    let parentId = null;
    if (parent) {
      if (!isValidId(parent)) {
        return res.status(400).json({ ok: false, mensaje: 'parent inválido' });
      }
      const parentDoc = await Comentario.findById(parent).lean();
      if (!parentDoc || String(parentDoc.tarjeta) !== String(tarjetaId)) {
        return res.status(400).json({ ok: false, mensaje: 'El parent no existe o pertenece a otra tarjeta' });
      }
      parentId = parentDoc._id;
    }

    const comentario = await Comentario.create({
      tarjeta: tarjetaId,
      usuario: req.usuario.id,   // requiere auth en la ruta
      texto,
      parent: parentId,
      estado: 'publicado',
    });

    const creado = await Comentario.findById(comentario._id)
      .populate('usuario', 'nombre email')
      .lean();

    return res.status(201).json({ ok: true, comentario: creado });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error creando comentario', error: e.message });
  }
}

// ——— DELETE /comentarios/:id ———
export async function eliminar(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ ok: false, mensaje: 'ID de comentario inválido' });
    }

    const comentario = await Comentario.findById(id);
    if (!comentario) {
      return res.status(404).json({ ok: false, mensaje: 'Comentario no encontrado' });
    }

    // Autor del comentario o dueño de la tarjeta pueden borrar
    const tarjeta = await Tarjeta.findById(comentario.tarjeta).lean();
    const esAutor = String(comentario.usuario) === req.usuario.id;
    const esDuenoTarjeta = tarjeta && String(tarjeta.usuario) === req.usuario.id;

    if (!esAutor && !esDuenoTarjeta) {
      return res.status(403).json({ ok: false, mensaje: 'Sin permiso' });
    }

    await comentario.deleteOne();
    return res.json({ ok: true, mensaje: 'Comentario eliminado' });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error eliminando comentario', error: e.message });
  }
}
