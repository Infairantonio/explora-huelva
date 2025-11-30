// backend/src/modelos/comentario.modelo.js
// ————————————————————————————————————————————————
// Modelo "Comentario" optimizado para escalar y paginar.
// - Vinculado a Tarjeta y Usuario
// - Soporta hilos mediante `parent`
// - Moderación lógica mediante `estado`
// - Soft delete con metadatos (quién/cuándo y motivo)
// ————————————————————————————————————————————————

import mongoose from 'mongoose';
const { Schema } = mongoose;

const ComentarioSchema = new Schema(
  {
    // ——— Relación ———
    tarjeta: {
      type: Schema.Types.ObjectId,
      ref: 'Tarjeta',
      required: true,
      index: true,
    },

    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },

    // ——— Contenido ———
    texto: {
      type: String,
      required: [true, 'El comentario no puede estar vacío'],
      trim: true,
      minlength: 1,
      maxlength: 800,
    },

    // ——— Hilos (respuestas) ———
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Comentario',
      default: null,
      index: true,
    },

    // ——— Moderación ———
    estado: {
      type: String,
      enum: ['publicado', 'pendiente', 'oculto'],
      default: 'publicado',
      index: true,
    },

    // ——— Soft delete (auditoría) ———
    eliminadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
    eliminadoEn: { type: Date, default: null },
    motivoEliminacion: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// ——— Índices para consulta eficiente ———
ComentarioSchema.index({ tarjeta: 1, parent: 1, createdAt: -1 });
ComentarioSchema.index({ tarjeta: 1, createdAt: -1 });
ComentarioSchema.index({ usuario: 1, createdAt: -1 });

// Evita OverwriteModelError en hot-reload
export default mongoose.models.Comentario ||
  mongoose.model('Comentario', ComentarioSchema);

