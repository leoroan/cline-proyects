/* ============================================================
   TARJETA DE LUGAR GUARDADO
   ------------------------------------------------------------
   A diferencia de la tarjeta de resultados (que muestra UN
   servicio: el que se está buscando), la guardada muestra el
   estado de TODOS los servicios que ofrece el lugar, porque
   es "su" lugar: quiere verlo completo de un vistazo.
   ============================================================ */

import { esc } from '../utils/html.js';
import { serviceById } from '../config/services.js';
import { getServiceStatus } from '../services/time.service.js';
import { directionsUrl } from '../services/geo.service.js';

function serviceLine(place, serviceId, now) {
  const service = serviceById(serviceId);
  const st = getServiceStatus(place.schedule?.[serviceId], now);
  const icon = service?.icon ?? '•';
  const label = service?.label ?? serviceId;
  const tone = st?.tone ?? 'closed';

  const parts = [];
  if (st?.display) parts.push(`${st.display.when} ${st.display.open} → ${st.display.close}`);
  parts.push(st ? st.title : 'Horario a confirmar');

  return `<p class="saved-line status--${tone}">
      <span class="status__dot" aria-hidden="true"></span>
      <span><strong><span aria-hidden="true">${icon}</span> ${esc(label)}</strong>
      · ${esc(parts.join(' · '))}</span>
    </p>`;
}

export function savedCard({ place, now = new Date() }) {
  return `
  <article class="place place--saved">
    <h3 class="place__name">${esc(place.name)}</h3>
    ${place.services.map((sid) => serviceLine(place, sid, now)).join('')}
    <p class="place__row"><span aria-hidden="true">📍</span> ${esc(place.address)}</p>
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
    <div class="place__actions">
      <a class="btn-directions" href="${directionsUrl(place)}" target="_blank" rel="noopener">
        <span aria-hidden="true">📍</span> CÓMO LLEGAR
      </a>
      <button type="button" class="btn-save is-saved" data-save="${esc(place.id)}" aria-pressed="true">
        ✔ GUARDADO
      </button>
    </div>
  </article>`;
}
