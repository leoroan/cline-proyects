/* Icono de un servicio: Bootstrap Icons si la entrada del
   catálogo tiene `bi`, si no el emoji (secciones creadas
   desde gestión). Siempre decorativo (el texto acompaña). */

import { esc } from '../utils/html.js';

export function serviceIcon(svc) {
  if (svc?.bi) return `<i class="bi ${esc(svc.bi)}" aria-hidden="true"></i>`;
  return `<span aria-hidden="true">${svc?.icon ?? '•'}</span>`;
}
