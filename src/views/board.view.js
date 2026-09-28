/* ============================================================
   MODO PANTALLA (TV / monitor informativo)
   ------------------------------------------------------------
   Una sola mirada: qué hay hoy, dónde y a qué hora, para todos
   los servicios. Sin interacción: se actualiza sola (main.js).
   ============================================================ */

import { esc } from '../utils/html.js';

function boardRow({ place, status }) {
  const d = status?.display;
  const isOpen = status?.tone === 'open';
  const hours = d ? `${isOpen ? 'AHORA · ' : ''}${d.when} · ${d.open} → ${d.close}` : 'Horario a confirmar';

  return `
    <div class="board-row${isOpen ? ' board-row--open' : ''}">
      <p class="board-row__name">${esc(place.name)}</p>
      <p class="board-row__meta">${esc(hours)} — ${esc(place.address)}</p>
    </div>`;
}

export function renderBoard({ sections, now }) {
  const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return `
  <div class="board">
    <a class="board-exit" href="#/">← Salir</a>
    <header class="board-header">
      <h1 class="board-title" id="contenido" tabindex="-1" data-focus>
        Ayuda Cerca · Qué hay hoy
      </h1>
      <p class="board-clock" aria-label="Hora actual">${time}</p>
    </header>
    <div class="board-grid">
      ${sections
        .map(
          ({ service, rows }) => `
        <section class="board-section" aria-label="${esc(service.label)}">
          <h2><span aria-hidden="true">${service.icon}</span> ${esc(service.label)}</h2>
          ${rows.map(boardRow).join('')}
        </section>`
        )
        .join('')}
    </div>
    <footer class="board-footer">
      La información se actualiza sola cada 30 segundos.
    </footer>
  </div>`;
}
