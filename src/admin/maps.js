/* ============================================================
   LINKS DE GOOGLE MAPS → coordenadas
   ------------------------------------------------------------
   La persona colaboradora busca el lugar en Google Maps (que
   ya conoce), toca Compartir → Copiar link, y lo pega en el
   formulario. Acá extraemos lat/lng (y el nombre si viene).

   Formatos soportados:
   - …/place/NOMBRE/@-34.91,-57.95,17z/…
   - …!3d-34.91!4d-57.95…
   - …?q=-34.91,-57.95  (también query= / destination=)
   - "-34.91, -57.95" escrito a mano
   ============================================================ */

export function parseMapsLink(text) {
  const t = String(text ?? '').trim();
  if (!t) return null;

  let m = t.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (!m) m = t.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (!m)
    m = t.match(/[?&](?:q|query|destination)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (!m) m = t.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if (!m) return null;

  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  // Nombre del lugar, si viene en la URL (/place/NOMBRE/@…)
  let name = null;
  const placeName = t.match(/\/place\/([^/@]+)\//);
  if (placeName) {
    try {
      name = decodeURIComponent(placeName[1]).replace(/\+/g, ' ').trim() || null;
    } catch {
      name = null;
    }
  }

  return { lat, lng, name };
}
