/* ============================================================
   ROUTER — hash-based, sin dependencias
   ------------------------------------------------------------
   Ventajas para este caso:
   - Funciona en cualquier hosting estático (y hasta file://).
   - URLs compartibles: #/s/lunch, #/panel (modo pantalla).
   - Los enlaces son <a href="#/..."> comunes: navegación nativa
     aunque falle algo de JavaScript.

   Rutas:
     #/            → home (¿QUÉ NECESITÁS?)
     #/s/:service  → resultados de un servicio
     #/panel       → modo pantalla (TV / monitor)

   parseRoute() devuelve null para hashes que no son rutas
   (ej. "#contenido" del skip link): el main los ignora.
   ============================================================ */

export function parseRoute() {
  const hash = location.hash;

  if (hash === '' || hash === '#' || hash === '#/') return { name: 'home' };
  if (!hash.startsWith('#/')) return null; // ancla interna, no es una ruta

  const parts = hash.slice(2).split('/').filter(Boolean);

  if (parts[0] === 's' && parts[1]) {
    return { name: 'results', serviceId: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === 'panel') return { name: 'board' };

  return { name: 'home' };
}
