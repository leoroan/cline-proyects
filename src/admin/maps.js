/* ============================================================
   LINKS DE GOOGLE MAPS → coordenadas
   ------------------------------------------------------------
   La persona colaboradora busca el lugar en Google Maps (que
   ya conoce), copia el link y lo pega en el formulario.
   Acá extraemos lat/lng (y el nombre si viene).

   Formatos soportados (los que da Google hoy):
   - …/place/NOMBRE/@-34.91,-57.95,17z/…      (barra de direcciones)
   - …/place/-34.91,-57.95                    (pin suelto)
   - …/search/-34.91,-57.95  ·  …/dir/-34.91,-57.95
   - …!3d-34.91!4d-57.95…                     (links de datos)
   - …?q= / ?query= / ?destination= / ?ll= / ?center=lat,lng
   - "-34.91, -57.95" escrito a mano

   NO se pueden resolver acá: links cortos (maps.app.goo.gl),
   porque exigen seguir una redirección (el navegador la bloquea).
   Para esos, isShortMapsLink() permite dar la pista correcta.
   ============================================================ */

export function parseMapsLink(text) {
  const t = String(text ?? '').trim();
  if (!t) return null;

  const m =
    t.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/) ||
    t.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/) ||
    t.match(/[?&](?:q|query|destination|ll|center)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/) ||
    t.match(/\/(?:place|search|dir)\/(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/) ||
    t.match(/^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/);
  if (!m) return null;

  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  // Nombre del lugar, si viene en la URL (/place/NOMBRE/@…)
  // (el [^/@\d] evita tomar coordenadas como si fueran nombre)
  let name = null;
  const placeName = t.match(/\/place\/([^/@\d][^/@]*)\//);
  if (placeName) {
    try {
      name = decodeURIComponent(placeName[1]).replace(/\+/g, ' ').trim() || null;
    } catch {
      name = null;
    }
  }

  return { lat, lng, name };
}

/** Links cortos de Google (no traen coords: hay que abrirlos primero). */
export function isShortMapsLink(text) {
  return /(^|[\/.])goo\.gl\/|maps\.app\.goo\.gl\//.test(String(text ?? '').trim());
}
