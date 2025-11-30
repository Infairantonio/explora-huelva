// backend/src/modelos/sesion.modelo.js
// ————————————————————————————————————————————————
// Modelo de sesión para refresh tokens httpOnly.
// Guardamos solo el HASH del refresh token (nunca el token en claro).
// Incluye información de auditoría (IP, user-agent),
// revocación y caducidad.
// ————————————————————————————————————————————————

import mongoose from 'mongoose';
const { Schema } = mongoose;

const SesionSchema = new Schema(
  {
    // Usuario propietario de la sesión
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      index: true,
    },

    // Hash SHA-256 del refresh token (único)
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Auditoría
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },

    // Revocación y caducidad
    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

// ——— TTL opcional si algún día quieres limpieza automática ———
// SesionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Sesion ||
  mongoose.model('Sesion', SesionSchema);
