/* ============================================================
   TARJETA DE LUGAR
   ------------------------------------------------------------
   Muestra exactamente lo que la persona necesita decidir:
   nombre → estado → horario → dirección → (disponibilidad) →
   (teléfono) → CÓMO LLEGAR. Nada más.

   Extras según el dispositivo:
   - Botón GUARDAR (toggle): lo guarda en este teléfono.
   - QR "escaneá y llevatelo": sólo visible en pantallas más
     grandes que un celular (lo maneja el CSS). En un celular
     no tiene sentido: no podés escanear tu propia pantalla.
   ============================================================ */

import { esc } from '../utils/html.js';
import { directionsUrl, formatDistance } from '../services/geo.service.js';
import { saveLink } from '../services/saved.service.js';
import { qrSvg } from './qr.js';

export function placeCard({ place, status, distance = null, saved = false }) {
  const statusHtml = status
    ? `<p class="status status--${status.tone}">
         <span class="status__dot" aria-hidden="true"></span>
         <span><strong>${esc(status.title)}</strong>${
           status.sub ? ` <span class="status__sub">· ${esc(status.sub)}</span>` : ''
         }</span>
       </p>`
    : `<p class="status status--closed">
         <span class="status__dot" aria-hidden="true"></span>
         <span><strong>Horario a confirmar</strong></span>
       </p>`;

  const d = status?.display;

  return `
  <article class="place">
    <h3 class="place__name">${esc(place.name)}</h3>
    ${statusHtml}
    ${
      d
        ? `<p class="place__row"><span aria-hidden="true">🕐</span> <strong>${esc(
            d.when
          )}</strong>&nbsp;·&nbsp;${esc(d.open)} → ${esc(d.close)}</p>`
        : ''
    }
    <p class="place__row"><span aria-hidden="true">📍</span> ${esc(place.address)}${
      distance != null ? ` · <strong>${esc(formatDistance(distance))}</strong>` : ''
    }</p>
    ${
      place.availability
        ? `<p class="place__availability">${esc(place.availability)}</p>`
        : ''
    }
    ${
      place.phone
        ? `<p class="place__row"><span aria-hidden="true">📞</span> <a href="tel:${esc(
            String(place.phone).replace(/[^0-9+]/g, '')
          )}">${esc(place.phone)}</a></p>`
        : ''
    }
    ${place.notes ? `<p class="place__notes">${esc(place.notes)}</p>` : ''}
    <div class="place__actions">
      <a class="btn-directions" href="${directionsUrl(place)}" target="_blank" rel="noopener">
        <span aria-hidden="true">📍</span> CÓMO LLEGAR
      </a>
      <button type="button" class="btn-save${saved ? ' is-saved' : ''}"
        data-save="${esc(place.id)}" aria-pressed="${saved}">
        ${saved ? '✔ GUARDADO' : '＋ GUARDAR'}
      </button>
    </div>
    <div class="qr-block">
      ${qrSvg(saveLink(place.id))}
      <p class="qr-block__label">ESCANEÁ Y LLEVATELO</p>
    </div>
  </article>`;
}
