/* ============================================================
   CONTACTO — formulario sin exponer el email del dueño
   ------------------------------------------------------------
   Envía el mensaje a Supabase (tabla contact_messages) con un
   fetch directo a PostgREST. El email del dueño NO aparece en
   ningún lado. Anti-spam: honeypot + pregunta humana + rate
   limit y chequeos en la base (supabase/contact.sql).
   ============================================================ */

const SUPABASE_URL = 'https://bpvfgyxwdjroxypbmejy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3jvYhwdAxvyi2iLPpBXeLg_JhJrJL5P';
const MATH_ANSWER = '5'; // "¿Cuánto es 2 + 3?"

/** Id anónimo (mismo que usa la app para estadísticas). */
function visitorId() {
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

/** Validación pura (testeable): devuelve lista de errores en palabras simples. */
export function validateMessage({ message, website, math }) {
  const errors = [];
  const text = String(message ?? '').trim();
  if (String(website ?? '').trim() !== '') errors.push('spam'); // honeypot
  if (text.length < 10) errors.push('Contanos un poco más (mínimo 10 letras).');
  if (text.length > 2000) errors.push('Es muy largo (máximo 2000 letras).');
  if (String(math ?? '').trim() !== MATH_ANSWER) {
    errors.push('La respuesta de la suma no es correcta.');
  }
  return errors;
}

async function sendMessage({ message, contact, website }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      message,
      contact: contact || null,
      visitor: visitorId(),
      website: website || null,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/* ---------- UI (solo si existe el formulario en la página) ---------- */

if (typeof document !== 'undefined') {
  const form = document.getElementById('contact-form');
  if (form) {
    const status = form.querySelector('[data-status]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const payload = {
        message: String(data.get('message') ?? '').trim(),
        contact: String(data.get('contact') ?? '').trim(),
        website: String(data.get('website') ?? '').trim(),
        math: String(data.get('math') ?? '').trim(),
      };

      // Honeypot: si está lleno, es un bot → "éxito" falso sin enviar
      if (payload.website !== '') {
        form.innerHTML = '<p class="contact-ok">✔ ¡Gracias! Tu mensaje llegó.</p>';
        return;
      }

      const errors = validateMessage(payload);
      if (errors.length > 0) {
        status.textContent = errors[0];
        status.className = 'contact-status is-error';
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'ENVIANDO…';
      try {
        await sendMessage(payload);
        form.innerHTML =
          '<p class="contact-ok">✔ ¡Gracias! Tu mensaje llegó. Respondemos cuando podamos.</p>';
      } catch {
        status.textContent =
          'No se pudo enviar (conexión o límite de mensajes por día). Probá más tarde.';
        status.className = 'contact-status is-error';
        btn.disabled = false;
        btn.textContent = 'ENVIAR MENSAJE';
      }
    });
  }
}
