/* Tests del servicio de guardados (localStorage con vencimiento).
   Uso: node tests/saved.test.mjs */

import assert from 'node:assert/strict';

// Stubs ANTES de importar el servicio
const store = new Map();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
  },
  configurable: true,
});
Object.defineProperty(globalThis, 'location', {
  value: { origin: 'https://app.test', pathname: '/index.html', hash: '' },
  configurable: true,
});

const { save, remove, getSavedIds, isSaved, saveLink, SAVED_TTL_DAYS } = await import(
  '../src/services/saved.service.js'
);

const T0 = 1_700_000_000_000;
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

console.log('\nGuardados (localStorage):');

t('guarda y lista (más reciente primero)', () => {
  save('a', T0);
  save('b', T0 + 1000);
  assert.deepEqual(getSavedIds(T0 + 2000), ['b', 'a']);
});

t('re-guardar no duplica: lo sube y renueva el vencimiento', () => {
  save('a', T0 + 5000);
  assert.deepEqual(getSavedIds(T0 + 6000), ['a', 'b']);
});

t('isSaved', () => {
  assert.equal(isSaved('a', T0 + 6000), true);
  assert.equal(isSaved('zzz', T0 + 6000), false);
});

t('vencen solos (auto-limpieza)', () => {
  const later = T0 + 5000 + SAVED_TTL_DAYS * 24 * 60 * 60 * 1000 + 1;
  assert.deepEqual(getSavedIds(later), []);
});

t('tope máximo de guardados', () => {
  for (let i = 0; i < 15; i++) save(`lugar-${i}`, T0 + i);
  assert.equal(getSavedIds(T0 + 100_000).length, 10);
});

t('remove', () => {
  remove('lugar-14', T0);
  assert.equal(isSaved('lugar-14', T0), false);
});

t('storage corrupto no rompe nada', () => {
  store.set('ayuda-cerca:guardados:v1', 'esto no es json{{{');
  assert.deepEqual(getSavedIds(T0), []);
});

t('saveLink arma la URL de guardado', () => {
  assert.equal(
    saveLink('comedor-san-jose'),
    'https://app.test/index.html#/guardar/comedor-san-jose'
  );
});

if (failed) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log('\nTests de guardados OK ✔\n');
