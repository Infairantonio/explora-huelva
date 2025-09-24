// backend/src/modelos/tarjeta.modelo.js
// ——————————————————————————————————————————————————————————
// Esquema Mongoose para "Tarjeta" (lugares/experiencias/rutas)
// Reglas: título, descripción, visibilidad, ≥1 etiqueta y ≥1 imagen obligatorios.
// Vídeo opcional. Compat con campo legado imagenUrl. Ubicación opcional (lat/lng).
// ——————————————————————————————————————————————————————————

import mongoose from 'mongoose';

const { Schema } = mongoose;

// Única fuente de verdad para etiquetas permitidas
export const ETIQUETAS_PERMITIDAS = ['lugares', 'experiencias', 'rutas'];

// Acepta URLs http(s) o rutas relativas del propio servidor (/uploads/...)
const URL_OK = /^(https?:\/\/|\/)/i;

const TarjetaSchema = new Schema(
  {
    // Usuario propietario
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },

    // Título (obligatorio)
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: 120,
    },

    // Descripción (obligatoria)
    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: 1000,
    },

    // Imágenes (obligatorio: al menos 1). Máx 10. URLs válidas.
    imagenes: {
      type: [String],
      default: [],
      // Normaliza: trim + filtra vacíos
      set: (arr) => (Array.isArray(arr) ? arr.map((s) => (s || '').trim()).filter(Boolean) : []),
      validate: [
        {
          validator(arr) {
            return Array.isArray(arr) && arr.length <= 10;
          },
          message: 'Máximo 10 imágenes',
        },
        {
          // Debe haber ≥1 imagen, salvo que exista imagenUrl legado
          validator(arr) {
            const hasLegacy =
              !!(this && typeof this.imagenUrl === 'string' && this.imagenUrl.trim());
            return (Array.isArray(arr) && arr.length >= 1) || hasLegacy;
          },
          message: 'Debes añadir al menos una imagen',
        },
        {
          validator(arr) {
            return (arr || []).every((s) => URL_OK.test(s));
          },
          message: 'Alguna imagen no es una URL válida',
        },
      ],
    },

    // Vídeo (opcional). Si viene, debe ser URL válida
    videoUrl: {
      type: String,
      default: '',
      validate: {
        validator(v) {
          return !v || URL_OK.test(v);
        },
        message: 'URL de vídeo no válida',
      },
    },

    // Compatibilidad con campo legado (no se usa si ya hay `imagenes`)
    imagenUrl: { type: String, default: '' },

    // Visibilidad (obligatoria, con default)
    visibilidad: {
      type: String,
      enum: ['publico', 'privado'],
      required: true,
      default: 'privado',
      index: true,
    },

    // Etiquetas (obligatorio: al menos 1 del conjunto permitido)
    etiquetas: {
      type: [{ type: String, enum: ETIQUETAS_PERMITIDAS }],
      default: [],
      index: true,
      validate: {
        validator(arr) {
          return Array.isArray(arr) && arr.length >= 1;
        },
        message: 'Selecciona al menos una etiqueta',
      },
    },

    // ——— Ubicación (opcional; si envías uno, envía ambos) ———
    lat: {
      type: Number,
      min: -90,
      max: 90,
      validate: {
        validator(v) {
          // Ambos nulos => OK; si llega lat debe existir lng
          const lng = this?.lng;
          return (v == null && (lng == null)) || (v != null && lng != null);
        },
        message: 'Debes proporcionar lat y lng juntos',
      },
    },
    lng: {
      type: Number,
      min: -180,
      max: 180,
      validate: {
        validator(v) {
          const lat = this?.lat;
          return (v == null && (lat == null)) || (v != null && lat != null);
        },
        message: 'Debes proporcionar lat y lng juntos',
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Índices útiles
TarjetaSchema.index({ createdAt: -1 });
TarjetaSchema.index({ titulo: 'text', descripcion: 'text' });

// Evita OverwriteModelError en dev
export default mongoose.models.Tarjeta || mongoose.model('Tarjeta', TarjetaSchema);
