/* ============================================================
   HOME — "¿QUÉ NECESITÁS?"
   Primero MIS LUGARES (lo guardado en este teléfono),
   después las grandes acciones. Si no hay guardados,
   la home queda exactamente igual que siempre.
   ============================================================ */

import { esc } from '../utils/html.js';
import { serviceIcon } from '../components/service-icon.js';
import { APP_VERSION } from '../config/version.js';
import { appCredit } from '../components/credit.js';
import { SAVED_TTL_DAYS } from '../services/saved.service.js';
import { savedCard } from '../components/saved-card.js';

export function renderHome({ services, savedItems = [] }) {
  return `
  <div class="home">
    <header class="home-header">
      <p class="app-name">Ayuda Cerca</p>
      <h1 id="contenido" tabindex="-1" data-focus>¿QUÉ NECESITÁS?</h1>
    </header>
    ${
      savedItems.length > 0
        ? `
    <section class="saved-section" aria-labelledby="saved-title">
      <h2 class="saved-title" id="saved-title">⭐ MIS LUGARES</h2>
      <p class="saved-note">
        Guardados en este teléfono. Se borran solos a los ${SAVED_TTL_DAYS} días.
      </p>
      <div class="place-list">
        ${savedItems.map((item) => savedCard(item)).join('')}
      </div>
    </section>`
        : ''
    }
    <nav class="service-grid" aria-label="Servicios disponibles">
      ${services
        .map(
          (s) => `
        <a class="service-btn" href="#/s/${esc(s.id)}">
          <span class="service-btn__icon">${serviceIcon(s)}</span>
          <span class="service-btn__label">${esc(s.label)}</span>
        </a>`
        )
        .join('')}
    </nav>
    <footer class="home-footer">
      <a class="board-link" href="#/panel"><i class="bi bi-tv" aria-hidden="true"></i> <span>Modo pantalla para TV</span></a>
      <a class="board-link" href="./guia/"><i class="bi bi-book-fill" aria-hidden="true"></i> <span>Guía y términos</span></a>
      <p class="app-version">Ayuda Cerca · v${APP_VERSION}</p>
      ${appCredit()}
    </footer>
  </div>`;
}
