/* ============================================================
   CONTROLADOR DE GESTIÓN (#/admin)
   ------------------------------------------------------------
   Ruta oculta: no hay ningún enlace público hacia acá.
   Sin sesión → login. Con sesión → menú y pantallas.
   ============================================================ */

import { paint } from '../utils/dom.js';
import { esc } from '../utils/html.js';
import { getServices } from '../services/catalog.service.js';
import { getPlaces } from '../services/places.service.js';
import { getCurrentPosition } from '../services/geo.service.js';
import {
  login,
  logout,
  currentUser,
  addUser,
  removeUser,
  getUsers,
} from './auth.service.js';
import {
  addPlace,
  updatePlace,
  setPlaceActive,
  deletePlace,
  addCustomService,
  removeCustomService,
  exportData,
  importData,
} from './data.service.js';
import { parseMapsLink } from './maps.js';
import { renderAdminLogin, renderAdminMenu } from './views/login.js';
import { renderAdminPlaces, renderPlaceForm } from './views/places.js';
import {
  renderAdminServices,
  renderAdminUsers,
  renderAdminData,
} from './views/misc.js';

let flash = null; // mensaje de éxito para la próxima pantalla
let lastSub = 'menu';
let lastParam = null;

const rerender = () => renderAdmin(lastSub, lastParam);

export async function renderAdmin(sub = 'menu', param = null) {
  lastSub = sub;
  lastParam = param;

  const user = currentUser();
  if (!user) {
    paint(renderAdminLogin());
    return;
  }

  const f = flash;
  flash = null;

  switch (sub) {
    case 'lugares': {
      const places = await getPlaces({ includeInactive: true });
      paint(renderAdminPlaces({ places, flash: f }));
      return;
    }
    case 'nuevo':
      paint(renderPlaceForm({ place: null }));
      return;
    case 'editar': {
      const places = await getPlaces({ includeInactive: true });
      const place = places.find((p) => p.id === param);
      if (!place) {
        location.hash = '#/admin/lugares';
        return;
      }
      paint(renderPlaceForm({ place }));
      return;
    }
    case 'secciones':
      paint(renderAdminServices({ flash: f }));
      return;
    case 'equipo':
      paint(renderAdminUsers({ users: getUsers(), flash: f }));
      return;
    case 'datos':
      paint(renderAdminData({ exportText: exportData(), flash: f }));
      return;
    default:
      paint(renderAdminMenu({ user, flash: f }));
  }
}

/* ---------- Clicks (botones data-action) ---------- */

export async function handleAdminClick(event) {
  const el = event.target.closest?.('[data-action]');
  if (!el) return false;
  const action = el.dataset.action;

  switch (action) {
    case 'logout':
      logout();
      location.hash = '#/';
      return true;

    case 'toggle-active':
      setPlaceActive(el.dataset.id, el.dataset.active !== '1');
      flash = '✔ Se actualizó el estado.';
      rerender();
      return true;

    case 'delete-place': {
      // Confirmación en dos toques: más claro que una ventana de diálogo
      if (el.dataset.armed === '1') {
        deletePlace(el.dataset.id);
        flash = '✔ Lugar borrado.';
        rerender();
      } else {
        el.dataset.armed = '1';
        el.classList.add('is-armed');
        el.textContent = '¿SEGURO? TOCÁ DE NUEVO';
        setTimeout(() => {
          if (el.isConnected) {
            el.dataset.armed = '';
            el.classList.remove('is-armed');
            el.textContent = 'BORRAR';
          }
        }, 4000);
      }
      return true;
    }

    case 'remove-service':
      removeCustomService(el.dataset.id);
      flash = '✔ Sección borrada.';
      rerender();
      return true;

    case 'remove-user': {
      const r = removeUser(el.dataset.username);
      flash = r.error ?? '✔ Usuario borrado.';
      rerender();
      return true;
    }

    case 'emoji': {
      const form = el.closest('form');
      const input = form?.querySelector('input[name="icon"]');
      if (input) input.value = el.dataset.emoji ?? '';
      return true;
    }

    case 'parse-maps-link': {
      const field = el.closest('.field');
      const form = el.closest('form');
      const input = field?.querySelector('input[name="mapslink"]');
      const status = field?.querySelector('#maps-status');
      const found = parseMapsLink(input?.value);
      if (found && form) {
        form.querySelector('input[name="lat"]').value = found.lat;
        form.querySelector('input[name="lng"]').value = found.lng;
        if (found.name) {
          const addr = form.querySelector('input[name="address"]');
          if (addr && !addr.value.trim()) addr.value = found.name;
        }
        if (status) {
          status.textContent = `✔ Ubicación encontrada (${found.lat}, ${found.lng}). Ya quedó cargada.`;
          status.classList.add('is-ok');
        }
      } else if (status) {
        status.textContent =
          'No entendí ese link. En Google Maps: Compartir → Copiar link, y pegalo completo.';
        status.classList.remove('is-ok');
      }
      return true;
    }

    default:
      return handleAdminClickMore(el, action);
  }
}

/* Resto de acciones (separado para archivos chicos) */

async function handleAdminClickMore(el, action) {
  switch (action) {
    case 'use-location': {
      const form = el.closest('form');
      const field = el.closest('.field');
      const status = field?.querySelector('#maps-status');
      el.disabled = true;
      el.textContent = 'BUSCANDO…';
      const pos = await getCurrentPosition({ timeout: 8000 });
      el.disabled = false;
      el.textContent = '📍 USAR MI UBICACIÓN ACTUAL';
      if (pos && form) {
        form.querySelector('input[name="lat"]').value = pos.lat;
        form.querySelector('input[name="lng"]').value = pos.lng;
        if (status) {
          status.textContent = `✔ Ubicación tomada (${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}).`;
          status.classList.add('is-ok');
        }
      } else if (status) {
        status.textContent =
          'No pude leer la ubicación. Revisá que esté activada y probá de nuevo.';
        status.classList.remove('is-ok');
      }
      return true;
    }

    case 'copy-export': {
      const panel = el.closest('.admin-data');
      const ta = panel?.querySelector('#export-text');
      if (!ta) return true;
      try {
        await navigator.clipboard.writeText(ta.value);
      } catch {
        ta.select();
        document.execCommand?.('copy');
      }
      el.textContent = '✔ COPIADO';
      setTimeout(() => {
        if (el.isConnected) el.textContent = 'COPIAR TEXTO';
      }, 2500);
      return true;
    }

    case 'download-export': {
      const blob = new Blob([exportData()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'ayuda-cerca-datos.json';
      a.click();
      URL.revokeObjectURL(a.href);
      return true;
    }

    default:
      return false;
  }
}

/* ---------- Formularios (data-form) ---------- */

function showFormErrors(form, errors) {
  const box = form.querySelector('#form-errors');
  if (!box) return;
  box.hidden = false;
  box.innerHTML = `<strong>Revisá esto:</strong><ul>${errors
    .map((e) => `<li>${esc(e)}</li>`)
    .join('')}</ul>`;
  box.focus();
}

function gatherPlace(form) {
  const fd = new FormData(form);
  const errors = [];
  const name = String(fd.get('name') ?? '').trim();
  const address = String(fd.get('address') ?? '').trim();
  if (name.length < 3) errors.push('Falta el nombre del lugar.');
  if (address.length < 3) errors.push('Falta la dirección.');

  const services = [];
  const schedule = {};
  for (const svc of getServices()) {
    if (!fd.get(`svc-${svc.id}`)) continue;
    const days = [0, 1, 2, 3, 4, 5, 6].filter((d) => fd.get(`day-${svc.id}-${d}`));
    const open = String(fd.get(`open-${svc.id}`) ?? '');
    const close = String(fd.get(`close-${svc.id}`) ?? '');
    if (days.length === 0) {
      errors.push(`Elegí al menos un día para ${svc.label}.`);
      continue;
    }
    if (!open || !close || open === close) {
      errors.push(`Revisá el horario de ${svc.label} (desde y hasta no pueden ser iguales).`);
      continue;
    }
    services.push(svc.id);
    schedule[svc.id] = [{ days, open, close }];
  }
  if (services.length === 0) {
    errors.push('Marcá al menos una cosa que ofrece (desayuno, ropa, dormir…).');
  }

  const lat = parseFloat(fd.get('lat'));
  const lng = parseFloat(fd.get('lng'));
  return {
    errors,
    place: {
      name,
      address,
      latitude: Number.isFinite(lat) ? lat : null,
      longitude: Number.isFinite(lng) ? lng : null,
      services,
      schedule,
      availability: String(fd.get('availability') ?? '').trim() || null,
      phone: String(fd.get('phone') ?? '').trim() || null,
      notes: String(fd.get('notes') ?? '').trim() || null,
      active: fd.get('active') !== null,
    },
  };
}


export async function handleAdminSubmit(event) {
  const form = event.target.closest?.('form[data-form]');
  if (!form) return false;
  event.preventDefault();
  const kind = form.dataset.form;

  if (kind === 'login') {
    const fd = new FormData(form);
    const user = login(fd.get('username'), fd.get('password'));
    if (!user) {
      paint(
        renderAdminLogin({
          error: 'Usuario o clave incorrectos. Probá de nuevo.',
          username: String(fd.get('username') ?? ''),
        })
      );
      return true;
    }
    flash = `Hola, ${user.name ?? user.username} 👋`;
    renderAdmin('menu');
    return true;
  }

  if (kind === 'place') {
    const { errors, place } = gatherPlace(form);
    if (errors.length > 0) {
      showFormErrors(form, errors);
      return true;
    }
    const editing = form.dataset.editing;
    if (editing) {
      updatePlace({ ...place, id: editing });
      flash = '✔ Cambios guardados.';
    } else {
      addPlace(place);
      flash = '✔ Lugar agregado. Ya se ve en la app.';
    }
    location.hash = '#/admin/lugares';
    return true;
  }

  if (kind === 'service') {
    const fd = new FormData(form);
    const label = String(fd.get('label') ?? '').trim();
    if (label.length < 3) {
      paint(renderAdminServices({ error: 'La sección necesita un nombre (ej: DUCHAS).' }));
      return true;
    }
    addCustomService({ label, icon: String(fd.get('icon') ?? '').trim() || '📌' });
    flash = '✔ Sección creada. Ya podés usarla en los lugares.';
    rerender();
    return true;
  }

  if (kind === 'user') {
    const fd = new FormData(form);
    const r = addUser({
      name: fd.get('name'),
      username: fd.get('username'),
      password: fd.get('password'),
    });
    if (r.error) {
      paint(renderAdminUsers({ users: getUsers(), error: r.error }));
      return true;
    }
    flash = `✔ ${r.user.name} ya puede entrar con su usuario.`;
    rerender();
    return true;
  }

  if (kind === 'import') {
    const text = String(new FormData(form).get('payload') ?? '').trim();
    if (!text) {
      paint(
        renderAdminData({
          exportText: exportData(),
          error: 'Pegá primero el texto copiado en el otro aparato.',
        })
      );
      return true;
    }
    try {
      const res = importData(text);
      flash = `✔ Listo: se sumaron ${res.places} lugares, ${res.services} secciones y ${res.users} usuarios.`;
      renderAdmin('datos');
    } catch {
      paint(
        renderAdminData({
          exportText: exportData(),
          error: 'Ese texto no se entiende. Copialo completo de nuevo.',
        })
      );
    }
    return true;
  }

  return false;
}

