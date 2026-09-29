/* ============================================================
   CATÁLOGO DE SERVICIOS FUSIONADO
   ------------------------------------------------------------
   = servicios del código (src/config/services.js)
   + secciones creadas desde la zona de gestión (localStorage).

   Toda la app pide el catálogo ACÁ, así una sección nueva
   (DUCHAS, VIANDAS…) aparece sola en home, resultados,
   cartelería y formularios, sin tocar código.
   ============================================================ */

import { SERVICES } from '../config/services.js';
import { getCustomServices } from '../admin/data.service.js';

export function getServices() {
  return [...SERVICES, ...getCustomServices()];
}

export function getServiceById(id) {
  return getServices().find((s) => s.id === id) ?? null;
}
