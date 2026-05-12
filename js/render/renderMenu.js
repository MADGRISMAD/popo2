// ============================================================
// render/renderMenu.js — diorama animado del menú principal.
// Pequeño parque vivo de fondo con perros, árboles y popó.
// ============================================================

let canvas = null;
let ctx = null;
let last = 0;
let running = false;

const dogs = [];
const trees = [];
const flowers = [];
const poops = [];
let nextPoopAt = 0;

const COLORS = [
  { body: '#a08361', spot: '#5e4a30' },
  { body: '#e8edf2', spot: '#2c2c34' },
  { body: '#d97e2c', spot: '#fff5e0' },
  { body: '#fbbf24', spot: '#92400e' },
  { body: '#1a1814', spot: '#f3eee5' },
];

export function initMenuRender () {
  canvas = document.getElementById('menu-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  // Pequeño grupo de perros caminando
  for (let i = 0; i < 5; i++) {
    const c = COLORS[i % COLORS.length];
    dogs.push({
      x: Math.random() * canvas.width,
      y: canvas.height * 0.55 + Math.random() * canvas.height * 0.30,
      tx: Math.random() * canvas.width,
      ty: canvas.height * 0.55 + Math.random() * canvas.height * 0.30,
      body: c.body, spot: c.spot,
      speed: 25 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2,
      facing: 1,
    });
  }
  for (let i = 0; i < 6; i++) {
    trees.push({ x: Math.random() * canvas.width, y: canvas.height * 0.55 + Math.random() * canvas.height * 0.30, r: 28 + Math.random() * 14 });
  }
  for (let i = 0; i < 30; i++) {
    flowers.push({ x: Math.random() * canvas.width, y: canvas.height * 0.55 + Math.random() * canvas.height * 0.35, color: ['#ec5985','#fbbf24','#a64dff','#5fc66f'][Math.floor(Math.random()*4)] });
  }
}

function resize () {
  if (!canvas) return;
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

export function startMenuRender () {
  if (running) return;
  running = true;
  last = performance.now();
  requestAnimationFrame(loop);
}
export function stopMenuRender () { running = false; }

function loop (ts) {
  if (!running) return;
  const dt = Math.min(0.1, (ts - last) / 1000);
  last = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function update (dt) {
  if (!canvas) return;
  // Mover perros
  for (const d of dogs) {
    d.phase += dt * 8;
    const dx = d.tx - d.x;
    const dy = d.ty - d.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 6) {
      d.tx = Math.random() * canvas.width;
      d.ty = canvas.height * 0.55 + Math.random() * canvas.height * 0.35;
    }
    d.facing = dx >= 0 ? 1 : -1;
    d.x += (dx / dist) * d.speed * dt;
    d.y += (dy / dist) * d.speed * dt;
  }
  // Spawn popó cada cierto tiempo
  const now = performance.now();
  if (now > nextPoopAt) {
    nextPoopAt = now + 3500 + Math.random() * 4000;
    if (dogs.length > 0) {
      const d = dogs[Math.floor(Math.random() * dogs.length)];
      poops.push({ x: d.x, y: d.y, born: now });
    }
  }
  // Vida útil de popó
  for (let i = poops.length - 1; i >= 0; i--) {
    if (now - poops[i].born > 9000) poops.splice(i, 1);
  }
}

function render () {
  if (!ctx || !canvas) return;
  const t = performance.now() / 1000;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Fondo (mesa)
  const bg = ctx.createRadialGradient(w / 2, h * 0.5, h * 0.3, w / 2, h * 0.5, h);
  bg.addColorStop(0, 'rgba(95,160,48,0.30)');
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Pasto inferior (banda)
  const grassY = h * 0.55;
  const grassGrad = ctx.createLinearGradient(0, grassY, 0, h);
  grassGrad.addColorStop(0, '#5fa030');
  grassGrad.addColorStop(1, '#2a5b15');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, grassY, w, h - grassY);

  // Camino sutil
  ctx.strokeStyle = 'rgba(122, 94, 53, 0.55)';
  ctx.lineWidth = 36; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, h * 0.78); ctx.lineTo(w, h * 0.74); ctx.stroke();
  ctx.strokeStyle = '#e6c386';
  ctx.lineWidth = 28;
  ctx.beginPath(); ctx.moveTo(0, h * 0.78); ctx.lineTo(w, h * 0.74); ctx.stroke();

  // Flores
  for (const f of flowers) {
    ctx.fillStyle = f.color;
    ctx.beginPath(); ctx.arc(f.x, f.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff5b8';
    ctx.beginPath(); ctx.arc(f.x, f.y, 1.2, 0, Math.PI * 2); ctx.fill();
  }

  // Árboles
  for (const tr of trees) drawTree(tr.x, tr.y, tr.r, t);

  // Popó
  for (const p of poops) drawPoopMini(p);

  // Perros
  const sorted = dogs.slice().sort((a, b) => a.y - b.y);
  for (const d of sorted) drawDogMini(d, t);
}

function drawTree (x, y, r, t) {
  const sway = Math.sin(t * 0.8 + x * 0.01) * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath(); ctx.ellipse(x + r * 0.25, y + r * 0.55, r * 1.1, r * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  // tronco
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(x - 4 + sway, y, 8, r * 0.6);
  // copa
  ctx.fillStyle = '#2c5a18';
  ctx.beginPath(); ctx.arc(x + sway, y - r * 0.3, r * 0.85, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5fa030';
  ctx.beginPath(); ctx.arc(x + sway, y - r * 0.4, r * 0.75, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.arc(x - r * 0.3 + sway, y - r * 0.6, r * 0.4, 0, Math.PI * 2); ctx.fill();
}

function drawDogMini (d, t) {
  const bob = Math.sin(d.phase) * 1.5;
  const x = d.x;
  const y = d.y + bob;
  const sgn = d.facing;
  // Sombra
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 14, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
  // Patas
  const swing = Math.sin(d.phase) * 2.5;
  ctx.fillStyle = darken(d.body, 0.85);
  ctx.fillRect(x - 12, y + 6 + swing, 4, 10);
  ctx.fillRect(x + 8, y + 6 - swing, 4, 10);
  // Cuerpo
  ctx.fillStyle = darken(d.body, 0.85);
  ctx.beginPath(); ctx.ellipse(x, y, 18, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = d.body;
  ctx.beginPath(); ctx.ellipse(x, y, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
  // Mancha
  if (d.spot) {
    ctx.fillStyle = d.spot;
    ctx.beginPath(); ctx.arc(x - 5, y - 1, 4, 0, Math.PI * 2); ctx.fill();
  }
  // Cabeza
  const hx = x + sgn * 14;
  const hy = y - 3;
  ctx.fillStyle = darken(d.body, 0.85);
  ctx.beginPath(); ctx.ellipse(hx, hy, 8, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = d.body;
  ctx.beginPath(); ctx.ellipse(hx, hy, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Orejas
  ctx.fillStyle = darken(d.body, 0.7);
  ctx.beginPath();
  ctx.moveTo(hx - sgn * 2, hy - 8); ctx.lineTo(hx - sgn * 6, hy - 1); ctx.lineTo(hx + sgn * 2, hy - 4); ctx.fill();
  // Hocico/nariz
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(hx + sgn * 6, hy + 1, 1.6, 0, Math.PI * 2); ctx.fill();
  // Ojo
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(hx + sgn * 1, hy - 2, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(hx + sgn * 1, hy - 2, 0.9, 0, Math.PI * 2); ctx.fill();
  // Cola
  ctx.strokeStyle = darken(d.body, 0.85); ctx.lineWidth = 4; ctx.lineCap = 'round';
  const wag = Math.sin(t * 12 + d.phase) * 5;
  ctx.beginPath();
  ctx.moveTo(x - sgn * 14, y - 2);
  ctx.quadraticCurveTo(x - sgn * 22, y - 8 + wag, x - sgn * 26, y - 14 + wag);
  ctx.stroke();
}

function drawPoopMini (p) {
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath(); ctx.ellipse(p.x + 2, p.y + 6, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5b3618';
  ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p.x, p.y - 4, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p.x, p.y - 7, 2, 0, Math.PI * 2); ctx.fill();
}

function darken (hex, factor) {
  if (!hex || !hex.startsWith('#')) return hex;
  const v = parseInt(hex.slice(1), 16);
  let r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
  if (factor < 1) { r = Math.floor(r * factor); g = Math.floor(g * factor); b = Math.floor(b * factor); }
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
