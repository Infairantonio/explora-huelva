// backend/src/modelos/usuario.modelo.js
// ————————————————————————————————————————————————————————
// Modelo "Usuario" para registro y login seguro.
// Incluye:
//  - Email único y normalizado
//  - Contraseña hasheada (nunca en claro)
//  - Roles: usuario / admin
//  - Verificación de email (token + caducidad)
//  - Reset de contraseña (token + caducidad)
//  - Protección anti fuerza bruta (intentos + bloqueo)
//  - Campos de bloqueo y eliminación para panel de administración
// ————————————————————————————————————————————————————————

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const UsuarioSchema = new Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Email no válido",
      },
    },

    // Hash de la contraseña (no se guarda nunca en claro)
    passwordHash: { type: String, required: true },

    // Rol del usuario
    rol: {
      type: String,
      enum: ["usuario", "admin"],
      default: "usuario",
      index: true,
    },

    // ——— Verificación de email ———
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null, index: true },
    verificationExpires: { type: Date, default: null },

    // ——— Reset de contraseña ———
    resetToken: { type: String, default: null, index: true },
    resetExpires: { type: Date, default: null },

    // ——— Anti fuerza bruta / bloqueo ———
    failedLoginCount: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null, index: true },

    // ——— Gestión desde panel admin ———
    // Bloqueo manual (además del automático por intentos)
    bloqueado: { type: Boolean, default: false },

    // Soft delete (no se borra físicamente)
    eliminado: { type: Boolean, default: false },
    eliminadoMotivo: { type: String, trim: true, maxlength: 500 },
    eliminadoEn: { type: Date, default: null },

    // Último login correcto (opcional)
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        // Nunca exponer datos sensibles al frontend
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

// Incrementa contador de fallos y aplica bloqueo temporal si toca
UsuarioSchema.methods.startLoginLockIfNeeded = function (
  maxFallos = 5,
  minutosBloqueo = 10
) {
  this.failedLoginCount = (this.failedLoginCount || 0) + 1;

  if (this.failedLoginCount >= maxFallos) {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutosBloqueo);
    this.lockUntil = d;
    this.failedLoginCount = 0;
  }
};

// Limpia contador y bloqueo
UsuarioSchema.methods.resetLoginLock = function () {
  this.failedLoginCount = 0;
  this.lockUntil = null;
};

// Indica si la cuenta está bloqueada (manual o temporal)
UsuarioSchema.methods.isLocked = function () {
  if (this.bloqueado) return true;
  return this.lockUntil && this.lockUntil > new Date();
};

export default mongoose.models.Usuario || mongoose.model("Usuario", UsuarioSchema);
