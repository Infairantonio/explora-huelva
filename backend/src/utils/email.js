// backend/src/utils/email.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST = "localhost",
  SMTP_PORT = "1025",
  SMTP_USER = "",
  SMTP_PASS = "",
  SMTP_SECURE = "", // "true" para forzar secure si lo necesitas
  MAIL_FROM = "Explora Huelva <no-reply@explorahuelva.local>",
} = process.env;

// Si SMTP_SECURE="true" => secure; si no, secure solo cuando el puerto es 465
const secure = SMTP_SECURE ? SMTP_SECURE === "true" : Number(SMTP_PORT) === 465;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  // timeouts para no quedarse colgado si el SMTP no responde
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 4000,
  tls: { rejectUnauthorized: false },
});

export async function enviarCorreo({ to, subject, html, text }) {
  return transporter.sendMail({ from: MAIL_FROM, to, subject, text, html });
}
