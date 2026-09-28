/* ============================================================
   GEOLOCALIZACIÓN Y DISTANCIAS
   ------------------------------------------------------------
   La ubicación es una ayuda, nunca un requisito:
   - Si la persona no la comparte, la app funciona igual.
   - "CÓMO LLEGAR" abre la app de mapas del teléfono con la
     ruta A PIE (la mayoría de los usuarios camina).
     No construimos un mapa propio.
   ============================================================ */

/** Pide la ubicación una vez. Resuelve null ante cualquier problema. */
export function getCurrentPosition({ timeout = 6000 } = {}) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null), // rechazó permiso, sin señal, etc.
      { timeout, maximumAge: 5 * 60 * 1000, enableHighAccuracy: false }
    );
  });
}

/** Distancia en metros entre dos puntos { lat, lng } (haversine). */
export function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** "a 350 m" · "a 1,2 km" · "a 3 km" */
export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return '';
  if (meters < 950) return `a ${Math.max(50, Math.round(meters / 50) * 50)} m`;
  const km = (meters / 1000).toFixed(1).replace('.', ',');
  return `a ${km.replace(',0', '')} km`;
}

/** URL universal: abre Google Maps (app o web) con ruta a pie. */
export function directionsUrl(place) {
  const destination = `${place.latitude},${place.longitude}`;
  return (
    'https://www.google.com/maps/dir/?api=1' +
    `&destination=${encodeURIComponent(destination)}` +
    '&travelmode=walking'
  );
}
