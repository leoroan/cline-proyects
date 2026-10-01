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

/* ---------- Registro de visitas ---------- */

let lastTrack = { path: null, at: 0 };

export function track(path) {
  if (!isSupabaseAvailable()) return;
  const now = Date.now();
  if (lastTrack.path === path && now - lastTrack.at < 60_000) return;
  lastTrack = { path, at: now };
  try {
    sb()
      .from('page_views')
      .insert({ path: String(path).slice(0, 120) })
      .then(({ error }) => {
        if (error) console.warn('track:', error.message);
      })
      .catch(() => {});
  } catch {
    /* nunca bloquea la navegación */
  }
}

/* ---------- Estadística (solo dueño) ---------- */

function artDateStr(date) {
  const a = argentinaTime(date);
  const p = (n) => String(n).padStart(2, '0');
  return `${a.getFullYear()}-${p(a.getMonth() + 1)}-${p(a.getDate())}`;
}

export async function getStats() {
  const [dailyRes, pathsRes, recentRes, totalRes, activeRes, inactiveRes, servicesRes, teamRes] =
    await Promise.all([
      sb().rpc('stats_daily', { days: 14 }),
      sb().rpc('stats_paths'),
      sb()
        .from('page_views')
        .select('path, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      sb().from('page_views').select('*', { count: 'exact', head: true }),
      sb().from('places').select('*', { count: 'exact', head: true }).eq('active', true),
      sb().from('places').select('*', { count: 'exact', head: true }).eq('active', false),
      sb().from('custom_services').select('*', { count: 'exact', head: true }),
      sb().from('profiles').select('*', { count: 'exact', head: true }),
    ]);

  if (dailyRes.error) throw new Error(dailyRes.error.message);

  const daily = (dailyRes.data ?? []).map((r) => ({
    day: String(r.day),
    views: Number(r.views),
  }));
  const today = daily.find((d) => d.day === artDateStr(new Date()))?.views ?? 0;
  const week = daily.slice(-7).reduce((acc, d) => acc + d.views, 0);

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
  };
}
