-- ============================================================
-- AYUDA CERCA — Datos iniciales (los mismos del mock)
-- Correr DESPUÉS de schema.sql. Idempotente (on conflict).
-- Los ids coinciden con los del código: los QR y los lugares
-- guardados en teléfonos siguen funcionando.
-- ============================================================

insert into public.places
  (id, name, address, latitude, longitude, services, schedule, availability, phone, notes)
values
  ('comedor-san-jose', 'Comedor San José', 'Calle 12 y 45', -34.9188, -57.953,
   '{breakfast,lunch,dinner}',
   '{"breakfast":[{"days":[1,2,3,4,5],"open":"08:00","close":"10:00"}],"lunch":[{"days":[1,2,3,4,5],"open":"12:00","close":"14:00"}],"dinner":[{"days":[1,2,3,4,5],"open":"18:30","close":"20:30"}]}',
   null, null, null),

  ('centro-la-esperanza', 'Centro Comunitario La Esperanza', 'Calle 8 y 60', -34.9277, -57.9458,
   '{lunch,snack}',
   '{"lunch":[{"days":[0,1,2,3,4,5,6],"open":"11:30","close":"13:30"}],"snack":[{"days":[1,2,3,4,5,6],"open":"16:00","close":"17:30"}]}',
   null, null, null),

  ('merendero-los-pibes', 'Merendero Los Pibes', 'Calle 137 y 60', -34.9471, -57.9554,
   '{snack}',
   '{"snack":[{"days":[1,2,3,4,5],"open":"16:30","close":"18:30"}]}',
   null, null, null),

  ('parroquia-santa-ana', 'Parroquia Santa Ana', 'Calle 44 y 18', -34.9117, -57.9563,
   '{breakfast,dinner}',
   '{"breakfast":[{"days":[0,6],"open":"08:30","close":"10:00"}],"dinner":[{"days":[0,1,2,3,4,5,6],"open":"19:00","close":"21:00"}]}',
   null, null, 'Entrada por la puerta lateral.'),

  ('centro-comunitario-norte', 'Centro Comunitario Norte', 'Calle 520 y 25', -34.9035, -57.9662,
   '{clothing}',
   '{"clothing":[{"days":[2,4],"open":"10:00","close":"16:00"}]}',
   null, null, null),

  ('el-roperito', 'El Roperito', 'Calle 4 y 68', -34.9318, -57.9414,
   '{clothing}',
   '{"clothing":[{"days":[2],"open":"14:00","close":"17:00"}]}',
   null, null, null),

  ('refugio-municipal', 'Refugio Municipal', 'Av. 7 y 50', -34.923, -57.9556,
   '{shelter}',
   '{"shelter":[{"days":[0,1,2,3,4,5,6],"open":"20:00","close":"08:00"}]}',
   'Entran 20 personas. Conviene llegar antes de las 20.', null, null),

  ('hogar-buen-descanso', 'Hogar Buen Descanso', 'Calle 25 y 66', -34.9307, -57.9482,
   '{shelter}',
   '{"shelter":[{"days":[0,1,2,3,4,5,6],"open":"21:00","close":"07:00"}]}',
   null, '221 555-0180', 'Llamar antes de ir.')
on conflict (id) do nothing;

insert into public.places
  (id, name, address, latitude, longitude, services, schedule, availability, phone, notes)
values
  ('comedor-los-girasoles', 'Comedor Los Girasoles', 'Calle 66 y 120', -34.9367, -57.9478,
   '{lunch,dinner}',
   '{"lunch":[{"days":[0,1,2,3,4,5,6],"open":"12:00","close":"14:00"}],"dinner":[{"days":[0,1,2,3,4,5,6],"open":"18:00","close":"20:00"}]}',
   null, null, null),

  ('cena-comunitaria-la-luna', 'Cena Comunitaria La Luna', 'Calle 31 y 70', -34.9295, -57.9462,
   '{dinner}',
   '{"dinner":[{"days":[0,1,2,3,4,5,6],"open":"19:30","close":"21:30"}]}',
   null, null, null),

  ('centro-de-dia-municipal', 'Centro de Día Municipal', 'Calle 49 y 14', -34.9156, -57.9501,
   '{clothing}',
   '{"clothing":[{"days":[1,2,3,4,5],"open":"09:00","close":"13:00"}]}',
   null, null, null),

  ('ropa-san-roque', 'Centro de Día San Roque', 'Calle 117 y 48', -34.9412, -57.9521,
   '{clothing}',
   '{"clothing":[{"days":[1,3,5],"open":"14:00","close":"17:00"}]}',
   null, null, null),

  ('refugio-noche-sur', 'Refugio de Noche Sur', 'Calle 155 y 52', -34.9523, -57.9538,
   '{shelter}',
   '{"shelter":[{"days":[0,1,2,3,4,5,6],"open":"21:00","close":"07:00"}]}',
   null, null, null)
on conflict (id) do nothing;
