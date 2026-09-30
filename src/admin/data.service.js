/* ============================================================
   DATOS DE GESTIÓN — fachada nube / local
   ------------------------------------------------------------
   - Con Supabase disponible: todo va a la nube (lugares,
     secciones, export/import v2). El caché se invalida solo.
   - Sin Supabase (tests, demo, sin librería): modo local
     (localStorage), exactamente como antes.
   La UI no sabe en qué modo está.
   ============================================================ */

import { SERVICES } from '../config/services.js';
import { read, write } from './store.js';
import {
  isSupabaseAvailable,
  sb,
  readCache,
} from '../services/supabase.service.js';
import {
  cloudAddPlace,
  cloudUpdatePlace,
  cloudSetPlaceActive,
  cloudDeletePlace,
  cloudAddService,
  cloudRemoveService,
  cloudExport,
  cloudImport,
} from './cloud.service.js';

const PLACES_KEY = 'places:v1';
const SERVICES_KEY = 'services:v1';
const OVERRIDES_KEY = 'overrides:v1';

export function slugify(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function newId(text) {
  const base = slugify(text) || 'lugar';
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ---------- Lecturas (modo local; la nube las resuelve por caché) ---------- */

export function getCustomPlaces() {
  return read(PLACES_KEY, []);
}

export function getOverrides() {
  return read(OVERRIDES_KEY, {});
}

export function getCustomServices() {
  if (isSupabaseAvailable()) {
    const cache = readCache();
    return Array.isArray(cache?.services) ? cache.services : [];
  }
  return read(SERVICES_KEY, []);
}

/* ---------- Ajustes de la cartelería (SIEMPRE por aparato) ---------- */

const BOARD_SETTINGS_KEY = 'board-settings:v1';
const BOARD_DEFAULTS = { autoScroll: true, autoScrollSeconds: 10, rotateSeconds: 6 };

function clampNumber(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function getBoardSettings() {
  const s = read(BOARD_SETTINGS_KEY, {});
  return {
    autoScroll: s.autoScroll !== false,
    autoScrollSeconds: clampNumber(
      s.autoScrollSeconds, 3, 120, BOARD_DEFAULTS.autoScrollSeconds
    ),
    rotateSeconds: clampNumber(s.rotateSeconds, 2, 60, BOARD_DEFAULTS.rotateSeconds),
  };
}

export function saveBoardSettings({ autoScroll, autoScrollSeconds, rotateSeconds }) {
  const prev = getBoardSettings();
  write(BOARD_SETTINGS_KEY, {
    autoScroll: Boolean(autoScroll),
    autoScrollSeconds: clampNumber(autoScrollSeconds, 3, 120, prev.autoScrollSeconds),
    rotateSeconds: clampNumber(rotateSeconds, 2, 60, prev.rotateSeconds),
  });
  return getBoardSettings();
}

/* ---------- Implementaciones LOCALES ---------- */

function localAddPlace(place) {
  const custom = getCustomPlaces();
  const withMeta = {
    active: true,
    origin: 'local',
    createdAt: Date.now(),
    ...place,
    id: place.id ?? newId(place.name),
  };
  custom.push(withMeta);
  write(PLACES_KEY, custom);
  return withMeta;
}

function localUpdatePlace(place) {
  const custom = getCustomPlaces();
  const idx = custom.findIndex((p) => p.id === place.id);
  if (idx >= 0) {
    custom[idx] = { ...custom[idx], ...place, origin: 'local' };
    write(PLACES_KEY, custom);
    return;
  }
  const overrides = getOverrides();
  overrides[place.id] = { ...overrides[place.id], edited: place };
  write(OVERRIDES_KEY, overrides);
}

function localSetPlaceActive(id, active) {
  const custom = getCustomPlaces();
  const idx = custom.findIndex((p) => p.id === id);
  if (idx >= 0) {
    custom[idx].active = Boolean(active);
    write(PLACES_KEY, custom);
    return;
  }
  const overrides = getOverrides();
  overrides[id] = { ...overrides[id], active: Boolean(active) };
  write(OVERRIDES_KEY, overrides);
}

function localDeletePlace(id) {
  const custom = getCustomPlaces();
  if (custom.some((p) => p.id === id)) {
    write(PLACES_KEY, custom.filter((p) => p.id !== id));
    return;
  }
  const overrides = getOverrides();
  overrides[id] = { ...overrides[id], deleted: true };
  write(OVERRIDES_KEY, overrides);
}

function localAddCustomService({ label, icon }) {
  const services = read(SERVICES_KEY, []);
  const svc = buildService({ label, icon }, services);
  services.push(svc);
  write(SERVICES_KEY, services);
  return svc;
}

function localRemoveCustomService(id) {
  write(SERVICES_KEY, read(SERVICES_KEY, []).filter((s) => s.id !== id));
}

function localExport() {
  return JSON.stringify(
    {
      app: 'ayuda-cerca',
      v: 1,
      exportedAt: new Date().toISOString(),
      customPlaces: getCustomPlaces(),
      customServices: read(SERVICES_KEY, []),
      overrides: getOverrides(),
      localUsers: read('users:v1', []),
    },
    null,
    2
  );
}

function localImport(text) {
  const data = JSON.parse(text);
  if (typeof data !== 'object' || data === null) throw new Error('formato');
  if (Array.isArray(data.customPlaces)) {
    const map = new Map(getCustomPlaces().map((p) => [p.id, p]));
    for (const p of data.customPlaces) if (p?.id) map.set(p.id, p);
    write(PLACES_KEY, [...map.values()]);
  }
  if (Array.isArray(data.customServices)) {
    const map = new Map(read(SERVICES_KEY, []).map((s) => [s.id, s]));
    for (const s of data.customServices) if (s?.id) map.set(s.id, s);
    write(SERVICES_KEY, [...map.values()]);
  }
  if (typeof data.overrides === 'object' && data.overrides !== null) {
    write(OVERRIDES_KEY, { ...getOverrides(), ...data.overrides });
  }
  if (Array.isArray(data.localUsers)) {
    const map = new Map(read('users:v1', []).map((u) => [u.username, u]));
    for (const u of data.localUsers) if (u?.username) map.set(u.username, u);
    write('users:v1', [...map.values()]);
  }
  return {
    places: Array.isArray(data.customPlaces) ? data.customPlaces.length : 0,
    services: Array.isArray(data.customServices) ? data.customServices.length : 0,
    users: Array.isArray(data.localUsers) ? data.localUsers.length : 0,
  };
}

/* ---------- Helper: construir sección con id único ---------- */

function buildService({ label, icon }, existing) {
  const base = slugify(label) || 'seccion';
  let id = base;
  let n = 2;
  const exists = (x) =>
    SERVICES.some((s) => s.id === x) || existing.some((s) => s.id === x);
  while (exists(id)) id = `${base}-${n++}`;
  return {
    id,
    label: String(label).trim().toUpperCase(),
    icon: String(icon ?? '').trim() || '📌',
  };
}

/* ============================================================
   FACHADA — nube si está disponible, local si no
   ============================================================ */

export async function addPlace(place) {
  if (isSupabaseAvailable()) {
    const full = { active: true, ...place, id: place.id ?? newId(place.name) };
    return cloudAddPlace(full);
  }
  return localAddPlace(place);
}

export async function updatePlace(place) {
  if (isSupabaseAvailable()) return cloudUpdatePlace(place);
  return localUpdatePlace(place);
}

export async function setPlaceActive(id, active) {
  if (isSupabaseAvailable()) return cloudSetPlaceActive(id, active);
  return localSetPlaceActive(id, active);
}

export async function deletePlace(id) {
  if (isSupabaseAvailable()) return cloudDeletePlace(id);
  return localDeletePlace(id);
}

export async function addCustomService({ label, icon }) {
  const svc = buildService({ label, icon }, getCustomServices());
  if (isSupabaseAvailable()) return cloudAddService(svc);
  return localAddCustomService({ label, icon });
}

export async function removeCustomService(id) {
  if (isSupabaseAvailable()) return cloudRemoveService(id);
  return localRemoveCustomService(id);
}

export async function exportData() {
  if (isSupabaseAvailable()) {
    const { data: places, error } = await sb().from('places').select('*').order('name');
    if (error) throw new Error('No se pudo leer la nube para exportar.');
    return cloudExport(places ?? [], getCustomServices());
  }
  return localExport();
}

export async function importData(text) {
  const payload = JSON.parse(text); // si no es JSON, lanza (lo atrapa el caller)
  if (isSupabaseAvailable()) return cloudImport(payload);
  return localImport(text);
}

