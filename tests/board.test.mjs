/* Tests de la cartelería (render puro): rotación y quietud.
   Uso: node tests/board.test.mjs */

import assert from 'node:assert/strict';

Object.defineProperty(globalThis, 'location', {
  value: { origin: 'https://app.test', pathname: '/index.html', hash: '' },
  configurable: true,
});

const { renderBoard } = await import('../src/views/board.view.js');

const LAYOUT = { heroPage: 3, rowsPerSection: 3 };
const SERVICE = { id: 'dinner', label: 'CENA', icon: '🍽️' };
const NOW = new Date(2024, 5, 3, 19, 30);

const mk = (id) => ({
  place: {
    id,
    name: `Lugar ${id}`,
    address: `Calle ${id}`,
    latitude: -34.9,
    longitude: -57.9,
  },
  status: {
    tone: 'open',
    title: 'ABIERTO AHORA',
    sub: null,
    display: { when: 'HOY', open: '18:00', close: '20:00' },
  },
  distance: null,
});

const heroOf = (ids) => ({
  state: 'now',
  shift: { serviceId: 'dinner', from: '18:30', to: '22:00' },
  service: SERVICE,
  items: ids.map(mk),
});
const stripOf = (ids) => [{ service: SERVICE, items: ids.map(mk) }];

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

console.log('\nCartelería — rotación y quietud:');

t('todo entra → quieto: sin puntos y HTML idéntico entre ticks', () => {
  const a = renderBoard({
    hero: heroOf(['a', 'b']),
    strips: stripOf(['x', 'y']),
    layout: LAYOUT,
    tick: 0,
    now: NOW,
  });
  const b = renderBoard({
    hero: heroOf(['a', 'b']),
    strips: stripOf(['x', 'y']),
    layout: LAYOUT,
    tick: 5, // tick distinto: no debería cambiar nada
    now: NOW,
  });
  assert.equal(a, b);
  assert.ok(!a.includes('class="dots"'));
});

t('4 lugares en el turno → el carrusel principal rota', () => {
  const hero = heroOf(['a', 'b', 'c', 'd']);
  const p0 = renderBoard({ hero, strips: [], layout: LAYOUT, tick: 0, now: NOW });
  const p1 = renderBoard({ hero, strips: [], layout: LAYOUT, tick: 1, now: NOW });
  assert.match(p0, /Lugar a/);
  assert.doesNotMatch(p0, /Lugar d/); // la 4ª no entra en la página 1
  assert.match(p1, /Lugar d/); // aparece en la página 2
  assert.doesNotMatch(p1, /Lugar a/);
  assert.ok(p0.includes('class="dots"')); // hay indicador de páginas
});

t('el carrusel vuelve a la primera página (ciclo)', () => {
  const hero = heroOf(['a', 'b', 'c', 'd']);
  const p0 = renderBoard({ hero, strips: [], layout: LAYOUT, tick: 0, now: NOW });
  const p2 = renderBoard({ hero, strips: [], layout: LAYOUT, tick: 2, now: NOW });
  assert.equal(p0, p2);
});

t('las filas de una tarjeta de sección también rotan', () => {
  const strips = stripOf(['a', 'b', 'c', 'd']);
  const p0 = renderBoard({ hero: null, strips, layout: LAYOUT, tick: 0, now: NOW });
  const p1 = renderBoard({ hero: null, strips, layout: LAYOUT, tick: 1, now: NOW });
  assert.doesNotMatch(p0, /Lugar d/);
  assert.match(p1, /Lugar d/);
});

t('sin hero (sin turnos) igual muestra las secciones', () => {
  const html = renderBoard({
    hero: null,
    strips: stripOf(['a']),
    layout: LAYOUT,
    tick: 0,
    now: NOW,
  });
  assert.match(html, /Lugar a/);
  assert.match(html, /CENA/);
});

if (failed) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log('\nTests de cartelería OK ✔\n');
