// backend/src/controladores/auth.controlador.js
// ————————————————————————————————————————————————
// Controlador de autenticación: registro, login, refresh, verificación y reset.
// Mantiene contrato { ok, token, usuario } y usa cookie httpOnly 'refresh'.
// ————————————————————————————————————————————————
import crypto from 'crypto';
import Usuario from '../modelos/usuario.modelo.js';
import Sesion from '../modelos/sesion.modelo.js';
import { firmar, buildUserPayload } from '../utils/jwt.js';
import { enviarCorreo } from '../utils/email.js';

// ====== Config ======
const {
  JWT_EXP = '15m',
  NODE_ENV = 'development',
  REFRESH_DIAS = '30',
  REFRESH_DIAS_REMEMBER = '60',
  PUBLIC_URL = 'http://localhost:5173', // Front para enlaces /verifica y /reset
} = process.env;
const isProd = NODE_ENV === 'production';

const firmarJWT = (usuario) => firmar(buildUserPayload(usuario), { exp: JWT_EXP });
const emailValido = (email) => /.+@.+\..+/.test(email);

// ====== Helpers ======
const genTokenHex = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
const generarRefreshToken = (bytes = 48) => crypto.randomBytes(bytes).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const fechaExpDias = (dias) => {
  const d = new Date();
  d.setDate(d.getDate() + Number(dias));
  return d;
};

function setRefreshCookie(res, rawRefresh, dias) {
  res.cookie('refresh', rawRefresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: Number(dias) * 24 * 60 * 60 * 1000,
  });
}
function clearRefreshCookie(res) {
  res.clearCookie('refresh', { path: '/api/auth' });
}

// ————————————————————————————————————————————————
// REGISTRO (sin autologin; requiere verificación por email)
// ————————————————————————————————————————————————
export const registrar = async (req, res) => {
  try {
    let { nombre, email, password } = req.body || {};
    nombre = (nombre || '').trim();
    email = (email || '').trim().toLowerCase();
    password = (password || '').toString();

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos' });
    }
    if (!emailValido(email)) {
      return res.status(422).json({ ok: false, mensaje: 'Email no válido' });
    }
    if (password.length < 6) {
      return res.status(422).json({ ok: false, mensaje: 'Contraseña demasiado corta' });
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado' });
    }

    // Crear usuario y preparar verificación
    const usuario = new Usuario({ nombre, email });
    await usuario.setPassword(password);

    usuario.emailVerified = false;
    usuario.verificationToken = genTokenHex(32);
    usuario.verificationExpires = new Date(Date.now() + 24 * 3600 * 1000); // 24h
    await usuario.save();

    // Enviar correo de verificación (no bloqueante)
    const baseFront = process.env.PUBLIC_URL || PUBLIC_URL;
    const link = `${baseFront}/verifica?token=${usuario.verificationToken}`;
    try {
      await enviarCorreo({
        to: email,
        subject: 'Verifica tu cuenta en Explora Huelva',
        html: `<p>Hola ${nombre},</p>
               <p>Confirma tu correo pulsando este enlace:</p>
               <p><a href="${link}" target="_blank" rel="noopener">${link}</a></p>
               <p>Caduca en 24 horas.</p>`,
        text: `Hola ${nombre}, confirma tu correo: ${link} (caduca en 24h)`,
      });
    } catch (e) {
      console.error('⚠️ Error enviando email de verificación:', e.message);
      // Devolvemos ok igualmente; el usuario puede pedir "reenviar verificación"
    }

    return res.status(201).json({
      ok: true,
      necesitaVerificar: true,
      email,
    });
  } catch (e) {
    console.error('❌ registrar:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error al registrar', detalle: e.message });
  }
};

// ————————————————————————————————————————————————
// LOGIN
// ————————————————————————————————————————————————
export const iniciarSesion = async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = (req.body?.password || '').toString();
    const remember = Boolean(req.body?.remember);

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });

    if (usuario.lockUntil && usuario.lockUntil > new Date()) {
      return res.status(423).json({ ok: false, mensaje: 'Cuenta bloqueada temporalmente' });
    }

    const ok = await usuario.validatePassword(password);
    if (!ok) {
      try {
        usuario.startLoginLockIfNeeded?.();
        await usuario.save();
      } catch {}
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    // Exigir verificación antes de login
    if (!usuario.emailVerified) {
      return res.status(403).json({ ok: false, mensaje: 'Email no verificado.' });
    }

    // Resetear lock/contador si procede
    if (usuario.failedLoginCount || usuario.lockUntil) {
      try {
        usuario.resetLoginLock?.();
        await usuario.save();
      } catch {}
    }

    const token = firmarJWT(usuario);

    const rawRefresh = generarRefreshToken();
    const tokenHash = hashToken(rawRefresh);
    const dias = remember ? REFRESH_DIAS_REMEMBER : REFRESH_DIAS;
    const expiresAt = fechaExpDias(dias);

    await Sesion.create({
      userId: usuario._id,
      tokenHash,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
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
    console.error('❌ iniciarSesion:', e);
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión', detalle: e.message });
  }
};

// ————————————————————————————————————————————————
// REFRESH
// ————————————————————————————————————————————————
export const refrescar = async (req, res) => {
  try {
    const raw = req.cookies?.refresh;
    if (!raw) return res.status(401).json({ ok: false, mensaje: 'Sin refresh' });

    const tokenHash = hashToken(raw);
    const sesion = await Sesion.findOne({ tokenHash, revoked: false });
    if (!sesion || sesion.expiresAt < new Date()) {
      return res.status(401).json({ ok: false, mensaje: 'Refresh inválido' });
    }

    const usuario = await Usuario.findById(sesion.userId);
    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    const token = firmarJWT(usuario);
    res.json({ ok: true, token });
  } catch (e) {
    console.error('❌ refrescar:', e);
    res.status(500).json({ ok: false, mensaje: 'Error al refrescar', detalle: e.message });
  }
};

// ————————————————————————————————————————————————
// LOGOUT Y LOGOUT-ALL
// ————————————————————————————————————————————————
export const cerrarSesion = async (req, res) => {
  try {
    const raw = req.cookies?.refresh;
    if (raw) {
      const tokenHash = hashToken(raw);
      await Sesion.updateOne({ tokenHash }, { $set: { revoked: true } });
    }
    clearRefreshCookie(res);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: 'Error al cerrar sesión' });
  }
};

export const cerrarSesiones = async (req, res) => {
  try {
    const userId = req.usuario?.id || req.usuario?._id || req.usuario?.sub;
    if (!userId) return res.status(401).json({ ok: false, mensaje: 'No autorizado' });

    await Sesion.updateMany({ userId }, { $set: { revoked: true } });
    clearRefreshCookie(res);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: 'Error al cerrar todas las sesiones' });
  }
};

// ————————————————————————————————————————————————
// PERFIL
// ————————————————————————————————————————————————
export const perfil = (req, res) => {
  res.json({ ok: true, usuario: req.usuario });
};

// ————————————————————————————————————————————————
// VERIFICAR / REENVIAR / OLVIDÉ / RESET
// ————————————————————————————————————————————————
export const verificarEmail = async (req, res) => {
  try {
    const token = (req.query?.token || '').trim();
    if (!token) return res.status(400).json({ ok: false, mensaje: 'Token requerido' });

    const user = await Usuario.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ ok: false, mensaje: 'Token inválido o caducado' });
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();

    res.json({ ok: true, mensaje: 'Email verificado' });
  } catch (e) {
    console.error('❌ verificarEmail:', e);
    res.status(500).json({ ok: false, mensaje: 'Error al verificar' });
  }
};

export const reenviarVerificacion = async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    if (!emailValido(email)) return res.status(422).json({ ok: false, mensaje: 'Email no válido' });

    const user = await Usuario.findOne({ email });
    if (!user) return res.status(404).json({ ok: false, mensaje: 'No existe usuario con ese email' });
    if (user.emailVerified) return res.json({ ok: true, mensaje: 'Ya estaba verificado' });

    user.verificationToken = genTokenHex(32);
    user.verificationExpires = new Date(Date.now() + 24 * 3600 * 1000);
    await user.save();

    const link = `${PUBLIC_URL}/verifica?token=${user.verificationToken}`;
    await enviarCorreo({
      to: email,
      subject: 'Verifica tu cuenta en Explora Huelva (reenviado)',
      html: `<p>Hola,</p>
             <p>Pulsa para verificar tu correo:</p>
             <p><a href="${link}" target="_blank" rel="noopener">${link}</a></p>`,
      text: `Verifica tu correo: ${link}`,
    });

    res.json({ ok: true, mensaje: 'Correo de verificación reenviado' });
  } catch (e) {
    console.error('❌ reenviarVerificacion:', e);
    res.status(500).json({ ok: false, mensaje: 'Error al reenviar verificación' });
  }
};

export const olvidePassword = async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    if (!emailValido(email)) return res.status(422).json({ ok: false, mensaje: 'Email no válido' });

    const user = await Usuario.findOne({ email });
    if (user) {
      user.resetToken = genTokenHex(32);
      user.resetExpires = new Date(Date.now() + 3600 * 1000); // 1h
      await user.save();

      const link = `${PUBLIC_URL}/reset?token=${user.resetToken}`;
      await enviarCorreo({
        to: email,
        subject: 'Restablece tu contraseña',
        html: `<p>Para restablecer tu contraseña, pulsa:</p>
               <p><a href="${link}" target="_blank" rel="noopener">${link}</a></p>
               <p>El enlace caduca en 1 hora.</p>`,
        text: `Restablece tu contraseña: ${link} (caduca en 1h)`,
      });
    }
    // No revelar si existe o no el email
    res.json({ ok: true });
  } catch (e) {
    console.error('❌ olvidePassword:', e);
    res.status(500).json({ ok: false, mensaje: 'Error al enviar enlace' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token) return res.status(400).json({ ok: false, mensaje: 'Token requerido' });
    if (!newPassword || newPassword.length < 6) {
      return res.status(422).json({ ok: false, mensaje: 'Contraseña demasiado corta' });
    }

    const user = await Usuario.findOne({
      resetToken: token,
      resetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ ok: false, mensaje: 'Token inválido o caducado' });
    }

    await user.setPassword(newPassword);
    user.resetToken = null;
    user.resetExpires = null;
    await user.save();

    res.json({ ok: true, mensaje: 'Contraseña actualizada' });
  } catch (e) {
    console.error('❌ resetPassword:', e);
    res.status(500).json({ ok: false, mensaje: 'Error al restablecer contraseña' });
  }
};
