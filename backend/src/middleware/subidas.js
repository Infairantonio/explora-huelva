// backend/src/middleware/subidas.js
// ————————————————————————————————————————————————————————
// Middleware de subida de ficheros con Multer (disco)
// - Crea la carpeta de destino si no existe
// - Normaliza nombres de archivo
// - Limita tamaño, nº de ficheros y tipos permitidos (imágenes / vídeo)
// - Exporta una instancia por defecto lista para usar
// ————————————————————————————————————————————————————————

import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Carpeta de subidas configurable; por defecto ./uploads del proyecto
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Asegura que la carpeta exista antes de escribir
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Almacén en disco: define destino y nombre de archivo
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Extrae extensión original (con punto) y base del nombre
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const rawBase = path.basename(file.originalname, ext);

    // Normaliza base: sin espacios, sin caracteres raros; corta a 80 chars
    const base = (rawBase || 'archivo')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 80) || 'archivo';

    // Sufijo único: timestamp + aleatorio
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, `${base}-${unique}${ext}`);
  }
});

// Límites razonables para desarrollo
const limits = {
  fileSize: 25 * 1024 * 1024, // 25MB por archivo
  files: 8,                   // máx. archivos por request (para .array/.fields)
};

// Tipos permitidos: imágenes comunes y vídeo ligero
const MIME_REGEXP = /^(image\/(png|jpe?g|webp|gif))$|^video\/(mp4|quicktime|webm)$/i;

const fileFilter = (_req, file, cb) => {
  // Verifica por mimetype; opcionalmente se podría reforzar por extensión si quieres
  const ok = MIME_REGEXP.test(file.mimetype || '');
  if (ok) return cb(null, true);
  // Rechaza con error controlado (Multer capturará esto y devolverá 500 salvo que lo manejes)
  cb(new Error('Tipo de archivo no permitido'));
};

// Instancia lista para usar con .single/.array/.fields
const upload = multer({ storage, limits, fileFilter });

export default upload; // Usar: upload.single('file'), upload.array('imagenes', N), upload.fields([...])

// ————————————————————————————————————————————————————————
// Sugerencias de uso:
//  - Para subir 1 imagen:  router.post('/imagen', upload.single('file'), controlador)
//  - Para subir varias imágenes + 1 vídeo en el mismo request:
//       router.post('/media', upload.fields([
//         { name: 'imagenes', maxCount: 8 },
//         { name: 'video',    maxCount: 1 },
//       ]), controlador)
//  - Sirve /uploads como estático en app.js (ya lo haces): app.use('/uploads', express.static(...))
//  - Si despliegas detrás de proxy/CDN, puedes exponer una URL pública fija con PUBLIC_UPLOAD_URL
// ————————————————————————————————————————————————————————
