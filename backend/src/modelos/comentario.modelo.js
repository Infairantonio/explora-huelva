// backend/src/modelos/comentario.modelo.js
// ————————————————————————————————————————————————
// Modelo "Comentario" optimizado para escalar y paginar.
// Campos mínimos: tarjeta, usuario, texto.
// Soporta hilos mediante 'parent' y moderación básica con 'estado'.
// Incluye metadatos de eliminación (quién/cuándo y motivo) SIN borrar el doc.
// ————————————————————————————————————————————————

import mongoose from 'mongoose';

const { Schema } = mongoose;

const ComentarioSchema = new Schema(
  {
    // ——— Relación ———
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

    // ——— Contenido ———
    texto: {
      type: String,
      required: [true, 'El comentario no puede estar vacío'],
      trim: true,
      minlength: 1,
      maxlength: 800, // ajusta según la UX que quieras
    },

    // (Opcional) Soporte de hilos (responder a otro comentario)
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Comentario',
      default: null,
      index: true,
    },

    // ——— Moderación básica ———
    // Estados:
    //  - publicado: visible normal
    //  - pendiente: a la espera de revisión (si algún día lo usas)
    //  - oculto: "soft delete" lógico (no se elimina de BD)
    estado: {
      type: String,
      enum: ['publicado', 'pendiente', 'oculto'],
      default: 'publicado',
      index: true,
    },

    // Metadatos de eliminación (auditoría). No borran físicamente el doc.
    eliminadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null,
    },
    eliminadoEn: { type: Date, default: null },
    motivoEliminacion: { type: String, default: '' },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// ——— Índices útiles para listados y hilos ———
ComentarioSchema.index({ tarjeta: 1, parent: 1, createdAt: -1 });
ComentarioSchema.index({ tarjeta: 1, createdAt: -1 });
ComentarioSchema.index({ usuario: 1, createdAt: -1 });

// Evita OverwriteModelError en dev/hot-reload
export default mongoose.models.Comentario || mongoose.model('Comentario', ComentarioSchema);
