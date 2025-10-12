// backend/src/modelos/sesion.modelo.js
// ————————————————————————————————————————————————
// Modelo de sesión para refresh tokens httpOnly.
// Guardamos solo el HASH del refresh (nunca el token en claro).
// Campos útiles para auditoría: IP y user-agent.
// ————————————————————————————————————————————————

import mongoose from 'mongoose';

const { Schema } = mongoose;

const SesionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'Usuario', index: true, required: true },

    // Hash SHA-256 del refresh token (único)
    tokenHash: { type: String, unique: true, index: true, required: true },

    // Auditoría
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },

    // Revocación y caducidad
    revoked: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

// TTL opcional (si quieres que Mongo borre automáticamente tras caducar):
// OJO: para TTL hay que usar { expireAfterSeconds: 0 } y una fecha en expiresAt.
// SesionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Sesion || mongoose.model('Sesion', SesionSchema);

