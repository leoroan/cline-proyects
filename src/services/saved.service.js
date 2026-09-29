/* ============================================================
   GUARDADOS — "mis lugares" en el teléfono (localStorage)
   ------------------------------------------------------------
   Sin registro, sin servidor, sin cuenta: la persona guarda
   lugares en SU teléfono (escaneando un QR o con el botón
   GUARDAR) y los ve primero en la home.

   AUTO-MANTENIBLE:
   - Cada guardado vence a los SAVED_TTL_DAYS días.
   - La limpieza ocurre sola en cada lectura (purge al leer).
   - Tope de MAX_ITEMS para no acumular basura.
   - Si el storage está corrupto o no existe, se empieza de
     cero sin romper nada.
   ============================================================ */

const KEY = 'ayuda-cerca:guardados:v1';
export const SAVED_TTL_DAYS = 3;
const SAVED_TTL_MS = SAVED_TTL_DAYS * 24 * 60 * 60 * 1000;
const MAX_ITEMS = 10;

function storage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null; // modo privado extremo, etc.
  }
}

function writeItems(items) {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(KEY, JSON.stringify({ v: 1, items }));
  } catch {
    /* sin espacio u otro error: simplemente no se guarda */
  }
}

/** Lee los ítems válidos y aprovecha para purgar los vencidos. */
function readItems(now = Date.now()) {
  const ls = storage();
  if (!ls) return [];
  let items = [];
  try {
    const parsed = JSON.parse(ls.getItem(KEY) ?? 'null');
    if (Array.isArray(parsed?.items)) items = parsed.items;
  } catch {
    items = [];
  }
  const valid = items.filter(
    (i) =>
      i &&
      typeof i.id === 'string' &&
      Number.isFinite(i.savedAt) &&
      now - i.savedAt < SAVED_TTL_MS
  );
  if (valid.length !== items.length) writeItems(valid); // auto-limpieza
  return valid;
}

export function getSavedIds(now = Date.now()) {
  return readItems(now).map((i) => i.id);
}

export function isSaved(id, now = Date.now()) {
  return readItems(now).some((i) => i.id === id);
}

/** Guarda (si ya estaba: lo sube al principio y renueva el vencimiento). */
export function save(id, now = Date.now()) {
  const items = readItems(now).filter((i) => i.id !== id);
  items.unshift({ id, savedAt: now });
  writeItems(items.slice(0, MAX_ITEMS));
}

export function remove(id, now = Date.now()) {
  writeItems(readItems(now).filter((i) => i.id !== id));
}

/** URL que codifican los QR: abre esta misma app y guarda el lugar. */
export function saveLink(placeId) {
  const origin = typeof location !== 'undefined' ? location.origin ?? '' : '';
  const path = typeof location !== 'undefined' ? location.pathname ?? '/' : '/';
  return `${origin}${path}#/guardar/${encodeURIComponent(placeId)}`;
}
