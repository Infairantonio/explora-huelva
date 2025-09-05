import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../modelos/usuario.modelo.js';

const firmarJWT = (usuario) => {
  return jwt.sign(
    { uid: usuario._id, nombre: usuario.nombre, email: usuario.email },
    process.env.JWT_SECRETO,
    { expiresIn: '7d' }
  );
};

export const registrar = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos' });
    }
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(409).json({ ok: false, mensaje: 'El email ya está registrado' });

    const passwordHash = await bcrypt.hash(password, 12);
    const usuario = await Usuario.create({ nombre, email, passwordHash });

    const token = firmarJWT(usuario);
    res.status(201).json({ ok: true, token, usuario: { id: usuario._id, nombre, email } });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: 'Error al registrar', detalle: e.message });
  }
};

export const iniciarSesion = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });

    const ok = await bcrypt.compare(password, usuario.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas' });

    const token = firmarJWT(usuario);
    res.json({ ok: true, token, usuario: { id: usuario._id, nombre: usuario.nombre, email: usuario.email } });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: 'Error al iniciar sesión', detalle: e.message });
  }
};

export const perfil = async (req, res) => {
  res.json({ ok: true, usuario: req.usuario });
};
