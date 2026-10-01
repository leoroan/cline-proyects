/* Corroboración de getStats: cada número debe salir de SU fuente.
   Cliente Supabase simulado con datos etiquetados.
   Uso: node tests/stats.test.mjs */

import assert from 'node:assert/strict';

const store = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
  },
  configurable: true,
});

/* Cliente falso: counts conocidos por tabla + rpcs etiquetados */
const COUNTS = { page_views: 78, places: 13, custom_services: 5, profiles: 2 };

function makeQuery(table) {
  const q = {
    eqVal: undefined,
    eq(col, val) {
      q.eqVal = val;
      return q;
    },
    order: () => q,
    limit: () => q,
    then(resolve) {
      if (table === 'page_views' && q.eqVal === undefined) {
        // select reciente o count total
        resolve({ count: COUNTS[table], data: [{ path: 'home', created_at: '2026-09-30T15:04:09+00:00' }], error: null });
        return;
      }
      if (table === 'places') {
        resolve({ count: q.eqVal === true ? 13 : 1, data: null, error: null });
        return;
      }
      resolve({ count: COUNTS[table], data: null, error: null });
    },
  };
  return q;
}

const { argentinaTime } = await import('../src/services/time.service.js');

// 'Hoy' en hora de Argentina, para que el dato simulado caiga en HOY
function todayArt() {
  const a = argentinaTime(new Date());
  const p = (n) => String(n).padStart(2, '0');
  return `${a.getFullYear()}-${p(a.getMonth() + 1)}-${p(a.getDate())}`;
}
const HOY = todayArt();

const fakeClient = {
  rpc: (fn, args) => {
    const arg = JSON.stringify(args ?? {});
    const payloads = {
      'stats_daily:{"days":14}': { data: [{ day: HOY, views: 7 }], error: null },
      'stats_daily:{"days":14,"exclude_admin":true}': { data: [{ day: HOY, views: 5 }], error: null },
      'stats_paths:{}': { data: [{ path: 'home', views: 40 }], error: null },
      'stats_visitors:{"days":14}': { data: [{ day: HOY, visitors: 3 }], error: null },
      'stats_devices:{}': { data: [{ device: 'celular', views: 60 }], error: null },
      'stats_hours:{}': { data: [{ hour: 12, views: 9 }], error: null },
    };
    const key = `${fn}:${arg}`;
    return Promise.resolve(payloads[key] ?? { data: [], error: null });
  },
  from: (table) => ({ select: () => makeQuery(table) }),
};

Object.defineProperty(globalThis, 'window', {
  value: { supabase: { createClient: () => fakeClient } },
  configurable: true,
});

const { getStats } = await import('../src/services/analytics.service.js');

let failed = 0;
function t(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✘ ${name}\n    ${e.message}`);
  }
}

console.log('\nCorroboración de fuentes en getStats:');

const stats = await getStats();

t('lugares activos sale de places (activos), no de otra query', () => {
  assert.equal(stats.places.active, 13);
});

t('lugares en pausa sale de places (inactivos)', () => {
  assert.equal(stats.places.inactive, 1);
});

t('secciones creadas sale de custom_services', () => {
  assert.equal(stats.customServices, 5);
});

t('equipo sale de profiles', () => {
  assert.equal(stats.team, 2);
});

t('total histórico sale del count de page_views', () => {
  assert.equal(stats.total, 78);
});

t('diarias / públicas / visitantes mapeadas a sus funciones', () => {
  assert.equal(stats.today, 7);        // stats_daily (día de hoy)
  assert.equal(stats.todayPublic, 5);  // stats_daily exclude_admin
  assert.equal(stats.dailySplit[0].publicas, 5);
  assert.equal(stats.dailySplit[0].gestion, 2); // 7 - 5
  assert.equal(stats.visitorsToday, 3);         // stats_visitors
});

t('rutas, dispositivos y horarios mapeados', () => {
  assert.equal(stats.paths[0].path, 'home');
  assert.equal(stats.devices[0].device, 'celular');
  assert.equal(stats.hours[0].hour, 12);
});

t('recientes llegan con su fecha', () => {
  assert.equal(stats.recent[0].path, 'home');
});

if (failed) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log('\nCorroboración OK ✔\n');
