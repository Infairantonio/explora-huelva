// backend/src/controladores/contacto.controlador.js
// ————————————————————————————————————————————————
// Controlador de formulario de contacto / newsletter.
// Valida el email y mensaje, registra la entrada y responde.
// En el futuro se conectará al sistema real de envío de correos.
// ————————————————————————————————————————————————

export async function enviarContacto(req, res) {
  try {
    const { email, mensaje } = req.body || {};

    const emailTrim = (email || "").toString().trim();
    const msgTrim =
      (mensaje || "").toString().trim() || "Mensaje desde Explora Huelva";

    if (!emailTrim) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "El email es obligatorio" });
    }

    // Validación simple de email
    const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!reEmail.test(emailTrim)) {
      return res.status(400).json({ ok: false, mensaje: "Email no válido" });
    }

    // Punto donde se integrará el envío real por correo
    // await enviarCorreo({
    //   para: process.env.CONTACTO_DESTINATARIO || "tu_correo@dominio.com",
    //   asunto: "Nuevo contacto desde Explora Huelva",
    //   texto: `Email: ${emailTrim}\n\nMensaje:\n${msgTrim}`,
    // });

    console.log("📩 Contacto recibido:", {
      email: emailTrim,
      mensaje: msgTrim,
      fecha: new Date().toISOString(),
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Contacto recibido correctamente",
    });
  } catch (e) {
    console.error("Error en enviarContacto:", e);
    return res.status(500).json({
      ok: false,
      mensaje: "Error procesando contacto",
      error: e.message,
    });
  }
}
