// backend/src/controladores/newsletter.controlador.js
// -----------------------------------------------------
// Controlador de newsletter (suscripción pública, confirmación, baja)
// -----------------------------------------------------

import crypto from "crypto";
import NewsletterSuscriptor from "../modelos/NewsletterSuscriptor.js";
import { enviarCorreo } from "../utils/email.js";

const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:5173";

/**
 * Genera un token aleatorio seguro para confirmar suscripción
 */
function generarToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * POST /api/newsletter/suscribir
 * Suscripción pública desde el footer (NO requiere login)
 */
export async function suscribirPublica(req, res) {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "Debes indicar un email válido." });
    }

    const correo = email.trim().toLowerCase();

    // Origen para meta
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";

    // ¿Ya existe?
    let suscriptor = await NewsletterSuscriptor.findOne({ email: correo });

    const nuevoToken = generarToken();

    if (!suscriptor) {
      // Crear nuevo en estado pendiente
      suscriptor = await NewsletterSuscriptor.create({
        email: correo,
        estado: "pendiente",
        tokenConfirmacion: nuevoToken,
        fechaAlta: new Date(),
        meta: {
          origen: "web",
          ipAlta: ip,
          userAgentAlta: userAgent,
        },
      });
    } else {
      // Si ya estaba ACTIVO, simplemente reenviamos un enlace nuevo
      // o confirmamos que ya está suscrito.
      if (suscriptor.estado === "activo") {
        // Opcional: puedes regenerar token si quieres
        suscriptor.tokenConfirmacion = nuevoToken;
        await suscriptor.save();
      } else {
        // Si estaba pendiente o de baja → reactivamos como pendiente
        suscriptor.estado = "pendiente";
        suscriptor.tokenConfirmacion = nuevoToken;
        suscriptor.fechaAlta = suscriptor.fechaAlta || new Date();
        suscriptor.fechaBaja = null;
        await suscriptor.save();
      }
    }

    // Enlace de confirmación hacia el FRONT
    const urlConfirmacion = `${PUBLIC_URL}/confirmar-newsletter?token=${encodeURIComponent(
      suscriptor.tokenConfirmacion
    )}`;

    // Contenido del email
    const subject = "Confirma tu suscripción a Explora Huelva";
    const text = `
Hola,

Has solicitado recibir rutas, planes y lugares destacados de Explora Huelva.

Para confirmar tu suscripción, haz clic en el siguiente enlace:

${urlConfirmacion}

Si tú no solicitaste esta suscripción, puedes ignorar este correo.

Un saludo,
Equipo de Explora Huelva
    `.trim();

    const html = `
<p>Hola,</p>

<p>
  Has solicitado recibir <strong>rutas, planes y lugares destacados</strong> de
  <strong>Explora Huelva</strong> en tu correo.
</p>

<p>
  Para confirmar tu suscripción, haz clic en el siguiente botón:
</p>

<p>
  <a href="${urlConfirmacion}" 
     style="display:inline-block;padding:10px 18px;background:#0d6efd;color:#fff;
            text-decoration:none;border-radius:4px;font-weight:bold;">
    Confirmar suscripción
  </a>
</p>

<p>Si el botón no funciona, también puedes copiar y pegar este enlace en tu navegador:</p>
<p><a href="${urlConfirmacion}">${urlConfirmacion}</a></p>

<p style="font-size:12px;color:#666;margin-top:20px;">
  Si tú no solicitaste esta suscripción, puedes ignorar este correo.
</p>

<p>Un saludo,<br>Equipo de Explora Huelva</p>
    `.trim();

    // Enviar correo real
    try {
      await enviarCorreo({
        to: correo,
        subject,
        text,
        html,
      });
      console.log("📧 [NEWSLETTER] Email de confirmación enviado a:", correo);
    } catch (e) {
      console.error("❌ [NEWSLETTER] Error enviando email:", e);
      // Opcionalmente podrías marcar estado distinto,
      // pero para el usuario mantenemos un mensaje genérico.
    }

    return res.json({
      ok: true,
      mensaje:
        "Te hemos enviado un correo para confirmar tu suscripción. Revisa también la carpeta de Spam o correo no deseado.",
    });
  } catch (err) {
    console.error("❌ Error en suscribirPublica:", err);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error interno al suscribirse." });
  }
}

/**
 * GET /api/newsletter/confirmar?token=...
 * Confirma la suscripción a partir del token del email
 * La página del FRONT (ConfirmarNewsletter.jsx) llama aquí.
 */
export async function confirmarNewsletter(req, res) {
  try {
    const { token } = req.query || {};

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        ok: false,
        mensaje:
          "El enlace de confirmación es incorrecto o está incompleto. Vuelve a solicitar la suscripción desde la web.",
      });
    }

    const suscriptor = await NewsletterSuscriptor.findOne({
      tokenConfirmacion: token,
    });

    if (!suscriptor) {
      return res.status(400).json({
        ok: false,
        mensaje:
          "El enlace de confirmación no es válido o ya ha sido utilizado.",
      });
    }

    // Activar suscripción
    suscriptor.estado = "activo";
    suscriptor.fechaConfirmacion = new Date();
    suscriptor.tokenConfirmacion = undefined;
    await suscriptor.save();

    return res.json({
      ok: true,
      mensaje:
        "¡Suscripción confirmada correctamente! A partir de ahora recibirás rutas, planes y lugares destacados en tu correo.",
    });
  } catch (err) {
    console.error("❌ Error en confirmarNewsletter:", err);
    return res.status(500).json({
      ok: false,
      mensaje:
        "No se ha podido confirmar la suscripción en este momento. Inténtalo más tarde.",
    });
  }
}

/**
 * POST /api/newsletter/baja
 * Dar de baja un email de la newsletter.
 */
export async function bajaNewsletter(req, res) {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({
        ok: false,
        mensaje: "Por favor, introduce el correo con el que te suscribiste.",
      });
    }

    const correo = email.trim().toLowerCase();

    const suscriptor = await NewsletterSuscriptor.findOne({ email: correo });

    if (!suscriptor) {
      // Por seguridad, no revelamos si el correo no estaba
      return res.json({
        ok: true,
        mensaje:
          "Hemos tramitado tu baja de la newsletter. Es posible que todavía recibas algún correo que ya estuviera en cola, pero no seguirás recibiendo nuevas comunicaciones.",
      });
    }

    if (suscriptor.estado === "baja") {
      return res.json({
        ok: true,
        mensaje:
          "Tu correo ya estaba dado de baja de la newsletter. No recibirás nuevas comunicaciones.",
      });
    }

    suscriptor.estado = "baja";
    suscriptor.fechaBaja = new Date();
    await suscriptor.save();

    return res.json({
      ok: true,
      mensaje:
        "Hemos tramitado tu baja de la newsletter. Es posible que todavía recibas algún correo que ya estuviera en cola, pero no seguirás recibiendo nuevas comunicaciones.",
    });
  } catch (err) {
    console.error("❌ Error en bajaNewsletter:", err);
    return res.status(500).json({
      ok: false,
      mensaje:
        "No ha sido posible tramitar la baja en este momento. Inténtalo otra vez más tarde.",
    });
  }
}
