/* ============================================================
   GESTIÓN — Lista de lugares y formulario (agregar / editar)
   ============================================================ */

import { esc } from '../../utils/html.js';
import { getServices } from '../../services/catalog.service.js';
import { MEAL_SHIFTS } from '../../config/shifts.js';
import { serviceIcon } from '../../components/service-icon.js';

/* Chips de días: empiezan el lunes (valor = día JS: 0 dom … 6 sáb) */
const DAY_CHIPS = [
  { d: 1, l: 'L', name: 'lunes' },
  { d: 2, l: 'M', name: 'martes' },
  { d: 3, l: 'M', name: 'miércoles' },
  { d: 4, l: 'J', name: 'jueves' },
  { d: 5, l: 'V', name: 'viernes' },
  { d: 6, l: 'S', name: 'sábado' },
  { d: 0, l: 'D', name: 'domingo' },
];

export function renderAdminPlaces({ places, flash = null }) {
  const services = getServices();
  const iconOf = (sid) =>
    serviceIcon(services.find((s) => s.id === sid) ?? { icon: '•' });

  return `
  <div class="page admin">
    <header class="page-header">
      <a class="back-link" href="#/admin"><i class="bi bi-arrow-left" aria-hidden="true"></i> GESTIÓN</a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>📋 Lugares</h2>
      <p class="admin-sub">
        <strong>ACTIVO</strong> = se ve en la app · <strong>EN PAUSA</strong> = no se ve
        (queda guardado para volver a activar).
      </p>
      ${flash ? `<p class="form-ok" role="status">${esc(flash)}</p>` : ''}
      <p><a class="btn-directions admin-submit" href="#/admin/nuevo">➕ AGREGAR LUGAR</a></p>
    </header>
    <div class="admin-list">
      ${places
        .map(
          (p) => `
        <article class="admin-place${p.active === false ? ' is-off' : ''}">
          <div class="admin-place__info">
            <h3>${esc(p.name)}</h3>
            <p>${p.services.map(iconOf).join(' ')} · ${esc(p.address)}</p>
            <p class="admin-place__badges">
              <span class="badge ${p.active === false ? 'badge--off' : 'badge--on'}">
                ${p.active === false ? 'EN PAUSA' : 'ACTIVO'}
              </span>
              ${p.origin === 'local' ? '<span class="badge">CARGADO ACÁ</span>' : ''}
            </p>
          </div>
          <div class="admin-place__actions">
            <a class="btn-secondary" href="#/admin/editar/${esc(p.id)}">EDITAR</a>
            <button type="button" class="btn-secondary" data-action="toggle-active"
              data-id="${esc(p.id)}" data-active="${p.active === false ? '0' : '1'}">
              ${p.active === false ? 'ACTIVAR' : 'DESACTIVAR'}
            </button>
            <button type="button" class="btn-danger" data-action="delete-place"
              data-id="${esc(p.id)}">BORRAR</button>
          </div>
        </article>`
        )
        .join('')}
    </div>
  </div>`;
}

function serviceBlock(svc, place) {
  const on = place?.services.includes(svc.id) ?? false;
  const win = on ? place?.schedule?.[svc.id]?.[0] : null;
  const days = win?.days ?? [1, 2, 3, 4, 5];
  // Horarios sugeridos según el turno de la comida (si es una)
  const shift = MEAL_SHIFTS.find((m) => m.serviceId === svc.id);
  const open = win?.open ?? shift?.from ?? '09:00';
  const close = win?.close ?? shift?.to ?? '17:00';

  return `
    <div class="svc${on ? ' is-on' : ''}">
      <label class="svc__toggle">
        <input type="checkbox" name="svc-${esc(svc.id)}" ${on ? 'checked' : ''} />
        <span class="svc__icon">${serviceIcon(svc)}</span>
        <span class="svc__label">${esc(svc.label)}</span>
      </label>
      <div class="svc__schedule">
        <p class="field-label">¿Qué días? <small>(tocá para prender o apagar)</small></p>
        <div class="day-chips">
          ${DAY_CHIPS.map(
            ({ d, l, name }) => `
            <label class="day-chip">
              <input type="checkbox" name="day-${esc(svc.id)}-${d}"
                ${days.includes(d) ? 'checked' : ''} aria-label="${name}" />
              <span aria-hidden="true">${l}</span>
            </label>`
          ).join('')}
        </div>
        <div class="time-row">
          <label class="time-field">DESDE
            <input type="time" name="open-${esc(svc.id)}" value="${esc(open)}" />
          </label>
          <label class="time-field">HASTA
            <input type="time" name="close-${esc(svc.id)}" value="${esc(close)}" />
          </label>
        </div>
        <p class="field-hint">
          Si pasa la medianoche (un refugio 20:00 → 08:00), se escribe así tal cual.
        </p>
      </div>
    </div>`;
}

export function renderPlaceForm({ place = null } = {}) {
  const editing = Boolean(place);
  const services = getServices();

  return `
  <div class="page admin">
    <header class="page-header">
      <a class="back-link" href="#/admin/lugares"><i class="bi bi-arrow-left" aria-hidden="true"></i> LUGARES</a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>
        ${editing ? '✏️ Editar lugar' : '➕ Agregar lugar'}
      </h2>
      <p class="admin-sub">
        Lo único obligatorio es el <strong>nombre</strong>, la <strong>dirección</strong>
        y <strong>qué ofrece</strong>. El resto se puede completar después.
      </p>
    </header>
    <form class="admin-form" data-form="place" data-editing="${editing ? esc(place.id) : ''}">
      <div class="form-errors" id="form-errors" role="alert" tabindex="-1" hidden></div>

      <div class="field">
        <label for="f-name">NOMBRE DEL LUGAR <em>*</em></label>
        <input id="f-name" name="name" type="text" required
          placeholder="Ej: Comedor San José" value="${esc(place?.name ?? '')}" />
        <p class="field-hint">Como lo conoce la gente.</p>
      </div>

      <div class="field">
        <label for="f-address">DIRECCIÓN O REFERENCIA <em>*</em></label>
        <input id="f-address" name="address" type="text" required
          placeholder="Ej: Calle 12 y 45" value="${esc(place?.address ?? '')}" />
        <p class="field-hint">
          Si no tiene número, una referencia sirve ("Plaza San Martín, lado sur").
        </p>
      </div>

      <div class="field">
        <label for="f-maps">UBICACIÓN EN EL MAPA (opcional)</label>
        <div class="maps-row">
          <input id="f-maps" name="mapslink" type="text"
            placeholder="Pegá acá el link de Google Maps" />
          <button type="button" class="btn-secondary" data-action="parse-maps-link">
            USAR ESTE LINK
          </button>
        </div>
        <button type="button" class="btn-secondary" data-action="use-location">
          📍 USAR MI UBICACIÓN ACTUAL
        </button>
        <p class="field-hint" id="maps-status">
          En Google Maps: buscá el lugar → <strong>Compartir</strong> →
          <strong>Copiar link</strong> → pegalo arriba. Así el botón CÓMO LLEGAR
          lleva justo a la puerta. Si no, no pasa nada: se usa la dirección escrita.
        </p>
        <input type="hidden" name="lat" value="${place?.latitude ?? ''}" />
        <input type="hidden" name="lng" value="${place?.longitude ?? ''}" />
      </div>

      <fieldset class="field admin-services">
        <legend>¿QUÉ OFRECE? <em>*</em></legend>
        <p class="field-hint">Prendé lo que da este lugar y completá días y horarios.</p>
        ${services.map((svc) => serviceBlock(svc, place)).join('')}
      </fieldset>

      <details class="field admin-more">
        <summary>MÁS DATOS (opcional)</summary>
        <div class="field">
          <label for="f-phone">TELÉFONO</label>
          <input id="f-phone" name="phone" type="tel" value="${esc(place?.phone ?? '')}" />
        </div>
        <div class="field">
          <label for="f-avail">CUPOS / DISPONIBILIDAD</label>
          <input id="f-avail" name="availability" type="text"
            placeholder="Ej: Entran 20 personas" value="${esc(place?.availability ?? '')}" />
        </div>
        <div class="field">
          <label for="f-notes">UN DATO ÚTIL</label>
          <input id="f-notes" name="notes" type="text"
            placeholder="Ej: Entrada por el costado" value="${esc(place?.notes ?? '')}" />
        </div>
      </details>

      <label class="active-toggle">
        <input type="checkbox" name="active" ${place?.active === false ? '' : 'checked'} />
        <span><strong>ESTÁ ACTIVO</strong> — se muestra en la app</span>
      </label>

      <button class="btn-directions admin-submit" type="submit">
        ${editing ? 'GUARDAR CAMBIOS' : 'GUARDAR LUGAR'}
      </button>
    </form>
  </div>`;
}

