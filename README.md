# Ayuda Cerca

> **Versión 0.2.0** — ahora con base Bootstrap 5.3 (vendored, sin CDN).

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
| `#/guardar/:id` | Destino de los QR: guarda el lugar y muestra confirmación |
| `#/admin` | Zona de gestión (oculta, con usuario y clave) |

El modo pantalla es **cartelería**. Arriba muestra el turno de comida (AHORA / PRÓXIMO / MAÑANA, según hora de Argentina GMT-3) con los lugares que lo sirven hoy; abajo, **todas** las demás secciones como tarjetas-carrusel. Comportamiento según la pantalla:

- **Si todo entra**: se muestra todo, quieto.
- **Lo que no entra dentro de una tarjeta**: rota en carruseles sincronizados.
- **Pantalla chica o PC (< 1200px)**: scroll manual normal.
- **TV/monitor grande (≥ 1200px) donde no entra todo**: scroll **automático** que baja y sube solo, cada X segundos (configurable en ⚙️ Gestión → 🖥️ PANTALLA, junto con la velocidad de rotación).

Relee los datos cada 30 s, pide WakeLock para que la TV no se apague y funciona en vertical u horizontal.



## 🔤 Tipografía e íconos (decisión de diseño)

- **Nunito** (vendored en `vendor/fonts/nunito`, ~16KB por peso, 400/600/700/800): redondeada, cálida y muy legible — amigable para personas con baja alfabetización y para leer a distancia. Fallback al system stack si no carga.
- **Íconos de servicio: emoji con color** (🍞🍲☕🍽️👕🛏️). Probado en la práctica: el color hace que cada necesidad se reconozca de un vistazo, mejor que íconos lineales monocromos. Las secciones creadas desde gestión también usan emoji.
- **Glifos utilitarios chicos** (CÓMO LLEGAR, reloj, teléfono, volver, menú de gestión): Bootstrap Icons, sutiles y estilizados.

## 🅱️ Bootstrap 5.3 — integración pragmática (vendored, offline)

Bootstrap está integrado **sin romper los principios** del proyecto (ir al hueso, identidad propia, cero dependencias de red):

- **Local, no CDN**: `vendor/bootstrap/` (css + bundle js) y `vendor/bootstrap-icons/` (css + fonts). La TV del comedor no necesita internet.
- **Tematizado con nuestra paleta**: las variables `--bs-*` (primary, link, body, radius) apuntan a nuestros tokens terracota/papel. No parece "plantilla Bootstrap": parece Ayuda Cerca.
- **Qué se usa de Bootstrap**:
  - **Carousel** (`data-bs-ride`, `data-bs-interval` configurable desde ⚙️ → 🖥️ PANTALLA): rota el turno y las filas de cada tarjeta de la cartelería. Con `prefers-reduced-motion` nada rota: se muestra todo.
  - **Spinner** (`spinner-border`) en "Buscando lugares…".
  - **Bootstrap Icons** sólo en glifos chicos utilitarios (ubicación, reloj, teléfono, volver, gestión): aportan lo estilizado sin volverse protagonistas.
  - **Reboot + variables CSS + `visually-hidden`**: base consistente que hereda nuestro `font-size` fluido (todo escala con el viewport igual que antes).
- **Qué NO se usa y por qué**: modales, toasts, navbars, dropdowns, offcanvas, tooltips, accordions… no ayudan a una persona a conseguir comida, ropa o dónde dormir. Sigue siendo IR AL HUESO: Bootstrap es el piso, no la casa.


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
  utils/
    html.js · paginate.js # escape HTML y carrusel
  config/
    services.js    # ★ CATÁLOGO DE SERVICIOS (dato configurable, no código)
    shifts.js      # ★ TURNOS DE COMIDA por defecto (rangos horarios)
  data/
    places.mock.js # datos de ejemplo (contrato de la futura API)
  services/
    places.service.js  # única puerta a los datos (hoy mock, mañana fetch)
    time.service.js    # lógica de horarios, pura y testeable
    geo.service.js     # ubicación, distancias, URL de "cómo llegar"
    saved.service.js   # guardados en localStorage con vencimiento
  components/
    place-card.js      # tarjeta de lugar
    saved-card.js      # tarjeta guardada (estado de todos sus servicios)
    qr.js              # QR en SVG con logo de la app
  views/
    home.view.js  results.view.js  board.view.js  saved.view.js
  vendor/
    qrcodegen.js       # generador QR (Nayuki, MIT) vendored, sin deps
  admin/
    controller.js      # zona de gestión: rutas, clicks, formularios
    auth.service.js    # usuarios y sesión (config + localStorage)
    data.service.js    # lugares/secciones locales, overrides, export-import
    maps.js            # links de Google Maps → coordenadas
    store.js           # capa mínima sobre localStorage
    views/             # login, lugares+formulario, secciones/equipo/datos
tests/             # time + saved + smoke, todo sin dependencias
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

## ⭐ Guardar y llevar (QR → teléfono de la persona)

Pensado para el caso real: **la pantalla grande muestra, la persona se lo lleva**.

- En pantallas **más grandes que un celular** (modo pantalla/TV, y también PC o tablet), cada lugar muestra un **QR con el logo de la app**: "ESCANEAR" en el panel, "ESCANEÁ Y LLEVATELO" en las tarjetas.
- Escanearlo abre `#/guardar/:id` en **el teléfono de la persona**: el lugar se guarda en `localStorage` (sin registro, sin cuenta, sin servidor) y aparece la confirmación al instante, con su CÓMO LLEGAR.
- En la home se ve primero **⭐ MIS LUGARES** (lo guardado, con el estado de todos sus servicios) y después los servicios.
- En celulares el QR no aparece (no podés escanear tu propia pantalla): en su lugar cada tarjeta tiene un botón **＋ GUARDAR**.
- **Auto-mantenible**: cada guardado vence a los **3 días**, la limpieza ocurre sola en cada lectura y hay un tope de 10 lugares. Si el storage está corrupto, se reinicia sin romper nada.
- El QR se genera **localmente** (`src/vendor/qrcodegen.js`, Nayuki, MIT, vendored): funciona sin internet, ideal para TVs sin conexión.

## 🕐 Turnos de comida (hora de Argentina)

Todo el cálculo horario usa **America/Argentina/Buenos_Aires (GMT-3)**, aunque el dispositivo (TV, PC, kiosk) tenga otra zona horaria.

Los turnos por defecto viven en `src/config/shifts.js` y se ajustan sin tocar la app:

| Turno    | Rango por defecto |
| -------- | ----------------- |
| DESAYUNO | 06:00 → 10:30     |
| ALMUERZO | 11:00 → 15:00     |
| MERIENDA | 15:30 → 18:00     |
| CENA     | 18:30 → 22:00     |

La cartelería los usa para titular "AHORA · ALMUERZO" (o el próximo turno) y mostrar sólo los lugares que sirven esa comida **hoy**. Si el turno actual no tiene lugares hoy, **cae automáticamente al siguiente turno que sí tenga** (hoy o mañana): nunca queda una pantalla vacía. Los horarios reales de cada lugar siguen saliendo de sus propios datos. Los servicios que no son comidas (ropa, dormir, duchas…) aparecen abajo como tarjetas-carrusel.

## Responsive: continuo, no breakpoints fijos

La interfaz se ajusta a **cualquier** resolución (celular, tablet, PC, TV) sin saltos discretos:

- **Tipografía raíz fluida**: `clamp(1.0625rem, 0.85rem + 1vmin, 1.75rem)` — crece de forma continua de un celular chico a una TV 4K.
- **Grillas `auto-fit` + `minmax`**: las columnas aparecen solas según el ancho real disponible (1 en celular, 2 en tablet, 3+ en PC/TV), en cualquier píxel intermedio.
- **Home que llena la pantalla**: las filas se estiran (`minmax(mínimo, 1fr)`); si no entran, hay scroll natural.
- **Espaciado fluido** con `--gap: clamp(...)` y respeto al notch (`env(safe-area-inset-*)`).
- **Celular en horizontal**: media query por altura que compacta header y botones.
- **`svh`**: el alto nunca queda escondido detrás de la barra del navegador móvil.
- **Modo pantalla**: secciones con la misma grilla fluida + tipografía en `vmin`.

## Accesibilidad

- Navegación con `<a>` nativos (funciona aunque falle JS), skip link, foco visible grueso.
- Al cambiar de pantalla el foco va al título → los lectores de pantalla la anuncian.
- Iconos emoji con `aria-hidden` + etiqueta de texto siempre presente.
- Áreas táctiles grandes (botones de servicio ≥ 5.75rem, CÓMO LLEGAR ≥ 3.9rem).
- Contraste AA (texto y estados ≥ 4.5:1), `prefers-reduced-motion` respetado.
- Tipografía y grillas fluidas que se adaptan solas a cualquier viewport (ver "Responsive").

## 🔐 Zona de gestión (`#/admin`)

Ruta **oculta** (no hay enlace público): hay que escribir `#/admin` a mano. Pide usuario y clave.

- **Credenciales por defecto**: usuario `admin`, clave `comedor2024` — cambiarlas en `src/config/admin.js` antes de publicar.
- **Es un cerrojo simbólico, no seguridad real**: sin backend, las claves viajan en el código. Alcanza para que nadie toque la cartelería por curiosidad; no para proteger datos sensibles (que no hay).
- La sesión queda en el aparato hasta tocar CERRAR SESIÓN.

Qué se puede hacer (todo con lenguaje declarativo, para personas sin experiencia informática):

| Pantalla | Qué hace |
| -------- | -------- |
| ➕ AGREGAR LUGAR | Nombre, dirección, ubicación en el mapa, qué ofrece (días y horarios por servicio), datos opcionales, activo/en pausa |
| 📋 LUGARES | Ver todos, EDITAR, ACTIVAR/DESACTIVAR, BORRAR (en dos toques, sin diálogos) |
| 🧩 SECCIONES | Crear categorías nuevas (DUCHAS, VIANDAS…) con ícono; aparecen solas en la app cuando un lugar las ofrece |
| 👥 EQUIPO | Sumar colaboradores con su usuario y clave (cada punto de la ciudad puede tener quien cargue sus lugares) |
| 🖥️ PANTALLA | Ajustes de la cartelería: scroll automático (cada cuántos segundos baja/sube) y velocidad de rotación de las tarjetas |
| 📤 COMPARTIR DATOS | Exportar (copiar texto o descargar archivo) e importar en otro aparato; se SUMAN sin borrar nada |

**Ubicación en el mapa sin APIs ni claves**: se pega el link de Google Maps (Compartir → Copiar link) y las coordenadas se extraen solas; o botón "USAR MI UBICACIÓN ACTUAL" (GPS); o nada — el CÓMO LLEGAR usa la dirección escrita.

**Dónde viven los datos**: lugares cargados, secciones nuevas, usuarios del equipo y cambios sobre lugares base (editar/desactivar/borrar) se guardan en `localStorage` del aparato. La fusión con los datos base ocurre en `places.service.js` (overrides: el origen nunca se toca). Sin internet, sin servidor, sin costo.## Qué NO tiene (a propósito)

Login · dashboards · estadísticas · formularios · perfiles · feeds · publicidad · gamificación · mapa embebido. Si algo no ayuda a una persona a conseguir comida, ropa o dónde dormir, no está.
