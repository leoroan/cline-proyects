/* ============================================================
   GESTIÓN — Login y menú principal
   Lenguaje ultra declarativo: cada opción explica qué hace.
   ============================================================ */

import { esc } from '../../utils/html.js';

export function renderAdminLogin({ error = null, username = '' } = {}) {
  return `
  <div class="page admin">
    <header class="page-header">
      <a class="back-link" href="#/">← VOLVER A LA APP</a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>🔐 Zona de gestión</h2>
      <p class="admin-sub">
        Esta parte es <strong>solo para las personas que cuidan la información</strong>.
        Si llegaste hasta acá buscando comida, ropa o dónde dormir,
        tocá <strong>“VOLVER A LA APP”</strong>.
      </p>
    </header>
    <form class="admin-form" data-form="login">
      ${error ? `<p class="form-errors" role="alert">${esc(error)}</p>` : ''}
      <div class="field">
        <label for="f-user">USUARIO</label>
        <input id="f-user" name="username" type="text" autocomplete="username"
          value="${esc(username)}" required />
      </div>
      <div class="field">
        <label for="f-pass">CLAVE</label>
        <input id="f-pass" name="password" type="password"
          autocomplete="current-password" required />
      </div>
      <button class="btn-directions admin-submit" type="submit">ENTRAR</button>
    </form>
  </div>`;
}

const MENU_ITEMS = [
  {
    href: '#/admin/nuevo',
    icon: '➕',
    title: 'AGREGAR LUGAR',
    desc: 'Sumar un comedor, ropero, refugio u otro punto de ayuda.',
  },
  {
    href: '#/admin/lugares',
    icon: '📋',
    title: 'LUGARES',
    desc: 'Verlos todos, editarlos, activarlos, desactivarlos o borrarlos.',
  },
  {
    href: '#/admin/secciones',
    icon: '🧩',
    title: 'SECCIONES',
    desc: 'Crear categorías nuevas (por ejemplo DUCHAS o VIANDAS).',
  },
  {
    href: '#/admin/equipo',
    icon: '👥',
    title: 'EQUIPO',
    desc: 'Dar de alta personas que colaboran cargando información.',
  },
  {
    href: '#/admin/pantalla',
    icon: '🖥️',
    title: 'PANTALLA',
    desc: 'Cómo se mueve la cartelería: rotación y scroll automático.',
  },
  {
    href: '#/admin/datos',
    icon: '📤',
    title: 'COMPARTIR DATOS',
    desc: 'Pasar lo cargado a otro teléfono, PC o TV.',
  },
];

export function renderAdminMenu({ user, flash = null }) {
  return `
  <div class="page admin">
    <header class="page-header">
      <a class="back-link" href="#/">← VER LA APP</a>
      <h2 class="page-title" id="contenido" tabindex="-1" data-focus>⚙️ Gestión</h2>
      <p class="admin-sub">Hola, <strong>${esc(user.name)}</strong> 👋 ¿Qué querés hacer?</p>
      ${flash ? `<p class="form-ok" role="status">${esc(flash)}</p>` : ''}
    </header>
    <nav class="admin-menu" aria-label="Opciones de gestión">
      ${MENU_ITEMS.map(
        (i) => `
        <a class="admin-menu__item" href="${i.href}">
          <span class="admin-menu__icon" aria-hidden="true">${i.icon}</span>
          <span class="admin-menu__text"><strong>${i.title}</strong>
          <small>${i.desc}</small></span>
        </a>`
      ).join('')}
      <button type="button" class="admin-menu__item admin-menu__item--danger" data-action="logout">
        <span class="admin-menu__icon" aria-hidden="true">🚪</span>
        <span class="admin-menu__text"><strong>CERRAR SESIÓN</strong>
        <small>Salir de la zona de gestión en este aparato.</small></span>
      </button>
    </nav>
  </div>`;
}
