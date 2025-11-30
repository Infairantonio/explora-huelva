// backend/src/middleware/requiereAdmin.js
// ————————————————————————————————————————————————
// Middleware para limitar el acceso a usuarios con rol "admin".
// Basado en requiereRol('admin'), para mantener consistencia.
// ————————————————————————————————————————————————

import requiereRol from './requiereRol.js';

// Exporta directamente el middleware especializado
export default requiereRol('admin');
