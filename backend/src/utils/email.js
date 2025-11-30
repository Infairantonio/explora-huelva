// backend/src/utils/email.js
// ————————————————————————————————————————————————————————
// Utilidad para enviar correos vía SMTP usando Nodemailer.
//
// Configurable por variables de entorno:
//   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
//   SMTP_SECURE ("true" para forzar secure=true)
//   MAIL_FROM  (remitente por defecto)
//
// Incluye timeouts para evitar bloqueos si el servidor SMTP no responde.
// ————————————————————————————————————————————————————————

import nodemailer from "nodemailer";

// Variables de entorno con valores por defecto seguros para desarrollo
const {
  SMTP_HOST = "localhost",
  SMTP_PORT = "1025", // Mailhog, Maildev, etc.
  SMTP_USER = "",
  SMTP_PASS = "",
  SMTP_SECURE = "", // "true" para forzar secure, si no se deduce por puerto 465
  MAIL_FROM = "Explora Huelva <no-reply@explorahuelva.local>",
} = process.env;

// secure: si SMTP_SECURE="true" → secure=true
//          si no, secure solo si el puerto SMTP es 465
const secure =
  SMTP_SECURE ? SMTP_SECURE === "true" : Number(SMTP_PORT) === 465;

// Transporter configurado
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  // Timeouts para evitar cuelgues
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 4000,
  // En desarrollo puede haber certificados self-signed
  tls: { rejectUnauthorized: false },
});

/**
 * Enviar un correo.
 * @param {Object} param0
 * @param {String} param0.to - destino
 * @param {String} param0.subject - asunto
 * @param {String} param0.text - versión en texto plano
 * @param {String} param0.html - versión HTML
 */
export async function enviarCorreo({ to, subject, html, text }) {
  return transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}
