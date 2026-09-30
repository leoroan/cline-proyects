/* ============================================================
   ACCESO A DATOS — única puerta de entrada
   ------------------------------------------------------------
   Orden de prioridad, siempre sin romper:
   1. Supabase (nube) con CACHÉ en localStorage:
      - se pide solo la VERSIÓN (data_version); si no cambió,
        no se baja nada. Si falla la red, se usa la última caché.
   2. Modo local (tests, demo, sin librería): mock + gestión
      local en localStorage.

   La UI no conoce el origen: siempre recibe lugares ya
   fusionados y filtrados (activos salvo para gestión).
   ============================================================ */

import { MOCK_PLACES } from '../data/places.mock.js';
import { getCustomPlaces, getOverrides } from '../admin/data.service.js';
import {
  isSupabaseAvailable,
  sb,
  readCache,
  writeCache,
} from './supabase.service.js';

const API_URL = null; // futura API propia (si no es Supabase)

async function fetchBasePlaces() {
  if (!API_URL) {
    await new Promise((r) => setTimeout(r, 120)); // latencia simulada
    return MOCK_PLACES;
  }
  const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Error ${res.status} al obtener los lugares`);
  return res.json();
}

function filterActive(places, includeInactive) {
  return includeInactive ? places : places.filter((p) => p.active !== false);
}

/* ---------- Modo local (mock + gestión local) ---------- */

function mergeLocal(base, { includeInactive = false } = {}) {
  const overrides = getOverrides();
  const all = [...base, ...getCustomPlaces()]
    .filter((p) => !overrides[p.id]?.deleted)
    .map((p) => (overrides[p.id]?.edited ? { ...p, ...overrides[p.id].edited } : p))
    .map((p) => ({ ...p, active: overrides[p.id]?.active ?? p.active ?? true }));
  return filterActive(all, includeInactive);
}

/* ---------- Modo nube (Supabase + caché por versión) ---------- */

async function getCloudPlaces({ includeInactive = false } = {}) {
  const cache = readCache();
  try {
    // 1 request chiquita: ¿cambió algo?
    const { data: version, error: vError } = await sb().rpc('data_version');
    if (vError) throw vError;

    if (cache?.version && cache.version === version && Array.isArray(cache.places)) {
      return filterActive(cache.places, includeInactive); // nada cambió ✔
    }

    const { data: places, error } = await sb().from('places').select('*').order('name');
    if (error) throw error;
    const { data: services, error: sError } = await sb()
      .from('custom_services')
      .select('*')
      .order('label');
    if (sError) throw sError;

    writeCache({
      version,
      places: places ?? [],
      services: services ?? [],
      at: Date.now(),
    });
    return filterActive(places ?? [], includeInactive);
  } catch {
    // Sin red o sin sesión: última caché; si no hay, modo local
    if (cache?.places) return filterActive(cache.places, includeInactive);
    return mergeLocal(await fetchBasePlaces(), { includeInactive });
  }
}

export async function getPlaces(options) {
  if (isSupabaseAvailable()) return getCloudPlaces(options);
  return mergeLocal(await fetchBasePlaces(), options);
}
