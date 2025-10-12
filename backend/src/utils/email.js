// backend/src/utils/email.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST = "localhost",
  SMTP_PORT = "1025",
  SMTP_USER = "",
  SMTP_PASS = "",
  MAIL_FROM = "Explora Huelva <no-reply@explorahuelva.local>",
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: false,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  // ⬇️ timeouts para que NO se quede colgado si mailhog no responde
  connectionTimeout: 4000,   // ms
  greetingTimeout: 4000,
  socketTimeout: 4000,
  tls: { rejectUnauthorized: false },
});

export async function enviarCorreo({ to, subject, html, text }) {
  return transporter.sendMail({ from: MAIL_FROM, to, subject, text, html });
}
