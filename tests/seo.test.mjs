/* Tests del paquete SEO: meta, compartir, robots, sitemap, manifest.
   Uso: node tests/seo.test.mjs */

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf-8');

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

console.log('\nSEO:');

t('título con palabras clave reales', () => {
  assert.match(html, /<title>Ayuda Cerca — Comida, ropa y dónde dormir/);
});

t('meta description, robots y canonical', () => {
  assert.match(html, /name="description" content="Punto de información comunitario/);
  assert.match(html, /name="robots" content="index, follow"/);
  assert.match(html, /rel="canonical"/);
});

t('tarjeta para compartir (Open Graph + Twitter)', () => {
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /property="og:image"/);
  assert.match(html, /name="twitter:card"/);
});

t('datos estructurados JSON-LD', () => {
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type": "WebApplication"/);
});

t('contenido estático indexable dentro de #app', () => {
  assert.match(html, /<h1>Ayuda Cerca — ¿Qué necesitás\?<\/h1>/);
  assert.match(html, /🍞 Desayuno/);
  assert.match(html, /🛏️ Dónde dormir/);
  assert.match(html, /sin registro/i);
});

t('manifest e iconos para "agregar a inicio"', () => {
  assert.match(html, /rel="manifest"/);
  assert.match(html, /rel="apple-touch-icon"/);
});

t('robots.txt válido', async () => {
  const robots = await readFile(new URL('../robots.txt', import.meta.url), 'utf-8');
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap:/);
});

t('sitemap.xml con la URL del sitio', async () => {
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf-8');
  assert.match(sitemap, /myselfproductions\.me\/cline-proyects\//);
});

t('manifest.webmanifest es JSON válido con lo esencial', async () => {
  const raw = await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf-8');
  const m = JSON.parse(raw);
  assert.equal(m.display, 'standalone');
  assert.equal(m.lang, 'es');
  assert.ok(m.icons.length > 0);
});

if (failed) {
  console.error(`\n${failed} test(s) fallaron`);
  process.exit(1);
}
console.log('\nTests de SEO OK ✔\n');
