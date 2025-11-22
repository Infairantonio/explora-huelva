// backend/src/rutas/contacto.ruta.js
// ————————————————————————————————————————————————
// Ruta muy sencilla para contacto / newsletter.
// POST /api/contacto
// ————————————————————————————————————————————————

import { Router } from "express";
import { enviarContacto } from "../controladores/contacto.controlador.js";

const router = Router();

// Recibe { email, mensaje }
router.post("/", enviarContacto);

export default router;
