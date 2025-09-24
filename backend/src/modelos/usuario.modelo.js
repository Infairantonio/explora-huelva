// backend/src/modelos/usuario.modelo.js
// ————————————————————————————————————————————————————————
// Esquema Mongoose para usuarios. Seguro para registro/login.
// - Sin índices duplicados (unique en email).
// - Oculta passwordHash en las respuestas JSON.
// - Métodos para setear/validar contraseña.
// ————————————————————————————————————————————————————————

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const UsuarioSchema = new Schema(
  {
    // Nombre visible (trim y longitud máxima razonable)
    nombre: { type: String, required: true, trim: true, maxlength: 80 },

    // Email único, normalizado a minúsculas y sin espacios
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: 'Email no válido',
      },
    },

    // Hash de la contraseña (nunca guardar la contraseña en claro)
    passwordHash: { type: String, required: true },
  },
  {
    timestamps: true, // createdAt / updatedAt automáticos
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret.passwordHash; // nunca exponer el hash
        return ret;
      },
    },
    toObject: { virtuals: true, versionKey: false },
  }
);

// ⚠️ NO crear índice manual duplicado:
// UsuarioSchema.index({ email: 1 }, { unique: true });

// (Opcional) Si quieres búsquedas por nombre o email con texto más adelante:
// UsuarioSchema.index({ nombre: 'text', email: 'text' });

// ——— Métodos de instancia para gestionar contraseñas ———
UsuarioSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10); // 10-12 es razonable
  this.passwordHash = await bcrypt.hash(plain, salt);
};

UsuarioSchema.methods.validatePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Evita OverwriteModelError en hot-reload
export default mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
