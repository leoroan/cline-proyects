/* Tests de la zona de gestión — modo LOCAL (sin Supabase).
   En Node no hay window.supabase, así que la fachada cae a
   localStorage: se prueban auth, datos, maps, catálogo y
   export/import con la misma lógica de siempre.
   Uso: node tests/admin.test.mjs */

import assert from 'node:assert/strict';

// Stubs ANTES de importar los servicios
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

const auth = await import('../src/admin/auth.service.js');
const data = await import('../src/admin/data.service.js');
const { parseMapsLink, isShortMapsLink } = await import('../src/admin/maps.js');
const { handleAdminClick } = await import('../src/admin/controller.js');
const { renderStats } = await import('../src/admin/views/stats.js');
const catalog = await import('../src/services/catalog.service.js');
const { getPlaces } = await import('../src/services/places.service.js');

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
async function ta(name, fn) {
  try {
    await fn();
    console.log(`  ✔ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✘ ${name}\n    ${e.message}`);
  }
}

console.log('\nAutenticación (modo local):');

await ta('login incorrecto → null', async () => {
  assert.equal(await auth.login('admin', 'malisima'), null);
  assert.equal(await auth.currentUser(), null);
});

await ta('login correcto → sesión activa', async () => {
  const u = await auth.login('admin', 'comedor2024');
  assert.ok(u);
  assert.equal((await auth.currentUser()).u, 'admin');
});

await ta('agregar colaborador y entra con su clave', async () => {
  const r = await auth.addUser({ name: 'María Gómez', username: 'maria.norte', password: 'norte123' });
  assert.ok(r.user);
  assert.ok(await auth.login('maria.norte', 'norte123'));
});

await ta('usuario duplicado rechazado', async () => {
  assert.ok((await auth.addUser({ name: 'Otra María', username: 'maria.norte', password: 'xxxxxx' })).error);
});

await ta('validaciones amigables', async () => {
  assert.ok((await auth.addUser({ name: 'A', username: 'abcde', password: '123456' })).error);
  assert.ok((await auth.addUser({ name: 'Ana', username: 'ab', password: '123456' })).error);
  assert.ok((await auth.addUser({ name: 'Ana', username: 'abcde', password: '12' })).error);
});

await ta('borrar: locales sí, permanentes no', async () => {
  assert.ok((await auth.removeUser('admin')).error);
  assert.ok((await auth.removeUser('maria.norte')).ok);
  assert.equal(await auth.login('maria.norte', 'norte123'), null);
});

console.log('\nLugares gestionados:');

const NUEVO = {
  name: 'Comedor Barrial Sur',
  address: 'Calle 150 y 30',
  latitude: -34.95,
  longitude: -57.96,
  services: ['lunch'],
  schedule: { lunch: [{ days: [1, 2, 3, 4, 5], open: '12:00', close: '14:00' }] },
  availability: null,
  phone: null,
  notes: null,
  active: true,
};

let nuevoId;
await ta('agregar lugar aparece en la app', async () => {
  const p = await data.addPlace(NUEVO);
  nuevoId = p.id;
  const all = await getPlaces();
  assert.ok(all.some((x) => x.id === nuevoId));
  assert.ok(all.length >= 9);
});

await ta('desactivar lo saca de la app, pero sigue en gestión', async () => {
  await data.setPlaceActive(nuevoId, false);
  const pub = await getPlaces();
  assert.ok(!pub.some((x) => x.id === nuevoId));
  const admin = await getPlaces({ includeInactive: true });
  assert.ok(admin.some((x) => x.id === nuevoId && x.active === false));
});

await ta('editar un lugar base no toca el origen (override)', async () => {
  await data.updatePlace({
    id: 'comedor-san-jose',
    name: 'Comedor San José (nuevo nombre)',
    services: ['lunch'],
    schedule: { lunch: [{ days: [1], open: '12:00', close: '13:00' }] },
  });
  const all = await getPlaces();
  const sj = all.find((x) => x.id === 'comedor-san-jose');
  assert.equal(sj.name, 'Comedor San José (nuevo nombre)');
});

await ta('borrar base lo oculta; borrar local lo elimina', async () => {
  await data.deletePlace('el-roperito');
  assert.ok(!(await getPlaces()).some((x) => x.id === 'el-roperito'));
  await data.deletePlace(nuevoId);
  assert.ok(!(await getPlaces({ includeInactive: true })).some((x) => x.id === nuevoId));
});

console.log('\nSecciones nuevas:');

await ta('crear sección aparece en el catálogo', async () => {
  const svc = await data.addCustomService({ label: 'Duchas', icon: '🚿' });
  assert.equal(svc.id, 'duchas');
  assert.equal(svc.label, 'DUCHAS');
  assert.equal(catalog.getServiceById('duchas').icon, '🚿');
});

await ta('nombre repetido genera id único', async () => {
  const svc = await data.addCustomService({ label: 'DUCHAS', icon: '🚿' });
  assert.equal(svc.id, 'duchas-2');
  await data.removeCustomService('duchas-2');
});

console.log('\nLinks de Google Maps:');

t('formato @lat,lng', () => {
  const r = parseMapsLink('https://www.google.com/maps/place/Comedor+San+Jos%C3%A9/@-34.9188,-57.953,17z/');
  assert.equal(r.lat, -34.9188);
  assert.equal(r.lng, -57.953);
  assert.equal(r.name, 'Comedor San José');
});

t('formato !3d!4d', () => {
  const r = parseMapsLink('https://www.google.com/maps/place/X/data=!3d-34.92!4d-57.95');
  assert.deepEqual([r.lat, r.lng], [-34.92, -57.95]);
});

t('coordenadas escritas a mano', () => {
  const r = parseMapsLink('-34.91, -57.95');
  assert.deepEqual([r.lat, r.lng], [-34.91, -57.95]);
});

t('basura → null', () => {
  assert.equal(parseMapsLink('hola qué tal'), null);
  assert.equal(parseMapsLink(''), null);
});

console.log('\nExportar / importar (modo local):');

await ta('exportar → limpiar → importar devuelve todo', async () => {
  await data.addCustomService({ label: 'Viandas', icon: '🥡' });
  await auth.addUser({ name: 'Juan P', username: 'juan.sur', password: 'sur123' });
  const dump = await data.exportData();

  store.clear(); // otro aparato, vacío
  const res = await data.importData(dump);

  assert.ok(res.services >= 2);
  assert.ok(catalog.getServiceById('viandas'));
  assert.ok(catalog.getServiceById('duchas'));
  assert.ok(await auth.login('juan.sur', 'sur123'));
  assert.ok(data.getOverrides()['comedor-san-jose']?.edited);
});

await ta('importar basura lanza error (el caller lo atrapa)', async () => {
  await assert.rejects(() => data.importData('no es json'));
});

console.log('\nAjustes de cartelería:');

t('valores por defecto', () => {
  const s = data.getBoardSettings();
  assert.equal(s.autoScroll, true);
  assert.equal(s.autoScrollSeconds, 10);
  assert.equal(s.rotateSeconds, 6);
});

t('guardar y leer (con límites sanos)', () => {
  data.saveBoardSettings({ autoScroll: false, autoScrollSeconds: 999, rotateSeconds: 1 });
  const s = data.getBoardSettings();
  assert.equal(s.autoScroll, false);
  assert.equal(s.autoScrollSeconds, 120);
  assert.equal(s.rotateSeconds, 2);
  data.saveBoardSettings({ autoScroll: true, autoScrollSeconds: 10, rotateSeconds: 6 });
});

if (failed) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log('\nTests de gestión OK ✔\n');


console.log('\nLinks de Google Maps (formatos reales):');

t('pin suelto /place/lat,lng', () => {
  const r = parseMapsLink('https://www.google.com/maps/place/-34.9205,-57.9536');
  assert.deepEqual([r.lat, r.lng], [-34.9205, -57.9536]);
});

t('parámetro ?ll=', () => {
  const r = parseMapsLink('https://maps.google.com/?ll=-34.9205,-57.9536');
  assert.deepEqual([r.lat, r.lng], [-34.9205, -57.9536]);
});

t('/search/ y /dir/ con coords', () => {
  assert.deepEqual(
    ((r) => [r.lat, r.lng])(parseMapsLink('https://www.google.com/maps/search/-34.92,-57.95')),
    [-34.92, -57.95]
  );
  assert.deepEqual(
    ((r) => [r.lat, r.lng])(parseMapsLink('https://www.google.com/maps/dir/-34.92,-57.95')),
    [-34.92, -57.95]
  );
});

t('coordenadas no se toman como nombre', () => {
  const r = parseMapsLink('https://www.google.com/maps/place/-34.9205,-57.9536');
  assert.equal(r.name, null);
});

t('link corto detectado', () => {
  assert.equal(isShortMapsLink('https://maps.app.goo.gl/AbCd123'), true);
  assert.equal(isShortMapsLink('https://goo.gl/maps/xyz'), true);
  assert.equal(isShortMapsLink('https://www.google.com/maps/place/X/@-34.9,-57.9,17z/'), false);
});

console.log('\nBotón USAR ESTE LINK (flujo completo):');

function fakeMapsDom(link) {
  const latInput = { value: '' };
  const lngInput = { value: '' };
  const addrInput = { value: '' };
  const mapsInput = { value: link, classList: { add() {}, remove() {} } };
  const classes = new Set();
  const status = {
    textContent: '',
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) },
    has: (c) => classes.has(c),
  };
  const form = {
    querySelector: (sel) =>
      sel.includes('lat') && !sel.includes('lng') ? latInput
      : sel.includes('lng') ? lngInput
      : sel.includes('address') ? addrInput
      : null,
  };
  const field = {
    querySelector: (sel) =>
      sel.includes('mapslink') ? mapsInput : sel.includes('maps-status') ? status : null,
  };
  const el = {
    dataset: { action: 'parse-maps-link' },
    closest: (sel) => (sel === '.field' ? field : sel === 'form' ? form : null),
  };
  return { el, latInput, lngInput, status };
}

await ta('link válido → carga lat/lng y avisa en verde', async () => {
  const dom = fakeMapsDom('https://www.google.com/maps/place/Obelisco/@-34.6037,-58.3816,17z/');
  const handled = await handleAdminClick({ target: { closest: () => dom.el } });
  assert.equal(handled, true);
  assert.equal(dom.latInput.value, -34.6037);
  assert.equal(dom.lngInput.value, -58.3816);
  assert.match(dom.status.textContent, /Ubicación encontrada/);
  assert.ok(dom.status.has('is-ok'));
});

await ta('link corto → aviso específico (abrir y copiar el largo)', async () => {
  const dom = fakeMapsDom('https://maps.app.goo.gl/abc123');
  await handleAdminClick({ target: { closest: () => dom.el } });
  assert.match(dom.status.textContent, /link corto/);
});

await ta('texto basura → aviso genérico, nada se rompe', async () => {
  const dom = fakeMapsDom('cualquier cosa');
  await handleAdminClick({ target: { closest: () => dom.el } });
  assert.match(dom.status.textContent, /No entendí/);
});

console.log('\nEstadística (vista):');

t('renderStats muestra tarjetas, días DD-MM-AAAA y rutas', () => {
  const html = renderStats({
    stats: {
      today: 3,
      week: 21,
      total: 150,
      daily: [{ day: '2026-09-30', views: 3 }],
      paths: [{ path: 'home', views: 80 }],
      recent: [{ path: 'panel', created_at: '2026-09-30T15:04:00Z' }],
      places: { active: 10, inactive: 2 },
      customServices: 1,
      team: 4,
    },
  });
  assert.match(html, /HOY/);
  assert.match(html, /30-09-2026/); // día en formato DD-MM-AAAA
  assert.match(html, /30-09-2026 12:04/); // visita en DD-MM-AAAA HH:mm GMT-3
  assert.match(html, /10 activos/);
});
