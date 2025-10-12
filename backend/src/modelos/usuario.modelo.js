// backend/src/modelos/usuario.modelo.js
// ————————————————————————————————————————————————————————
// Esquema Mongoose para usuarios (registro/login seguro) con:
// - Email único y normalizado.
// - Hash de contraseña (nunca en claro).
// - Roles (usuario/admin).
// - Verificación de email (token + caducidad).
// - Reset de contraseña (token + caducidad).
// - Controles anti-fuerza bruta (intentos fallidos + bloqueo temporal).
// ————————————————————————————————————————————————————————

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const UsuarioSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 80 },

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

    // Hash de la contraseña (nunca guardar contraseña en claro)
    passwordHash: { type: String, required: true },

    // Rol del usuario
    rol: {
      type: String,
      enum: ['usuario', 'admin'],
      default: 'usuario',
      index: true,
    },

    // —— Verificación de email ——
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null, index: true },
    verificationExpires: { type: Date, default: null },

    // —— Reset de contraseña ——
    resetToken: { type: String, default: null, index: true },
    resetExpires: { type: Date, default: null },

    // —— Anti-fuerza bruta / bloqueo temporal ——
    failedLoginCount: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.verificationToken;
        delete ret.verificationExpires;
        delete ret.resetToken;
        delete ret.resetExpires;
        delete ret.failedLoginCount;
        delete ret.lockUntil;
        return ret;
      },
    },
    toObject: { virtuals: true, versionKey: false },
  }
);

// ————————————————————————————————————————————————————————
// Métodos de instancia
// ————————————————————————————————————————————————————————

UsuarioSchema.methods.setPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};

UsuarioSchema.methods.validatePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UsuarioSchema.methods.startLoginLockIfNeeded = function (maxFallos = 5, minutosBloqueo = 10) {
  this.failedLoginCount = (this.failedLoginCount || 0) + 1;
  if (this.failedLoginCount >= maxFallos) {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutosBloqueo);
    this.lockUntil = d;
    this.failedLoginCount = 0;
  }
};

UsuarioSchema.methods.resetLoginLock = function () {
  this.failedLoginCount = 0;
  this.lockUntil = null;
};

UsuarioSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

export default mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
