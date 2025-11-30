// backend/src/modelos/amigo.modelo.js
// ————————————————————————————————————————————————
// Modelo de relación de amistad entre usuarios.
// Estados posibles: 'pendiente' | 'aceptada' | 'bloqueada'.
// Garantiza que una relación (solicitante, receptor) sea única.
// ————————————————————————————————————————————————

import mongoose from 'mongoose';
const { Schema } = mongoose;

const AmigoSchema = new Schema(
  {
    solicitante: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    receptor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },
    estado: {
      type: String,
      enum: ['pendiente', 'aceptada', 'bloqueada'],
      default: 'pendiente',
      index: true,
    },

    // Información opcional sobre cambios de estado
    aceptadoEn: { type: Date, default: null },
    bloqueadoEn: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Garantiza que no existan duplicados A→B
AmigoSchema.index({ solicitante: 1, receptor: 1 }, { unique: true });

// Índices para búsquedas eficientes
AmigoSchema.index({ solicitante: 1, estado: 1 });
AmigoSchema.index({ receptor: 1, estado: 1 });

// Evita OverwriteModelError en desarrollos con hot reload
export default mongoose.models.Amigo ||
  mongoose.model('Amigo', AmigoSchema);

