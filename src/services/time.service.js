/* ============================================================
   LÓGICA DE HORARIOS — pura y testeable (sin DOM, sin red)
   ------------------------------------------------------------
   Recibe el schedule de UN servicio en UN lugar y devuelve:
   - tone:    'open' | 'soon' | 'closed'
   - title:   texto principal ("ABIERTO AHORA", "SOLO LOS MARTES")
   - sub:     detalle corto ("Cierra 14:00", "Abre mañana 12:00")
   - display: la línea de horario a mostrar en la tarjeta
              { when: 'HOY' | 'MAÑANA' | 'MARTES'…, open, close }

   Devuelve null si no hay horario cargado → la UI muestra
   "Horario a confirmar". Nunca lanza errores por datos raros.

   Soporta turnos que cruzan medianoche (refugios 20:00 → 08:00):
   a las 2 AM el refugio figura ABIERTO AHORA.
   ============================================================ */

const DAY_NAME = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
const DAY_NAME_PLURAL = ['DOMINGOS', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADOS'];
const DAY_NAME_LOWER = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MINUTES_PER_DAY = 24 * 60;

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * @param {Array<{days:number[], open:string, close:string}>} schedule
 * @param {Date} [now]
 */
export function getServiceStatus(schedule, now = new Date()) {
  const windows = (Array.isArray(schedule) ? schedule : []).filter(
    (w) => w && Array.isArray(w.days) && w.days.length > 0 && w.open && w.close
  );
  if (windows.length === 0) return null;

  const todayIdx = now.getDay();
  const nowAbs = now.getHours() * 60 + now.getMinutes();

  // Ventanas candidatas en minutos absolutos respecto a hoy 00:00.
  // El offset -1 contempla turnos de ayer que cruzan medianoche.
  const candidates = [];
  for (let offset = -1; offset <= 7; offset++) {
    const dayIdx = (((todayIdx + offset) % 7) + 7) % 7;
    for (const w of windows) {
      if (!w.days.includes(dayIdx)) continue;
      const openMin = toMinutes(w.open);
      const closeMin = toMinutes(w.close);
      const crossesMidnight = closeMin <= openMin;
      const start = offset * MINUTES_PER_DAY + openMin;
      const end =
        offset * MINUTES_PER_DAY + closeMin + (crossesMidnight ? MINUTES_PER_DAY : 0);
      candidates.push({ offset, dayIdx, open: w.open, close: w.close, start, end });
    }
  }

  const current = candidates.find((c) => nowAbs >= c.start && nowAbs < c.end) ?? null;
  const next = current
    ? null
    : candidates.filter((c) => c.start > nowAbs).sort((a, b) => a.start - b.start)[0] ??
      null;

  // Línea de horario para la tarjeta: la ventana relevante
  // (la actual si está abierto, si no la próxima).
  const ref = current ?? next;
  const display = ref
    ? {
        when: ref.offset <= 0 ? 'HOY' : ref.offset === 1 ? 'MAÑANA' : DAY_NAME[ref.dayIdx],
        open: ref.open,
        close: ref.close,
      }
    : null;

  if (current) {
    return { tone: 'open', title: 'ABIERTO AHORA', sub: `Cierra ${current.close}`, display };
  }
  if (!next) {
    return { tone: 'closed', title: 'CERRADO', sub: null, display };
  }
  if (next.offset === 0) {
    return { tone: 'soon', title: `ABRE HOY ${next.open}`, sub: null, display };
  }
  if (next.offset === 1) {
    return { tone: 'closed', title: 'CERRADO HOY', sub: `Abre mañana ${next.open}`, display };
  }
  // Si el servicio ocurre un solo día de la semana, eso es lo más
  // importante de comunicar: "SOLO LOS MARTES".
  const distinctDays = new Set(windows.flatMap((w) => w.days));
  if (distinctDays.size === 1) {
    const [onlyDay] = distinctDays;
    return { tone: 'closed', title: `SOLO LOS ${DAY_NAME_PLURAL[onlyDay]}`, sub: null, display };
  }
  return {
    tone: 'closed',
    title: 'CERRADO HOY',
    sub: `Abre el ${DAY_NAME_LOWER[next.dayIdx]} ${next.open}`,
    display,
  };
}
