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

t('CSP presente y con el hash real del JSON-LD', async () => {
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /default-src 'self'/);
  assert.match(html, /object-src 'none'/);
  // El hash del meta debe coincidir con el bloque JSON-LD actual
  const { createHash } = await import('node:crypto');
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const hash = createHash('sha256').update(m[1], 'utf8').digest('base64');
  assert.ok(html.includes(`'sha256-${hash}'`), 'el hash del CSP no coincide con el JSON-LD');
});

t('referrer policy', () => {
  assert.match(html, /name="referrer" content="strict-origin-when-cross-origin"/);
});

t('landing /guia/ existe, es indexable y linkea a la app', async () => {
  const landing = await readFile(new URL('../guia/index.html', import.meta.url), 'utf-8');
  assert.match(landing, /Ayuda Cerca/);
  assert.match(landing, /ENTRAR A LA APP|ENTRAR AHORA/);
  assert.match(landing, /FAQPage/);
  assert.match(landing, /terminos\.html/);
  assert.match(landing, /🛏️/);
});

t('términos de uso con las cláusulas clave', async () => {
  const tos = await readFile(new URL('../guia/terminos.html', import.meta.url), 'utf-8');
  assert.match(tos, /Qué es Ayuda Cerca/);
  assert.match(tos, /Qué NO es/);
  assert.match(tos, /Sin registro/);
  assert.match(tos, /sin rastreadores, sin publicidad/i);
  assert.match(tos, /Uso aceptable/);
  assert.match(tos, /911/);
});

t('sitemap incluye landing y términos', async () => {
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf-8');
  assert.match(sitemap, /guia\//);
  assert.match(sitemap, /guia\/terminos\.html/);
});

t('formulario de contacto en la landing, sin exponer el email', async () => {
  const landing = await readFile(new URL('../guia/index.html', import.meta.url), 'utf-8');
  assert.match(landing, /id="contacto"/);
  assert.match(landing, /contacto\.js/);
  assert.match(landing, /honeypot/i);
  assert.ok(!landing.includes('mailto:'));
  assert.ok(!landing.includes('leoroan@gmail.com'));
});

t('términos linkean al formulario, sin mailto', async () => {
  const tos = await readFile(new URL('../guia/terminos.html', import.meta.url), 'utf-8');
  assert.match(tos, /index\.html#contacto/);
  assert.ok(!tos.includes('mailto:'));
  assert.ok(!tos.includes('leoroan@gmail.com'));
});
