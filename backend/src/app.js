// backend/src/app.js
// ————————————————————————————————————————————————————————————————
// Punto de entrada de la API de Explora Huelva.
// ————————————————————————————————————————————————————————————————

import "dotenv/config"; // Carga variables de entorno

// Dependencias principales
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import fs from "fs";
import path from "path";
import cookieParser from "cookie-parser"; // Cookies httpOnly (refresh)

// Rutas
import rutaSalud from "./rutas/salud.ruta.js"; // /api/salud
import rutaAuth from "./rutas/auth.ruta.js"; // /api/auth
import rutaTarjetas from "./rutas/tarjetas.ruta.js"; // /api/tarjetas
import rutaComentarios from "./rutas/comentarios.ruta.js"; // /api/...
import adminTarjetasRouter from "./rutas/admin.tarjetas.ruta.js"; // /api/admin/tarjetas
import amigosRouter from "./rutas/amigos.ruta.js"; // /api/amigos
import adminUsuariosRouter from "./rutas/admin.usuarios.ruta.js"; // /api/admin/usuarios
import rutaContacto from "./rutas/contacto.ruta.js"; // /api/contacto
import newsletterRouter from "./rutas/newsletter.ruta.js"; // 👈 NUEVO: /api/newsletter

const app = express();

// Configuración básica
const PUERTO = process.env.PUERTO_INTERNO || 5174;
const CADENA_MONGO = process.env.CADENA_MONGO;

// Orígenes permitidos para CORS (separados por comas en FRONT_ORIGEN)
const ORIGENES_PERMITIDOS = (process.env.FRONT_ORIGEN ||
  "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Archivos estáticos de subidas
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("📁 Creada carpeta de subidas:", UPLOAD_DIR);
}
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "1h" }));
// Alias para /api/uploads (cuando el frontend llama con prefijo /api)
app.use("/api/uploads", express.static(UPLOAD_DIR, { maxAge: "1h" }));

// Ajustes de seguridad básicos
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Middlewares globales
app.use(morgan("dev"));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // llamadas locales (por ejemplo, herramientas de desarrollo)
      if (ORIGENES_PERMITIDOS.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
    ],
    credentials: true, // necesario para enviar cookies httpOnly
  })
);
app.use(express.json());
app.use(cookieParser());

// Ruta raíz informativa
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    servicio: "API Explora Huelva",
    ruta: "/",
    hora: new Date().toISOString(),
  });
});

// Registro de routers
app.use("/api/salud", rutaSalud);
app.use("/api/auth", rutaAuth);
app.use("/api/tarjetas", rutaTarjetas);
app.use("/api/amigos", amigosRouter);
app.use("/api", rutaComentarios);
app.use("/api", adminTarjetasRouter);
app.use("/api", adminUsuariosRouter);
app.use("/api/contacto", rutaContacto);
app.use("/api/newsletter", newsletterRouter); // 👈 NUEVO

// Middleware de errores
app.use((err, _req, res, _next) => {
  console.error("❌ Error no controlado:", err);
  res
    .status(err.status || 500)
    .json({ ok: false, mensaje: err.message || "Error interno" });
});

// Arranque del servidor y conexión a MongoDB
app.listen(PUERTO, () => {
  console.log(`✅ API escuchando en http://localhost:${PUERTO}`);

  if (!CADENA_MONGO) {
    console.warn("⚠️  Falta CADENA_MONGO en variables de entorno");
    return;
  }
  mongoose.set("strictQuery", true);
  mongoose
    .connect(CADENA_MONGO)
    .then(() => console.log("✅ Conectado a MongoDB"))
    .catch((err) =>
      console.error("❌ Error conectando a MongoDB:", err.message)
    );
});

// Manejo básico de promesas y excepciones no controladas
process.on("unhandledRejection", (reason) => {
  console.error("⚠️  Promesa no manejada:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("⚠️  Excepción no capturada:", err);
});

export default app;
