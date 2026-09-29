/* Tests de la cartelería (render puro): carruseles Bootstrap,
   quietud cuando todo entra, y reduced-motion.
   Uso: node tests/board.test.mjs */

import assert from 'node:assert/strict';

Object.defineProperty(globalThis, 'location', {
  value: { origin: 'https://app.test', pathname: '/index.html', hash: '' },
  configurable: true,
});

const { renderBoard } = await import('../src/views/board.view.js');

const LAYOUT = { heroPage: 3, rowsPerSection: 3, rotateMs: 6000 };
const NO_ROTATE = { heroPage: 3, rowsPerSection: 3, rotateMs: 0 };
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

console.log('\nCartelería — carruseles Bootstrap:');

t('todo entra → quieto: sin carrusel ni indicadores', () => {
  const html = renderBoard({
    hero: heroOf(['a', 'b']),
    strips: stripOf(['x', 'y']),
    layout: LAYOUT,
    now: NOW,
  });
  assert.ok(!html.includes('data-bs-ride="carousel"'));
  assert.ok(!html.includes('carousel-indicators'));
});

t('4 lugares en el turno → carrusel Bootstrap con todas las páginas', () => {
  const html = renderBoard({
    hero: heroOf(['a', 'b', 'c', 'd']),
    strips: [],
    layout: LAYOUT,
    now: NOW,
  });
  assert.ok(html.includes('data-bs-ride="carousel"'));
  assert.ok(html.includes('id="hero-carousel"'));
  assert.ok(html.includes('data-bs-interval="6000"'));
  assert.ok(html.includes('carousel-item active'));
  // las 4 páginas existen en el DOM (Bootstrap las desliza)
  for (const id of ['a', 'b', 'c', 'd']) assert.ok(html.includes(`Lugar ${id}`));
  // indicadores con slide-to
  assert.ok(html.includes('data-bs-slide-to="0"'));
  assert.ok(html.includes('data-bs-slide-to="1"'));
});

t('las filas de una sección rotan con su propio carrusel', () => {
  const html = renderBoard({
    hero: null,
    strips: stripOf(['a', 'b', 'c', 'd']),
    layout: LAYOUT,
    now: NOW,
  });
  assert.ok(html.includes('id="strip-carousel-dinner"'));
  assert.ok(html.includes('data-bs-ride="carousel"'));
});

t('rotateMs 0 (reduced-motion) → nada rota: todo visible, sin carrusel', () => {
  const html = renderBoard({
    hero: heroOf(['a', 'b', 'c', 'd']),
    strips: stripOf(['w', 'x', 'y', 'z']),
    layout: NO_ROTATE,
    now: NOW,
  });
  assert.ok(!html.includes('data-bs-ride="carousel"'));
  for (const id of ['a', 'b', 'c', 'd', 'w', 'x', 'y', 'z'])
    assert.ok(html.includes(`Lugar ${id}`));
});

t('iconos de servicio: emoji con color (no monocromos)', () => {
  const html = renderBoard({
    hero: heroOf(['a']),
    strips: stripOf(['x']),
    layout: LAYOUT,
    now: NOW,
  });
  assert.ok(html.includes('🍽️'));
  assert.ok(!html.includes('bi-moon-stars'));
});

if (failed) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log('\nTests de cartelería OK ✔\n');
