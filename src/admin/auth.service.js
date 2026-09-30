/* ============================================================
   AUTENTICACIÓN DE GESTIÓN — fachada nube / local
   ------------------------------------------------------------
   - Con Supabase disponible: Supabase Auth (email+clave) y
     perfiles con rol. El "usuario" simple se mapea a email
     interno (@acerca.local); un email completo se usa tal cual.
     El equipo (alta/baja) se gestiona por Edge Function.
   - Sin Supabase: usuarios del config + localStorage (como antes).
   ============================================================ */

import { ADMIN_USERS } from '../config/admin.js';
import { read, write } from './store.js';
import {
  isSupabaseAvailable,
  sb,
  toEmail,
} from '../services/supabase.service.js';
import {
  cloudListUsers,
  cloudCreateUser,
  cloudDeleteUser,
} from './cloud.service.js';

const USERS_KEY = 'users:v1';
const SESSION_KEY = 'session:v1';

/* ============================================================
   MODO NUBE (Supabase Auth + profiles)
   ============================================================ */

async function fetchProfile(uid) {
  const { data } = await sb()
    .from('profiles')
    .select('name, role')
    .eq('id', uid)
    .maybeSingle();
  return data ?? null;
}

async function cloudLogin(username, password) {
  const email = toEmail(username);
  const { data, error } = await sb().auth.signInWithPassword({
    email,
    password: String(password ?? ''),
  });
  if (error || !data?.user) return null;
  const profile = await fetchProfile(data.user.id);
  return {
    u: email,
    name: profile?.name ?? email.split('@')[0],
    role: profile?.role ?? 'editor',
  };
}

async function cloudCurrentUser() {
  const {
    data: { session },
  } = await sb().auth.getSession();
  if (!session?.user) return null;
  const profile = await fetchProfile(session.user.id);
  return {
    u: session.user.email,
    name: profile?.name ?? session.user.email.split('@')[0],
    role: profile?.role ?? 'editor',
  };
}

/* ============================================================
   MODO LOCAL (config + localStorage) — sin cambios de antes
   ============================================================ */

function getLocalUsers() {
  return read(USERS_KEY, []);
}

function localLogin(username, password) {
  const u = String(username ?? '').trim().toLowerCase();
  const p = String(password ?? '');
  const found = [...ADMIN_USERS, ...getLocalUsers()].find(
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

function localCurrentUser() {
  const s = read(SESSION_KEY, null);
  return s && typeof s.u === 'string' ? s : null;
}

function localAddUser({ name, username, password }) {
  const clean = {
    name: String(name ?? '').trim(),
    username: String(username ?? '').trim().toLowerCase(),
    password: String(password ?? ''),
  };
  if (clean.name.length < 2) return { error: 'Falta el nombre de la persona.' };
  if (clean.username.length < 3)
    return { error: 'El usuario necesita al menos 3 letras.' };
  if (!/^[a-z0-9._-]+$/.test(clean.username))
    return { error: 'El usuario solo puede tener letras, números, punto y guion.' };
  if (clean.password.length < 6)
    return { error: 'La clave necesita al menos 6 caracteres.' };
  if (
    [...ADMIN_USERS, ...getLocalUsers()].some((u) => u.username === clean.username)
  )
    return { error: 'Ese usuario ya existe.' };
  write(USERS_KEY, [...getLocalUsers(), clean]);
  return { user: clean };
}

function localRemoveUser(username) {
  if (ADMIN_USERS.some((u) => u.username === username)) {
    return { error: 'Ese usuario es permanente: se cambia en el código.' };
  }
  write(USERS_KEY, getLocalUsers().filter((u) => u.username !== username));
  return { ok: true };
}

/* ============================================================
   FACHADA — nube si está disponible, local si no
   ============================================================ */

export async function login(username, password) {
  return isSupabaseAvailable()
    ? cloudLogin(username, password)
    : localLogin(username, password);
}

export async function logout() {
  if (isSupabaseAvailable()) {
    try {
      await sb().auth.signOut();
    } catch {
      /* aunque falle la red, la sesión local se limpia igual */
    }
  }
  write(SESSION_KEY, null);
}

export async function currentUser() {
  return isSupabaseAvailable() ? cloudCurrentUser() : localCurrentUser();
}

export async function getUsers() {
  if (isSupabaseAvailable()) {
    const users = await cloudListUsers();
    return users.map((u) => ({ ...u, builtin: false }));
  }
  return [
    ...ADMIN_USERS.map((u) => ({ ...u, role: 'admin', builtin: true })),
    ...getLocalUsers().map((u) => ({ ...u, role: 'editor', builtin: false })),
  ];
}

export async function addUser({ name, username, password }) {
  if (isSupabaseAvailable()) {
    const clean = {
      name: String(name ?? '').trim(),
      username: String(username ?? '').trim().toLowerCase(),
      password: String(password ?? ''),
    };
    if (clean.name.length < 2) return { error: 'Falta el nombre de la persona.' };
    if (!/^[a-z0-9._-]{3,}$/.test(clean.username))
      return { error: 'El usuario solo puede tener letras, números, punto y guion.' };
    if (clean.password.length < 6)
      return { error: 'La clave necesita al menos 6 caracteres.' };
    try {
      const res = await cloudCreateUser(clean);
      return { user: { name: clean.name, username: clean.username, ...res?.user } };
    } catch (e) {
      return { error: String(e?.message ?? e) };
    }
  }
  return localAddUser({ name, username, password });
}

export async function removeUser(idOrUsername) {
  if (isSupabaseAvailable()) {
    try {
      await cloudDeleteUser(idOrUsername);
      return { ok: true };
    } catch (e) {
      return { error: String(e?.message ?? e) };
    }
  }
  return localRemoveUser(idOrUsername);
}

