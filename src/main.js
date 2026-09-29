/* ============================================================
   MAIN — orquestación mínima
   ------------------------------------------------------------
   Flujos:
   - home → servicio → CÓMO LLEGAR (2 toques)
   - pantalla grande → QR → #/guardar/:id → guardado en el
     teléfono de la persona → la home muestra primero
     "⭐ MIS LUGARES"
   - #/panel → cartelería sin scroll: turno arriba (hora de
     Argentina GMT-3), resto abajo, todo rotando.
   - #/admin[/…] → zona de gestión OCULTA (sin enlace público),
     con clave, para cargar lugares, secciones y equipo.

   - Toda la lógica horaria usa hora de Argentina
     (America/Argentina/Buenos_Aires), aunque el dispositivo
     tenga otra zona horaria.
   ============================================================ */

import { MEAL_SHIFTS } from './config/shifts.js';
import { getServices, getServiceById } from './services/catalog.service.js';
import { getPlaces } from './services/places.service.js';
import {
  getServiceStatus,
  argentinaTime,
  getShiftCandidates,
} from './services/time.service.js';
import {
  getCurrentPosition,
  distanceMeters,
  hasCoords,
} from './services/geo.service.js';
import { getSavedIds, isSaved, save, remove } from './services/saved.service.js';
import { getBoardSettings } from './admin/data.service.js';
import { parseRoute } from './router.js';
import { paint } from './utils/dom.js';
import { renderHome } from './views/home.view.js';
import {
  renderResults,
  renderResultsLoading,
  renderResultsError,
} from './views/results.view.js';
import { renderBoard } from './views/board.view.js';
import { renderSavedConfirm } from './views/saved.view.js';
import {
  renderAdmin,
  handleAdminClick,
  handleAdminSubmit,
} from './admin/controller.js';

const app = document.getElementById('app');

const NEARBY_METERS = 2000; // "cerca tuyo" = a menos de 2 km a pie

let wakeLock = null;

/* Prioridad para ordenar: abierto > abre hoy > cerrado */
const TONE_RANK = { open: 0, soon: 1, closed: 2 };
const rankOf = (item) => TONE_RANK[item.status?.tone ?? 'closed'];

const distanceOf = (position, p) =>
  position && hasCoords(p)
    ? Math.round(distanceMeters(position, { lat: p.latitude, lng: p.longitude }))
    : null;

async function renderHomeRoute() {
  let services = getServices();
  let savedItems = [];
  try {
    const places = await getPlaces();
    // Sólo se muestran servicios que tienen al menos un lugar.
    const withPlaces = services.filter((s) =>
      places.some((p) => p.services.includes(s.id))
    );
    if (withPlaces.length > 0) services = withPlaces;

    // Lo guardado en este teléfono, primero (más reciente arriba).
    const now = argentinaTime();
    savedItems = getSavedIds()
      .map((id) => places.find((p) => p.id === id))
      .filter(Boolean)
      .map((place) => ({ place, now }));
  } catch {
    // Si fallan los datos, la home igual muestra el catálogo.
  }
  paint(renderHome({ services, savedItems }));
}

async function renderResultsRoute(serviceId) {
  const service = getServiceById(serviceId);
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
    const now = argentinaTime();
    const savedIds = new Set(getSavedIds());

    const items = places
      .filter((p) => p.services.includes(service.id))
      .map((p) => ({
        place: p,
        status: getServiceStatus(p.schedule?.[service.id], now),
        distance: distanceOf(position, p),
        saved: savedIds.has(p.id),
      }));

    if (position) {
      items.sort((a, b) => a.distance - b.distance);
    } else {
      items.sort((a, b) => rankOf(a) - rankOf(b));
    }

    const nearCount = position
      ? items.filter((i) => i.distance != null && i.distance <= NEARBY_METERS).length
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

/* Destino de los QR: guarda el lugar en este teléfono y lo muestra. */
async function renderSaveRoute(placeId) {
  try {
    const places = await getPlaces();
    const place = places.find((p) => p.id === placeId);
    if (!place) {
      location.hash = '#/';
      return renderHomeRoute();
    }
    save(place.id);
    paint(renderSavedConfirm({ place, now: argentinaTime() }));
  } catch {
    paint(
      `<div class="page">
         <p class="error" role="alert">No se pudo guardar. Probá escanear de nuevo.</p>
         <p><a class="back-link" href="#/">← IR AL INICIO</a></p>
       </div>`
    );
  }
}

/* ============================================================
   MODO PANTALLA / CARTELERÍA
   ------------------------------------------------------------
   - Los carruseles rotan cada BOARD_ROTATE_MS (mismo tick para
     todo: rotación sincronizada y en calma).
   - Los datos se releen cada BOARD_DATA_MS (cache, para no
     pedir en cada rotación).
   - La ubicación es opcional: si la hay, se ordena por cercanía
     y se muestra "a X m"; si no, orden por urgencia.
   ============================================================ */

const BOARD_DATA_MS = 30_000;

let boardTimer = null;
let boardTick = 0;
let boardLastHtml = null; // anti-parpadeo: no repintar si nada cambió
let boardCache = null;     // { places, at }
let boardPosition;         // undefined = todavía no se pidió

/* Tamaños de página según orientación (cartelería sin scroll). */
function boardLayout() {
  const landscape =
    typeof matchMedia !== 'function' ||
    matchMedia('(orientation: landscape)').matches;
  return landscape
    ? { heroPage: 3, rowsPerSection: 3 }
    : { heroPage: 2, rowsPerSection: 3 };
}

async function boardPlaces() {
  if (!boardCache || Date.now() - boardCache.at > BOARD_DATA_MS) {
    boardCache = { places: await getPlaces(), at: Date.now() };
  }
  return boardCache.places;
}

async function renderBoardRoute({ focus = true } = {}) {
  try {
    const places = await boardPlaces();
    const now = argentinaTime();
    const layout = boardLayout();
    const byUrgencyThenDistance = (a, b) =>
      rankOf(a) - rankOf(b) || (a.distance ?? Infinity) - (b.distance ?? Infinity);
    const catalog = getServices();

    // Turno de comida: el primero (desde ahora) que TENGA lugares.
    // Si el turno actual no tiene lugares hoy, se cae al siguiente.
    const candidates = getShiftCandidates(MEAL_SHIFTS, now);
    let hero = null;
    for (const cand of candidates) {
      const service = getServiceById(cand.shift.serviceId);
      if (!service) continue;
      const items = places
        .filter((p) => p.services.includes(service.id))
        .map((p) => ({
          place: p,
          status: getServiceStatus(p.schedule?.[service.id], now),
          distance: distanceOf(boardPosition, p),
        }))
        .filter((i) => i.status?.display?.when === cand.when)
        .sort(byUrgencyThenDistance);
      const h = { state: cand.state, shift: cand.shift, service, items };
      if (items.length > 0) {
        hero = h;
        break;
      }
      if (!hero) hero = h; // fallback: el primero, aunque esté vacío
    }

    // El resto de los servicios (ropa, dormir y cualquiera futuro)
    const mealIds = new Set(MEAL_SHIFTS.map((s) => s.serviceId));
    const strips = catalog
      .map((service) => {
        if (mealIds.has(service.id)) return null;
        const items = places
          .filter((p) => p.services.includes(service.id))
          .map((p) => ({
            place: p,
            status: getServiceStatus(p.schedule?.[service.id], now),
            distance: distanceOf(boardPosition, p),
          }))
          .sort(byUrgencyThenDistance);
        return items.length ? { service, items } : null;
      })
      .filter(Boolean);

    const html = renderBoard({ hero, strips, layout, tick: boardTick, now });
    // Si nada cambió (todo entra y está quieto), no repintar:
    // evita el parpadeo del fundido en TVs.
    if (html !== boardLastHtml) {
      boardLastHtml = html;
      paint(html, { focus });
    }
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
  boardTick = 0;
  boardCache = null;
  boardLastHtml = null;
  // Ubicación opcional para ordenar por cercanía (nunca bloquea)
  if (boardPosition === undefined) {
    boardPosition = null;
    getCurrentPosition().then((pos) => {
      boardPosition = pos;
    });
  }
  await renderBoardRoute();
  const settings = getBoardSettings();
  boardTimer = setInterval(() => {
    boardTick += 1;
    renderBoardRoute({ focus: false });
  }, settings.rotateSeconds * 1000);
  startAutoScroll(settings);
  // Que la pantalla no se apague (donde el navegador lo permita).
  try {
    wakeLock = (await navigator.wakeLock?.request('screen')) ?? null;
  } catch {
    wakeLock = null;
  }
}

/* Scroll automático arriba/abajo para TVs donde no entra todo.
   Sólo en pantallas grandes (≥1200px): en chicas el scroll es manual. */
let autoScrollTimer = null;
let autoScrollDown = false;

function startAutoScroll(settings) {
  stopAutoScroll();
  if (!settings.autoScroll) return;
  if (typeof matchMedia !== 'function') return;
  if (!matchMedia('(min-width: 1200px)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  autoScrollTimer = setInterval(() => {
    const el = document.scrollingElement ?? document.documentElement;
    const viewH = window.innerHeight;
    if (!el || typeof viewH !== 'number') return;
    if (el.scrollHeight <= viewH + 8) return; // entra todo: quieto
    autoScrollDown = !autoScrollDown;
    window.scrollTo({ top: autoScrollDown ? el.scrollHeight : 0, behavior: 'smooth' });
  }, settings.autoScrollSeconds * 1000);
}

function stopAutoScroll() {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }
  autoScrollDown = false;
}

function leaveBoardMode() {
  if (boardTimer) {
    clearInterval(boardTimer);
    boardTimer = null;
  }
  stopAutoScroll();
  boardCache = null;
  boardLastHtml = null;
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

  if (route.name === 'admin') return renderAdmin(route.sub, route.param);
  if (route.name === 'results') return renderResultsRoute(route.serviceId);
  if (route.name === 'save') return renderSaveRoute(route.placeId);
  if (route.name === 'board') return enterBoardMode();
  return renderHomeRoute();
}

/* ---------- Eventos ---------- */

// Clicks: primero gestión (data-action), después GUARDAR (data-save).
app.addEventListener('click', async (event) => {
  if (await handleAdminClick(event)) return;
  const btn = event.target.closest('[data-save]');
  if (!btn) return;
  const id = btn.getAttribute('data-save');
  if (isSaved(id)) remove(id);
  else save(id);
  render(); // re-render para reflejar el cambio al instante
});

// Formularios de gestión (data-form)
app.addEventListener('submit', (event) => {
  handleAdminSubmit(event);
});

// Prender un servicio en el formulario muestra sus días y horarios
app.addEventListener('change', (event) => {
  const t = event.target;
  if (t.matches?.('.svc__toggle input')) {
    t.closest('.svc')?.classList.toggle('is-on', t.checked);
  }
});

window.addEventListener('hashchange', render);
render();

