/* Tests de la lógica de horarios (sin dependencias).
   Uso: node tests/time.test.mjs */

import assert from 'node:assert/strict';
import { getServiceStatus } from '../src/services/time.service.js';
import { SERVICES } from '../src/config/services.js';
import { MOCK_PLACES } from '../src/data/places.mock.js';

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

// 2024-06-02 fue domingo → base + día da cualquier día de la semana.
const at = (day, h, m = 0) => new Date(2024, 5, 2 + day, h, m, 0);

const lunchLV = [{ days: [1, 2, 3, 4, 5], open: '12:00', close: '14:00' }];
const shelterDaily = [{ days: [0, 1, 2, 3, 4, 5, 6], open: '20:00', close: '08:00' }];

console.log('\nHorarios:');

t('abierto durante el horario', () => {
  const s = getServiceStatus(lunchLV, at(1, 13));
  assert.equal(s.tone, 'open');
  assert.equal(s.title, 'ABIERTO AHORA');
  assert.equal(s.sub, 'Cierra 14:00');
  assert.deepEqual(s.display, { when: 'HOY', open: '12:00', close: '14:00' });
});

t('abre más tarde hoy', () => {
  const s = getServiceStatus(lunchLV, at(1, 11));
  assert.equal(s.tone, 'soon');
  assert.equal(s.title, 'ABRE HOY 12:00');
  assert.deepEqual(s.display, { when: 'HOY', open: '12:00', close: '14:00' });
});

t('ya cerró por hoy → abre mañana', () => {
  const s = getServiceStatus(lunchLV, at(1, 15));
  assert.equal(s.tone, 'closed');
  assert.equal(s.title, 'CERRADO HOY');
  assert.equal(s.sub, 'Abre mañana 12:00');
  assert.deepEqual(s.display, { when: 'MAÑANA', open: '12:00', close: '14:00' });
});

t('fin de semana → abre el lunes', () => {
  const s = getServiceStatus(lunchLV, at(6, 12, 30));
  assert.equal(s.tone, 'closed');
  assert.equal(s.title, 'CERRADO HOY');
  assert.equal(s.sub, 'Abre el lunes 12:00');
  assert.equal(s.display.when, 'LUNES');
});

t('refugio nocturno: ABIERTO a las 2 AM', () => {
  const s = getServiceStatus(shelterDaily, at(2, 2));
  assert.equal(s.tone, 'open');
  assert.equal(s.sub, 'Cierra 08:00');
  assert.deepEqual(s.display, { when: 'HOY', open: '20:00', close: '08:00' });
});

t('refugio nocturno: de tarde avisa que abre hoy', () => {
  const s = getServiceStatus(shelterDaily, at(2, 15));
  assert.equal(s.tone, 'soon');
  assert.equal(s.title, 'ABRE HOY 20:00');
});

t('refugio nocturno: abierto a la noche', () => {
  const s = getServiceStatus(shelterDaily, at(2, 21));
  assert.equal(s.tone, 'open');
  assert.equal(s.sub, 'Cierra 08:00');
});

t('servicio de un solo día → SOLO LOS …', () => {
  const ropero = [{ days: [2], open: '14:00', close: '17:00' }];
  const s = getServiceStatus(ropero, at(5, 10));
  assert.equal(s.tone, 'closed');
  assert.equal(s.title, 'SOLO LOS MARTES');
  assert.deepEqual(s.display, { when: 'MARTES', open: '14:00', close: '17:00' });
});

t('un solo día pero es mañana → mejor "abre mañana"', () => {
  const ropero = [{ days: [2], open: '14:00', close: '17:00' }];
  const s = getServiceStatus(ropero, at(1, 18));
  assert.equal(s.sub, 'Abre mañana 14:00');
});

t('domingo, servicio diario, abierto', () => {
  const diario = [{ days: [0, 1, 2, 3, 4, 5, 6], open: '11:30', close: '13:30' }];
  const s = getServiceStatus(diario, at(0, 12));
  assert.equal(s.tone, 'open');
});

t('sin horario → null (la UI muestra "Horario a confirmar")', () => {
  assert.equal(getServiceStatus([], at(1, 12)), null);
  assert.equal(getServiceStatus(undefined, at(1, 12)), null);
  assert.equal(getServiceStatus([{ days: [], open: '10:00', close: '12:00' }], at(1, 12)), null);
});

t('varios turnos el mismo día', () => {
  const dos = [
    { days: [3], open: '08:00', close: '10:00' },
    { days: [3], open: '16:00', close: '18:00' },
  ];
  const s = getServiceStatus(dos, at(3, 11));
  assert.equal(s.tone, 'soon');
  assert.equal(s.title, 'ABRE HOY 16:00');
});

console.log('\nDatos mock:');

t('todo servicio usado existe en el catálogo', () => {
  const ids = new Set(SERVICES.map((s) => s.id));
  for (const p of MOCK_PLACES) {
    for (const sid of p.services) {
      assert.ok(ids.has(sid), `${p.id} usa servicio desconocido: ${sid}`);
    }
  }
});

t('todo lugar tiene schedule para cada servicio que ofrece', () => {
  for (const p of MOCK_PLACES) {
    assert.ok(p.services.length > 0, `${p.id} no ofrece ningún servicio`);
    for (const sid of p.services) {
      assert.ok(Array.isArray(p.schedule?.[sid]), `${p.id}: falta schedule de ${sid}`);
    }
  }
});

t('coordenadas y campos mínimos válidos', () => {
  for (const p of MOCK_PLACES) {
    assert.ok(p.id && p.name && p.address, `${p.id}: faltan campos`);
    assert.ok(Number.isFinite(p.latitude) && Number.isFinite(p.longitude), `${p.id}: coords`);
  }
});

t('cada servicio del catálogo tiene al menos un lugar', () => {
  for (const s of SERVICES) {
    assert.ok(
      MOCK_PLACES.some((p) => p.services.includes(s.id)),
      `nadie ofrece ${s.id}`
    );
  }
});

if (failed) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log('\nTodos los tests pasaron ✔\n');
