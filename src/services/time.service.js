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

/* ============================================================
   HORA DE ARGENTINA (GMT-3) Y TURNOS DE COMIDA
   ------------------------------------------------------------
   Los horarios de los lugares son de Argentina. Si el
   dispositivo (TV, PC, kiosk) tiene otra zona horaria, la
   cartelería igual muestra lo correcto: siempre se calcula
   con la hora de America/Argentina/Buenos_Aires.
   ============================================================ */

const AR_TIMEZONE = 'America/Argentina/Buenos_Aires';

/** Devuelve un Date cuyos campos locales son la hora de Argentina. */
export function argentinaTime(from = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: AR_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(from);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return new Date(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  );
}

/**
 * Turno de comida según la hora del día.
 * shifts: [{ serviceId, from: 'HH:MM', to: 'HH:MM' }] (src/config/shifts.js)
 * Devuelve:
 *  { state: 'now',      shift } → estamos dentro del turno
 *  { state: 'next',     shift } → el próximo turno de hoy
 *  { state: 'tomorrow', shift } → el primer turno de mañana
 *  null si no hay turnos configurados.
 */
export function getShiftState(shifts, now = new Date()) {
  const parsed = (Array.isArray(shifts) ? shifts : [])
    .filter((s) => s && s.from && s.to)
    .map((s) => ({ ...s, start: toMinutes(s.from), end: toMinutes(s.to) }));
  if (parsed.length === 0) return null;

  const m = now.getHours() * 60 + now.getMinutes();

  for (const s of parsed) {
    if (m >= s.start && m < s.end) return { state: 'now', shift: s };
  }
  const upcoming = parsed
    .filter((s) => s.start > m)
    .sort((a, b) => a.start - b.start)[0];
  if (upcoming) return { state: 'next', shift: upcoming };
  return {
    state: 'tomorrow',
    shift: parsed.slice().sort((a, b) => a.start - b.start)[0],
  };
}

/**
 * Lista de turnos candidatos EN ORDEN desde "ahora", para la
 * cartelería: si el turno actual no tiene lugares, se cae al
 * siguiente que sí tenga (hoy o mañana).
 *
 * Devuelve [{ shift, when: 'HOY'|'MAÑANA', state: 'now'|'next'|'tomorrow' }]
 *  - state 'now':      estamos dentro de ese turno
 *  - state 'next':     ese turno viene hoy más tarde
 *  - state 'tomorrow': ese turno es mañana
 * [] si no hay turnos configurados.
 */
export function getShiftCandidates(shifts, now = new Date()) {
  const current = getShiftState(shifts, now);
  if (!current) return [];

  const sorted = (Array.isArray(shifts) ? shifts : [])
    .filter((s) => s && s.from && s.to)
    .slice()
    .sort((a, b) => toMinutes(a.from) - toMinutes(b.from));
  const currentIdx = sorted.findIndex(
    (s) => s.serviceId === current.shift.serviceId
  );
  if (currentIdx === -1) return [];

  const result = [];
  for (let k = 0; k < sorted.length; k++) {
    const idx = (currentIdx + k) % sorted.length;
    const shift = sorted[idx];
    let when;
    let state;
    if (current.state === 'tomorrow') {
      when = 'MAÑANA';
      state = 'tomorrow';
    } else if (k === 0) {
      when = 'HOY';
      state = current.state; // 'now' o 'next'
    } else if (idx > currentIdx) {
      when = 'HOY';
      state = 'next';
    } else {
      when = 'MAÑANA';
      state = 'tomorrow';
    }
    result.push({ shift, when, state });
  }
  return result;
}

/**
 * Formato corto argentino: 'DD-MM-AAAA' o 'DD-MM-AAAA HH:mm'
 * (siempre en hora de Argentina, GMT-3).
 */
export function formatAR(dateInput, { withTime = true } = {}) {
  const parsed = parseDbDate(dateInput);
  if (!parsed) return '—'; // fecha ilegible: no rompe la pantalla
  const d = argentinaTime(parsed);
  const p = (n) => String(n).padStart(2, '0');
  const date = `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
  return withTime ? `${date} ${p(d.getHours())}:${p(d.getMinutes())}` : date;
}

/**
 * Parsea fechas que vienen de la base (timestamptz con
 * MICROSEGUNDOS: '2026-09-30T15:04:09.123456+00:00').
 * Chrome y Safari rechazan fracciones de más de 3 dígitos
 * (Invalid Date → 'Invalid time value'), así que se truncan
 * a milisegundos. Devuelve Date válido o null (nunca rompe).
 */
export function parseDbDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  let s = String(value ?? '').trim();
  if (!s) return null;
  s = s.replace(' ', 'T'); // '2026-09-30 15:04:09+00:00' → ISO
  s = s.replace(/(\.\d{3})\d+/, '$1'); // microsegundos → milisegundos
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
