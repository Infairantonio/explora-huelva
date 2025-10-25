// ————————————————————————————————————————————————————————
// Controlador "amigos":
// - Buscar usuarios (para enviar solicitud)
// - Enviar/Cancelar/Aceptar/Rechazar solicitudes
// - Listar amigos y solicitudes pendientes
// - Eliminar amistad
// ————————————————————————————————————————————————————————
import mongoose from 'mongoose';
import Amigo from '../modelos/amigo.modelo.js';
import Usuario from '../modelos/usuario.modelo.js';

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

// ===== Buscar usuarios para enviar solicitud =====
// GET /api/amigos/buscar-usuarios?q=&page=&limit=
export async function buscarUsuarios(req, res) {
  try {
    const me = String(req.usuario?.id);
    const q = (req.query?.q || '').trim();
    const page = Math.max(parseInt(req.query?.page || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query?.limit || '20', 10) || 20, 1), 50);

    // Usuarios con cualquier relación conmigo (pendiente/aceptada/bloqueada)
    const rels = await Amigo.find({
      $or: [{ solicitante: me }, { receptor: me }],
    }).select('solicitante receptor').lean();

    const excluir = new Set([me]);
    for (const r of rels) {
      const a = String(r.solicitante);
      const b = String(r.receptor);
      excluir.add(a);
      excluir.add(b);
    }

    const filtro = {
      _id: { $nin: Array.from(excluir) },
    };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filtro.$or = [{ nombre: rx }, { email: rx }];
    }

    const [total, items] = await Promise.all([
      Usuario.countDocuments(filtro),
      Usuario.find(filtro)
        .sort({ nombre: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('nombre email') // info mínima
        .lean(),
    ]);

    return res.json({
      ok: true,
      items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error buscando usuarios', detalle: e.message });
  }
}

// ===== Enviar solicitud =====
export async function enviarSolicitud(req, res) {
  try {
    const { usuarioId } = req.body || {};
    const yo = String(req.usuario?.id || '');
    if (!isId(usuarioId)) return res.status(400).json({ ok: false, mensaje: 'usuarioId inválido' });
    if (usuarioId === yo) return res.status(400).json({ ok: false, mensaje: 'No puedes enviarte solicitud a ti mismo' });

    // ¿ya hay relación?
    const existente = await Amigo.findOne({
      $or: [
        { solicitante: yo, receptor: usuarioId },
        { solicitante: usuarioId, receptor: yo },
      ],
    });

    if (existente) {
      if (existente.estado === 'aceptada') return res.status(409).json({ ok: false, mensaje: 'Ya sois amigos' });
      if (existente.estado === 'pendiente') {
        if (String(existente.solicitante) === yo) {
          return res.status(409).json({ ok: false, mensaje: 'Solicitud ya enviada' });
        }
        return res.status(409).json({ ok: false, mensaje: 'Tienes una solicitud recibida de este usuario' });
      }
      if (existente.estado === 'bloqueada') {
        return res.status(409).json({ ok: false, mensaje: 'No es posible por estado actual' });
      }
    }

    const creada = await Amigo.create({
      solicitante: yo,
      receptor: usuarioId,
      estado: 'pendiente',
    });

    return res.status(201).json({ ok: true, relacion: creada });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: e.message || 'Error enviando solicitud' });
  }
}

// ===== Cancelar mi solicitud (pendiente y creada por mí) =====
export async function cancelarSolicitud(req, res) {
  try {
    const { usuarioId } = req.body || {};
    const yo = String(req.usuario?.id || '');
    if (!isId(usuarioId)) return res.status(400).json({ ok: false, mensaje: 'usuarioId inválido' });

    const rel = await Amigo.findOne({
      solicitante: yo,
      receptor: usuarioId,
      estado: 'pendiente',
    });

    if (!rel) return res.status(404).json({ ok: false, mensaje: 'No hay solicitud pendiente enviada por ti' });

    await rel.deleteOne();
    return res.json({ ok: true, mensaje: 'Solicitud cancelada' });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: e.message || 'Error cancelando' });
  }
}

// ===== Aceptar solicitud recibida =====
export async function aceptarSolicitud(req, res) {
  try {
    const { usuarioId } = req.body || {};
    const yo = String(req.usuario?.id || '');
    if (!isId(usuarioId)) return res.status(400).json({ ok: false, mensaje: 'usuarioId inválido' });

    const rel = await Amigo.findOne({
      solicitante: usuarioId,
      receptor: yo,
      estado: 'pendiente',
    });

    if (!rel) return res.status(404).json({ ok: false, mensaje: 'No tienes solicitud pendiente de ese usuario' });

    rel.estado = 'aceptada';
    rel.aceptadoEn = new Date();
    await rel.save();

    return res.json({ ok: true, relacion: rel });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: e.message || 'Error aceptando' });
  }
}

// ===== Rechazar solicitud recibida =====
export async function rechazarSolicitud(req, res) {
  try {
    const { usuarioId } = req.body || {};
    const yo = String(req.usuario?.id || '');
    if (!isId(usuarioId)) return res.status(400).json({ ok: false, mensaje: 'usuarioId inválido' });

    const rel = await Amigo.findOne({
      solicitante: usuarioId,
      receptor: yo,
      estado: 'pendiente',
    });

    if (!rel) return res.status(404).json({ ok: false, mensaje: 'No tienes solicitud pendiente de ese usuario' });

    await rel.deleteOne();
    return res.json({ ok: true, mensaje: 'Solicitud rechazada' });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: e.message || 'Error rechazando' });
  }
}

// ===== Eliminar amistad (unfriend) =====
export async function eliminarAmigo(req, res) {
  try {
    const { usuarioId } = req.params || {};
    const yo = String(req.usuario?.id || '');
    if (!isId(usuarioId)) return res.status(400).json({ ok: false, mensaje: 'usuarioId inválido' });

    const rel = await Amigo.findOne({
      estado: 'aceptada',
      $or: [
        { solicitante: yo, receptor: usuarioId },
        { solicitante: usuarioId, receptor: yo },
      ],
    });

    if (!rel) return res.status(404).json({ ok: false, mensaje: 'No hay amistad con ese usuario' });

    await rel.deleteOne();
    return res.json({ ok: true, mensaje: 'Amistad eliminada' });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: e.message || 'Error eliminando amistad' });
  }
}

// ===== Listar amigos =====
export async function listarAmigos(req, res) {
  try {
    const yo = String(req.usuario?.id || '');
    const rels = await Amigo.find({
      estado: 'aceptada',
      $or: [{ solicitante: yo }, { receptor: yo }],
    }).lean();

    const ids = rels.map((r) => String(r.solicitante) === yo ? String(r.receptor) : String(r.solicitante));
    const usuarios = await Usuario.find({ _id: { $in: ids } }, { nombre: 1, email: 1 }).lean();
    const uMap = new Map(usuarios.map(u => [String(u._id), u]));

    const items = rels.map(r => {
      const friendId = String(r.solicitante) === yo ? String(r.receptor) : String(r.solicitante);
      return { _id: r._id, amigo: uMap.get(friendId) || null };
    }).filter(x => x.amigo);

    return res.json({ ok: true, items, total: items.length });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: e.message || 'Error listando amigos' });
  }
}

// ===== Listar pendientes (recibidas y enviadas) =====
export async function listarPendientes(req, res) {
  try {
    const yo = String(req.usuario?.id || '');
    const rels = await Amigo.find({
      estado: 'pendiente',
      $or: [{ solicitante: yo }, { receptor: yo }],
    }).lean();

    // cargamos “el otro” usuario para cada relación
    const otrosIds = [];
    for (const r of rels) {
      const otroId = String(r.solicitante) === yo ? String(r.receptor) : String(r.solicitante);
      otrosIds.push(otroId);
    }
    const usuarios = await Usuario.find({ _id: { $in: otrosIds } }, { nombre: 1, email: 1 }).lean();
    const uMap = new Map(usuarios.map(u => [String(u._id), u]));

    const items = rels.map(r => {
      const recibida = String(r.receptor) === yo; // si yo soy receptor → la recibí
      const otroId = recibida ? String(r.solicitante) : String(r.receptor);
      return {
        _id: r._id,
        tipo: recibida ? 'recibida' : 'enviada',
        usuario: uMap.get(otroId) || null,
      };
    }).filter(x => x.usuario);

    return res.json({ ok: true, items });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: e.message || 'Error listando pendientes' });
  }
}
