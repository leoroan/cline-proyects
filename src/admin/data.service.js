/* ============================================================
   DATOS LOCALES DE GESTIÓN — sin backend
   ------------------------------------------------------------
   Tres cosas conviven con los datos base (mock/API):
   - customPlaces:   lugares cargados a mano en este aparato.
   - overrides:      cambios sobre lugares base (editados,
                     desactivados o borrados) sin tocar el origen.
   - customServices: secciones nuevas (DUCHAS, VIANDAS…).

   Todo es localStorage + exportar/importar JSON para pasar
   los datos a otro aparato (TV, PC del centro, otro teléfono).
   ============================================================ */

import { SERVICES } from '../config/services.js';
import { read, write } from './store.js';

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

/* ---------- Lecturas ---------- */

export function getCustomPlaces() {
  return read(PLACES_KEY, []);
}

export function getOverrides() {
  return read(OVERRIDES_KEY, {});
}

export function getCustomServices() {
  return read(SERVICES_KEY, []);
}

/* ---------- Lugares ---------- */

export function addPlace(place) {
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

export function updatePlace(place) {
  const custom = getCustomPlaces();
  const idx = custom.findIndex((p) => p.id === place.id);
  if (idx >= 0) {
    custom[idx] = { ...custom[idx], ...place, origin: 'local' };
    write(PLACES_KEY, custom);
    return;
  }
  // Es un lugar base: el cambio queda como override (el origen intacto)
  const overrides = getOverrides();
  overrides[place.id] = { ...overrides[place.id], edited: place };
  write(OVERRIDES_KEY, overrides);
}

export function setPlaceActive(id, active) {
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

export function deletePlace(id) {
  const custom = getCustomPlaces();
  if (custom.some((p) => p.id === id)) {
    write(
      PLACES_KEY,
      custom.filter((p) => p.id !== id)
    );
    return;
  }
  const overrides = getOverrides();
  overrides[id] = { ...overrides[id], deleted: true };
  write(OVERRIDES_KEY, overrides);
}

/* ---------- Secciones nuevas ---------- */

export function addCustomService({ label, icon }) {
  const services = getCustomServices();
  const base = slugify(label) || 'seccion';
  let id = base;
  let n = 2;
  const exists = (x) =>
    SERVICES.some((s) => s.id === x) || services.some((s) => s.id === x);
  while (exists(id)) id = `${base}-${n++}`;

  const svc = {
    id,
    label: String(label).trim().toUpperCase(),
    icon: String(icon ?? '').trim() || '📌',
  };
  services.push(svc);
  write(SERVICES_KEY, services);
  return svc;
}

export function removeCustomService(id) {
  write(
    SERVICES_KEY,
    getCustomServices().filter((s) => s.id !== id)
  );
}

/* ---------- Exportar / importar (pasar datos a otro aparato) ---------- */

export function exportData() {
  return JSON.stringify(
    {
      app: 'ayuda-cerca',
      v: 1,
      exportedAt: new Date().toISOString(),
      customPlaces: getCustomPlaces(),
      customServices: getCustomServices(),
      overrides: getOverrides(),
      localUsers: read('users:v1', []),
    },
    null,
    2
  );
}

export function importData(text) {
  const data = JSON.parse(text); // si no es JSON, lanza (lo atrapa el caller)
  if (typeof data !== 'object' || data === null) throw new Error('formato');

  // Fusión por id: lo importado gana. Nada se pierde.
  if (Array.isArray(data.customPlaces)) {
    const map = new Map(getCustomPlaces().map((p) => [p.id, p]));
    for (const p of data.customPlaces) if (p?.id) map.set(p.id, p);
    write(PLACES_KEY, [...map.values()]);
  }
  if (Array.isArray(data.customServices)) {
    const map = new Map(getCustomServices().map((s) => [s.id, s]));
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

/* ---------- Ajustes de la cartelería (por aparato) ---------- */

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
