// backend/src/rutas/admin.usuarios.ruta.js
// ————————————————————————————————————————————————
// Rutas de administración para GESTIÓN DE USUARIOS
// Prefijo final: /api/admin/usuarios/*
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

// 👇 Usamos TUS middlewares
// OJO: si alguno exporta "default", la importación es correcta así;
// si exporta con nombre, sería: import { nombre } from "...";
import autenticacion from "../middleware/autenticacion.js";
import requiereAdmin from "../middleware/requiereAdmin.js";

const router = Router();

// Todas estas rutas requieren:
// - usuario logueado
// - rol admin
router.use(autenticacion, requiereAdmin);

// GET /api/admin/usuarios
router.get("/admin/usuarios", listarUsuarios);

// DELETE (soft) /api/admin/usuarios/:id
router.delete("/admin/usuarios/:id", eliminarUsuario);

// PATCH /api/admin/usuarios/:id/restaurar
router.patch("/admin/usuarios/:id/restaurar", restaurarUsuario);

// PATCH /api/admin/usuarios/:id/bloqueo
router.patch("/admin/usuarios/:id/bloqueo", cambiarBloqueo);

// PATCH /api/admin/usuarios/:id/rol
router.patch("/admin/usuarios/:id/rol", cambiarRol);

// DELETE DEFINITIVO /api/admin/usuarios/:id/definitivo
router.delete("/admin/usuarios/:id/definitivo", eliminarDefinitivo);

export default router;
