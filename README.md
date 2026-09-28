# Ayuda Cerca

**Punto de información comunitario digital**: comunica rápidamente servicios esenciales (comida, ropa, dónde dormir) a personas en situación de calle o con acceso limitado a la información.

No es una app tradicional. Es un **cartel digital inteligente**: entrar, mirar y saber de inmediato qué hay disponible.

## Principio rector

> **IR AL HUESO.** La app comunica QUÉ, DÓNDE, CUÁNDO y CÓMO LLEGAR. Nada más.

- Sin login, sin dashboards, sin estadísticas, sin feeds, sin publicidad.
- Máximo 2–3 interacciones: abrir → tocar lo que necesitás → tocar CÓMO LLEGAR.
- Pensada para baja alfabetización: iconos grandes, palabras cotidianas, alto contraste, botones enormes.
- Sin dependencias: ES modules nativos, CSS puro, cero build. Funciona en celulares económicos, tablets, monitores y TVs.

## Uso

```bash
npm start          # http://localhost:8080 (servidor estático sin dependencias)
npm test           # tests de horarios + integración
```

También funciona con cualquier hosting estático (Netlify, GitHub Pages, nginx…): no requiere configuración de servidor porque el router es por hash (`#/`).

## Rutas

| Ruta      | Pantalla                                          |
| --------- | ------------------------------------------------- |
| `#/`      | Home — "¿QUÉ NECESITÁS?" con las grandes acciones |
| `#/s/:id` | Resultados de un servicio (ej. `#/s/lunch`)       |
| `#/panel` | **Modo pantalla** para TV/monitor informativo     |

El modo pantalla muestra todo lo que hay hoy, se actualiza solo cada 30 segundos y pide WakeLock para que la TV no se apague. Tipografía en `vmin` para leer a distancia.

## Arquitectura

```
index.html
styles/
  tokens.css       # paleta, radios, tipografía (fuente única de verdad visual)
  base.css         # reset, foco visible, skip link, reduced-motion
  components.css   # home, resultados, tarjetas, estados
  board.css        # modo pantalla (TV)
src/
  main.js          # orquestación: rutas, orden, ubicación, refresco del panel
  router.js        # hash router mínimo
  config/
    services.js    # ★ CATÁLOGO DE SERVICIOS (dato configurable, no código)
  data/
    places.mock.js # datos de ejemplo (contrato de la futura API)
  services/
    places.service.js  # única puerta a los datos (hoy mock, mañana fetch)
    time.service.js    # lógica de horarios, pura y testeable
    geo.service.js     # ubicación, distancias, URL de "cómo llegar"
  components/
    place-card.js      # tarjeta de lugar
  views/
    home.view.js  results.view.js  board.view.js
tests/             # node tests/time.test.mjs · node tests/smoke.test.mjs
scripts/serve.mjs  # servidor estático para desarrollo
```

## Los servicios son datos configurables

La home muestra hoy: DESAYUNO · ALMUERZO · MERIENDA · CENA · ROPA · DORMIR.
**No son categorías fijas**: son entradas de `src/config/services.js`.

Para sumar un servicio (duchas, viandas, medicamentos, carga de celular…):

1. Agregar una línea al catálogo:
   ```js
   { id: 'showers', label: 'DUCHAS', icon: '🚿' },
   ```
2. Que los lugares (mock o API) lo incluyan en `services` y `schedule`.

Nada más. La home lo muestra automáticamente **cuando hay al menos un lugar que lo ofrece**, y los resultados y el modo pantalla ya saben renderizarlo. Si un lugar ofrece un servicio que no está en el catálogo, simplemente no se muestra hasta agregarlo.

## Modelo de datos (contrato API)

```js
{
  id: 'comedor-san-jose',
  name: 'Comedor San José',
  address: 'Calle 12 y 45',
  latitude: -34.9188,
  longitude: -57.9530,
  services: ['breakfast', 'lunch'],
  schedule: {
    // por servicio; days: 0=domingo … 6=sábado; soporta cruzar medianoche
    lunch: [{ days: [1, 2, 3, 4, 5], open: '12:00', close: '14:00' }],
  },
  availability: null,   // ej. "Entran 20 personas. Llegar temprano."
  phone: null,
  notes: null,          // una línea, lenguaje simple
}
```

Para conectar la API real: poner la URL en `src/services/places.service.js` (`API_URL`). La UI no se entera: ya está desacoplada de los mocks.

## Información temporal

`time.service.js` convierte horarios en mensajes que se entienden de un vistazo:

| Situación                      | Lo que muestra                       |
| ------------------------------ | ------------------------------------ |
| Dentro del horario             | 🟢 ABIERTO AHORA · Cierra 14:00      |
| Todavía no abrió (hoy)         | 🟡 ABRE HOY 12:00                    |
| Ya cerró / no abre hoy         | 🔴 CERRADO HOY · Abre mañana 12:00   |
| Próximo día de la semana       | 🔴 CERRADO HOY · Abre el lunes 12:00 |
| Servicio de un solo día        | 🔴 SOLO LOS MARTES                   |
| Turno nocturno (20:00 → 08:00) | a las 2 AM figura ABIERTO AHORA      |
| Sin horario cargado            | "Horario a confirmar" (nunca rompe)  |

El color nunca es el único indicador: siempre acompaña texto.

## Ubicación

- Se pide al entrar a los resultados; **nunca bloquea** la experiencia.
- Con ubicación: "Hay N lugares cerca tuyo", orden por distancia, "a 350 m" en cada tarjeta.
- Sin ubicación: primero los abiertos ahora.
- **CÓMO LLEGAR** abre la app de mapas del teléfono con ruta **a pie** (URL universal de Google Maps). No hay mapa propio.

## Accesibilidad

- Navegación con `<a>` nativos (funciona aunque falle JS), skip link, foco visible grueso.
- Al cambiar de pantalla el foco va al título → los lectores de pantalla la anuncian.
- Iconos emoji con `aria-hidden` + etiqueta de texto siempre presente.
- Áreas táctiles grandes (botones de servicio ≥ 5.75rem, CÓMO LLEGAR ≥ 3.9rem).
- Contraste AA (texto y estados ≥ 4.5:1), `prefers-reduced-motion` respetado.
- Tipografía raíz que escala con `vmin`: crece sola en tablets, monitores y TVs.

## Qué NO tiene (a propósito)

Login · dashboards · estadísticas · formularios · perfiles · feeds · publicidad · gamificación · mapa embebido. Si algo no ayuda a una persona a conseguir comida, ropa o dónde dormir, no está.
