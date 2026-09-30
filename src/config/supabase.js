/* ============================================================
   SUPABASE — conexión (pública por diseño)
   ------------------------------------------------------------
   La URL y la publishable key pueden estar en el frontend:
   NO son secretas. La seguridad real la da Row Level Security
   en la base (ver supabase/schema.sql):
   - Anónimos: solo LEEN lugares activos.
   - Escritura: solo usuarios logueados del equipo.
   La service_role key jamás vive acá (solo en la Edge Function).
   ============================================================ */

export const SUPABASE_URL = 'https://bpvfgyxwdjroxypbmejy.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_3jvYhwdAxvyi2iLPpBXeLg_JhJrJL5P';

/* Los "usuarios" simples se mapean a este dominio de email interno
   (Supabase Auth pide email; la gente ve solo su usuario). */
export const EMAIL_DOMAIN = '@acerca.local';
