// backend/src/modelos/tarjeta.modelo.js
// ——————————————————————————————————————————————————————————
// Esquema Mongoose para "Tarjeta" (lugares / experiencias / rutas).
// Validaciones completas:
//  - Título y descripción obligatorios
//  - ≥1 imagen (o imagenUrl legado) y máx. 10
//  - Etiquetas válidas y mín. 1
//  - Visibilidad: público, privado o amigos
//  - Ubicación opcional (lat/lng deben venir juntos)
// Soft delete para panel admin.
// ——————————————————————————————————————————————————————————

import mongoose from 'mongoose';

const { Schema } = mongoose;

// Fuente única de verdad sobre etiquetas válidas
export const ETIQUETAS_PERMITIDAS = ['lugares', 'experiencias', 'rutas'];

// Visibilidades permitidas (incluye "amigos")
export const VISIBILIDADES_PERMITIDAS = ['publico', 'privado', 'amigos'];

// Permite URLs absolutas (http/https) y rutas relativas /uploads
const URL_OK = /^(https?:\/\/|\/)/i;

const TarjetaSchema = new Schema(
  {
    // ——— Propietario ———
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },

    // ——— Contenido ———
    titulo: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: 120,
    },

    descripcion: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: 1000,
    },

    // Imágenes normalizadas
    imagenes: {
      type: [String],
      default: [],
      set: (arr) =>
        Array.isArray(arr)
          ? arr.map((s) => (s || '').trim()).filter(Boolean)
          : [],
      validate: [
        {
          validator(arr) {
            return Array.isArray(arr) && arr.length <= 10;
          },
          message: 'Máximo 10 imágenes',
        },
        {
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

    // ——— Vídeo opcional ———
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

    // Campo legado (compatibilidad)
    imagenUrl: { type: String, default: '' },

    // ——— Visibilidad y etiquetas ———
    visibilidad: {
      type: String,
      enum: VISIBILIDADES_PERMITIDAS,
      required: true,
      default: 'privado',
      index: true,
    },

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

    // ——— Moderación / Soft delete ———
    eliminado: { type: Boolean, default: false, index: true },
    eliminadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
    eliminadoEn: { type: Date, default: null },
    motivoEliminacion: { type: String, default: '' },

    // ——— Ubicación opcional (lat/lng deben venir juntos) ———
    lat: {
      type: Number,
      min: -90,
      max: 90,
      validate: {
        validator(v) {
          const lng = this?.lng;
          return (v == null && lng == null) || (v != null && lng != null);
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
          return (v == null && lat == null) || (v != null && lat != null);
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

// ——— Índices ———
TarjetaSchema.index({ createdAt: -1 });
TarjetaSchema.index({ titulo: 'text', descripcion: 'text' });
TarjetaSchema.index({ eliminado: 1, createdAt: -1 });

// Evitar OverwriteModelError en hot reload
export default mongoose.models.Tarjeta ||
  mongoose.model('Tarjeta', TarjetaSchema);
