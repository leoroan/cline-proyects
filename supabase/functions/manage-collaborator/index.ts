// ============================================================
// AYUDA CERCA — Edge Function: manage-collaborator
// ------------------------------------------------------------
// Crear / listar / borrar usuarios de gestión. Sólo un ADMIN
// (profiles.role = 'admin') puede usarla. La service_role key
// vive ACÁ (servidor), jamás en el frontend.
//
// Deploy:
//   - Dashboard → Edge Functions → New function → pegar este código
//   - o CLI: supabase functions deploy manage-collaborator
//
// Acciones (POST JSON):
//   { action: 'list' }
//   { action: 'create', name, username, password }
//   { action: 'delete', userId }
// Los usernames se mapean a emails internos: usuario@acerca.local
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMAIL_DOMAIN = '@acerca.local';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Quien llama (con SU token)
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'No autenticado.' }, 401);

    // Admin (service role) + verificación de rol del que llama
    const admin = createClient(url, serviceKey);
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'admin') {
      return json({ error: 'Solo una persona admin puede gestionar el equipo.' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === 'list') {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, name, role, created_at');
      return json({
        users: (profiles ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          username: '', // el email interno no se expone
        })),
      });
    }

    if (action === 'create') {
      const name = String(body.name ?? '').trim();
      const username = String(body.username ?? '').trim().toLowerCase();
      const password = String(body.password ?? '');
      if (name.length < 2) return json({ error: 'Falta el nombre de la persona.' }, 400);
      if (!/^[a-z0-9._-]{3,}$/.test(username)) {
        return json({ error: 'Usuario: mínimo 3 letras, números, punto o guion.' }, 400);
      }
      if (password.length < 6) {
        return json({ error: 'La clave necesita al menos 6 caracteres.' }, 400);
      }
      const { data, error } = await admin.auth.admin.createUser({
        email: username + EMAIL_DOMAIN,
        password,
        email_confirm: true, // queda lista para usar al instante
        user_metadata: { name }, // el trigger crea su perfil (editor)
      });
      if (error) return json({ error: error.message }, 400);
      return json({ user: { id: data.user.id, username, name } });
    }

    if (action === 'delete') {
      const userId = String(body.userId ?? '');
      if (!userId) return json({ error: 'Falta userId.' }, 400);
      if (userId === user.id) {
        return json({ error: 'No podés borrarte a vos misma/o.' }, 400);
      }
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: 'Acción desconocida.' }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
