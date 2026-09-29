/* ============================================================
   AUTENTICACIÓN DE GESTIÓN — sin backend
   ------------------------------------------------------------
   Usuarios = los fijos de src/config/admin.js (PERMANENTES)
   + los colaboradores cargados desde EQUIPO (localStorage).
   La sesión queda en el aparato hasta cerrar sesión (pensado
   para kiosks y personas no técnicas: no vence).
   ============================================================ */

import { ADMIN_USERS } from '../config/admin.js';
import { read, write } from './store.js';

const USERS_KEY = 'users:v1';
const SESSION_KEY = 'session:v1';

export function getLocalUsers() {
  return read(USERS_KEY, []);
}

export function getUsers() {
  return [
    ...ADMIN_USERS.map((u) => ({ ...u, builtin: true })),
    ...getLocalUsers().map((u) => ({ ...u, builtin: false })),
  ];
}

export function login(username, password) {
  const u = String(username ?? '').trim().toLowerCase();
  const p = String(password ?? '');
  const found = getUsers().find(
    (x) => x.username.toLowerCase() === u && x.password === p
  );
  if (!found) return null;
  write(SESSION_KEY, {
    u: found.username,
    name: found.name ?? found.username,
    at: Date.now(),
  });
  return found;
}

export function logout() {
  write(SESSION_KEY, null);
}

export function currentUser() {
  const s = read(SESSION_KEY, null);
  return s && typeof s.u === 'string' ? s : null;
}

export function addUser({ name, username, password }) {
  const clean = {
    name: String(name ?? '').trim(),
    username: String(username ?? '').trim().toLowerCase(),
    password: String(password ?? ''),
  };
  if (clean.name.length < 2) return { error: 'Falta el nombre de la persona.' };
  if (clean.username.length < 3)
    return { error: 'El usuario necesita al menos 3 letras.' };
  if (!/^[a-z0-9._-]+$/.test(clean.username))
    return {
      error: 'El usuario solo puede tener letras, números, punto y guion.',
    };
  if (clean.password.length < 4)
    return { error: 'La clave necesita al menos 4 caracteres.' };
  if (getUsers().some((u) => u.username === clean.username))
    return { error: 'Ese usuario ya existe.' };
  write(USERS_KEY, [...getLocalUsers(), clean]);
  return { user: clean };
}

export function removeUser(username) {
  if (ADMIN_USERS.some((u) => u.username === username)) {
    return { error: 'Ese usuario es permanente: se cambia en el código.' };
  }
  write(
    USERS_KEY,
    getLocalUsers().filter((u) => u.username !== username)
  );
  return { ok: true };
}
