// backend/src/utils/validarPasswordFuerte.js
// ————————————————————————————————————————————————————
// Validador de contraseñas fuertes para Explora Huelva.
//
// Requisitos mínimos:
//  ✓ Al menos 10 caracteres
//  ✓ ≥1 minúscula
//  ✓ ≥1 mayúscula
//  ✓ ≥1 número
//  ✓ ≥1 símbolo
//  ✓ No puede estar en lista de contraseñas comunes
//  ✓ Evita secuencias obvias: abc, 123, qwe (normal y al revés)
// ————————————————————————————————————————————————————

// Lista negra básica de contraseñas hiper-comunes
const DENYLIST = new Set([
  "123456", "123456789", "password", "qwerty", "12345678", "111111",
  "123123", "12345", "1234567890", "000000", "iloveyou", "admin",
  "welcome", "abc123", "password1", "1234", "1q2w3e4r", "123qwe"
]);

// Detecta secuencias como abc / cba / 123 / 321 / qwe / ewq
function hasSeq(str) {
  const s = str.toLowerCase();

  const patrones = [
    "abcdefghijklmnopqrstuvwxyz",
    "qwertyuiopasdfghjklzxcvbnm",
    "0123456789"
  ];

  for (const line of patrones) {
    for (let i = 0; i <= line.length - 3; i++) {
      const fwd = line.slice(i, i + 3);           // abc
      const rev = [...fwd].reverse().join("");    // cba
      if (s.includes(fwd) || s.includes(rev)) return true;
    }
  }
  return false;
}

// ————————————————————————————————————————————————
// Validador principal
// Devuelve:
//   { ok: true }  → contraseña fuerte
//   { ok: false, errores: [ ... ] }
// ————————————————————————————————————————————————
export function validarPasswordFuerte(password) {
  const errores = [];

  if (typeof password !== "string" || !password.trim()) {
    errores.push("La contraseña es obligatoria.");
    return { ok: false, errores };
  }

  if (DENYLIST.has(password)) errores.push("Contraseña demasiado común.");
  if (password.length < 10) errores.push("Debe tener al menos 10 caracteres.");
  if (!/[a-z]/.test(password)) errores.push("Debe contener al menos una minúscula.");
  if (!/[A-Z]/.test(password)) errores.push("Debe contener al menos una mayúscula.");
  if (!/[0-9]/.test(password)) errores.push("Debe contener al menos un número.");
  if (!/[^A-Za-z0-9]/.test(password)) errores.push("Debe contener al menos un símbolo.");
  if (hasSeq(password)) errores.push("Evita secuencias obvias (abc, 123, qwe).");

  return { ok: errores.length === 0, errores };
}
