/* ============================================================
   GESTIÓN — Secciones nuevas · Equipo · Compartir datos
   ============================================================ */

import { esc } from '../../utils/html.js';
import { getServices } from '../../services/catalog.service.js';

const EMOJI_SUGGESTIONS = ['🚿', '🧴', '💊', '🩹', '🍼', '📚', '🔌', '🚰', '🧦', '🩺', '🧼', '🍫'];

/* ---------- SECCIONES ---------- */

export function renderAdminServices({ flash = null, error = null } = {}) {
  const services = getServices();
  return `
  <div class="page admin">
    <header class="page-header">
      <a class="back-link" href="#/admin">← GESTIÓN</a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>🧩 Secciones</h2>
      <p class="admin-sub">
        Las secciones son las categorías que ve la gente (DESAYUNO, ROPA…).
        Una sección nueva aparece en la app <strong>recién cuando algún lugar la ofrece</strong>.
      </p>
      ${flash ? `<p class="form-ok" role="status">${esc(flash)}</p>` : ''}
      ${error ? `<p class="form-errors" role="alert">${esc(error)}</p>` : ''}
    </header>

    <div class="admin-list">
      ${services
        .map(
          (s) => `
        <article class="admin-place">
          <div class="admin-place__info">
            <h3>${s.icon} ${esc(s.label)}</h3>
          </div>
          <div class="admin-place__actions">
            ${
              s.builtin
                ? '<span class="badge">FIJA</span>'
                : `<button type="button" class="btn-danger" data-action="remove-service"
                     data-id="${esc(s.id)}">BORRAR</button>`
            }
          </div>
        </article>`
        )
        .join('')}
    </div>

    <form class="admin-form admin-panel" data-form="service">
      <h3 class="admin-panel__title">CREAR SECCIÓN NUEVA</h3>
      <div class="field">
        <label for="f-label">NOMBRE <em>*</em></label>
        <input id="f-label" name="label" type="text" required placeholder="Ej: DUCHAS" />
        <p class="field-hint">Una palabra, como la diría la gente.</p>
      </div>
      <div class="field">
        <label for="f-icon">ÍCONO</label>
        <input id="f-icon" name="icon" type="text" placeholder="Ej: 🚿" />
        <div class="emoji-row">
          ${EMOJI_SUGGESTIONS.map(
            (e) => `<button type="button" class="emoji-btn" data-action="emoji" data-emoji="${e}">${e}</button>`
          ).join('')}
        </div>
        <p class="field-hint">Tocá uno o escribí/pegá el emoji que quieras.</p>
      </div>
      <button class="btn-directions admin-submit" type="submit">CREAR SECCIÓN</button>
    </form>
  </div>`;
}

/* ---------- EQUIPO ---------- */

export function renderAdminUsers({ users, flash = null, error = null } = {}) {
  return `
  <div class="page admin">
    <header class="page-header">
      <a class="back-link" href="#/admin">← GESTIÓN</a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>👥 Equipo</h2>
      <p class="admin-sub">
        Personas que pueden entrar a esta zona. Cada una con su usuario y su clave.
        Útil si en cada punto de la ciudad hay alguien que carga sus lugares.
      </p>
      ${flash ? `<p class="form-ok" role="status">${esc(flash)}</p>` : ''}
      ${error ? `<p class="form-errors" role="alert">${esc(error)}</p>` : ''}
    </header>

    <div class="admin-list">
      ${users
        .map(
          (u) => `
        <article class="admin-place">
          <div class="admin-place__info">
            <h3>${esc(u.name)}</h3>
            <p>Usuario: <strong>${esc(u.username)}</strong></p>
          </div>
          <div class="admin-place__actions">
            ${
              u.builtin
                ? '<span class="badge">PERMANENTE</span>'
                : `<button type="button" class="btn-danger" data-action="remove-user"
                     data-username="${esc(u.username)}">BORRAR</button>`
            }
          </div>
        </article>`
        )
        .join('')}
    </div>

    <form class="admin-form admin-panel" data-form="user">
      <h3 class="admin-panel__title">SUMAR PERSONA</h3>
      <div class="field">
        <label for="f-uname">NOMBRE Y APELLIDO <em>*</em></label>
        <input id="f-uname" name="name" type="text" required placeholder="Ej: María Gómez" />
      </div>
      <div class="field">
        <label for="f-uuser">USUARIO <em>*</em></label>
        <input id="f-uuser" name="username" type="text" required placeholder="Ej: maria.norte" />
        <p class="field-hint">Sin espacios ni acentos. Letras, números, punto y guion.</p>
      </div>
      <div class="field">
        <label for="f-upass">CLAVE <em>*</em></label>
        <input id="f-upass" name="password" type="text" required placeholder="Ej: norte2024" />
        <p class="field-hint">Fácil de recordar para la persona. Mínimo 4 caracteres.</p>
      </div>
      <button class="btn-directions admin-submit" type="submit">SUMAR AL EQUIPO</button>
    </form>
  </div>`;
}

/* ---------- COMPARTIR DATOS ---------- */

export function renderAdminData({ exportText, flash = null, error = null } = {}) {
  return `
  <div class="page admin">
    <header class="page-header">
      <a class="back-link" href="#/admin">← GESTIÓN</a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>📤 Compartir datos</h2>
      <p class="admin-sub">
        Lo cargado queda guardado <strong>en este aparato</strong>. Para que otro
        aparato (la TV, otra PC, otro teléfono) tenga lo mismo:
        <strong>copiá el texto de acá</strong> y <strong>pegalo allá</strong>.
      </p>
      ${flash ? `<p class="form-ok" role="status">${esc(flash)}</p>` : ''}
      ${error ? `<p class="form-errors" role="alert">${esc(error)}</p>` : ''}
    </header>

    <section class="admin-panel admin-data">
      <h3 class="admin-panel__title">1️⃣ SACAR LOS DATOS DE ESTE APARATO</h3>
      <div class="field">
        <label for="export-text">Este texto es todo lo cargado acá:</label>
        <textarea id="export-text" readonly rows="6">${esc(exportText)}</textarea>
      </div>
      <div class="maps-row">
        <button type="button" class="btn-secondary" data-action="copy-export">COPIAR TEXTO</button>
        <button type="button" class="btn-secondary" data-action="download-export">
          DESCARGAR ARCHIVO
        </button>
      </div>
    </section>

    <form class="admin-form admin-panel" data-form="import">
      <h3 class="admin-panel__title">2️⃣ TRAER DATOS DE OTRO APARATO</h3>
      <div class="field">
        <label for="import-text">Pegá acá el texto copiado en el otro aparato:</label>
        <textarea id="import-text" name="payload" rows="6"
          placeholder="Pegá acá el texto…"></textarea>
        <p class="field-hint">
          Se <strong>suman</strong> a lo que ya hay: nada de este aparato se pierde.
        </p>
      </div>
      <button class="btn-directions admin-submit" type="submit">TRAER DATOS</button>
    </form>
  </div>`;
}


/* ---------- PANTALLA (ajustes de la cartelería) ---------- */

export function renderAdminBoardSettings({ settings, flash = null } = {}) {
  return `
  <div class="page admin">
    <header class="page-header">
      <a class="back-link" href="#/admin">← GESTIÓN</a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>🖥️ Pantalla</h2>
      <p class="admin-sub">
        Cómo se mueve la cartelería (la vista de TV / monitor).
        Los cambios valen <strong>para este aparato</strong>.
      </p>
      ${flash ? `<p class="form-ok" role="status">${esc(flash)}</p>` : ''}
    </header>
    <form class="admin-form" data-form="board-settings">
      <label class="active-toggle">
        <input type="checkbox" name="autoScroll" ${settings.autoScroll ? 'checked' : ''} />
        <span><strong>MOVIMIENTO AUTOMÁTICO</strong> — si no entra todo,
        la pantalla baja y sube sola</span>
      </label>
      <div class="field">
        <label for="f-scroll-secs">¿CADA CUÁNTOS SEGUNDOS se mueve?</label>
        <input id="f-scroll-secs" name="autoScrollSeconds" type="number"
          min="3" max="120" step="1" inputmode="numeric"
          value="${settings.autoScrollSeconds}" />
        <p class="field-hint">Entre 3 y 120. Recomendado: 10.</p>
      </div>
      <div class="field">
        <label for="f-rotate-secs">¿CADA CUÁNTOS SEGUNDOS rotan las tarjetas?</label>
        <input id="f-rotate-secs" name="rotateSeconds" type="number"
          min="2" max="60" step="1" inputmode="numeric"
          value="${settings.rotateSeconds}" />
        <p class="field-hint">Entre 2 y 60. Recomendado: 6.</p>
      </div>
      <button class="btn-directions admin-submit" type="submit">GUARDAR</button>
    </form>
    <p class="admin-sub" style="margin-top: 1.5rem;">
      <a class="back-link" href="#/panel">Ver cómo queda la cartelería →</a>
    </p>
  </div>`;
}
