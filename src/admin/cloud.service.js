/* ============================================================
   CLOUD — operaciones de gestión contra Supabase
   ------------------------------------------------------------
   Solo se usa cuando isSupabaseAvailable(). Toda escritura
   invalida el caché para que la próxima lectura traiga lo nuevo.
   ============================================================ */

import { sb, clearCache } from '../services/supabase.service.js';

/* ---------- Lugares ---------- */

export async function cloudAddPlace(place) {
  const { error } = await sb().from('places').insert(place);
  if (error) throw new Error(friendly(error));
  clearCache();
  return place;
}

export async function cloudUpdatePlace(place) {
  const { error } = await sb().from('places').update(place).eq('id', place.id);
  if (error) throw new Error(friendly(error));
  clearCache();
}

export async function cloudSetPlaceActive(id, active) {
  const { error } = await sb().from('places').update({ active }).eq('id', id);
  if (error) throw new Error(friendly(error));
  clearCache();
}

export async function cloudDeletePlace(id) {
  const { error } = await sb().from('places').delete().eq('id', id);
  if (error) throw new Error(friendly(error));
  clearCache();
}

/* ---------- Secciones ---------- */

export async function cloudAddService(svc) {
  const { error } = await sb().from('custom_services').insert(svc);
  if (error) throw new Error(friendly(error));
  clearCache();
  return svc;
}

export async function cloudRemoveService(id) {
  const { error } = await sb().from('custom_services').delete().eq('id', id);
  if (error) throw new Error(friendly(error));
  clearCache();
}

/* ---------- Exportar / importar (v2, nube) ---------- */

export async function cloudExport(places, services) {
  return JSON.stringify(
    {
      app: 'ayuda-cerca',
      v: 2,
      exportedAt: new Date().toISOString(),
      places,
      customServices: services,
    },
    null,
    2
  );
}

export async function cloudImport(payload) {
  if (payload.v !== 2) {
    throw new Error('Ese texto es de una versión vieja. Exportalo de nuevo.');
  }
  let places = 0;
  let services = 0;
  if (Array.isArray(payload.places) && payload.places.length > 0) {
    const { error } = await sb().from('places').upsert(payload.places);
    if (error) throw new Error(friendly(error));
    places = payload.places.length;
  }
  if (Array.isArray(payload.customServices) && payload.customServices.length > 0) {
    const { error } = await sb().from('custom_services').upsert(payload.customServices);
    if (error) throw new Error(friendly(error));
    services = payload.customServices.length;
  }
  clearCache();
  return { places, services, users: 0 };
}

/* ---------- Equipo (vía Edge Function, solo admin) ---------- */

async function callManage(body) {
  const { data, error } = await sb().functions.invoke('manage-collaborator', { body });
  if (error) throw new Error('No se pudo hablar con la función. ¿Está publicada?');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function cloudListUsers() {
  const data = await callManage({ action: 'list' });
  return data.users ?? [];
}

export async function cloudCreateUser({ name, username, password }) {
  return callManage({ action: 'create', name, username, password });
}

export async function cloudDeleteUser(userId) {
  return callManage({ action: 'delete', userId });
}

/* ---------- Errores en palabras simples ---------- */

function friendly(error) {
  const msg = String(error?.message ?? error);
  if (msg.includes('duplicate key')) return 'Ya existe uno con ese mismo nombre/id.';
  if (msg.includes('row-level security')) return 'Sin permiso. ¿Está la sesión iniciada?';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Sin conexión. Probá de nuevo.';
  }
  return msg;
}
