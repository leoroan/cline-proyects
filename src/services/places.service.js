/* ============================================================
   ACCESO A DATOS — única puerta de entrada
   ------------------------------------------------------------
   La UI NO conoce el origen de los datos. Los lugares visibles
   son la fusión de:
   - base:   mock de desarrollo (mañana, la API) — intacta
   - locales: lugares cargados desde la zona de gestión
   - overrides: ediciones / desactivaciones / borrados hechos
     desde gestión sobre lugares base

   Para conectar la API real: poner la URL en API_URL.
   La UI no se entera: ya está desacoplada.
   ============================================================ */

import { MOCK_PLACES } from '../data/places.mock.js';
import { getCustomPlaces, getOverrides } from '../admin/data.service.js';

const API_URL = null; // ej.: 'https://api.tu-organizacion.org/places'

async function fetchBasePlaces() {
  if (!API_URL) {
    // Pequeña latencia simulada para ejercitar el estado de carga.
    await new Promise((r) => setTimeout(r, 120));
    return MOCK_PLACES;
  }
  const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Error ${res.status} al obtener los lugares`);
  return res.json();
}

function mergeLocal(base, { includeInactive = false } = {}) {
  const overrides = getOverrides();
  const all = [...base, ...getCustomPlaces()]
    .filter((p) => !overrides[p.id]?.deleted)
    .map((p) => (overrides[p.id]?.edited ? { ...p, ...overrides[p.id].edited } : p))
    .map((p) => ({ ...p, active: overrides[p.id]?.active ?? p.active ?? true }));

  // Inactivos sólo se ven dentro de la gestión.
  return includeInactive ? all : all.filter((p) => p.active !== false);
}

export async function getPlaces(options) {
  return mergeLocal(await fetchBasePlaces(), options);
}
