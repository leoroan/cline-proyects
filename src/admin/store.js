/* Capa mínima sobre localStorage para la zona de gestión.
   Tolerante a todo: si falla, devuelve el fallback. */

const PREFIX = 'ayuda-cerca:admin:';

export function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
