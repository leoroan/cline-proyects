/* Smoke test de integración sin navegador ni dependencias:
   stub mínimo de DOM/location/navigator/localStorage y se
   ejercita el flujo home → resultados → guardar → panel.
   Uso: node tests/smoke.test.mjs */

import assert from 'node:assert/strict';

const handlers = {};
const appEl = {
  innerHTML: '',
  querySelector: () => null,
  addEventListener: () => {},
};
const store = new Map();

globalThis.document = {
  getElementById: (id) => (id === 'app' ? appEl : null),
};
globalThis.window = {
  addEventListener: (ev, fn) => {
    handlers[ev] = fn;
  },
  scrollTo: () => {},
};
Object.defineProperty(globalThis, 'navigator', {
  value: {}, // sin geolocation → la app debe funcionar igual
  configurable: true,
});
Object.defineProperty(globalThis, 'location', {
  value: { hash: '', origin: 'https://app.test', pathname: '/index.html' },
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
  },
  configurable: true,
});

await import('../src/main.js');

const settle = () => new Promise((r) => setTimeout(r, 400));
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

console.log('\nSmoke:');

await settle();
t('home muestra la pregunta y los servicios', () => {
  assert.match(appEl.innerHTML, /¿QUÉ NECESITÁS\?/);
  assert.match(appEl.innerHTML, /ALMUERZO/);
  assert.match(appEl.innerHTML, /DORMIR/);
  assert.match(appEl.innerHTML, /href="#\/s\/lunch"/);
});

t('home SIN guardados no muestra MIS LUGARES', () => {
  assert.doesNotMatch(appEl.innerHTML, /MIS LUGARES/);
});

location.hash = '#/s/lunch';
await handlers.hashchange();
await settle();
t('resultados de almuerzo muestran lugares y CÓMO LLEGAR', () => {
  assert.match(appEl.innerHTML, /ALMUERZO/);
  assert.match(appEl.innerHTML, /Comedor San José/);
  assert.match(appEl.innerHTML, /Centro Comunitario La Esperanza/);
  assert.match(appEl.innerHTML, /CÓMO LLEGAR/);
  assert.match(appEl.innerHTML, /google\.com\/maps\/dir/);
  assert.match(appEl.innerHTML, /HOY|MAÑANA|LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|SÁBADO|DOMINGO/);
});

t('las tarjetas ofrecen GUARDAR y un QR con la URL de guardado', () => {
  assert.match(appEl.innerHTML, /GUARDAR/);
  assert.match(appEl.innerHTML, /data-save="comedor-san-jose"/);
  assert.match(appEl.innerHTML, /<svg/); // QR inline
});

t('no muestra lugares que no ofrecen almuerzo', () => {
  assert.doesNotMatch(appEl.innerHTML, /Refugio Municipal/);
  assert.doesNotMatch(appEl.innerHTML, /El Roperito/);
});

location.hash = '#/guardar/comedor-san-jose';
await handlers.hashchange();
await settle();
t('escanear un QR guarda el lugar y muestra la confirmación', () => {
  assert.match(appEl.innerHTML, /GUARDADO EN ESTE TELÉFONO/);
  assert.match(appEl.innerHTML, /Comedor San José/);
  assert.match(appEl.innerHTML, /CÓMO LLEGAR/);
  assert.match(appEl.innerHTML, /Se borra solo a los 3 días/);
});

location.hash = '#/';
await handlers.hashchange();
await settle();
t('la home muestra primero MIS LUGARES y después los servicios', () => {
  const html = appEl.innerHTML;
  assert.match(html, /⭐ MIS LUGARES/);
  assert.match(html, /Comedor San José/);
  assert.match(html, /¿QUÉ NECESITÁS\?/);
  assert.ok(
    html.indexOf('MIS LUGARES') < html.indexOf('service-grid'),
    'MIS LUGARES debe aparecer antes que la grilla de servicios'
  );
});

location.hash = '#/guardar/lugar-que-no-existe';
await handlers.hashchange();
await settle();
t('guardar un lugar inexistente vuelve a la home', () => {
  assert.match(appEl.innerHTML, /¿QUÉ NECESITÁS\?/);
});

location.hash = '#/panel';
await handlers.hashchange();
await settle();
t('modo pantalla lista servicios con QR escaneable por lugar', () => {
  assert.match(appEl.innerHTML, /Qué hay hoy/);
  assert.match(appEl.innerHTML, /Refugio Municipal/);
  assert.match(appEl.innerHTML, /<svg/); // QR
  assert.match(appEl.innerHTML, /ESCANEAR/);
});

location.hash = '#/s/servicio-que-no-existe';
await handlers.hashchange();
await settle();
t('servicio desconocido vuelve a la home', () => {
  assert.match(appEl.innerHTML, /¿QUÉ NECESITÁS\?/);
});

location.hash = '#contenido';
await handlers.hashchange?.();
t('ancla interna no rompe la navegación', () => {
  assert.match(appEl.innerHTML, /¿QUÉ NECESITÁS\?/);
});

if (failed) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log('\nSmoke test OK ✔\n');
process.exit(0); // asegura salir aunque quede un timer de #/panel
