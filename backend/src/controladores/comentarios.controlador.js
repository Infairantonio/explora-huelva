// backend/src/controladores/comentarios.controlador.js
// ————————————————————————————————————————————————————————
// Controlador de comentarios en tarjetas
//   - Listar comentarios (según visibilidad)
//   - Crear comentarios y respuestas (auth)
//   - Eliminar comentario (autor o dueño de la tarjeta)
// Visibilidad: público / amigos / privado.
// ————————————————————————————————————————————————————————

import mongoose from 'mongoose';
import Comentario from '../modelos/comentario.modelo.js';
import Tarjeta from '../modelos/tarjeta.modelo.js';
import Amigo from '../modelos/amigo.modelo.js';

// Helpers básicos
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const parsePage = (v, def = 1) =>
  Math.max(parseInt(String(v || def), 10) || def, 1);
const parseLimit = (v, def = 20, min = 1, max = 100) => {
  const n = parseInt(String(v || def), 10) || def;
  return Math.min(Math.max(n, min), max);
};

// Comprueba si dos usuarios son amigos (misma lógica que en tarjetas.controlador)
async function sonAmigos(userIdA, userIdB) {
  if (!userIdA || !userIdB) return false;
  if (String(userIdA) === String(userIdB)) return true; // propietario

  const rel = await Amigo.findOne({
    estado: 'aceptada',
    $or: [
      { solicitante: userIdA, receptor: userIdB },
      { solicitante: userIdB, receptor: userIdA },
    ],
  })
    .select({ _id: 1 })
    .lean();

  return !!rel;
}

/**
 * Carga la tarjeta y comprueba si el usuario puede ver/comentar.
 *
 * Reglas:
 *  - visibilidad = 'publico':
 *      -> cualquiera puede listar comentarios
 *      -> para crear, la ruta POST exige usuario autenticado
 *
 *  - visibilidad = 'amigos':
 *      -> solo dueño o amigos pueden listar/crear
 *
 *  - visibilidad = 'privado':
 *      -> solo dueño puede listar/crear
 *
 * Devuelve { tarjeta } o null (si hay error ya responde al cliente).
 */
async function cargarTarjetaParaComentarios(req, res, tarjetaId) {
  if (!isValidId(tarjetaId)) {
    res
      .status(400)
      .json({ ok: false, mensaje: 'ID de tarjeta inválido' });
    return null;
  }

  const tarjeta = await Tarjeta.findById(tarjetaId).lean();
  if (!tarjeta) {
    res
      .status(404)
      .json({ ok: false, mensaje: 'Tarjeta no encontrada' });
    return null;
  }

  const vis = tarjeta.visibilidad;
  const uid = req.usuario?.id || null; // puede venir vacío si la ruta es pública

  // Pública: cualquiera puede ver comentarios.
  if (vis === 'publico') {
    return { tarjeta };
  }

  // Para "amigos" o "privado" se requiere usuario autenticado
  if (!uid) {
    res.status(403).json({
      ok: false,
      mensaje:
        'Comentarios solo disponibles para usuarios con acceso a esta tarjeta',
    });
    return null;
  }

  const esDueno = String(tarjeta.usuario) === uid;

  // Dueño: acceso completo
  if (esDueno) {
    return { tarjeta };
  }

  // Tarjeta de amigos: debe existir relación de amistad
  if (vis === 'amigos') {
    const okAmigo = await sonAmigos(uid, tarjeta.usuario);
    if (!okAmigo) {
      res
        .status(403)
        .json({ ok: false, mensaje: 'Sin permiso para esta tarjeta' });
      return null;
    }
    return { tarjeta };
  }

  // Tarjeta privada y no es el dueño
  res.status(403).json({
    ok: false,
    mensaje: 'Comentarios no disponibles en esta tarjeta',
  });
  return null;
}

// ——— GET /tarjetas/:id/comentarios ———
export async function listar(req, res) {
  try {
    const tarjetaId = req.params.id;
    const acceso = await cargarTarjetaParaComentarios(
      req,
      res,
      tarjetaId
    );
    if (!acceso) return;

    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 20, 1, 100);

    // Hilos (opcional): ?parent=<comentarioId> para listar respuestas
    const parent =
      req.query.parent && isValidId(req.query.parent)
        ? req.query.parent
        : null;

    const filtro = {
      tarjeta: tarjetaId,
      parent: parent ?? null,
      estado: 'publicado',
    };

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
    return res.status(500).json({
      ok: false,
      mensaje: 'Error listando comentarios',
      error: e.message,
    });
  }
}

// ——— POST /tarjetas/:id/comentarios ———
export async function crear(req, res) {
  try {
    const tarjetaId = req.params.id;
    const acceso = await cargarTarjetaParaComentarios(
      req,
      res,
      tarjetaId
    );
    if (!acceso) return;

    let { texto, parent = null } = req.body || {};
    texto = (texto || '').toString().trim();

    if (!texto) {
      return res.status(422).json({
        ok: false,
        mensaje: 'El comentario no puede estar vacío',
      });
    }
    if (texto.length > 800) {
      return res.status(422).json({
        ok: false,
        mensaje:
          'El comentario supera el máximo de 800 caracteres',
      });
    }

    // Validar parent si llega (debe existir y pertenecer a la misma tarjeta)
    let parentId = null;
    if (parent) {
      if (!isValidId(parent)) {
        return res
          .status(400)
          .json({ ok: false, mensaje: 'parent inválido' });
      }
      const parentDoc = await Comentario.findById(parent).lean();
      if (
        !parentDoc ||
        String(parentDoc.tarjeta) !== String(tarjetaId)
      ) {
        return res.status(400).json({
          ok: false,
          mensaje:
            'El parent no existe o pertenece a otra tarjeta',
        });
      }
      parentId = parentDoc._id;
    }

    const comentario = await Comentario.create({
      tarjeta: tarjetaId,
      usuario: req.usuario.id, // requiere auth en la ruta
      texto,
      parent: parentId,
      estado: 'publicado',
    });

    const creado = await Comentario.findById(comentario._id)
      .populate('usuario', 'nombre email')
      .lean();

    return res.status(201).json({ ok: true, comentario: creado });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error creando comentario',
      error: e.message,
    });
  }
}

// ——— DELETE /comentarios/:id ———
export async function eliminar(req, res) {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'ID de comentario inválido',
      });
    }

    const comentario = await Comentario.findById(id);
    if (!comentario) {
      return res.status(404).json({
        ok: false,
        mensaje: 'Comentario no encontrado',
      });
    }

    // Autor del comentario o dueño de la tarjeta pueden borrar
    const tarjeta = await Tarjeta.findById(comentario.tarjeta).lean();
    const esAutor =
      String(comentario.usuario) === req.usuario.id;
    const esDuenoTarjeta =
      tarjeta && String(tarjeta.usuario) === req.usuario.id;

    if (!esAutor && !esDuenoTarjeta) {
      return res
        .status(403)
        .json({ ok: false, mensaje: 'Sin permiso' });
    }

    await comentario.deleteOne();
    return res.json({ ok: true, mensaje: 'Comentario eliminado' });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      mensaje: 'Error eliminando comentario',
      error: e.message,
    });
  }
}
