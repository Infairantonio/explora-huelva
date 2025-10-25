// backend/src/modelos/amigo.modelo.js
// ————————————————————————————————————————————————
// Relación de amistad entre usuarios.
// Estados: 'pendiente' | 'aceptada' | 'bloqueada'
// Un par (A,B) es único (evita duplicados).
// ————————————————————————————————————————————————

import mongoose from 'mongoose';
const { Schema } = mongoose;

const AmigoSchema = new Schema(
  {
    solicitante: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    receptor:    { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    estado: {
      type: String,
      enum: ['pendiente', 'aceptada', 'bloqueada'],
      default: 'pendiente',
      index: true,
    },
    // opcional: quién y cuándo aceptó/bloqueó
    aceptadoEn: { type: Date, default: null },
    bloqueadoEn: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// Evitar duplicados exactos A->B
AmigoSchema.index({ solicitante: 1, receptor: 1 }, { unique: true });

// Búsqueda eficiente por cualquiera de los dos lados
AmigoSchema.index({ solicitante: 1, estado: 1 });
AmigoSchema.index({ receptor: 1, estado: 1 });

// Evita OverwriteModelError
export default mongoose.models.Amigo || mongoose.model('Amigo', AmigoSchema);
