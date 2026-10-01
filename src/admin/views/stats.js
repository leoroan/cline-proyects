/* ============================================================
   GESTIÓN — Estadística (SOLO dueño)
   Fechas en formato DD-MM-AAAA, hora de Argentina (GMT-3).
   ============================================================ */

import { esc } from '../../utils/html.js';
import { SERVICES } from '../../config/services.js';
import { formatAR } from '../../services/time.service.js';

function dayLabel(ymd) {
  // '2026-09-30' → '30-09-2026'
  const [y, m, d] = String(ymd).split('-');
  return `${d}-${m}-${y}`;
}

export function renderStats({ stats }) {
  const {
    today,
    week,
    total,
    daily,
    paths,
    recent,
    places,
    customServices,
    team,
    visitorsToday = 0,
    visitorsWeek = 0,
    devices = [],
    hours = [],
    todayPublic = today,
    weekPublic = week,
    dailySplit = null,
  } = stats;

  return `
  <div class="page admin">
    <header class="page-header">
      <a class="back-link" href="#/admin">
        <i class="bi bi-arrow-left" aria-hidden="true"></i> GESTIÓN
      </a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>📊 Estadística</h2>
      <p class="admin-sub">
        Cuánto y cómo se usa la app. <strong>Solo la ves vos</strong> (el dueño).
        Una <strong>visita</strong> = una pantalla vista (home, un servicio, el panel,
        un QR guardado). Las de gestión (tus clics en #/admin) se cuentan aparte.
        Fechas en hora de Argentina (GMT-3).
      </p>
    </header>

    <div class="stats-cards">
      <div class="stats-card">
        <p class="stats-card__num">${todayPublic}</p>
        <p class="stats-card__label">VISITAS HOY</p>
        <p class="stats-card__sub">+${today - todayPublic} gestión</p>
      </div>
      <div class="stats-card">
        <p class="stats-card__num">${weekPublic}</p>
        <p class="stats-card__label">VISITAS 7 DÍAS</p>
        <p class="stats-card__sub">+${week - weekPublic} gestión</p>
      </div>
      <div class="stats-card">
        <p class="stats-card__num">${total}</p>
        <p class="stats-card__label">VISITAS TOTALES</p>
      </div>
      <div class="stats-card">
        <p class="stats-card__num">${visitorsToday}</p>
        <p class="stats-card__label">VISITANTES HOY</p>
      </div>
      <div class="stats-card">
        <p class="stats-card__num">${visitorsWeek}</p>
        <p class="stats-card__label">VISITANTES 7 DÍAS</p>
      </div>
    </div>

    <section class="admin-panel">
      <h3 class="admin-panel__title">EL SITIO AHORA</h3>
      <p class="stats-line">📍 Lugares: <strong>${places.active} activos</strong>
        · ${places.inactive} en pausa</p>
      <p class="stats-line">🧩 Secciones: <strong>${SERVICES.length + customServices}</strong>
        (${customServices} creadas por el equipo)</p>
      <p class="stats-line">👥 Equipo: <strong>${team}</strong> personas</p>
    </section>

    <section class="admin-panel">
      <h3 class="admin-panel__title">VISITAS POR DÍA (últimos 14 días)</h3>
      ${
        dailySplit && dailySplit.length
          ? `<table class="stats-table">
              <thead><tr><th>Día</th><th>Públicas</th><th>Gestión</th></tr></thead>
              <tbody>
              ${dailySplit
                .map(
                  (d) =>
                    `<tr><td>${esc(dayLabel(d.day))}</td><td><strong>${d.publicas}</strong></td><td>${d.gestion}</td></tr>`
                )
                .join('')}
              </tbody></table>`
          : daily.length
            ? `<table class="stats-table"><tbody>
              ${daily
                .map(
                  (d) => `<tr><td>${esc(dayLabel(d.day))}</td><td><strong>${d.views}</strong></td></tr>`
                )
                .join('')}
            </tbody></table>`
            : '<p class="field-hint">Todavía no hay visitas registradas.</p>'
      }
    </section>

    <section class="admin-panel">
      <h3 class="admin-panel__title">RUTAS MÁS VISTAS</h3>
      ${
        paths.length
          ? `<table class="stats-table"><tbody>
              ${paths
                .map(
                  (p) => `<tr><td>${esc(p.path)}</td><td><strong>${p.views}</strong></td></tr>`
                )
                .join('')}
            </tbody></table>`
          : '<p class="field-hint">Sin datos todavía.</p>'
      }
    </section>

    <section class="admin-panel">
      <h3 class="admin-panel__title">¿DESDE QUÉ ENTRAN?</h3>
      ${
        devices.length
          ? `<table class="stats-table"><tbody>
              ${devices
                .map(
                  (d) => `<tr><td>${esc(d.device)}</td><td><strong>${d.views}</strong></td></tr>`
                )
                .join('')}
            </tbody></table>`
          : '<p class="field-hint">Sin datos todavía.</p>'
      }
    </section>

    <section class="admin-panel">
      <h3 class="admin-panel__title">¿A QUÉ HORA ENTRAN? (GMT-3)</h3>
      ${
        hours.length
          ? `<table class="stats-table"><tbody>
              ${hours
                .map(
                  (h) =>
                    `<tr><td>${String(h.hour).padStart(2, '0')}:00 – ${String(h.hour).padStart(2, '0')}:59</td><td><strong>${h.views}</strong></td></tr>`
                )
                .join('')}
            </tbody></table>`
          : '<p class="field-hint">Sin datos todavía.</p>'
      }
    </section>

    <section class="admin-panel">
      <h3 class="admin-panel__title">ÚLTIMAS 10 VISITAS</h3>
      ${
        recent.length
          ? `<table class="stats-table"><tbody>
              ${recent
                .map(
                  (r) =>
                    `<tr><td>${esc(r.path)}</td><td>${esc(formatAR(r.created_at))}</td></tr>`
                )
                .join('')}
            </tbody></table>`
          : '<p class="field-hint">Sin datos todavía.</p>'
      }
    </section>
  </div>`;
}
