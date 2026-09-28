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
   - icon:  emoji grande (sin dependencias). Si mañana se quieren
            SVG propios, sólo cambia cómo se renderiza este campo.
   ============================================================ */

export const SERVICES = [
  { id: 'breakfast', label: 'DESAYUNO', icon: '🍞' },
  { id: 'lunch',     label: 'ALMUERZO', icon: '🍲' },
  { id: 'snack',     label: 'MERIENDA', icon: '☕' },
  { id: 'dinner',    label: 'CENA',     icon: '🍽️' },
  { id: 'clothing',  label: 'ROPA',     icon: '👕' },
  { id: 'shelter',   label: 'DORMIR',   icon: '🛏️' },
];

export function serviceById(id) {
  return SERVICES.find((s) => s.id === id) ?? null;
}
