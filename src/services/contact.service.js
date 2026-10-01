/* ============================================================
   MENSAJES DE CONTACTO — solo el dueño puede leerlos
   ------------------------------------------------------------
   Los escribe cualquiera desde el formulario de la guía
   (/guia/#contacto). Llegan a contact_messages (Supabase).
   La seguridad real la da RLS (email del dueño): aunque un
   colaborador llegue a la ruta, la base no le devuelve nada.
   ============================================================ */

import { isSupabaseAvailable, sb } from './supabase.service.js';

export async function getMessages() {
  if (!isSupabaseAvailable()) return [];
  const { data, error } = await sb()
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markMessageRead(id) {
  const { error } = await sb()
    .from('contact_messages')
    .update({ read: true })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteMessage(id) {
  const { error } = await sb().from('contact_messages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
