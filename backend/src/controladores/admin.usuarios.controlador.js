// backend/src/controladores/admin.usuarios.controlador.js
// ————————————————————————————————————————————————
// Controlador de administración de usuarios
// Operaciones: listado, bloqueo, soft delete, restauración,
// cambio de rol y eliminación definitiva.
// ————————————————————————————————————————————————

import Usuario from "../modelos/usuario.modelo.js";
import Tarjeta from "../modelos/tarjeta.modelo.js";
import Comentario from "../modelos/comentario.modelo.js";

// Comprueba que la petición la realiza un usuario con rol administrador
async function asegurarAdmin(req, res) {
  try {
    if (!req.usuario || !req.usuario.id) {
      res.status(401).json({
        ok: false,
        mensaje: "No autenticado",
      });
      return false;
    }

    const u = await Usuario.findById(req.usuario.id).select("rol");

    if (!u || u.rol !== "admin") {
      res.status(403).json({
        ok: false,
        mensaje: "No tienes permisos de administrador",
      });
      return false;
    }

    return true;
  } catch (e) {
    console.error("Error en asegurarAdmin:", e);
    res.status(500).json({ ok: false, mensaje: "Error interno" });
    return false;
  }
}

// ————————————————————————————————————————————————
// LISTAR USUARIOS
// GET /api/admin/usuarios
// Devuelve usuarios con filtros y paginación.
// ————————————————————————————————————————————————
export async function listarUsuarios(req, res) {
  if (!(await asegurarAdmin(req, res))) return;

  try {
    let {
      q = "",
      rol = "",
      estado = "", // activo / bloqueado / eliminado
      incDel = "", // ya no se usa directamente
      page = 1,
      limit = 25,
      orden = "-createdAt",
    } = req.query;

    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Math.min(Number(limit) || 25, 200));

    const filtros = {};

    // Búsqueda por nombre o email
    if (q.trim()) {
      filtros.$or = [
        { nombre: new RegExp(q.trim(), "i") },
        { email: new RegExp(q.trim(), "i") },
      ];
    }

    // Filtro por rol
    if (rol) filtros.rol = rol;

    // Filtro por estado general
    if (estado === "activo") {
      filtros.eliminado = false;
      filtros.bloqueado = false;
    } else if (estado === "bloqueado") {
      filtros.eliminado = false;
      filtros.bloqueado = true;
    } else if (estado === "eliminado") {
      filtros.eliminado = true;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Usuario.find(filtros)
        .sort(orden)
        .skip(skip)
        .limit(limit),
      Usuario.countDocuments(filtros),
    ]);

    return res.json({
      ok: true,
      items,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (e) {
    console.error("Error admin listarUsuarios:", e);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
}

// ————————————————————————————————————————————————
// SOFT DELETE
// DELETE /api/admin/usuarios/:id
// Marca el usuario como eliminado y oculta su contenido.
// ————————————————————————————————————————————————
export async function eliminarUsuario(req, res) {
  if (!(await asegurarAdmin(req, res))) return;

  try {
    const { id } = req.params;
    const { motivo = "" } = req.body || {};

    const u = await Usuario.findById(id);
    if (!u) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    const ahora = new Date();
    const motivoFinal = motivo || "No especificado";

    // Marca el usuario como eliminado (borrado lógico)
    u.eliminado = true;
    u.eliminadoMotivo = motivoFinal;
    u.eliminadoEn = ahora;
    await u.save();

    // Tarjetas del usuario: se marcan como eliminadas
    await Tarjeta.updateMany(
      { usuario: id, eliminado: { $ne: true } },
      {
        $set: {
          eliminado: true,
          eliminadoPor: req.usuario.id,
          eliminadoEn: ahora,
          motivoEliminacion: motivoFinal || "Usuario marcado como eliminado",
        },
      }
    );

    // Comentarios del usuario: se dejan en estado "oculto"
    await Comentario.updateMany(
      { usuario: id, estado: { $ne: "oculto" } },
      {
        $set: {
          estado: "oculto",
          eliminadoPor: req.usuario.id,
          eliminadoEn: ahora,
          motivoEliminacion:
            motivoFinal || "Comentarios ocultados por eliminación de usuario",
        },
      }
    );

    return res.json({
      ok: true,
      mensaje: "Usuario marcado como eliminado y contenido ocultado",
    });
  } catch (e) {
    console.error("Error admin eliminarUsuario:", e);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
}

// ————————————————————————————————————————————————
// RESTAURAR SOFT DELETE
// PATCH /api/admin/usuarios/:id/restaurar
// Reactiva al usuario y recupera su contenido.
// ————————————————————————————————————————————————
export async function restaurarUsuario(req, res) {
  if (!(await asegurarAdmin(req, res))) return;

  try {
    const { id } = req.params;

    const u = await Usuario.findById(id);
    if (!u) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    u.eliminado = false;
    u.eliminadoMotivo = null;
    u.eliminadoEn = null;
    await u.save();

    // Tarjetas: se marcan como activas de nuevo
    await Tarjeta.updateMany(
      { usuario: id, eliminado: true },
      {
        $set: {
          eliminado: false,
          eliminadoPor: null,
          eliminadoEn: null,
          motivoEliminacion: "",
        },
      }
    );

    // Comentarios: se vuelven a publicar
    await Comentario.updateMany(
      { usuario: id, estado: "oculto" },
      {
        $set: {
          estado: "publicado",
          eliminadoPor: null,
          eliminadoEn: null,
          motivoEliminacion: "",
        },
      }
    );

    return res.json({
      ok: true,
      mensaje: "Usuario y contenido restaurados",
    });
  } catch (e) {
    console.error("Error admin restaurarUsuario:", e);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
}

// ————————————————————————————————————————————————
// BLOQUEAR / DESBLOQUEAR
// PATCH /api/admin/usuarios/:id/bloqueo
// Controla si el usuario puede iniciar sesión.
// ————————————————————————————————————————————————
export async function cambiarBloqueo(req, res) {
  if (!(await asegurarAdmin(req, res))) return;

  try {
    const { id } = req.params;
    const { bloqueado } = req.body || {};

    const u = await Usuario.findById(id);
    if (!u) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    u.bloqueado = !!bloqueado;
    await u.save();

    return res.json({
      ok: true,
      mensaje: u.bloqueado
        ? "Usuario bloqueado (no podrá iniciar sesión)"
        : "Usuario desbloqueado",
    });
  } catch (e) {
    console.error("Error admin cambiarBloqueo:", e);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
}

// ————————————————————————————————————————————————
// CAMBIAR ROL
// PATCH /api/admin/usuarios/:id/rol
// Actualiza el rol del usuario (usuario/admin).
// ————————————————————————————————————————————————
export async function cambiarRol(req, res) {
  if (!(await asegurarAdmin(req, res))) return;

  try {
    const { id } = req.params;
    const { rol } = req.body || {};

    if (!["usuario", "admin"].includes(rol)) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "Rol inválido" });
    }

    const u = await Usuario.findById(id);
    if (!u) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    u.rol = rol;
    await u.save();

    return res.json({ ok: true, mensaje: "Rol actualizado" });
  } catch (e) {
    console.error("Error admin cambiarRol:", e);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
}

// ————————————————————————————————————————————————
// ELIMINACIÓN DEFINITIVA
// DELETE /api/admin/usuarios/:id/definitivo
// Borra al usuario de la base de datos.
// ————————————————————————————————————————————————
export async function eliminarDefinitivo(req, res) {
  if (!(await asegurarAdmin(req, res))) return;

  try {
    const { id } = req.params;

    await Usuario.findByIdAndDelete(id);

    return res.json({
      ok: true,
      mensaje: "Usuario eliminado definitivamente",
    });
  } catch (e) {
    console.error("Error admin eliminarDefinitivo:", e);
    return res.status(500).json({ ok: false, mensaje: "Error interno" });
  }
}
