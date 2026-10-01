/* ============================================================
   GESTIÓN — Mensajes de contacto (SOLO dueño)
   ============================================================ */

import { esc } from '../../utils/html.js';
import { formatAR } from '../../services/time.service.js';

export function renderMessages({ messages, flash = null, error = null }) {
  const unread = messages.filter((m) => !m.read).length;

  return `
  <div class="page admin">
    <header class="page-header">
      <a class="back-link" href="#/admin">
        <i class="bi bi-arrow-left" aria-hidden="true"></i> GESTIÓN
      </a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>📨 Mensajes</h2>
      <p class="admin-sub">
        Lo que escriben desde el formulario de contacto de la guía.
        <strong>Solo lo ves vos</strong> (el dueño).
      </p>
      ${flash ? `<p class="form-ok" role="status">${esc(flash)}</p>` : ''}
      ${error ? `<p class="form-errors" role="alert">${esc(error)}</p>` : ''}
      <p class="admin-sub">
        ${unread ? `<strong>${unread} sin leer</strong> · ` : ''}${messages.length} en total
      </p>
    </header>
    <div class="admin-list">
      ${
        messages.length === 0
          ? '<p class="field-hint">Todavía no hay mensajes.</p>'
          : messages
              .map(
                (m) => `
        <article class="admin-place${m.read ? '' : ' is-unread'}">
          <div class="admin-place__info">
            <p class="messages-date">${esc(formatAR(m.created_at))}${
              m.read ? '' : ' · <span class="badge badge--on">NUEVO</span>'
            }</p>
            <p class="messages-text">${esc(m.message)}</p>
            ${
              m.contact
                ? `<p class="messages-contact"><i class="bi bi-reply" aria-hidden="true"></i> Contacto: <strong>${esc(m.contact)}</strong></p>`
                : ''
            }
          </div>
          <div class="admin-place__actions">
            ${
              m.read
                ? ''
                : `<button type="button" class="btn-secondary" data-action="read-message"\n                     data-id="${m.id}">MARCAR LEÍDO</button>`
            }
            <button type="button" class="btn-danger" data-action="delete-message"
              data-id="${m.id}">BORRAR</button>
          </div>
        </article>`
              )
              .join('')
      }
    </div>
  </div>`;
}
