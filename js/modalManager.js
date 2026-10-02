// ============================================================
// modalManager.js — modales y toasts.
// modal.open({ title, body, footer, onClose })
// toast.show({ icon, title, desc, kind })
// ============================================================

let _modalRoot = null;
let _toastRoot = null;
let _activeModal = null;

function ensure () {
  if (_modalRoot) return;
  _modalRoot = document.getElementById('modal-root');
  _toastRoot = document.getElementById('toast-root');
}

export const modal = {
  open ({ title = '', body = '', footer = '', onClose, wide = false }) {
    ensure();
    this.close();
    const m = document.createElement('div');
    m.className = 'modal';
    if (wide) m.style.minWidth = '720px';
    m.innerHTML = `
      <div class="modal-header">
        <h2>${title}</h2>
        <span class="close" data-close>×</span>
      </div>
      <div class="modal-body"></div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    `;
    const bodyEl = m.querySelector('.modal-body');
    if (typeof body === 'string') bodyEl.innerHTML = body;
    else if (body instanceof Node) bodyEl.appendChild(body);

    _modalRoot.appendChild(m);
    _modalRoot.classList.add('active');
    _activeModal = { el: m, onClose };

    m.querySelector('[data-close]').onclick = () => this.close();
    return m;
  },
  close () {
    ensure();
    if (!_activeModal) return;
    const { el, onClose } = _activeModal;
    el.remove();
    _modalRoot.classList.remove('active');
    _activeModal = null;
    if (onClose) try { onClose(); } catch (e) {}
  },
  isOpen () { return !!_activeModal; },
};

export const toast = {
  show ({ icon = '✨', title = '', desc = '', kind = '', durationMs = 3600 } = {}) {
    ensure();
    // Máximo 3 avisos a la vez: el más viejo se va
    while (_toastRoot.children.length >= 3) _toastRoot.firstElementChild.remove();
    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.innerHTML = `
      <div class="icon">${icon}</div>
      <div class="body">
        <div class="title">${title}</div>
        ${desc ? `<div class="desc">${desc}</div>` : ''}
      </div>`;
    _toastRoot.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'all 0.4s ease';
      t.style.opacity = '0';
      t.style.transform = 'translateY(-30px) scale(0.8)';
      setTimeout(() => t.remove(), 400);
    }, durationMs);
  },
};
