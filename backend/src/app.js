import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';

import rutaSalud from './rutas/salud.ruta.js';

const app = express();

// Configuración
const PUERTO = process.env.PUERTO_INTERNO || 5174;
const CADENA_MONGO = process.env.CADENA_MONGO;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Rutas mínimas
app.get('/', (_req, res) => {
  res.json({ ok: true, servicio: 'API Explora Huelva', ruta: '/', hora: new Date().toISOString() });
});
app.use('/api/salud', rutaSalud);

// Arrancar servidor SIEMPRE
app.listen(PUERTO, () => {
  console.log(`✅ API escuchando en http://localhost:${PUERTO}`);
  // Conectar a Mongo en segundo plano (no bloquea el arranque)
  if (!CADENA_MONGO) {
    console.warn('⚠️  Falta CADENA_MONGO en variables de entorno (la API funciona pero sin BD)');
    return;
  }
  mongoose
    .connect(CADENA_MONGO)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error conectando a MongoDB:', err.message));
});
