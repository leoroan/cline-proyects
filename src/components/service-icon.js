/* Icono de un servicio: emoji con color. Probado con personas
   reales: el color ayuda a reconocer cada necesidad de un
   vistazo (mejor que íconos lineales monocromos).
   Siempre decorativo: el texto acompaña. */

import { esc } from '../utils/html.js';

export function serviceIcon(svc) {
  return `<span aria-hidden="true">${esc(svc?.icon ?? '•')}</span>`;
}
