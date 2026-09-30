/* Tests del servicio Supabase (helpers puros, sin red).
   Uso: node tests/supabase.test.mjs */

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

const { toEmail, isSupabaseAvailable, readCache, writeCache, clearCache } =
  await import('../src/services/supabase.service.js');

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

console.log('\nSupabase (helpers):');

t('sin librería cargada → no disponible (cae a modo local)', () => {
  assert.equal(isSupabaseAvailable(), false);
});

t('toEmail: usuario simple → dominio interno', () => {
  assert.equal(toEmail('maria.norte'), 'maria.norte@acerca.local');
});

t('toEmail: email completo queda igual (y en minúsculas)', () => {
  assert.equal(toEmail('LeoRoan@gmail.com'), 'leoroan@gmail.com');
});

t('toEmail: limpia espacios', () => {
  assert.equal(toEmail('  admin  '), 'admin@acerca.local');
});

t('caché: escribir, leer, limpiar', () => {
  writeCache({ version: 'v1', places: [{ id: 'a' }], services: [], at: 1 });
  assert.equal(readCache().version, 'v1');
  assert.equal(readCache().places.length, 1);
  clearCache();
  assert.equal(readCache(), null);
});

t('caché corrupta → null (no rompe)', () => {
  store.set('ayuda-cerca:cache:v1', '{{{ no es json');
  assert.equal(readCache(), null);
});

if (failed) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log('\nTests de supabase OK ✔\n');
