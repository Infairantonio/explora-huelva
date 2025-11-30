// backend/src/modelos/NewsletterSuscriptor.js
// -----------------------------------------------------
// Modelo de suscriptores de la newsletter de Explora Huelva
// -----------------------------------------------------

import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ESTADOS = ["pendiente", "activo", "baja"];

const newsletterSuscriptorSchema = new Schema(
  {
    // Email del suscriptor
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    // Estado de la suscripción:
    // - pendiente: ha dejado el email pero aún no ha hecho clic en el enlace
    // - activo: ha confirmado su correo
    // - baja: se ha dado de baja
    estado: {
      type: String,
      enum: ESTADOS,
      default: "pendiente",
      index: true,
    },

    // Token para confirmar la suscripción desde el email
    tokenConfirmacion: {
      type: String,
      index: true,
    },

    // Fechas útiles para auditoría
    fechaAlta: {
      type: Date,
      default: Date.now,
    },
    fechaConfirmacion: Date,
    fechaBaja: Date,

    // Información opcional del origen (por si en el futuro tienes varios sitios)
    meta: {
      origen: { type: String, default: "web" },
      ipAlta: String,
      userAgentAlta: String,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    collection: "newsletter_suscriptores",
  }
);

// Un email solo puede existir una vez (si se da de baja lo reutilizamos)
newsletterSuscriptorSchema.index({ email: 1 }, { unique: true });

// Opcional: ocultar el token al serializar (por seguridad)
newsletterSuscriptorSchema.methods.toJSON = function () {
  const obj = this.toObject({ versionKey: false });
  delete obj.tokenConfirmacion;
  return obj;
};

export default model("NewsletterSuscriptor", newsletterSuscriptorSchema);
