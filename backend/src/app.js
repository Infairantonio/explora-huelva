// backend/src/app.js
// ————————————————————————————————————————————————————————————————
// Punto de entrada de la API de Explora Huelva.
// ————————————————————————————————————————————————————————————————

// Carga variables de entorno desde .env
import "dotenv/config"; // Permite usar process.env.*

// Dependencias principales del servidor
import express from "express"; // Framework HTTP minimalista
import mongoose from "mongoose"; // ODM para MongoDB
import morgan from "morgan"; // Logger HTTP para desarrollo
import cors from "cors"; // Middleware CORS (control de orígenes)
import fs from "fs"; // Sistema de archivos (para crear /uploads si falta)
import path from "path"; // Utilidades de rutas de archivos

// Rutas de la aplicación (se importan ya configuradas como routers)
import rutaSalud from "./rutas/salud.ruta.js";      // /api/salud (pong)
import rutaAuth from "./rutas/auth.ruta.js";        // /api/auth (login / registro)
import rutaTarjetas from "./rutas/tarjetas.ruta.js"; // /api/tarjetas (CRUD)
import rutaComentarios from "./rutas/comentarios.ruta.js"; // /api/tarjetas/:id/comentarios, /api/comentarios/:id

// Instancia de la app Express
const app = express();

// Lectura de variables de entorno con valores por defecto sensatos
const PUERTO = process.env.PUERTO_INTERNO || 5174; // Puerto interno del contenedor/API
const CADENA_MONGO = process.env.CADENA_MONGO; // URI de conexión a MongoDB

// Pequeña mejora: permitir múltiples orígenes front separados por comas en FRONT_ORIGEN
// Ejemplo: FRONT_ORIGEN=http://localhost:5173,http://127.0.0.1:5173,https://mi-front.app
const ORIGENES_PERMITIDOS = (process.env.FRONT_ORIGEN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// === STATIC /uploads ===
// Carpeta para ficheros subidos (configurable por env o por defecto en /uploads)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

// Crear la carpeta si no existe (con recursive por si faltan niveles intermedios)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("📁 Creada carpeta de subidas:", UPLOAD_DIR);
}

// Servir estáticos de /uploads con cache suave (1h). No es crítico y mejora rendimiento.
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "1h" }));

// Ocultar cabecera X-Powered-By por mínima seguridad (no revela que es Express)
app.disable("x-powered-by");

// Si algún día sirves detrás de Nginx/Render/etc.
app.set("trust proxy", 1);

// Logger HTTP en modo desarrollo (muestra método, ruta, estado, tiempo, etc.)
app.use(morgan("dev"));

// Configuración de CORS
// - Permite peticiones desde los orígenes listados en ORIGENES_PERMITIDOS
// - Rechaza otros orígenes sin lanzar error (menos ruido en logs)
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite herramientas locales (Postman/cURL) sin origin
      if (!origin) return callback(null, true);
      if (ORIGENES_PERMITIDOS.includes(origin)) return callback(null, true);
      return callback(null, false); // rechaza sin tirar error
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// Parser JSON del body (con límite por defecto). Si en el futuro se suben
// payloads grandes, se puede aumentar: express.json({ limit: "2mb" })
app.use(express.json());

// Ruta raíz informativa, útil como verificación rápida de servicio vivo
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    servicio: "API Explora Huelva",
    ruta: "/",
    hora: new Date().toISOString(),
  });
});

// Registro de routers de la API (mantiene prefijos claros y versionables en el futuro)
app.use("/api/salud", rutaSalud);
app.use("/api/auth", rutaAuth);
app.use("/api/tarjetas", rutaTarjetas);
app.use("/api", rutaComentarios); // ← rutas de comentarios (GET/POST/DELETE)

// Middleware de manejo básico de errores (mejora leve):
// Centraliza errores no capturados en rutas y devuelve JSON homogéneo
app.use((err, _req, res, _next) => {
  console.error("❌ Error no controlado:", err);
  res.status(err.status || 500).json({ ok: false, mensaje: err.message || "Error interno" });
});

// Arranque del servidor HTTP + conexión a MongoDB
// Nota: Se mantiene la semántica original (levantar servidor y luego conectar).
// Si prefieres ser estricto, podrías conectar primero y luego app.listen().
app.listen(PUERTO, () => {
  console.log(`✅ API escuchando en http://localhost:${PUERTO}`);

  if (!CADENA_MONGO) {
    console.warn("⚠️  Falta CADENA_MONGO en variables de entorno");
    return; // Evita intentar conectar sin cadena
  }

  // Ajuste recomendado por Mongoose para queries estrictas (opcional, no disruptivo)
  mongoose.set("strictQuery", true);

  // Conexión a MongoDB
  mongoose
    .connect(CADENA_MONGO)
    .then(() => console.log("✅ Conectado a MongoDB"))
    .catch((err) => console.error("❌ Error conectando a MongoDB:", err.message));
});

// Manejo de promesas no gestionadas a nivel proceso (pequeña red de seguridad)
process.on("unhandledRejection", (reason) => {
  console.error("⚠️  Promesa no manejada:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("⚠️  Excepción no capturada:", err);
});

// Export para pruebas o para reutilizar la app en otros módulos
export default app;
