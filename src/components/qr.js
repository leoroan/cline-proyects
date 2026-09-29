/* ============================================================
   QR EN SVG — generado localmente (sin red, sin dependencias)
   ------------------------------------------------------------
   Usa la librería vendored src/vendor/qrcodegen.js (Nayuki, MIT).
   El logo central es posible porque el QR se genera con
   corrección de errores ALTA (~30%): el ícono tapa una zona
   mínima y el código sigue escaneándose perfecto.
   ============================================================ */

import qrcodegen from '../vendor/qrcodegen.js';

export function qrSvg(text, { logo = '🍲', border = 2 } = {}) {
  const qr = qrcodegen.QrCode.encodeText(text, qrcodegen.QrCode.Ecc.HIGH);
  const size = qr.size;
  const total = size + border * 2;

  // Un solo <path> con todos los módulos oscuros (SVG compacto)
  let d = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (qr.getModule(x, y)) d += `M${x + border} ${y + border}h1v1h-1z`;
    }
  }

  // Zona central despejada para el logo de la app
  const c = total / 2;
  const r = Math.max(4, Math.round(total * 0.12));
  const rx = Math.round(r * 0.35);
  const fontSize = Math.round(r * 1.15);

  return `<svg viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect width="${total}" height="${total}" fill="#ffffff"/><path d="${d}" fill="#1c1712"/><rect x="${c - r}" y="${c - r}" width="${
    r * 2
  }" height="${
    r * 2
  }" rx="${rx}" fill="#ffffff"/><text x="${c}" y="${c}" font-size="${fontSize}" text-anchor="middle" dominant-baseline="central">${logo}</text></svg>`;
}
