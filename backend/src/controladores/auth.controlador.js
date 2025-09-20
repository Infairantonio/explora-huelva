// backend/src/controladores/auth.controlador.js
// ————————————————————————————————————————————————
// Controlador de autenticación: registro, login y perfil.
// Comentado línea a línea y con pequeñas mejoras no disruptivas.
// Mantiene el mismo contrato de respuesta para no romper el frontend.
// ————————————————————————————————————————————————

import bcrypt from 'bcryptjs'; // Hash seguro de contraseñas
import jwt from 'jsonwebtoken'; // Emisión/verificación de JWT
import Usuario from '../modelos/usuario.modelo.js'; // Modelo Mongoose del usuario

// Variables de entorno con valores por defecto sensatos
const {
  JWT_SECRETO,
  JWT_EXP = '7d', // Vida del token (igual que antes)
  BCRYPT_ROUNDS = '12', // Coste de hash; 12 es un buen equilibrio
} = process.env;

// Utilidad para firmar JWT de forma consistente
const firmarJWT = (usuario) => {
  if (!JWT_SECRETO) {
    // Evita firmar tokens sin secreto definido
    throw new Error('Falta JWT_SECRETO en variables de entorno');
  }

  // Carga útil mínima necesaria; no incluir datos sensibles
  const payload = {
    uid: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
  };

  // Se podría añadir issuer/audience si lo necesitas a futuro
  return jwt.sign(payload, JWT_SECRETO, { expiresIn: JWT_EXP });
};

// Validación muy básica de email (suficiente para front/back simples)
const emailValido = (email) => /.+@.+\..+/.test(email);

export const registrar = async (req, res) => {
  try {
    // Extracción y normalización de datos de entrada
    let { nombre, email, password } = req.body || {};
    nombre = (nombre || '').trim();
    email = (email || '').trim().toLowerCase(); // normaliza para evitar duplicados por mayúsculas
    password = (password || '').toString();

    // Validaciones básicas (sin romper el flujo actual)
    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos' });
    }
    if (!emailValido(email)) {
      return res.status(422).json({ ok: false, mensaje: 'Email no válido' });
    }
    if (password.length < 6) {
      return res.status(422).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Comprobar si ya existe un usuario con ese email
    const existe = await Usuario.findOne({ email });
    if (existe) {
      return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado' });
    }

    // Hash de la contraseña con número de rondas configurable
    const saltRounds = parseInt(BCRYPT_ROUNDS, 10) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear el usuario (el esquema debería definir email único idealmente)
    const usuario = await Usuario.create({ nombre, email, passwordHash });

    // Emitir JWT y responder (no devolvemos passwordHash)
    const token = firmarJWT(usuario);
    return res
      .status(201)
      .json({ ok: true, token, usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email } });
  } catch (e) {
    // Manejo particular para duplicados (por si hay índice único en Mongo)
    if (e && e.code === 11000) {
      return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado' });
    }
    console.error('❌ Error en registrar:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error al registrar', detalle: e.message });
  }
};

export const iniciarSesion = async (req, res) => {
  try {
    // Normalizar email por si llega con espacios/mayúsculas
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = (req.body?.password || '').toString();

    // Por coherencia, la respuesta para email inexistente o password errónea es la misma
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      // Pequeña pausa opcional para mitigar enumeración (comentada para no afectar rendimiento)
      // await new Promise(r => setTimeout(r, 150));
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    const ok = await bcrypt.compare(password, usuario.passwordHash);
    if (!ok) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    const token = firmarJWT(usuario);

    // (Opcional futuro) registrar último acceso: await Usuario.findByIdAndUpdate(usuario._id, { ultimoAcceso: new Date() });

    return res.json({ ok: true, token, usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email } });
  } catch (e) {
    console.error('❌ Error en iniciarSesion:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión', detalle: e.message });
  }
};

export const perfil = async (_req, res) => {
  // Se asume que un middleware de autenticación ha poblado req.usuario previamente
  // Devuelve el perfil mínimo necesario (sin campos sensibles)
  return res.json({ ok: true, usuario: res.req.usuario });
};
