/* ============================================================
   CATÁLOGO DE SERVICIOS — DATO CONFIGURABLE, NO CÓDIGO
   ------------------------------------------------------------
   La home muestra lo que hoy la comunidad necesita ver:
   desayuno, almuerzo, merienda, cena, ropa, dormir.
   Pero NO son categorías fijas de la aplicación.

   Para ofrecer un servicio nuevo (duchas, viandas, medicamentos,
   carga de celular, lo que sea):
     1) Agregar una entrada acá: { id, label, icon }
     2) Usar ese `id` en `services` y `schedule` de los lugares
        (mock o API).
   No hace falta tocar ninguna vista, componente ni estilo.

   - id:    clave estable que viaja en los datos (inglés, minúscula)
   - label: la palabra que ve la persona (lenguaje cotidiano,
            en mayúsculas porque la UI la muestra así)
   - icon:  emoji grande (fallback universal).
   - bi:    clase de Bootstrap Icons (vendored). Si está, se usa
            en lugar del emoji. Las secciones creadas desde gestión
            tienen sólo emoji y se ven igual de bien.
   ============================================================ */

export const SERVICES = [
  { id: 'breakfast', label: 'DESAYUNO', icon: '🍞', bi: 'bi-cup-hot' },
  { id: 'lunch',     label: 'ALMUERZO', icon: '🍲', bi: 'bi-egg-fried' },
  { id: 'snack',     label: 'MERIENDA', icon: '☕', bi: 'bi-cup-straw' },
  { id: 'dinner',    label: 'CENA',     icon: '🍽️', bi: 'bi-moon-stars' },
  { id: 'clothing',  label: 'ROPA',     icon: '👕', bi: 'bi-bag' },
  { id: 'shelter',   label: 'DORMIR',   icon: '🛏️', bi: 'bi-house-heart' },
];

export function serviceById(id) {
  return SERVICES.find((s) => s.id === id) ?? null;
}
