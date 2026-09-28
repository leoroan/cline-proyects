/* ============================================================
   HOME — "¿QUÉ NECESITÁS?"
   Grandes acciones visuales: icono grande + palabra simple.
   ============================================================ */

import { esc } from '../utils/html.js';

export function renderHome({ services }) {
  return `
  <div class="home">
    <header class="home-header">
      <p class="app-name">Ayuda Cerca</p>
      <h1 id="contenido" tabindex="-1" data-focus>¿QUÉ NECESITÁS?</h1>
    </header>
    <nav class="service-grid" aria-label="Servicios disponibles">
      ${services
        .map(
          (s) => `
        <a class="service-btn" href="#/s/${esc(s.id)}">
          <span class="service-btn__icon" aria-hidden="true">${s.icon}</span>
          <span class="service-btn__label">${esc(s.label)}</span>
        </a>`
        )
        .join('')}
    </nav>
    <footer class="home-footer">
      <a class="board-link" href="#/panel">🖥️ <span>Modo pantalla para TV</span></a>
    </footer>
  </div>`;
}
