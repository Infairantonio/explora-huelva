// backend/src/utils/validarPasswordFuerte.js
// Requisitos:
// - Mínimo 10 caracteres
// - Al menos 1 mayúscula, 1 minúscula, 1 número y 1 símbolo
// - Sin secuencias obvias (abc, 123, qwe) y evita contraseñas muy comunes

const DENYLIST = new Set([
  "123456","123456789","password","qwerty","12345678","111111","123123",
  "12345","1234567890","000000","iloveyou","admin","welcome","abc123",
  "password1","1234","1q2w3e4r","123qwe"
]);

function hasSeq(str) {
  const s = str.toLowerCase();
  const lines = [
    "abcdefghijklmnopqrstuvwxyz",
    "qwertyuiopasdfghjklzxcvbnm",
    "0123456789"
  ];
  for (const line of lines) {
    for (let i = 0; i <= line.length - 3; i++) {
      const fwd = line.slice(i, i + 3);
      const rev = [...fwd].reverse().join("");
      if (s.includes(fwd) || s.includes(rev)) return true;
    }
  }
  return false;
}

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
