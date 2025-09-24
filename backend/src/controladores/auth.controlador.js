// backend/src/controladores/auth.controlador.js
// ————————————————————————————————————————————————
// Controlador de autenticación: registro, login y perfil.
// Usa métodos del modelo (setPassword/validatePassword) y utils/jwt.
// Mantiene el contrato de respuesta para no romper el frontend.
// ————————————————————————————————————————————————

import Usuario from '../modelos/usuario.modelo.js';
import { firmar, buildUserPayload } from '../utils/jwt.js';

// Variables de entorno con valores por defecto sensatos
const { JWT_EXP = '7d' } = process.env;

// Utilidad para firmar JWT de forma consistente con utils
const firmarJWT = (usuario) => firmar(buildUserPayload(usuario), { exp: JWT_EXP });

// Validación muy básica de email (suficiente para front/back simples)
const emailValido = (email) => /.+@.+\..+/.test(email);

export const registrar = async (req, res) => {
  try {
    // Extracción y normalización de datos de entrada
    let { nombre, email, password } = req.body || {};
    nombre = (nombre || '').trim();
    email = (email || '').trim().toLowerCase();
    password = (password || '').toString();

    // Validaciones básicas
    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos' });
    }
    if (!emailValido(email)) {
      return res.status(422).json({ ok: false, mensaje: 'Email no válido' });
    }
    if (password.length < 6) {
      return res.status(422).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Comprobar si ya existe
    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado' });
    }

    // Crear usuario y hashear password desde el modelo
    const usuario = new Usuario({ nombre, email });
    await usuario.setPassword(password);
    await usuario.save();

    // JWT + respuesta (sin passwordHash)
    const token = firmarJWT(usuario);
    return res
      .status(201)
      .json({ ok: true, token, usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email } });
  } catch (e) {
    if (e && e.code === 11000) {
      return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado' });
    }
    console.error('❌ Error en registrar:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error al registrar', detalle: e.message });
  }
};

export const iniciarSesion = async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = (req.body?.password || '').toString();

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    const ok = await usuario.validatePassword(password);
    if (!ok) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    const token = firmarJWT(usuario);
    return res.json({ ok: true, token, usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email } });
  } catch (e) {
    console.error('❌ Error en iniciarSesion:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión', detalle: e.message });
  }
};

export const perfil = (req, res) => {
  return res.json({ ok: true, usuario: req.usuario });
};
