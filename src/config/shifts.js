/* ============================================================
   TURNOS DE COMIDA — rangos por defecto (hora de Argentina)
   ------------------------------------------------------------
   Definen qué se está sirviendo "AHORA" en la cartelería y
   cuál es el "PRÓXIMO" turno. Son rangos POR DEFECTO del
   sentido común; cada lugar sigue teniendo sus propios
   horarios reales en los datos.

   - serviceId: id del catálogo (src/config/services.js)
   - from / to: "HH:MM" (24 h)

   Se pueden ajustar (o reordenar) sin tocar nada más de la app.
   Los servicios del catálogo que NO estén acá (ropa, dormir,
   duchas…) se muestran abajo como tarjetas, sin turno.
   ============================================================ */

export const MEAL_SHIFTS = [
  { serviceId: 'breakfast', from: '06:00', to: '10:30' },
  { serviceId: 'lunch',     from: '11:00', to: '15:00' },
  { serviceId: 'snack',     from: '15:30', to: '18:00' },
  { serviceId: 'dinner',    from: '18:30', to: '22:00' },
];
