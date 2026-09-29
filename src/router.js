/* ============================================================
   ROUTER — hash-based, sin dependencias
   ------------------------------------------------------------
   Ventajas para este caso:
   - Funciona en cualquier hosting estático (y hasta file://).
   - URLs compartibles y escaneables: #/s/lunch, #/panel,
     #/guardar/:placeId (destino de los QR).
   - Los enlaces son <a href="#/..."> comunes: navegación nativa
     aunque falle algo de JavaScript.

   Rutas:
     #/                 → home (¿QUÉ NECESITÁS?)
     #/s/:service       → resultados de un servicio
     #/guardar/:placeId → guarda el lugar y muestra confirmación
     #/panel            → modo pantalla / cartelería (TV)
     #/admin[/…]        → zona de gestión (OCULTA, con clave)

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
  if (parts[0] === 'guardar' && parts[1]) {
    return { name: 'save', placeId: decodeURIComponent(parts[1]) };
  }
  if (parts[0] === 'admin') {
    return {
      name: 'admin',
      sub: parts[1] ?? 'menu',
      param: parts[2] ? decodeURIComponent(parts[2]) : null,
    };
  }
  if (parts[0] === 'panel') return { name: 'board' };

  return { name: 'home' };
}
