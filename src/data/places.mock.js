/* ============================================================
   DATOS DE EJEMPLO (MOCK)
   ------------------------------------------------------------
   En producción esto viene de la API. El contrato que la API
   debe respetar es exactamente este (ver src/services/places.service.js):

   {
     id:          string   — estable, único
     name:        string   — como lo conoce la gente
     address:     string   — dirección o referencia corta
     latitude:    number   — para "cómo llegar" y cercanía
     longitude:   number
     services:    string[] — ids del catálogo (src/config/services.js)
     schedule:    { [serviceId]: [{ days, open, close }] }
     availability: string | null  — ej. "Entran 20 personas…"
     phone:        string | null
     notes:        string | null  — una línea, lenguaje simple
   }

   Convenciones de schedule:
   - days: 0 = domingo, 1 = lunes, … 6 = sábado
   - open / close: "HH:MM" en 24 h
   - Soporta cruzar medianoche: { open: "20:00", close: "08:00" }
   - Un servicio sin horario cargado muestra "Horario a confirmar"
     (nunca rompe la UI).
   ============================================================ */

export const MOCK_PLACES = [
  {
    id: 'comedor-san-jose',
    name: 'Comedor San José',
    address: 'Calle 12 y 45',
    latitude: -34.9188,
    longitude: -57.953,
    services: ['breakfast', 'lunch', 'dinner'],
    schedule: {
      breakfast: [{ days: [1, 2, 3, 4, 5], open: '08:00', close: '10:00' }],
      lunch:     [{ days: [1, 2, 3, 4, 5], open: '12:00', close: '14:00' }],
      dinner:    [{ days: [1, 2, 3, 4, 5], open: '18:30', close: '20:30' }],
    },
    availability: null,
    phone: null,
    notes: null,
  },
  {
    id: 'centro-la-esperanza',
    name: 'Centro Comunitario La Esperanza',
    address: 'Calle 8 y 60',
    latitude: -34.9277,
    longitude: -57.9458,
    services: ['lunch', 'snack'],
    schedule: {
      lunch: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '11:30', close: '13:30' }],
      snack: [{ days: [1, 2, 3, 4, 5, 6], open: '16:00', close: '17:30' }],
    },
    availability: null,
    phone: null,
    notes: null,
  },
  {
    id: 'merendero-los-pibes',
    name: 'Merendero Los Pibes',
    address: 'Calle 137 y 60',
    latitude: -34.9471,
    longitude: -57.9554,
    services: ['snack'],
    schedule: {
      snack: [{ days: [1, 2, 3, 4, 5], open: '16:30', close: '18:30' }],
    },
    availability: null,
    phone: null,
    notes: null,
  },
  {
    id: 'parroquia-santa-ana',
    name: 'Parroquia Santa Ana',
    address: 'Calle 44 y 18',
    latitude: -34.9117,
    longitude: -57.9563,
    services: ['breakfast', 'dinner'],
    schedule: {
      breakfast: [{ days: [0, 6], open: '08:30', close: '10:00' }],
      dinner:    [{ days: [0, 1, 2, 3, 4, 5, 6], open: '19:00', close: '21:00' }],
    },
    availability: null,
    phone: null,
    notes: 'Entrada por la puerta lateral.',
  },
  {
    id: 'centro-comunitario-norte',
    name: 'Centro Comunitario Norte',
    address: 'Calle 520 y 25',
    latitude: -34.9035,
    longitude: -57.9662,
    services: ['clothing'],
    schedule: {
      clothing: [{ days: [2, 4], open: '10:00', close: '16:00' }],
    },
    availability: null,
    phone: null,
    notes: null,
  },
  {
    id: 'el-roperito',
    name: 'El Roperito',
    address: 'Calle 4 y 68',
    latitude: -34.9318,
    longitude: -57.9414,
    services: ['clothing'],
    schedule: {
      clothing: [{ days: [2], open: '14:00', close: '17:00' }],
    },
    availability: null,
    phone: null,
    notes: null,
  },
  {
    id: 'refugio-municipal',
    name: 'Refugio Municipal',
    address: 'Av. 7 y 50',
    latitude: -34.923,
    longitude: -57.9556,
    services: ['shelter'],
    schedule: {
      shelter: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '20:00', close: '08:00' }],
    },
    availability: 'Entran 20 personas. Conviene llegar antes de las 20.',
    phone: null,
    notes: null,
  },
  {
    id: 'hogar-buen-descanso',
    name: 'Hogar Buen Descanso',
    address: 'Calle 25 y 66',
    latitude: -34.9307,
    longitude: -57.9482,
    services: ['shelter'],
    schedule: {
      shelter: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '21:00', close: '07:00' }],
    },
    availability: null,
    phone: '221 555-0180',
    notes: 'Llamar antes de ir.',
  },
  {
    id: 'comedor-los-girasoles',
    name: 'Comedor Los Girasoles',
    address: 'Calle 66 y 120',
    latitude: -34.9367,
    longitude: -57.9478,
    services: ['lunch', 'dinner'],
    schedule: {
      lunch: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '12:00', close: '14:00' }],
      dinner: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '18:00', close: '20:00' }],
    },
    availability: null,
    phone: null,
    notes: null,
  },
  {
    id: 'cena-comunitaria-la-luna',
    name: 'Cena Comunitaria La Luna',
    address: 'Calle 31 y 70',
    latitude: -34.9295,
    longitude: -57.9462,
    services: ['dinner'],
    schedule: {
      dinner: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '19:30', close: '21:30' }],
    },
    availability: null,
    phone: null,
    notes: null,
  },
  {
    id: 'centro-de-dia-municipal',
    name: 'Centro de Día Municipal',
    address: 'Calle 49 y 14',
    latitude: -34.9156,
    longitude: -57.9501,
    services: ['clothing'],
    schedule: {
      clothing: [{ days: [1, 2, 3, 4, 5], open: '09:00', close: '13:00' }],
    },
    availability: null,
    phone: null,
    notes: null,
  },
  {
    id: 'ropa-san-roque',
    name: 'Centro de Día San Roque',
    address: 'Calle 117 y 48',
    latitude: -34.9412,
    longitude: -57.9521,
    services: ['clothing'],
    schedule: {
      clothing: [{ days: [1, 3, 5], open: '14:00', close: '17:00' }],
    },
    availability: null,
    phone: null,
    notes: null,
  },
  {
    id: 'refugio-noche-sur',
    name: 'Refugio de Noche Sur',
    address: 'Calle 155 y 52',
    latitude: -34.9523,
    longitude: -57.9538,
    services: ['shelter'],
    schedule: {
      shelter: [{ days: [0, 1, 2, 3, 4, 5, 6], open: '21:00', close: '07:00' }],
    },
    availability: null,
    phone: null,
    notes: null,
  },
];
