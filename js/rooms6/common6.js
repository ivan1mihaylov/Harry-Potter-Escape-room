/* ============================================================
   common6.js — общото за Шеста част.
   Тук почти няма 3D: частта разчита на SVG, canvas и CSS,
   защото иска да е гледка, а не сцена.
   ============================================================ */

import { personalizeDOM } from '../state.js';

export const NS = 'http://www.w3.org/2000/svg';

/* кратък помощник за SVG елементи: svg('circle', {cx:1, cy:2}) */
export function svg(tag, attrs = {}, kids = []) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) {
    if (attrs[k] == null) continue;
    e.setAttribute(k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), attrs[k]);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach(k => k && e.appendChild(k));
  return e;
}

export function svgRoot(w, h, cls = '') {
  const s = svg('svg', { viewBox: `0 0 ${w} ${h}`, class: cls, preserveAspectRatio: 'xMidYMid meet' });
  s.setAttribute('xmlns', NS);
  return s;
}

/* детерминиран шум — една и съща стая изглежда еднакво при всяко зареждане */
export function rnd(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ------------------------------------------------------------
   Живо платно: пуска rAF цикъл и се самоспира, щом излезем.
   Върнатият обект се подава на api.onLeave.
   ------------------------------------------------------------ */
export function canvasLayer(host, draw, { alpha = true } = {}) {
  const c = document.createElement('canvas');
  c.className = 'a6-canvas';
  host.appendChild(c);
  const ctx = c.getContext('2d', { alpha });
  let raf = 0, dead = false, t0 = performance.now();

  const fit = () => {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.max(1, Math.round(r.width * dpr));
    c.height = Math.max(1, Math.round(r.height * dpr));
    c.style.width = r.width + 'px';
    c.style.height = r.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return r;
  };
  let box = fit();
  const ro = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => { box = fit(); }) : null;
  if (ro) ro.observe(host);

  const frame = now => {
    if (dead) return;
    ctx.clearRect(0, 0, box.width, box.height);
    try { draw(ctx, (now - t0) / 1000, box.width, box.height); } catch (e) { dead = true; return; }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    canvas: c,
    /* същият часовник, който получава `draw` — за да могат стаите да
       насрочват събития по него                                      */
    now() { return (performance.now() - t0) / 1000; },
    stop() { dead = true; cancelAnimationFrame(raf); if (ro) ro.disconnect(); c.remove(); },
  };
}

/* ------------------------------------------------------------
   Въглени/прах, които се носят нагоре — фонът на цялата част.
   ------------------------------------------------------------ */
export function embers(host, { count = 46, color = '220,120,60', speed = 1, size = 2.2 } = {}) {
  const P = Array.from({ length: count }, (_, i) => ({
    x: rnd(i * 3.1), y: rnd(i * 7.7), v: 0.02 + rnd(i * 5.3) * 0.05,
    a: 0.2 + rnd(i * 2.9) * 0.7, r: 0.4 + rnd(i * 11.3) * size, w: rnd(i * 13.1) * 6,
  }));
  return canvasLayer(host, (g, t, W, H) => {
    P.forEach((p, i) => {
      const y = ((p.y - t * p.v * speed) % 1 + 1) % 1;
      const x = p.x + Math.sin(t * 0.7 + p.w) * 0.03;
      const al = p.a * (0.35 + 0.65 * Math.sin(t * 1.6 + i) ** 2);
      g.beginPath();
      g.arc(x * W, y * H, p.r, 0, 7);
      g.fillStyle = `rgba(${color},${al.toFixed(3)})`;
      g.fill();
    });
  });
}

/* ------------------------------------------------------------
   Снимки за платната. Кешираме по път и не чакаме: докато
   картинката се зареди, стаята рисува без нея и не се чупи,
   ако файлът липсва.
   ------------------------------------------------------------ */
const IMG_CACHE = new Map();

export function sprite(src) {
  if (IMG_CACHE.has(src)) return IMG_CACHE.get(src);
  const rec = { img: new Image(), ready: false, failed: false };
  rec.img.decoding = 'async';
  rec.img.onload = () => { rec.ready = true; };
  rec.img.onerror = () => { rec.failed = true; };
  rec.img.src = src;
  IMG_CACHE.set(src, rec);
  return rec;
}

/* ------------------------------------------------------------
   Плавен tween: pass(0..1) на всеки кадър, после done().
   Връща функция за отказ.
   ------------------------------------------------------------ */
export function tween(ms, step, done) {
  const t0 = performance.now();
  let raf = 0, off = false;
  const f = now => {
    if (off) return;
    const k = Math.min(1, (now - t0) / ms);
    step(k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, k);
    if (k < 1) raf = requestAnimationFrame(f);
    else if (done) done();
  };
  raf = requestAnimationFrame(f);
  return () => { off = true; cancelAnimationFrame(raf); };
}

export const wait = ms => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------------------
   Панел, който се показва едва след като предишната стъпка е
   минала — с плавно разгъване, вместо да изскача.
   ------------------------------------------------------------ */
export function revealPanel(node) {
  if (!node) return;
  node.hidden = false;
  node.classList.add('a6-reveal');
  requestAnimationFrame(() => node.classList.add('on'));
}

/* ------------------------------------------------------------
   Пълноекранна изненада: наслагва слой над всичко, изпълнява
   `build(layer)` и се маха сам (или по бутон).
   ------------------------------------------------------------ */
export function curtain(build, { ms = 0, cls = '' } = {}) {
  const l = document.createElement('div');
  l.className = 'a6-curtain ' + cls;
  document.body.appendChild(l);
  requestAnimationFrame(() => l.classList.add('on'));
  const close = () => {
    l.classList.remove('on');
    setTimeout(() => l.remove(), 700);
  };
  build(l, close);
  personalizeDOM(l);          /* и завесата се обръща към играча по име */
  if (ms) setTimeout(close, ms);
  return close;
}
