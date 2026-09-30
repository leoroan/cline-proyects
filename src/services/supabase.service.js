/* ============================================================
   SUPABASE — cliente, disponibilidad, caché y helpers
   ------------------------------------------------------------
   - isSupabaseAvailable(): false en Node/tests/sin librería →
     toda la app cae a modo local (mock/localStorage) y sigue
     andando. Nunca rompe.
   - Caché en localStorage: lugares + secciones + versión de
     datos. La app pide primero SOLO la versión (data_version());
     si no cambió, no baja nada.
   ============================================================ */

import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  EMAIL_DOMAIN,
} from '../config/supabase.js';

const CACHE_KEY = 'ayuda-cerca:cache:v1';

let client = null;

export function isSupabaseAvailable() {
  return (
    typeof window !== 'undefined' &&
    typeof window.supabase?.createClient === 'function' &&
    Boolean(SUPABASE_URL) &&
    Boolean(SUPABASE_PUBLISHABLE_KEY)
  );
}

export function sb() {
  if (!isSupabaseAvailable()) throw new Error('Supabase no disponible');
  if (!client) {
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  return client;
}

/** "maria.norte" → "maria.norte@acerca.local" · email queda igual */
export function toEmail(username) {
  const u = String(username ?? '').trim().toLowerCase();
  return u.includes('@') ? u : u + EMAIL_DOMAIN;
}

/* ---------- Caché de datos (lugares + secciones + versión) ---------- */

export function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* sin espacio: se sigue sin caché */
  }
}

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* nada que hacer */
  }
}
