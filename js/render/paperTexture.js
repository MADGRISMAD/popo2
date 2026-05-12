// ============================================================
// render/paperTexture.js — texturas de papel y cartón generadas
// proceduralmente y cacheadas como off-screen canvases.
// ============================================================

const cache = new Map();

export function paperTexture (w, h, key, opts = {}) {
  const id = `${key}|${w}x${h}|${JSON.stringify(opts)}`;
  if (cache.has(id)) return cache.get(id);

  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');

  const {
    base = '#fff6dd',
    shade = 'rgba(75,42,16,0.10)',
    fibers = 90,
    spots = 30,
  } = opts;

  // Fondo
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // Manchas suaves
  for (let i = 0; i < spots; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 8 + Math.random() * 32;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, shade);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Fibras finas
  ctx.strokeStyle = shade;
  ctx.lineWidth = 0.4;
  for (let i = 0; i < fibers; i++) {
    const x1 = Math.random() * w;
    const y1 = Math.random() * h;
    const a  = Math.random() * Math.PI * 2;
    const len = 6 + Math.random() * 26;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(a) * len, y1 + Math.sin(a) * len);
    ctx.stroke();
  }

  cache.set(id, c);
  return c;
}

export function grassTexture (w, h) {
  return paperTexture(w, h, 'grass', {
    base: '#5fa030', shade: 'rgba(20,60,10,0.20)', fibers: 240, spots: 60,
  });
}

export function pathTexture (w, h) {
  return paperTexture(w, h, 'path', {
    base: '#d6b27a', shade: 'rgba(75,42,16,0.18)', fibers: 80, spots: 24,
  });
}

export function cardboardTexture (w, h) {
  return paperTexture(w, h, 'cardboard', {
    base: '#efd4a3', shade: 'rgba(75,42,16,0.18)', fibers: 100, spots: 26,
  });
}
