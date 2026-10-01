/* ============================================================
   CONTROLADOR DE GESTIÓN (#/admin)
   ------------------------------------------------------------
   Ruta oculta: no hay ningún enlace público hacia acá.
   Sin sesión → login. Con sesión → menú y pantallas.
   ============================================================ */

import { paint } from '../utils/dom.js';
import { appCredit } from '../components/credit.js';

/* Todas las pantallas de gestión llevan la firma al pie. */
function paintAdmin(html, opts) {
  return paint(`${html}${appCredit()}`, opts);
}
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
  getBoardSettings,
  saveBoardSettings,
} from './data.service.js';
import { parseMapsLink, isShortMapsLink } from './maps.js';
import { renderAdminLogin, renderAdminMenu } from './views/login.js';
import { renderStats } from './views/stats.js';
import { renderMessages } from './views/messages.js';
import { getMessages, markMessageRead, deleteMessage } from '../services/contact.service.js';
import { getStats, isOwnerEmail } from '../services/analytics.service.js';
import { renderAdminPlaces, renderPlaceForm } from './views/places.js';
import {
  renderAdminServices,
  renderAdminUsers,
  renderAdminData,
  renderAdminBoardSettings,
} from './views/misc.js';

let flash = null; // mensaje de éxito para la próxima pantalla
let lastSub = 'menu';
let lastParam = null;

const rerender = () => renderAdmin(lastSub, lastParam);

export async function renderAdmin(sub = 'menu', param = null) {
  lastSub = sub;
  lastParam = param;

  const user = await currentUser();
  if (!user) {
    paintAdmin(renderAdminLogin());
    return;
  }

  const f = flash;
  flash = null;

  switch (sub) {
    case 'lugares': {
      const places = await getPlaces({ includeInactive: true });
      paintAdmin(renderAdminPlaces({ places, flash: f }));
      return;
    }
    case 'nuevo':
      paintAdmin(renderPlaceForm({ place: null }));
      return;
    case 'editar': {
      const places = await getPlaces({ includeInactive: true });
      const place = places.find((p) => p.id === param);
      if (!place) {
        location.hash = '#/admin/lugares';
        return;
      }
      paintAdmin(renderPlaceForm({ place }));
      return;
    }
    case 'secciones':
      await getPlaces(); // calienta el caché de secciones
      paintAdmin(renderAdminServices({ flash: f }));
      return;
    case 'equipo':
      paintAdmin(renderAdminUsers({ users: await getUsers(), flash: f }));
      return;
    case 'pantalla':
      paintAdmin(renderAdminBoardSettings({ settings: getBoardSettings(), flash: f }));
      return;
    case 'mensajes': {
      if (!isOwnerEmail(user.u)) {
        paintAdmin(renderAdminMenu({ user, flash: '⛔ Esa página es solo del dueño del proyecto.' }));
        return;
      }
      try {
        const messages = await getMessages();
        paintAdmin(renderMessages({ messages }));
      } catch (e) {
        paintAdmin(
          renderAdminMenu({
            user,
            flash: `No se pudieron cargar los mensajes (${e?.message ?? e}). ¿Corriste contact.sql en Supabase?`,
          })
        );
      }
      return;
    }
    case 'stats': {
      if (!isOwnerEmail(user.u)) {
        paintAdmin(renderAdminMenu({ user, flash: '⛔ Esa página es solo del dueño del proyecto.' }));
        return;
      }
      try {
        const stats = await getStats();
        paintAdmin(renderStats({ stats }));
      } catch (e) {
        const msg = String(e?.message ?? e);
        // La pista del SQL solo cuando el error es realmente de la base
        const esDb = /does not exist|permission|denied|solo el dueno|page_views|schema/i.test(msg);
        paintAdmin(
          renderAdminMenu({
            user,
            flash: `No se pudo cargar la estadística (${msg}).${
              esDb ? ' ¿Corriste analytics.sql y analytics-v2.sql en Supabase?' : ''
            }`,
          })
        );
      }
      return;
    }
    case 'datos':
      paintAdmin(renderAdminData({ exportText: await exportData(), flash: f }));
      return;
    default:
      paintAdmin(renderAdminMenu({ user, flash: f }));
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
      await setPlaceActive(el.dataset.id, el.dataset.active !== '1');
      flash = '✔ Se actualizó el estado.';
      rerender();
      return true;

    case 'delete-place': {
      // Confirmación en dos toques: más claro que una ventana de diálogo
      if (el.dataset.armed === '1') {
        await deletePlace(el.dataset.id);
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
      await removeCustomService(el.dataset.id);
      flash = '✔ Sección borrada.';
      rerender();
      return true;

    case 'remove-user': {
      const r = await removeUser(el.dataset.id);
      flash = r.error ?? '✔ Usuario borrado.';
      rerender();
      return true;
    }

    case 'read-message':
      await markMessageRead(Number(el.dataset.id));
      flash = '✔ Marcado como leído.';
      rerender();
      return true;

    case 'delete-message':
      await deleteMessage(Number(el.dataset.id));
      flash = '✔ Mensaje borrado.';
      rerender();
      return true;

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
      try {
        const raw = String(input?.value ?? '').trim();
        const found = parseMapsLink(raw);
        if (found && form) {
          const latInput = form.querySelector('input[name="lat"]');
          const lngInput = form.querySelector('input[name="lng"]');
          if (latInput) latInput.value = found.lat;
          if (lngInput) lngInput.value = found.lng;
          if (found.name) {
            const addr = form.querySelector('input[name="address"]');
            if (addr && !addr.value.trim()) addr.value = found.name;
          }
          input?.classList.add('is-ok');
          if (status) {
            status.textContent = `✔ Ubicación encontrada: ${found.lat}, ${found.lng}. Ya quedó cargada en el formulario.`;
            status.classList.add('is-ok');
          }
        } else if (status) {
          input?.classList.remove('is-ok');
          status.textContent = isShortMapsLink(raw)
            ? 'Ese link corto no trae las coordenadas. Abrilo en el navegador, esperá que cargue el lugar y copiá la dirección LARGA de la barra. O usá USAR MI UBICACIÓN ACTUAL.'
            : 'No entendí ese link. En Google Maps: Compartir → Copiar link, y pegalo completo.';
          status.classList.remove('is-ok');
        }
      } catch (err) {
        console.error('parse-maps-link:', err);
        if (status) {
          status.textContent =
            'Algo falló al leer el link. Probá de nuevo o escribí las coordenadas a mano (ej: -34.91, -57.95).';
          status.classList.remove('is-ok');
        }
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
      const blob = new Blob([await exportData()], { type: 'application/json' });
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
    const user = await login(fd.get('username'), fd.get('password'));
    if (!user) {
      paintAdmin(
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
      await updatePlace({ ...place, id: editing });
      flash = '✔ Cambios guardados.';
    } else {
      await addPlace(place);
      flash = '✔ Lugar agregado. Ya se ve en la app.';
    }
    location.hash = '#/admin/lugares';
    return true;
  }

  if (kind === 'service') {
    const fd = new FormData(form);
    const label = String(fd.get('label') ?? '').trim();
    if (label.length < 3) {
      paintAdmin(renderAdminServices({ error: 'La sección necesita un nombre (ej: DUCHAS).' }));
      return true;
    }
    await addCustomService({ label, icon: String(fd.get('icon') ?? '').trim() || '📌' });
    flash = '✔ Sección creada. Ya podés usarla en los lugares.';
    rerender();
    return true;
  }

  if (kind === 'user') {
    const fd = new FormData(form);
    const r = await addUser({
      name: fd.get('name'),
      username: fd.get('username'),
      password: fd.get('password'),
    });
    if (r.error) {
      paintAdmin(renderAdminUsers({ users: await getUsers(), error: r.error }));
      return true;
    }
    flash = `✔ ${r.user.name} ya puede entrar con su usuario.`;
    rerender();
    return true;
  }

  if (kind === 'board-settings') {
    const fd = new FormData(form);
    saveBoardSettings({
      autoScroll: fd.get('autoScroll') !== null,
      autoScrollSeconds: fd.get('autoScrollSeconds'),
      rotateSeconds: fd.get('rotateSeconds'),
    });
    flash = '✔ Ajustes guardados. Se aplican en la cartelería de este aparato.';
    rerender();
    return true;
  }

  if (kind === 'import') {
    const text = String(new FormData(form).get('payload') ?? '').trim();
    if (!text) {
      paintAdmin(
        renderAdminData({
          exportText: exportData(),
          error: 'Pegá primero el texto copiado en el otro aparato.',
        })
      );
      return true;
    }
    try {
      const res = await importData(text);
      flash = `✔ Listo: se sumaron ${res.places} lugares y ${res.services} secciones${res.users ? `, y ${res.users} usuarios` : ''}.`;
      renderAdmin('datos');
    } catch {
      paintAdmin(
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

