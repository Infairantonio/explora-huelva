import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';

import rutaSalud from './rutas/salud.ruta.js';
import rutaAuth from './rutas/auth.ruta.js';

const app = express();

const PUERTO = process.env.PUERTO_INTERNO || 5174;
const CADENA_MONGO = process.env.CADENA_MONGO;

app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONT_ORIGEN || 'http://localhost:5173'
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ ok: true, servicio: 'API Explora Huelva', ruta: '/', hora: new Date().toISOString() });
});

app.use('/api/salud', rutaSalud);
app.use('/api/auth', rutaAuth);

app.listen(PUERTO, () => {
  console.log(`✅ API escuchando en http://localhost:${PUERTO}`);
  if (!CADENA_MONGO) {
    console.warn('⚠️  Falta CADENA_MONGO en variables de entorno');
    return;
  }
  mongoose.connect(CADENA_MONGO)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error conectando a MongoDB:', err.message));
});

export default app;
