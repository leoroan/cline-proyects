/* ============================================================
   ANALYTICS — visitas (track) y estadística del dueño
   ------------------------------------------------------------
   - track(): registra una visita por ruta, sin bloquear jamás
     la navegación y con anti-ruido (misma ruta < 60 s = 1 visita).
   - getStats(): datos para la página del dueño (#/admin/stats).
     La seguridad real está en la base (RLS por email, ver
     supabase/analytics.sql): aunque alguien llegue a la URL,
     sin ser el dueño no ve nada.
   ============================================================ */

import { OWNER_EMAIL } from '../config/admin.js';
import { isSupabaseAvailable, sb } from './supabase.service.js';
import { argentinaTime } from './time.service.js';

export function isOwnerEmail(email) {
  return String(email ?? '').trim().toLowerCase() === OWNER_EMAIL;
}

/* ---------- Contexto anónimo (sin datos personales) ---------- */

/** 'celular' | 'tablet' | 'pc/tv' — del viewport + pistas del UA. */
export function deviceClass(env = {}) {
  const w = env.width ?? 0;
  const ua = String(env.ua ?? '').toLowerCase();
  if (/smart-tv|smarttv|tizen|webos|bravia|googletv|android tv|crkey/.test(ua)) {
    return 'pc/tv';
  }
  if (w >= 1200) return 'pc/tv';
  if (w >= 700 || /tablet|ipad/.test(ua)) return 'tablet';
  return 'celular';
}

/** Id anónimo por navegador (localStorage). Permite "visitantes únicos". */
export function visitorId() {
  const KEY = 'ayuda-cerca:vid:v1';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function currentDevice() {
  try {
    return deviceClass({
      width: window.innerWidth,
      ua: navigator.userAgent,
    });
  } catch {
    return 'celular';
  }
}

/* ---------- Registro de visitas ---------- */

let lastTrack = { path: null, at: 0 };

/** 'publico' (sin sesión) · 'dueno' (owner) · 'equipo' (colaborador) */
async function currentActor() {
  try {
    const {
      data: { session },
    } = await sb().auth.getSession();
    const email = session?.user?.email;
    if (!email) return 'publico';
    return isOwnerEmail(email) ? 'dueno' : 'equipo';
  } catch {
    return 'publico';
  }
}

export function track(path) {
  if (!isSupabaseAvailable()) return;
  const now = Date.now();
  if (lastTrack.path === path && now - lastTrack.at < 60_000) return;
  lastTrack = { path, at: now };
  const device = currentDevice();
  const visitor = visitorId();
  currentActor()
    .then((actor) =>
      sb().from('page_views').insert({
        path: String(path).slice(0, 120),
        device,
        visitor,
        actor,
      })
    )
    .then(({ error }) => {
      if (error) console.warn('track:', error.message);
    })
    .catch(() => {});
}

/* ---------- Estadística (solo dueño) ---------- */

function artDateStr(date) {
  const a = argentinaTime(date);
  const p = (n) => String(n).padStart(2, '0');
  return `${a.getFullYear()}-${p(a.getMonth() + 1)}-${p(a.getDate())}`;
}

export async function getStats() {
  // ORDEN CANÓNICO: el destructuring sigue EXACTAMENTE este orden.
  // (Cualquier query nueva va SIEMPRE al final, con su nombre al final.)
  const [dailyRes, pathsRes, recentRes, totalRes, activeRes, inactiveRes, servicesRes, teamRes, visitorsRes, devicesRes, hoursRes] =
    await Promise.all([
      sb().rpc('stats_daily', { days: 14 }),                    //  1 dailyRes (publicas/dueno/equipo)
      sb().rpc('stats_paths'),                                   //  2 pathsRes
      sb()                                                       //  3 recentRes
        .from('page_views')
        .select('path, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      sb().from('page_views').select('*', { count: 'exact', head: true }), //  4 totalRes
      sb().from('places').select('*', { count: 'exact', head: true }).eq('active', true),  //  5 activeRes
      sb().from('places').select('*', { count: 'exact', head: true }).eq('active', false), //  6 inactiveRes
      sb().from('custom_services').select('*', { count: 'exact', head: true }), //  7 servicesRes
      sb().from('profiles').select('*', { count: 'exact', head: true }),        //  8 teamRes
      sb().rpc('stats_visitors', { days: 14 }),                  //  9 visitorsRes
      sb().rpc('stats_devices'),                                 // 10 devicesRes
      sb().rpc('stats_hours'),                                   // 11 hoursRes
    ]);

  if (dailyRes.error) throw new Error(dailyRes.error.message);

  // Por día: público (sin sesión) vs dueño vs equipo — la señal real
  const dailySplit = (dailyRes.data ?? []).map((r) => ({
    day: String(r.day),
    publicas: Number(r.publicas),
    dueno: Number(r.dueno),
    equipo: Number(r.equipo),
  }));
  const todayStr = artDateStr(new Date());
  const todayRow = dailySplit.find((d) => d.day === todayStr);
  const todayPublic = todayRow?.publicas ?? 0;
  const todayDueno = todayRow?.dueno ?? 0;
  const todayEquipo = todayRow?.equipo ?? 0;
  const today = todayPublic + todayDueno + todayEquipo;
  const last7 = dailySplit.slice(-7);
  const weekPublic = last7.reduce((a, d) => a + d.publicas, 0);
  const weekDueno = last7.reduce((a, d) => a + d.dueno, 0);
  const weekEquipo = last7.reduce((a, d) => a + d.equipo, 0);
  const week = weekPublic + weekDueno + weekEquipo;

  const visitors = (visitorsRes.data ?? []).map((r) => ({
    day: String(r.day),
    visitors: Number(r.visitors),
  }));
  const visitorsToday = visitors.find((d) => d.day === todayStr)?.visitors ?? 0;

  const daily = dailySplit.map((d) => ({
    day: d.day,
    views: d.publicas + d.dueno + d.equipo,
  }));
  const visitorsWeek = visitors.slice(-7).reduce((acc, d) => acc + d.visitors, 0);

  return {
    today,
    week,
    total: totalRes.count ?? 0,
    daily,
    paths: (pathsRes.data ?? []).map((p) => ({ path: p.path, views: Number(p.views) })),
    recent: recentRes.data ?? [],
    places: { active: activeRes.count ?? 0, inactive: inactiveRes.count ?? 0 },
    customServices: servicesRes.count ?? 0,
    team: teamRes.count ?? 0,
    todayPublic,
    weekPublic,
    todayDueno,
    todayEquipo,
    weekDueno,
    weekEquipo,
    dailySplit,
    visitorsToday,
    visitorsWeek,
    devices: (devicesRes.data ?? []).map((d) => ({
      device: d.device,
      views: Number(d.views),
    })),
    hours: (hoursRes.data ?? []).map((h) => ({
      hour: Number(h.hour),
      views: Number(h.views),
    })),
  };
}
