/* Smoke test de integración sin navegador ni dependencias:
   stub mínimo de DOM/location/navigator y se ejercita el flujo
   home → resultados → modo pantalla → home.
   Uso: node tests/smoke.test.mjs */

import assert from 'node:assert/strict';

const handlers = {};
const appEl = { innerHTML: '', querySelector: () => null };

globalThis.document = {
  getElementById: (id) => (id === 'app' ? appEl : null),
};
globalThis.window = {
  addEventListener: (ev, fn) => {
    handlers[ev] = fn;
  },
  scrollTo: () => {},
};
globalThis.location = { hash: '' };
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });

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

t('no muestra lugares que no ofrecen almuerzo', () => {
  assert.doesNotMatch(appEl.innerHTML, /Refugio Municipal/);
  assert.doesNotMatch(appEl.innerHTML, /El Roperito/);
});

location.hash = '#/panel';
await handlers.hashchange();
await settle();
t('modo pantalla lista todos los servicios con lugares', () => {
  assert.match(appEl.innerHTML, /Qué hay hoy/);
  assert.match(appEl.innerHTML, /Refugio Municipal/);
  assert.match(appEl.innerHTML, /El Roperito/);
  assert.match(appEl.innerHTML, /ALMUERZO/);
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
