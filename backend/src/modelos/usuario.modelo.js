import mongoose from 'mongoose';

const UsuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, maxlength: 80 },
    email:  { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

// índice único por email (redundante pero explícito)
UsuarioSchema.index({ email: 1 }, { unique: true });

// 👉 Exportación por defecto (esto es lo que pedía el import)
export default mongoose.model('Usuario', UsuarioSchema);
