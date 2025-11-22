// backend/src/controladores/contacto.controlador.js
// ————————————————————————————————————————————————
// Controlador de contacto / newsletter.
// Ahora mismo: valida, registra en consola y responde OK.
// Más adelante lo conectamos al sistema de envío de correos
// que ya usas para "recuperar contraseña".
// ————————————————————————————————————————————————

export async function enviarContacto(req, res) {
  try {
    const { email, mensaje } = req.body || {};

    const emailTrim = (email || "").toString().trim();
    const msgTrim = (mensaje || "").toString().trim() || "Mensaje desde Explora Huelva";

    if (!emailTrim) {
      return res.status(400).json({ ok: false, mensaje: "El email es obligatorio" });
    }

    // Validación básica de email
    const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!reEmail.test(emailTrim)) {
      return res.status(400).json({ ok: false, mensaje: "Email no válido" });
    }

    // 🔹 Aquí en el futuro enganchamos tu helper de correo (el mismo que uses para recuperar contraseña)
    // await enviarCorreo({
    //   para: process.env.CONTACTO_DESTINATARIO || "tu_correo@dominio.com",
    //   asunto: "Nuevo contacto / newsletter desde Explora Huelva",
    //   texto: `Email: ${emailTrim}\n\nMensaje:\n${msgTrim}`,
    // });

    console.log("📩 Nuevo contacto/newsletter:", {
      email: emailTrim,
      mensaje: msgTrim,
      fecha: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Contacto recibido correctamente",
    });
  } catch (e) {
    console.error("❌ Error en enviarContacto:", e);
    return res
      .status(500)
      .json({ ok: false, mensaje: "Error procesando contacto", error: e.message });
  }
}
