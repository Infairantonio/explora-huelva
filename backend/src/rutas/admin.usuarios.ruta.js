// backend/src/rutas/admin.usuarios.ruta.js
// ————————————————————————————————————————————————
// Rutas de administración para gestión de usuarios.
// Prefijo final en la API: /api/admin/usuarios/*
// Requiere usuario autenticado con rol admin.
// ————————————————————————————————————————————————

import { Router } from "express";
import {
  listarUsuarios,
  eliminarUsuario,
  restaurarUsuario,
  cambiarBloqueo,
  cambiarRol,
  eliminarDefinitivo,
} from "../controladores/admin.usuarios.controlador.js";

import autenticacion from "../middleware/autenticacion.js";
import requiereAdmin from "../middleware/requiereAdmin.js";

const router = Router();

/**
 * 🔥 MUY IMPORTANTE:
 * SOLO aplicar autenticación + rol admin
 * a rutas que EMPIECEN por /admin
 *
 * Así evitamos que este router intercepte TODAS las rutas /api
 * (lo que estaba rompiendo newsletter y devolviendo “No autenticado”)
 */
router.use("/admin", autenticacion, requiereAdmin);

// ============================================================
// Rutas ADMIN reales
// ============================================================

// GET /api/admin/usuarios  → listado con filtros
router.get("/admin/usuarios", listarUsuarios);

// DELETE (soft delete) /api/admin/usuarios/:id
router.delete("/admin/usuarios/:id", eliminarUsuario);

// PATCH /api/admin/usuarios/:id/restaurar  → revertir soft delete
router.patch("/admin/usuarios/:id/restaurar", restaurarUsuario);

// PATCH /api/admin/usuarios/:id/bloqueo  → bloquear/desbloquear usuario
router.patch("/admin/usuarios/:id/bloqueo", cambiarBloqueo);

// PATCH /api/admin/usuarios/:id/rol  → cambiar rol (usuario/admin)
router.patch("/admin/usuarios/:id/rol", cambiarRol);

// DELETE DEFINITIVO /api/admin/usuarios/:id/definitivo
router.delete("/admin/usuarios/:id/definitivo", eliminarDefinitivo);

export default router;
