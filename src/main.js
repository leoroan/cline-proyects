/* ============================================================
   MAIN — orquestación mínima
   ------------------------------------------------------------
   Flujo principal en 2 toques:
   home → servicio → CÓMO LLEGAR.

   - Sin estado global complejo: cada cambio de ruta re-renderiza.
   - Al navegar, el foco va al título de la vista (lectores de
     pantalla anuncian la nueva pantalla).
   - El modo pantalla (#/panel) se actualiza solo cada 30 s y
     pide WakeLock para que la TV no se apague.
   ============================================================ */

import { SERVICES, serviceById } from './config/services.js';
import { getPlaces } from './services/places.service.js';
import { getServiceStatus } from './services/time.service.js';
import { getCurrentPosition, distanceMeters } from './services/geo.service.js';
import { parseRoute } from './router.js';
import { renderHome } from './views/home.view.js';
import {
  renderResults,
  renderResultsLoading,
  renderResultsError,
} from './views/results.view.js';
import { renderBoard } from './views/board.view.js';

const app = document.getElementById('app');

const NEARBY_METERS = 2000;      // "cerca tuyo" = a menos de 2 km a pie
const BOARD_REFRESH_MS = 30_000; // el modo pantalla se actualiza solo

let boardTimer = null;
let wakeLock = null;

/* Prioridad para ordenar sin ubicación: abierto > abre hoy > cerrado */
const TONE_RANK = { open: 0, soon: 1, closed: 2 };
const rankOf = (item) => TONE_RANK[item.status?.tone ?? 'closed'];

function paint(html, { focus = true } = {}) {
  app.innerHTML = html;
  if (focus) {
    const heading = app.querySelector('[data-focus]');
    if (heading) heading.focus({ preventScroll: true });
  }
}

async function renderHomeRoute() {
  let services = SERVICES;
  try {
    const places = await getPlaces();
    // Sólo se muestran servicios que tienen al menos un lugar.
    // Un servicio nuevo aparece solo cuando hay datos que lo ofrezcan.
    const withPlaces = SERVICES.filter((s) =>
      places.some((p) => p.services.includes(s.id))
    );
    if (withPlaces.length > 0) services = withPlaces;
  } catch {
    // Si fallan los datos, la home igual muestra el catálogo.
  }
  paint(renderHome({ services }));
}

async function renderResultsRoute(serviceId) {
  const service = serviceById(serviceId);
  if (!service) {
    location.hash = '#/';
    return renderHomeRoute();
  }

  paint(renderResultsLoading(service));

  try {
    // Ubicación y datos en paralelo; la ubicación nunca bloquea.
    const [places, position] = await Promise.all([
      getPlaces(),
      getCurrentPosition(),
    ]);
    const now = new Date();

    const items = places
      .filter((p) => p.services.includes(service.id))
      .map((p) => ({
        place: p,
        status: getServiceStatus(p.schedule?.[service.id], now),
        distance: position
          ? Math.round(
              distanceMeters(position, { lat: p.latitude, lng: p.longitude })
            )
          : null,
      }));

    if (position) {
      items.sort((a, b) => a.distance - b.distance);
    } else {
      items.sort((a, b) => rankOf(a) - rankOf(b));
    }

    const nearCount = position
      ? items.filter((i) => i.distance <= NEARBY_METERS).length
      : 0;

    paint(
      renderResults({
        service,
        items,
        hasLocation: Boolean(position),
        nearCount,
      })
    );
  } catch {
    paint(renderResultsError(service));
  }
}

async function renderBoardRoute({ focus = true } = {}) {
  try {
    const places = await getPlaces();
    const now = new Date();

    const sections = SERVICES.map((service) => {
      const rows = places
        .filter((p) => p.services.includes(service.id))
        .map((p) => ({
          place: p,
          status: getServiceStatus(p.schedule?.[service.id], now),
        }))
        .sort((a, b) => rankOf(a) - rankOf(b));
      return rows.length ? { service, rows } : null;
    }).filter(Boolean);

    paint(renderBoard({ sections, now }), { focus });
  } catch {
    if (focus) {
      paint(
        '<p class="error" role="alert">No se pudo cargar la información.</p>'
      );
    }
    // Si falla una actualización automática, se reintenta sola
    // en el próximo ciclo sin sacar la pantalla anterior.
  }
}

async function enterBoardMode() {
  await renderBoardRoute();
  boardTimer = setInterval(
    () => renderBoardRoute({ focus: false }),
    BOARD_REFRESH_MS
  );
  // Que la pantalla no se apague (donde el navegador lo permita).
  try {
    wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
  } catch {
    wakeLock = null;
  }
}

function leaveBoardMode() {
  if (boardTimer) {
    clearInterval(boardTimer);
    boardTimer = null;
  }
  if (wakeLock) {
    try {
      wakeLock.release();
    } catch {
      /* nada que hacer */
    }
    wakeLock = null;
  }
}

async function render() {
  const route = parseRoute();
  if (route === null) return; // ancla interna (skip link): no es navegación

  leaveBoardMode();
  window.scrollTo(0, 0);

  if (route.name === 'results') return renderResultsRoute(route.serviceId);
  if (route.name === 'board') return enterBoardMode();
  return renderHomeRoute();
}

window.addEventListener('hashchange', render);
render();
