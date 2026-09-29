/* Mini-helper de carrusel: devuelve la "página" actual de una
   lista según el tick de rotación. Todas las rotaciones de la
   cartelería comparten el mismo tick (ver main.js), así giran
   sincronizadas y en calma. */

export function pageOf(items, pageSize, tick = 0) {
  const list = Array.isArray(items) ? items : [];
  const size = Math.max(1, pageSize || 1);
  const pageCount = Math.max(1, Math.ceil(list.length / size));
  const page = ((tick % pageCount) + pageCount) % pageCount;
  return {
    items: list.slice(page * size, page * size + size),
    page,
    pageCount,
  };
}
