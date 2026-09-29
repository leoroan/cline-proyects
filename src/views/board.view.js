/* ============================================================
   MODO PANTALLA / CARTELERÍA (TV · PC grande · vertical y horizontal)
   ------------------------------------------------------------
   - Arriba: el TURNO de comida (AHORA / PRÓXIMO / MAÑANA) con
     los lugares que lo sirven hoy, en carrusel si no entran.
   - Abajo: el resto de los servicios (ropa, dormir, futuros)
     como tarjetas, también con rotación.
   - TODO a la vista: la pantalla no scrollea (ver board.css).
   - Cada lugar tiene su QR para llevárselo al teléfono.
   ============================================================ */

import { esc } from '../utils/html.js';
import { saveLink } from '../services/saved.service.js';
import { formatDistance } from '../services/geo.service.js';
import { qrSvg } from '../components/qr.js';
import { pageOf } from '../utils/paginate.js';

function dots({ page, pageCount }) {
  if (pageCount <= 1) return '';
  const spans = Array.from(
    { length: pageCount },
    (_, i) => `<span class="${i === page ? 'on' : ''}"></span>`
  ).join('');
  return `<p class="dots" aria-hidden="true">${spans}</p>`;
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

export function renderBoard({ hero, strips, layout, tick, now }) {
  const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  let heroHtml = '';
  if (hero) {
    const title =
      hero.state === 'now'
        ? `AHORA · ${hero.service.icon} ${hero.service.label} · hasta las ${hero.shift.to}`
        : hero.state === 'next'
          ? `PRÓXIMO · ${hero.service.icon} ${hero.service.label} · desde las ${hero.shift.from}`
          : `MAÑANA · ${hero.service.icon} ${hero.service.label} · desde las ${hero.shift.from}`;

    const heroPage = pageOf(hero.items, layout.heroPage, tick);

    heroHtml = `
    <section class="board-hero" aria-label="Turno de comida">
      <h2 class="board-hero__title">
        <span class="hero-dot hero-dot--${hero.state}" aria-hidden="true"></span>${esc(title)}
      </h2>
      <div class="board-hero__cards">
        ${
          heroPage.items.length
            ? heroPage.items.map(heroCard).join('')
            : `<p class="board-hero__empty">No hay lugares cargados para este turno.</p>`
        }
      </div>
      ${dots(heroPage)}
    </section>`;
  }

  // Todas las secciones a la vista (si no entran, scrollea sola)
  return `
  <div class="board">
    <header class="board-header">
      <a class="board-exit" href="#/">← Salir</a>
      <h1 class="board-title" id="contenido" tabindex="-1" data-focus>Ayuda Cerca</h1>
      <p class="board-clock" aria-label="Hora actual">${esc(time)}</p>
    </header>
    ${heroHtml}
    <div class="board-strip">
      ${strips
        .map(({ service, items }) => {
          const rows = pageOf(items, layout.rowsPerSection, tick);
          return `
        <article class="strip-card" aria-label="${esc(service.label)}">
          <h3><span aria-hidden="true">${service.icon}</span> ${esc(service.label)}</h3>
          ${rows.items.map(stripRow).join('')}
          ${dots(rows)}
        </article>`;
        })
        .join('')}
    </div>
    <footer class="board-footer">
      Escaneá el QR y llevate el lugar en tu teléfono · La información se actualiza sola
    </footer>
  </div>`;
}
