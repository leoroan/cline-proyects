/* ============================================================
   USUARIOS DE GESTIÓN — credenciales en duro (a propósito)
   ------------------------------------------------------------
   La zona de gestión (#/admin) está pensada para costo casi
   cero: SIN backend, SIN base de datos. Estas credenciales
   son un "cerrojo simbólico": evitan que una persona curiosa
   toque la cartelería, pero son visibles en el código (como
   todo candado de kiosco comunitario, no es seguridad real).

   - Cambiá usuario y clave antes de publicar.
   - Los usuarios que se agregan desde EQUIPO se guardan en
     localStorage del aparato (ver src/admin/auth.service.js)
     y se comparten con COMPARTIR DATOS.
   ============================================================ */

export const ADMIN_USERS = [
  { username: 'admin', password: 'comedor2024', name: 'Coordinación' },
];

/* Email de la persona DUEÑA del proyecto: es la única que ve la
   página de estadística (#/admin/stats). También está fijado en
   supabase/analytics.sql (RLS). Si cambia el dueño, cambiar ambos. */
export const OWNER_EMAIL = 'leoroan@gmail.com';
