/* ============================================================
   CONFIRMACIÓN TRAS ESCANEAR (#/guardar/:id)
   ------------------------------------------------------------
   La persona escaneó el QR de la pantalla grande y acá tiene
   lo que se lleva: el lugar guardado, visible al instante,
   con su botón de CÓMO LLEGAR.
   ============================================================ */

import { SAVED_TTL_DAYS } from '../services/saved.service.js';
import { savedCard } from '../components/saved-card.js';

export function renderSavedConfirm({ place, now }) {
  return `
  <div class="page">
    <p class="confirm-badge" role="status" id="contenido" tabindex="-1" data-focus>
      ✔ GUARDADO EN ESTE TELÉFONO
    </p>
    <p class="confirm-sub">
      Queda acá aunque cierres todo. Se borra solo a los ${SAVED_TTL_DAYS} días.
    </p>
    ${savedCard({ place, now })}
    <p class="confirm-back">
      <a class="back-link" href="#/">← IR AL INICIO</a>
    </p>
  </div>`;
}
