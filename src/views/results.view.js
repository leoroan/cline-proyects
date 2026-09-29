/* ============================================================
   RESULTADOS — sólo lugares que ofrecen el servicio elegido
   ------------------------------------------------------------
   Con ubicación: ordenados de más cerca a más lejos y
   "Hay N lugares cerca tuyo". Sin ubicación: primero los
   abiertos ahora. La app funciona igual en ambos casos.
   ============================================================ */

import { esc } from '../utils/html.js';
import { serviceIcon } from '../components/service-icon.js';
import { placeCard } from '../components/place-card.js';

function shell(service, inner) {
  return `
  <div class="page">
    <header class="page-header">
      <a class="back-link" href="#/"><i class="bi bi-arrow-left" aria-hidden="true"></i> VOLVER</a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>
        ${serviceIcon(service)} ${esc(service.label)}
      </h2>
    </header>
    ${inner}
  </div>`;
}

export function renderResultsLoading(service) {
  return shell(service, `<div class="loading" role="status">
       <div class="spinner-border loading__spinner" aria-hidden="true"></div>
       <p class="loading__text">Buscando lugares…</p>
     </div>`);
}

export function renderResultsError(service) {
  return shell(
    service,
    `<p class="error" role="alert">
       No se pudo cargar la información.<br />Revisá tu conexión y probá de nuevo.
     </p>
     <p><a class="btn-directions" href="#/s/${esc(service.id)}">REINTENTAR</a></p>`
  );
}

export function renderResults({ service, items, hasLocation, nearCount }) {
  let note;
  if (hasLocation && nearCount > 0) {
    note = `<p class="nearby-note">📍 Hay ${nearCount} ${
      nearCount === 1 ? 'lugar' : 'lugares'
    } cerca tuyo.</p>`;
  } else if (hasLocation) {
    note = `<p class="nearby-note">📍 Ordenado de más cerca a más lejos.</p>`;
  } else {
    note = `<p class="nearby-note nearby-note--hint">
      Con la ubicación activada, verías primero lo más cercano.
    </p>`;
  }

  const list = items.length
    ? `<div class="place-list">${items.map(placeCard).join('')}</div>`
    : `<p class="empty">Todavía no hay lugares cargados para este servicio.</p>`;

  return shell(service, note + list);
}
