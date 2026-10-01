/* ============================================================
   MODO PANTALLA / CARTELERÍA (TV · PC grande · vertical y horizontal)
   ------------------------------------------------------------
   - Arriba: el TURNO de comida (AHORA / PRÓXIMO / MAÑANA) con
     los lugares que lo sirven hoy.
   - Abajo: TODAS las demás secciones como tarjetas.
   - Lo que no entra rota con CARRUSELES DE BOOTSTRAP (vendored,
     data-bs-ride con el intervalo configurable desde gestión).
     Si todo entra, queda quieto. Con reduced-motion, nada rota:
     se muestra todo y la página scrollea.
   ============================================================ */

import { esc } from '../utils/html.js';
import { saveLink } from '../services/saved.service.js';
import { formatDistance } from '../services/geo.service.js';
import { qrSvg } from '../components/qr.js';
import { serviceIcon } from '../components/service-icon.js';
import { appCredit } from '../components/credit.js';

function chunk(list, size) {
  const pages = [];
  for (let i = 0; i < list.length; i += size) {
    pages.push(list.slice(i, i + size));
  }
  return pages;
}

function dots(id, count) {
  const buttons = Array.from(
    { length: count },
    (_, i) =>
      `<button type="button" data-bs-target="#${id}" data-bs-slide-to="${i}"${
        i === 0 ? ' class="active" aria-current="true"' : ''
      } aria-label="Página ${i + 1}"></button>`
  ).join('');
  return `<div class="carousel-indicators board-dots">${buttons}</div>`;
}

/* Si hay más de lo que entra (y el movimiento está permitido):
   carrusel Bootstrap. Si no: todo quieto y a la vista. */
function rotating(id, items, pageSize, rotateMs, inner) {
  if (rotateMs > 0 && items.length > pageSize) {
    const pages = chunk(items, pageSize);
    return `
    <div id="${id}" class="carousel slide" data-bs-ride="carousel"
      data-bs-interval="${rotateMs}" data-bs-pause="false">
      <div class="carousel-inner">
        ${pages
          .map(
            (page, i) => `
          <div class="carousel-item${i === 0 ? ' active' : ''}">
            ${inner(page)}
          </div>`
          )
          .join('')}
      </div>
      ${dots(id, pages.length)}
    </div>`;
  }
  return inner(items);
}

function heroCard({ place, status, distance }) {
  const d = status?.display;
  const isOpen = status?.tone === 'open';
  const hours = d ? `${d.when} · ${d.open} → ${d.close}` : 'Horario a confirmar';

  return `
    <article class="hero-card${isOpen ? ' hero-card--open' : ''}">
      <div class="hero-card__info">
        <p class="hero-card__name">${esc(place.name)}</p>
        <p class="hero-card__meta">${esc(hours)}</p>
        <p class="hero-card__meta">${esc(place.address)}${
          distance != null ? ` · ${esc(formatDistance(distance))}` : ''
        }</p>
      </div>
      <div class="board-qr">
        ${qrSvg(saveLink(place.id))}
        <p class="board-qr__label">ESCANEAR</p>
      </div>
    </article>`;
}

function stripRow({ place, status, distance }) {
  const d = status?.display;
  const isOpen = status?.tone === 'open';
  const hours = d
    ? `${isOpen ? 'AHORA · ' : ''}${d.when} ${d.open} → ${d.close}`
    : 'Horario a confirmar';

  return `
    <div class="strip-row${isOpen ? ' strip-row--open' : ''}">
      <div class="strip-row__info">
        <p class="strip-row__name">${esc(place.name)}</p>
        <p class="strip-row__meta">${esc(hours)} — ${esc(place.address)}${
          distance != null ? ` · ${esc(formatDistance(distance))}` : ''
        }</p>
      </div>
      <div class="board-qr board-qr--sm">
        ${qrSvg(saveLink(place.id))}
        <p class="board-qr__label">ESCANEAR</p>
      </div>
    </div>`;
}

export function renderBoard({ hero, strips, layout, now }) {
  const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  let heroHtml = '';
  if (hero) {
    const title =
      hero.state === 'now'
        ? `AHORA · ${hero.service.label} · hasta las ${hero.shift.to}`
        : hero.state === 'next'
          ? `PRÓXIMO · ${hero.service.label} · desde las ${hero.shift.from}`
          : `MAÑANA · ${hero.service.label} · desde las ${hero.shift.from}`;

    heroHtml = `
    <section class="board-hero" aria-label="Turno de comida">
      <h2 class="board-hero__title">
        <span class="hero-dot hero-dot--${hero.state}" aria-hidden="true"></span>${serviceIcon(hero.service)} ${esc(title)}
      </h2>
      ${rotating(
        'hero-carousel',
        hero.items,
        layout.heroPage,
        layout.rotateMs,
        (page) =>
          page.length
            ? `<div class="board-hero__cards">${page.map(heroCard).join('')}</div>`
            : `<p class="board-hero__empty">No hay lugares cargados para este turno.</p>`
      )}
    </section>`;
  }

  return `
  <div class="board">
    <header class="board-header">
      <a class="board-exit" href="#/"><i class="bi bi-arrow-left" aria-hidden="true"></i> Salir</a>
      <h1 class="board-title" id="contenido" tabindex="-1" data-focus>Ayuda Cerca</h1>
      <p class="board-clock" aria-label="Hora actual"><i class="bi bi-clock" aria-hidden="true"></i> ${esc(time)}</p>
    </header>
    ${heroHtml}
    <div class="board-strip">
      ${strips
        .map(
          ({ service, items }) => `
        <article class="strip-card" aria-label="${esc(service.label)}">
          <h3>${serviceIcon(service)} ${esc(service.label)}</h3>
          ${rotating(
            `strip-carousel-${service.id}`,
            items,
            layout.rowsPerSection,
            layout.rotateMs,
            (rows) => rows.map(stripRow).join('')
          )}
        </article>`
        )
        .join('')}
    </div>
    <footer class="board-footer">
      Escaneá el QR y llevate el lugar en tu teléfono · La información se actualiza sola
      ${appCredit()}
    </footer>
  </div>`;
}

