// backend/src/modelos/usuario.modelo.js
// ————————————————————————————————————————————————————————
// Esquema Mongoose para usuarios (registro/login seguro).
// - 'email' único con validación y normalización.
// - 'passwordHash' NUNCA sale en las respuestas JSON.
// - Métodos de instancia para setear/validar contraseña.
// - Campo 'rol' para control de acceso (usuario/admin).
// ————————————————————————————————————————————————————————

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const UsuarioSchema = new Schema(
  {
    // Nombre visible (trim para limpiar espacios; longitud acotada)
    nombre: { type: String, required: true, trim: true, maxlength: 80 },

    // Email único, en minúsculas y sin espacios; con validación básica
    email: {
      type: String,
      required: true,
      unique: true,         // índice único en Mongo (no crear otro manual)
      lowercase: true,      // normaliza a minúsculas
      trim: true,
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: 'Email no válido',
      },
    },

    // Hash de la contraseña (nunca guardar contraseña en claro)
    passwordHash: { type: String, required: true },

    // Rol del usuario: 'usuario' (por defecto) o 'admin'
    // Se indexa para consultas del panel admin (p. ej., listar admins)
    rol: {
      type: String,
      enum: ['usuario', 'admin'],
      default: 'usuario',
      index: true,
    },
  },
  {
    // Timestamps automáticos: createdAt / updatedAt
    timestamps: true,

    // Cómo se serializa a JSON (respuestas de la API)
    toJSON: {
      virtuals: true,
      versionKey: false,     // oculta __v
      transform: (_doc, ret) => {
        // Seguridad: nunca exponer el hash
        delete ret.passwordHash;
        return ret;
      },
    },

    // toObject por si en algún punto conviertes documentos a objeto plano
    toObject: { virtuals: true, versionKey: false },
  }
);

// ————————————————————————————————————————————————————————
// Índices
// Nota: 'unique: true' en el campo email ya crea el índice único necesario.
// Si añadieras un índice manual duplicado podría causar errores en despliegue.
// UsuarioSchema.index({ email: 1 }, { unique: true });  // ❌ No necesario

// (Opcional) Búsquedas por texto en nombre/email
// UsuarioSchema.index({ nombre: 'text', email: 'text' });
// ————————————————————————————————————————————————————————

// ——— Métodos de instancia (trabajan sobre 'this') ———

// Establece el hash a partir de una contraseña en claro
UsuarioSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);     // 10–12 es razonable para server pequeño
  this.passwordHash = await bcrypt.hash(plain, salt);
};

// Valida una contraseña en claro contra el hash almacenado
UsuarioSchema.methods.validatePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Evita OverwriteModelError en hot-reload / dev
export default mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
