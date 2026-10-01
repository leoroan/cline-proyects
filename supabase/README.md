# Ayuda Cerca × Supabase — Guía de carga (5 pasos)

Todo se hace desde el dashboard web de Supabase, sin instalar nada.

## 1️⃣ Crear las tablas y la seguridad

Dashboard → **SQL Editor** → *New query* → pegar **todo** el contenido de
[`schema.sql`](./schema.sql) → **Run**.

Crea: tablas `places`, `custom_services`, `profiles`; el trigger de perfiles;
la función `data_version()` (para el caché); y las políticas RLS
(lectura pública de lugares activos; escritura solo para el equipo logueado).

## 2️⃣ Cargar los lugares iniciales

Mismo lugar, otra *New query* → pegar [`seed.sql`](./seed.sql) → **Run**.

Son los lugares de ejemplo actuales (con los mismos ids del código:
los QR y los "guardados" existentes siguen funcionando).

## 3️⃣ Crear el primer usuario (queda ADMIN automáticamente)

Dashboard → **Authentication** → **Users** → **Add user** → *Create new user*:

- Email: `admin@acerca.local` (o el que quieras)
- Password: una clave fuerte que recuerdes
- ✅ Marcar **Auto Confirm User**

> El primer perfil creado queda con rol **admin**; los que se sumen después
> desde la app quedan como **editor**.

## 4️⃣ Publicar la Edge Function (para sumar gente al equipo desde la app)

Dashboard → **Edge Functions** → *New function* → nombre: `manage-collaborator`
→ pegar el contenido de [`functions/manage-collaborator/index.ts`](./functions/manage-collaborator/index.ts)
→ **Deploy**.

> Sin este paso, la pantalla 👥 EQUIPO no puede crear usuarios (el resto
> de la gestión —lugares y secciones— funciona igual).

## 5️⃣ (Opcional) Estadística para el dueño

Otra *New query* → pegar [`analytics.sql`](./analytics.sql) → **Run**.

Crea la tabla `page_views` y las funciones de estadística. La app registra
visitas sola (rutas vistas); la página 📊 ESTADÍSTICA en `#/admin` la ve
**solo el dueño** (`leoroan@gmail.com`, por RLS).

## 6️⃣ (Opcional) Formulario de contacto sin exponer el email

Otra *New query* → pegar [`contact.sql`](./contact.sql) → **Run**.

Crea `contact_messages` (cualquiera escribe, solo el dueño lee, con
honeypot + rate limit anti-spam). La app muestra el formulario en la
guía (`#contacto`) y el dueño los lee en ⚙️ → 📨 MENSAJES.

## 7️⃣ Avisar

Con eso listo, el frontend se conecta solo (la URL y la publishable key ya
están en el código: son públicas por diseño; la seguridad la da RLS).

---

## Notas

- **Los usuarios usan "usuario + clave"**, no email. Internamente se mapean a
  `usuario@acerca.local`. Invisible para ellos.
- **Roles**: `admin` gestiona el equipo; cualquier colaborador logueado puede
  cargar/editar/activar/borrar lugares y crear secciones.
- **Nunca** pongas la `service_role` key en el frontend. Solo la usa la
  Edge Function (vive en el servidor).
