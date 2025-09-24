// backend/src/modelos/comentario.modelo.js
// ————————————————————————————————————————————————
// Modelo "Comentario" separado para escalar y paginar bien.
// Campos mínimos: tarjeta, usuario, texto. Opcional: parent (replies).
// ————————————————————————————————————————————————

import mongoose from 'mongoose';

const { Schema } = mongoose;

const ComentarioSchema = new Schema(
  {
    // A qué tarjeta pertenece el comentario
    tarjeta: {
      type: Schema.Types.ObjectId,
      ref: 'Tarjeta',
      required: true,
      index: true,
    },

    // Quién escribe el comentario
    usuario: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },

    // Texto del comentario
    texto: {
      type: String,
      required: [true, 'El comentario no puede estar vacío'],
      trim: true,
      minlength: 1,
      maxlength: 800, // ajusta según tu UX
    },

    // (Opcional) Respuesta a otro comentario
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Comentario',
      default: null,
      index: true,
    },

    // (Opcional) Estado para moderación básica
    estado: {
      type: String,
      enum: ['publicado', 'pendiente', 'oculto'],
      default: 'publicado',
      index: true,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Índices útiles para listados y hilos
ComentarioSchema.index({ tarjeta: 1, parent: 1, createdAt: -1 });
ComentarioSchema.index({ tarjeta: 1, createdAt: -1 });
ComentarioSchema.index({ usuario: 1, createdAt: -1 });

// Evita OverwriteModelError en dev/hot-reload
export default mongoose.models.Comentario || mongoose.model('Comentario', ComentarioSchema);
