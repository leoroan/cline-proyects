/* Pintar una vista en #app y mover el foco a su título
   (los lectores de pantalla anuncian la nueva pantalla). */

export function paint(html, { focus = true } = {}) {
  const app = document.getElementById('app');
  app.innerHTML = html;
  if (focus) {
    const heading = app.querySelector('[data-focus]');
    if (heading) heading.focus({ preventScroll: true });
  }
}
