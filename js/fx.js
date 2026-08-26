/* ============================================================
   fx.js — частици, искри, разтърсване, toast съобщения
   ============================================================ */

const dustLayer = () => document.getElementById('dust-layer');
const spellLayer = () => document.getElementById('spell-layer');

/* ---------- носещи се прашинки / искри в дъното ---------- */
export function initDust(count = 46) {
  const layer = dustLayer();
  if (!layer) return;
  layer.innerHTML = '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  for (let i = 0; i < count; i++) {
    const m = document.createElement('span');
    m.className = 'mote';
    const size = 2 + Math.random() * 5;
    m.style.width = m.style.height = size + 'px';
    m.style.left = Math.random() * 100 + 'vw';
    m.style.animationDuration = (16 + Math.random() * 26) + 's';
    m.style.animationDelay = (-Math.random() * 30) + 's';
    m.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
    m.style.opacity = 0.25 + Math.random() * 0.6;
    layer.appendChild(m);
  }
}

/* ---------- сноп искри от точка ---------- */
export function sparks(x, y, { count = 20, color = '#ffd98a', spread = 160 } = {}) {
  const layer = spellLayer();
  if (!layer) return;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.color = color;
    s.style.background = color;
    const a = Math.random() * Math.PI * 2;
    const d = 30 + Math.random() * spread;
    s.style.setProperty('--sx', Math.cos(a) * d + 'px');
    s.style.setProperty('--sy', Math.sin(a) * d + 'px');
    s.style.animationDuration = (0.6 + Math.random() * 0.8) + 's';
    layer.appendChild(s);
    setTimeout(() => s.remove(), 1600);
  }
}

export function sparksFrom(el, opts) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  sparks(r.left + r.width / 2, r.top + r.height / 2, opts);
}

/* ---------- разширяващ се пръстен ---------- */
export function shockwave(x, y, color = 'var(--gold)') {
  const layer = spellLayer(); if (!layer) return;
  const s = document.createElement('span');
  s.className = 'shock';
  s.style.left = x + 'px'; s.style.top = y + 'px';
  s.style.borderColor = color;
  layer.appendChild(s);
  setTimeout(() => s.remove(), 1000);
}
export function shockwaveFrom(el, color) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  shockwave(r.left + r.width / 2, r.top + r.height / 2, color);
}

/* ---------- цветен воал върху екрана ---------- */
export function flash(color = 'rgba(217,180,91,.35)', ms = 420) {
  const d = document.createElement('div');
  d.style.cssText = `position:fixed;inset:0;z-index:140;pointer-events:none;background:${color};
    opacity:0;transition:opacity ${ms / 2}ms ease`;
  document.body.appendChild(d);
  requestAnimationFrame(() => { d.style.opacity = '1'; });
  setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), ms); }, ms / 2);
}

/* ---------- разтърсване ---------- */
let shakeT = null;
export function shakeScreen(power = 8, ms = 420) {
  const g = document.getElementById('screen-game') || document.body;
  const t0 = performance.now();
  clearInterval(shakeT);
  shakeT = setInterval(() => {
    const p = (performance.now() - t0) / ms;
    if (p >= 1) { clearInterval(shakeT); g.style.transform = ''; return; }
    const amp = power * (1 - p);
    g.style.transform = `translate(${(Math.random() * 2 - 1) * amp}px,${(Math.random() * 2 - 1) * amp}px)`;
  }, 16);
}

/* ---------- toast ---------- */
export function toast(msg, kind = '', ms = 3400) {
  const tray = document.getElementById('toast-tray');
  if (!tray) return;
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = msg;
  tray.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 450); }, ms);
  while (tray.children.length > 4) tray.firstChild.remove();
}

/* ---------- пишеща машина ---------- */
export function typewriter(el, text, { speed = 26, onDone = null } = {}) {
  let i = 0;
  el.textContent = '';
  clearInterval(el._tw);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { el.textContent = text; onDone && onDone(); return () => {}; }
  el._tw = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) { clearInterval(el._tw); onDone && onDone(); }
  }, speed);
  return () => { clearInterval(el._tw); el.textContent = text; onDone && onDone(); };
}

/* ---------- конфети от златни искри ---------- */
export function celebrate(seconds = 4) {
  const layer = spellLayer(); if (!layer) return;
  const colors = ['#ffd98a', '#fff3cf', 'var(--house)', '#d9b45b', '#ffffff'];
  const end = performance.now() + seconds * 1000;
  (function burst() {
    if (performance.now() > end) return;
    sparks(Math.random() * innerWidth, Math.random() * innerHeight * 0.7,
      { count: 12, color: colors[(Math.random() * colors.length) | 0], spread: 220 });
    setTimeout(burst, 220);
  })();
}
