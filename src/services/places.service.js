/* ============================================================
   ACCESO A DATOS — única puerta de entrada
   ------------------------------------------------------------
   La UI NO conoce el origen de los datos. Hoy son mocks;
   cuando exista la API, sólo se toca este archivo:

     const API_URL = 'https://api.tu-organizacion.org/places';

   El contrato es el del mock (ver src/data/places.mock.js).
   La interfaz ya soporta, sin rediseño:
   - lugares nuevos
   - servicios nuevos (vía src/config/services.js)
   - horarios por servicio, cierres y turnos nocturnos
   - disponibilidad, teléfono y notas (opcionales)
   ============================================================ */

import { MOCK_PLACES } from '../data/places.mock.js';

const API_URL = null; // null = usar mocks

export async function getPlaces() {
  if (!API_URL) {
    // Pequeña latencia simulada para ejercitar el estado de carga.
    await new Promise((r) => setTimeout(r, 120));
    return MOCK_PLACES;
  }
  const res = await fetch(API_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Error ${res.status} al obtener los lugares`);
  return res.json();
}
