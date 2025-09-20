// backend/src/modelos/tarjeta.modelo.js
// ——————————————————————————————————————————————————————————
// Esquema Mongoose para "Tarjeta" (lugares/experiencias/rutas)
// Comentado y con pequeñas mejoras no disruptivas.
// ——————————————————————————————————————————————————————————

import mongoose from 'mongoose';

const { Schema } = mongoose;

// Etiquetas permitidas (se exportan para mantener una única fuente de verdad
// y poder reutilizarlas en controladores/validadores)
export const ETIQUETAS_PERMITIDAS = ['lugares', 'experiencias', 'rutas'];

const TarjetaSchema = new Schema(
  {
    // Usuario propietario de la tarjeta
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true, // índice para acelerar consultas por usuario
    },

    // Título visible en listados y detalle
    titulo: { type: String, required: true, trim: true, maxlength: 120 },

    // Descripción breve/mediana
    descripcion: { type: String, default: '', maxlength: 1000 },

    // Varias imágenes (como URLs absolutas o relativas a /uploads)
    imagenes: {
      type: [String],
      default: [],
      // Validación ligera: límite de 10 elementos
      validate: {
        validator(arr) { return Array.isArray(arr) && arr.length <= 10; },
        message: 'Máximo 10 imágenes',
      },
    },

    // Vídeo opcional (URL)
    videoUrl: { type: String, default: '' },

    // Compatibilidad con campo legado (no se usa si ya tienes `imagenes`)
    imagenUrl: { type: String, default: '' },

    // Visibilidad: público o privado (por defecto privado)
    visibilidad: {
      type: String,
      enum: ['publico', 'privado'],
      default: 'privado',
      index: true, // útil para listados públicos
    },

    // Etiquetas acotadas al set permitido
    etiquetas: {
      type: [{ type: String, enum: ETIQUETAS_PERMITIDAS }],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt automáticos
    // (opcional) quita __v de las respuestas JSON sin cambiar contrato actual
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Índices adicionales recomendados
TarjetaSchema.index({ createdAt: -1 }); // ordenación por fecha
TarjetaSchema.index({ titulo: 'text', descripcion: 'text' }); // búsqueda $text

// Nota: Evita declarar el mismo índice dos veces en distintos sitios.
// (Este esquema no define índices duplicados por defecto.)

// Evita OverwriteModelError con hot-reload/dev
export default mongoose.models.Tarjeta || mongoose.model('Tarjeta', TarjetaSchema);
