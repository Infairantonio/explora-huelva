// backend/src/controladores/auth.controlador.js
// ————————————————————————————————————————————————
// Controlador de autenticación:
//   - Registro con verificación por email
//   - Inicio de sesión con JWT + refresh (cookie httpOnly)
//   - Refresh de token, logout y cierre de todas las sesiones
//   - Gestión de verificación de correo y reseteo de contraseña
// Respuesta base: { ok, token?, usuario? }.
// ————————————————————————————————————————————————

import crypto from "crypto";
import Usuario from "../modelos/usuario.modelo.js";
import Sesion from "../modelos/sesion.modelo.js";
import { firmar, buildUserPayload } from "../utils/jwt.js";
import { enviarCorreo } from "../utils/email.js";
import { validarPasswordFuerte } from "../utils/validarPasswordFuerte.js";

// Configuración básica
const {
  JWT_EXP = "15m",
  NODE_ENV = "development",
  REFRESH_DIAS = "30",
  REFRESH_DIAS_REMEMBER = "60",
  PUBLIC_URL = "http://localhost:5173", // Front para /verifica y /reset
} = process.env;

const isProd = NODE_ENV === "production";

const firmarJWT = (usuario) =>
  firmar(buildUserPayload(usuario), { exp: JWT_EXP });

const emailValido = (email) => /.+@.+\..+/.test(email);

// Helpers para tokens y fechas
const genTokenHex = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");
const generarRefreshToken = (bytes = 48) =>
  crypto.randomBytes(bytes).toString("hex");
const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const fechaExpDias = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() + Number(dias));
  return d;
};

// Cookies de refresh
function setRefreshCookie(res, rawRefresh, dias) {
  res.cookie("refresh", rawRefresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: Number(dias) * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res) {
  res.clearCookie("refresh", { path: "/api/auth" });
}

// ————————————————————————————————————————————————
// REGISTRO (requiere verificación por email)
// ————————————————————————————————————————————————
export const registrar = async (req, res) => {
  try {
    let { nombre, email, password } = req.body || {};
    nombre = (nombre || "").trim();
    email = (email || "").trim().toLowerCase();
    password = (password || "").toString();

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, mensaje: "Faltan campos" });
    }

    if (!emailValido(email)) {
      return res.status(422).json({ ok: false, mensaje: "Email no válido" });
    }

    // Validación de contraseña fuerte
    const { ok: passOk, errores: passErrores } =
      validarPasswordFuerte(password);
    if (!passOk) {
      return res.status(422).json({
        ok: false,
        mensaje: "La contraseña no cumple los requisitos de seguridad.",
        detalles: passErrores,
        requisitos: [
          "Mínimo 10 caracteres",
          "Al menos 1 mayúscula y 1 minúscula",
          "Al menos 1 número",
          "Al menos 1 símbolo",
          "Evitar secuencias (abc, 123, qwe)",
        ],
      });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res
        .status(409)
        .json({ ok: false, mensaje: "El email ya está registrado" });
    }

    // Creación de usuario y datos de verificación
    const usuario = new Usuario({ nombre, email });
    await usuario.setPassword(password);

    usuario.emailVerified = false;
    usuario.verificationToken = genTokenHex(32);
    usuario.verificationExpires = new Date(Date.now() + 24 * 3600 * 1000); // 24h
    await usuario.save();

    // Envío de correo de verificación
    const baseFront = process.env.PUBLIC_URL || PUBLIC_URL;
    const link = `${baseFront}/verifica?token=${usuario.verificationToken}`;

    try {
      await enviarCorreo({
        to: email,
        subject: "Verifica tu cuenta en Explora Huelva",
        html: `<p>Hola ${nombre},</p>
               <p>Confirma tu correo pulsando este enlace:</p>
               <p><a href="${link}" target="_blank" rel="noopener">${link}</a></p>
               <p>Caduca en 24 horas.</p>`,
        text: `Hola ${nombre}, confirma tu correo: ${link} (caduca en 24h)`,
      });
    } catch (e) {
      console.error("Error enviando email de verificación:", e.message);
      // Se devuelve ok igualmente; el usuario puede solicitar un reenvío
    }

    return res.status(201).json({
      ok: true,
      necesitaVerificar: true,
      email,
    });
  } catch (e) {
    console.error("registrar:", e);
    return res.status(500).json({
      ok: false,
      mensaje: "Error al registrar",
      detalle: e.message,
    });
  }
};

// ————————————————————————————————————————————————
// LOGIN
// ————————————————————————————————————————————————
export const iniciarSesion = async (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = (req.body?.password || "").toString();
    const remember = Boolean(req.body?.remember);

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res
        .status(401)
            .json({ ok: false, mensaje: "Credenciales inválidas" });
    }

    // Usuario marcado como eliminado
    if (usuario.eliminado) {
      return res.status(403).json({
        ok: false,
        mensaje: "Tu cuenta ha sido desactivada. Contacta con el administrador.",
      });
    }

    // Bloqueo manual o temporal
    if (typeof usuario.isLocked === "function" && usuario.isLocked()) {
      const msg = usuario.bloqueado
        ? "Tu cuenta está bloqueada por el administrador."
        : "Cuenta bloqueada temporalmente por intentos fallidos. Inténtalo más tarde.";
      return res.status(423).json({ ok: false, mensaje: msg });
    }

    const ok = await usuario.validatePassword(password);
    if (!ok) {
      try {
        usuario.startLoginLockIfNeeded?.();
        await usuario.save();
      } catch {
        // No se bloquea el flujo por errores en esta actualización
      }
      return res
        .status(401)
        .json({ ok: false, mensaje: "Credenciales inválidas" });
    }

    // Requiere correo verificado
    if (!usuario.emailVerified) {
      return res
        .status(403)
        .json({ ok: false, mensaje: "Email no verificado." });
    }

    // Reset de bloqueo, si aplica, y registro de último login
    if (usuario.failedLoginCount || usuario.lockUntil) {
      try {
        usuario.resetLoginLock?.();
      } catch {
        // Silencioso si la función no existe o falla
      }
    }
    usuario.lastLoginAt = new Date();
    await usuario.save();

    const token = firmarJWT(usuario);

    const rawRefresh = generarRefreshToken();
    const tokenHash = hashToken(rawRefresh);
    const dias = remember ? REFRESH_DIAS_REMEMBER : REFRESH_DIAS;
    const expiresAt = fechaExpDias(dias);

    await Sesion.create({
      userId: usuario._id,
      tokenHash,
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
      expiresAt,
    });

    setRefreshCookie(res, rawRefresh, dias);

    res.json({
      ok: true,
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email,
        rol: usuario.rol,
      },
    });
  } catch (e) {
    console.error("iniciarSesion:", e);
    res.status(500).json({
      ok: false,
      mensaje: "Error al iniciar sesión",
      detalle: e.message,
    });
  }
};

// ————————————————————————————————————————————————
// REFRESH (nuevo JWT a partir del refresh cookie)
// ————————————————————————————————————————————————
export const refrescar = async (req, res) => {
  try {
    const raw = req.cookies?.refresh;
    if (!raw) {
      return res.status(401).json({ ok: false, mensaje: "Sin refresh" });
    }

    const tokenHash = hashToken(raw);
    const sesion = await Sesion.findOne({ tokenHash, revoked: false });

    if (!sesion || sesion.expiresAt < new Date()) {
      return res.status(401).json({ ok: false, mensaje: "Refresh inválido" });
    }

    const usuario = await Usuario.findById(sesion.userId);
    if (!usuario) {
      return res
        .status(401)
        .json({ ok: false, mensaje: "Usuario no encontrado" });
    }

    // No renovar si la cuenta ahora está bloqueada o eliminada
    if (
      usuario.eliminado ||
      (typeof usuario.isLocked === "function" && usuario.isLocked())
    ) {
      return res.status(403).json({
        ok: false,
        mensaje: "La sesión ya no es válida. Vuelve a iniciar sesión.",
      });
    }

    const token = firmarJWT(usuario);
    res.json({ ok: true, token });
  } catch (e) {
    console.error("refrescar:", e);
    res.status(500).json({
      ok: false,
      mensaje: "Error al refrescar",
      detalle: e.message,
    });
  }
};

// ————————————————————————————————————————————————
// LOGOUT (solo la sesión actual) y LOGOUT-ALL
// ————————————————————————————————————————————————
export const cerrarSesion = async (req, res) => {
  try {
    const raw = req.cookies?.refresh;
    if (raw) {
      const tokenHash = hashToken(raw);
      await Sesion.updateOne(
        { tokenHash },
        { $set: { revoked: true } }
      );
    }
    clearRefreshCookie(res);
    res.json({ ok: true });
  } catch (e) {
    res
      .status(500)
      .json({ ok: false, mensaje: "Error al cerrar sesión" });
  }
};

export const cerrarSesiones = async (req, res) => {
  try {
    const userId = req.usuario?.id || req.usuario?._id || req.usuario?.sub;
    if (!userId) {
      return res.status(401).json({ ok: false, mensaje: "No autorizado" });
    }

    await Sesion.updateMany(
      { userId },
      { $set: { revoked: true } }
    );
    clearRefreshCookie(res);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({
      ok: false,
      mensaje: "Error al cerrar todas las sesiones",
    });
  }
};

// ————————————————————————————————————————————————
// PERFIL (datos del usuario autenticado)
// ————————————————————————————————————————————————
export const perfil = (req, res) => {
  res.json({ ok: true, usuario: req.usuario });
};

// ————————————————————————————————————————————————
// VERIFICAR EMAIL / REENVIAR VERIFICACIÓN
// ————————————————————————————————————————————————
export const verificarEmail = async (req, res) => {
  try {
    const token = (req.query?.token || "").trim();
    if (!token) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "Token requerido" });
    }

    const user = await Usuario.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        mensaje: "Token inválido o caducado",
      });
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    res.json({ ok: true, mensaje: "Email verificado" });
  } catch (e) {
    console.error("verificarEmail:", e);
    res
      .status(500)
      .json({ ok: false, mensaje: "Error al verificar" });
  }
};

export const reenviarVerificacion = async (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    if (!emailValido(email)) {
      return res
        .status(422)
        .json({ ok: false, mensaje: "Email no válido" });
    }

    const user = await Usuario.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "No existe usuario con ese email" });
    }
    if (user.emailVerified) {
      return res.json({ ok: true, mensaje: "Ya estaba verificado" });
    }

    user.verificationToken = genTokenHex(32);
    user.verificationExpires = new Date(Date.now() + 24 * 3600 * 1000);
    await user.save();

    const link = `${PUBLIC_URL}/verifica?token=${user.verificationToken}`;
    await enviarCorreo({
      to: email,
      subject: "Verifica tu cuenta en Explora Huelva (reenviado)",
      html: `<p>Hola,</p>
             <p>Pulsa para verificar tu correo:</p>
             <p><a href="${link}" target="_blank" rel="noopener">${link}</a></p>`,
      text: `Verifica tu correo: ${link}`,
    });

    res.json({ ok: true, mensaje: "Correo de verificación reenviado" });
  } catch (e) {
    console.error("reenviarVerificacion:", e);
    res.status(500).json({
      ok: false,
      mensaje: "Error al reenviar verificación",
    });
  }
};

// ————————————————————————————————————————————————
// OLVIDÉ PASSWORD / RESET PASSWORD
// ————————————————————————————————————————————————
export const olvidePassword = async (req, res) => {
  try {
    const email = (req.body?.email || "").trim().toLowerCase();
    if (!emailValido(email)) {
      return res
        .status(422)
        .json({ ok: false, mensaje: "Email no válido" });
    }

    const user = await Usuario.findOne({ email });

    if (user) {
      user.resetToken = genTokenHex(32);
      user.resetExpires = new Date(Date.now() + 3600 * 1000); // 1h
      await user.save();

      const link = `${PUBLIC_URL}/reset?token=${user.resetToken}`;
      await enviarCorreo({
        to: email,
        subject: "Restablece tu contraseña",
        html: `<p>Para restablecer tu contraseña, pulsa:</p>
               <p><a href="${link}" target="_blank" rel="noopener">${link}</a></p>
               <p>El enlace caduca en 1 hora.</p>`,
        text: `Restablece tu contraseña: ${link} (caduca en 1h)`,
      });
    }

    // No se indica si el email existe o no en la base de datos
    res.json({ ok: true });
  } catch (e) {
    console.error("olvidePassword:", e);
    res.status(500).json({
      ok: false,
      mensaje: "Error al enviar enlace",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token) {
      return res
        .status(400)
        .json({ ok: false, mensaje: "Token requerido" });
    }

    // Validación de contraseña fuerte en el cambio
    const {
      ok: passOkReset,
      errores: passErrReset,
    } = validarPasswordFuerte(newPassword || "");
    if (!passOkReset) {
      return res.status(422).json({
        ok: false,
        mensaje:
          "La nueva contraseña no cumple los requisitos de seguridad.",
        detalles: passErrReset,
      });
    }

    const user = await Usuario.findOne({
      resetToken: token,
      resetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        mensaje: "Token inválido o caducado",
      });
    }

    await user.setPassword(newPassword);
    user.resetToken = null;
    user.resetExpires = null;
    await user.save();

    res.json({ ok: true, mensaje: "Contraseña actualizada" });
  } catch (e) {
    console.error("resetPassword:", e);
    res.status(500).json({
      ok: false,
      mensaje: "Error al restablecer contraseña",
    });
  }
};
