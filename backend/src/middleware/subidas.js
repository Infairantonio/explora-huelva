// backend/src/middleware/subidas.js
// ————————————————————————————————————————————————————————
// Middleware de subida de ficheros (multer + disco):
//  - Crea la carpeta de destino si no existe
//  - Normaliza los nombres de archivo
//  - Limita tamaño, nº de ficheros y tipos permitidos
//  - Exporta instancia lista para usar en rutas
// ————————————————————————————————————————————————————————

import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Carpeta de subidas configurable; por defecto ./uploads en el proyecto
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Asegurar que la carpeta existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Almacén en disco: destino + nombre de archivo
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),

  filename: (_req, file, cb) => {
    // Extensión y base original
    const ext = (path.extname(file.originalname) || '').toLowerCase();
    const rawBase = path.basename(file.originalname, ext);

    // Normalización del nombre base
    const base =
      (rawBase || 'archivo')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // acentos
        .replace(/[^a-zA-Z0-9_-]+/g, '-') // caracteres no válidos → guiones
        .replace(/-+/g, '-') // guiones dobles
        .replace(/^-|-$/g, '') // quita guiones del inicio/final
        .toLowerCase()
        .slice(0, 80) || 'archivo';

    // Sufijo único
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(null, `${base}-${unique}${ext}`);
  },
});

// Límites (por request)
const limits = {
  fileSize: 25 * 1024 * 1024, // 25 MB por archivo
  files: 8, // máximo archivos simultáneos
};

// Tipos permitidos (imágenes + vídeo)
const MIME_REGEXP =
  /^(image\/(png|jpe?g|webp|gif))$|^video\/(mp4|quicktime|webm)$/i;

// Filtro de validación por mimetype
const fileFilter = (_req, file, cb) => {
  const ok = MIME_REGEXP.test(file.mimetype || '');
  if (ok) return cb(null, true);
  cb(new Error('Tipo de archivo no permitido'));
};

// Instancia principal
const upload = multer({ storage, limits, fileFilter });

export default upload;
// Usar en rutas: upload.single('file'), upload.array('imagenes'), upload.fields([...])

// ————————————————————————————————————————————————————————
// Ejemplos de uso:
//  - router.post('/imagen', upload.single('file'), controlador)
//  - router.post('/media', upload.fields([
//        { name: 'imagenes', maxCount: 8 },
//        { name: 'video',    maxCount: 1 },
//    ]), controlador)
//  - Servir /uploads en app.js: app.use('/uploads', express.static(...))
//  - PUBLIC_UPLOAD_URL permite definir una URL pública fija (CDN/proxy)
// ————————————————————————————————————————————————————————
