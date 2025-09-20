// backend/src/modelos/usuario.modelo.js
// ————————————————————————————————————————————————————————
// Esquema Mongoose para usuarios. Comentado y sin índices duplicados.
// Corrige el warning de Mongoose sobre "Duplicate schema index on { email: 1 }".
// ————————————————————————————————————————————————————————

import mongoose from 'mongoose';

const { Schema } = mongoose;

const UsuarioSchema = new Schema(
  {
    // Nombre visible (trim y longitud máxima razonable)
    nombre: { type: String, required: true, trim: true, maxlength: 80 },

    // Email único, normalizado a minúsculas y sin espacios
    // IMPORTANTE: Dejamos "unique: true" aquí y ELIMINAMOS la creación manual
    // de índice más abajo para evitar el duplicado.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // Hash de la contraseña (nunca guardar la contraseña en claro)
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: true, // createdAt / updatedAt automáticos
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// ⚠️ ELIMINADO para evitar duplicados:
// UsuarioSchema.index({ email: 1 }, { unique: true });
// Con "unique: true" en el campo, Mongoose ya crea ese índice único.

// (Opcional) Si quieres búsquedas por nombre o email con texto más adelante:
// UsuarioSchema.index({ nombre: 'text', email: 'text' });

// Evita OverwriteModelError en hot-reload
export default mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
