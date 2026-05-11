// ============================================================
// tooltipManager.js — tooltips elegantes anclados al cursor.
// Usar [data-tooltip] o llamar tooltip.show(html, x, y) directamente.
// ============================================================

let _root = null;
let _el = null;

function ensure () {
  if (_root) return;
  _root = document.getElementById('tooltip-root');
  _el = document.createElement('div');
  _el.className = 'tooltip';
  _el.style.display = 'none';
  _root.appendChild(_el);

  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tooltip]');
    if (t) tooltip.show(t.dataset.tooltip, e.clientX, e.clientY);
  });
  document.addEventListener('mousemove', e => {
    if (_el.style.display === 'block') tooltip.move(e.clientX, e.clientY);
  });
  document.addEventListener('mouseout', e => {
    const t = e.target.closest('[data-tooltip]');
    if (t) tooltip.hide();
  });
}

export const tooltip = {
  show (html, x, y) {
    ensure();
    _el.innerHTML = html;
    _el.style.display = 'block';
    this.move(x, y);
  },
  move (x, y) {
    ensure();
    const r = _el.getBoundingClientRect();
    let nx = x + 14;
    let ny = y + 14;
    if (nx + r.width > window.innerWidth) nx = x - r.width - 14;
    if (ny + r.height > window.innerHeight) ny = y - r.height - 14;
    _el.style.left = nx + 'px';
    _el.style.top = ny + 'px';
  },
  hide () {
    ensure();
    _el.style.display = 'none';
  },
};
