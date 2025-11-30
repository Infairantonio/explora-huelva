// backend/src/rutas/newsletter.ruta.js
// -----------------------------------------------------
// Rutas de newsletter pública (NO requieren login)
// Prefijo final: /api/newsletter/*
// -----------------------------------------------------

import { Router } from "express";
import {
  suscribirPublica,
  confirmarNewsletter,
  bajaNewsletter,
} from "../controladores/newsletter.controlador.js";

const router = Router();

// POST /api/newsletter/suscribir
router.post("/suscribir", suscribirPublica);

// GET /api/newsletter/confirmar?token=...
router.get("/confirmar", confirmarNewsletter);

// POST /api/newsletter/baja
router.post("/baja", bajaNewsletter);

export default router;
