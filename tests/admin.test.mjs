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
const { parseMapsLink } = await import('../src/admin/maps.js');
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

