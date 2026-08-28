/* ============================================================
   ШЕСТА ЧАСТ · МЯСТО IV — Стаята с нужното
   Планина от скрити неща, три прокълнати сандъка и три
   рунни плочи. А накрая — огън, който мисли.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { canvasLayer, revealPanel, curtain, wait, rnd } from './common6.js';

export const meta = {
  id: 'a6-room',
  eyebrow: 'Място IV',
  title: 'Стаята с нужното',
  sub: 'Стая с размерите на катедрала, натъпкана с вещите на хиляда поколения. Диадемата е зазидана зад три сандъка, които не се вдигат — само се бутат.',
  rune: 'К',
  bg: 'off',
  tint: '#c98be0',
  hints: [
    { text: 'Сандъците се <b>бутат</b>, не се дърпат: заставаш от срещуположната страна и вървиш напред. Затова сандък, опрян в ъгъл, вече не мърда — има бутон «Върни ход».',
      done: d => !!d.cleared },
    { text: 'Първо разчисти онзи в горната част — той има най-малко място за маневри. Двата долни могат да чакат, стига да не ги бутнеш към стена.',
      done: d => !!d.cleared },
    'Двадесет и шест крачки: Ю Ю Ю З Ю И И И И С С С И С З З З З Ю Ю И И Ю И Ю З. (С = север/нагоре, Ю = юг, З = запад, И = изток.)',
  ],
};

/* ---- проверено с изчерпателно търсене: решимо за 26 крачки / 12 бутания ---- */
const W = 8, H = 7;
const WALL = new Set(['1,3', '3,4']);
const GOALS = [[1, 1], [3, 5], [6, 5]];
const BOXES = [[2, 4], [4, 4], [5, 2]];
const START = [2, 1];
const DIRS = { С: [0, -1], Ю: [0, 1], З: [-1, 0], И: [1, 0] };

const isWall = (x, y) => x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1 || WALL.has(`${x},${y}`);
const key = (x, y) => `${x},${y}`;

let junk = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.b) { d.b = BOXES.map(b => [...b]); d.p = [...START]; d.moves = 0; d.hist = []; }
  if (d.cleared == null) d.cleared = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}

    <div class="panel">
      <p class="panel-title">Между два шкафа стърчи ъгъл на диадема</p>
      <p class="muted">Три сандъка с фламгранте стоят между теб и нея. Стаята приема само едно:
      всеки сандък да легне върху рунната плоча, която го чака.</p>
    </div>

    <div class="panel room-panel">
      <div class="room-junk" id="room-junk"></div>
      <div class="room-in">
        <div class="sok-wrap"><div class="sok" id="sok"></div></div>
        <div class="sok-status" id="sok-status"></div>
        <div class="sok-pad">
          <button class="pad" data-k="С">▲</button>
          <div class="pad-row">
            <button class="pad" data-k="З">◀</button>
            <button class="pad" data-k="Ю">▼</button>
            <button class="pad" data-k="И">▶</button>
          </div>
        </div>
        <div class="flex flex-center mt">
          <button class="btn btn-ghost btn-sm" id="sk-undo"><span>Върни ход</span></button>
          <button class="btn btn-ghost btn-sm" id="sk-reset"><span>Отначало</span></button>
        </div>
        <p class="center muted stage-help">Стрелките на клавиатурата вършат същото.</p>
      </div>
    </div>`;

  draw(api);
  $$('.pad').forEach(b => b.addEventListener('click', () => step(api, b.dataset.k)));
  $('#sk-undo').addEventListener('click', () => undo(api));
  $('#sk-reset').addEventListener('click', () => {
    if (api.solved || api.data.cleared) return;
    reset(api.data); api.saveData(); api.sfx.click(); draw(api);
  });

  const onKey = e => {
    const k = { ArrowUp: 'С', ArrowDown: 'Ю', ArrowLeft: 'З', ArrowRight: 'И' }[e.key];
    if (!k) return;
    e.preventDefault(); step(api, k);
  };
  window.addEventListener('keydown', onKey);

  junk = makeJunk($('#room-junk'));
  api.onLeave = () => {
    window.removeEventListener('keydown', onKey);
    if (junk) { junk.stop(); junk = null; }
  };
}

function reset(d) { d.b = BOXES.map(b => [...b]); d.p = [...START]; d.moves = 0; d.hist = []; }

function step(api, k) {
  const d = api.data;
  if (api.solved || d.cleared) return;
  const [dx, dy] = DIRS[k];
  const nx = d.p[0] + dx, ny = d.p[1] + dy;
  if (isWall(nx, ny)) { api.sfx.bad(); return; }
  const bi = d.b.findIndex(b => b[0] === nx && b[1] === ny);
  if (bi >= 0) {
    const bx = nx + dx, by = ny + dy;
    if (isWall(bx, by) || d.b.some(b => b[0] === bx && b[1] === by)) { api.sfx.bad(); return; }
    d.b[bi] = [bx, by];
    api.sfx.click();
  } else api.sfx.tick();
  d.hist.push(k);
  d.p = [nx, ny];
  d.moves++;
  api.saveData();
  draw(api);

  if (d.b.every(b => GOALS.some(g => g[0] === b[0] && g[1] === b[1]))) {
    d.cleared = true; api.saveData();
    api.sfx.chime();
    api.fx.flash('rgba(210,150,240,.22)', 700);
    draw(api);
    setTimeout(() => fiendfyre(api), 700);
  }
}

function undo(api) {
  const d = api.data;
  if (api.solved || d.cleared || !d.hist.length) return;
  const hist = d.hist.slice(0, -1);
  reset(d);
  hist.forEach(k => {
    const [dx, dy] = DIRS[k];
    const nx = d.p[0] + dx, ny = d.p[1] + dy;
    const bi = d.b.findIndex(b => b[0] === nx && b[1] === ny);
    if (bi >= 0) d.b[bi] = [nx + dx, ny + dy];
    d.p = [nx, ny]; d.moves++; d.hist.push(k);
  });
  api.saveData(); api.sfx.click(); draw(api);
}

function draw(api) {
  const d = api.data;
  const box = $('#sok'); if (!box) return;
  const on = (x, y) => GOALS.some(g => g[0] === x && g[1] === y);
  let html = '';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const w = isWall(x, y);
    const b = d.b.some(p => p[0] === x && p[1] === y);
    const me = d.p[0] === x && d.p[1] === y;
    const g = on(x, y);
    html += `<div class="sk-cell${w ? ' wall' : ''}${g ? ' goal' : ''}${b ? (g ? ' box done' : ' box') : ''}${me ? ' me' : ''}"
      style="--x:${x};--y:${y}">${b ? boxArt() : ''}${me ? meArt() : ''}${g && !b ? '<i class="sk-rune">✶</i>' : ''}</div>`;
  }
  box.style.setProperty('--w', W);
  box.style.setProperty('--h', H);
  box.innerHTML = html;

  const st = $('#sok-status');
  const placed = d.b.filter(b => on(b[0], b[1])).length;
  if (st) st.innerHTML = (d.cleared || api.solved)
    ? '<b class="good">Трите сандъка легнаха по местата си.</b>'
    : `на плочи: <b>${placed}</b> от 3 · крачки: <b>${d.moves}</b>`;
}

/* сандъкът е истинско дърво: текстурата се слага като SVG шарка,
   а не се имитира с два щриха                                    */
const boxArt = () => `<svg viewBox="0 0 40 40" class="sk-box" aria-hidden="true">
  <defs>
    <pattern id="skwood" patternUnits="userSpaceOnUse" width="40" height="40">
      <image href="assets/tex/planks.jpg" x="0" y="0" width="40" height="40"
             preserveAspectRatio="xMidYMid slice"/>
    </pattern>
    <linearGradient id="skshade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".22"/>
      <stop offset=".55" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".45"/>
    </linearGradient>
  </defs>
  <rect x="4" y="8" width="32" height="26" rx="2.5" fill="url(#skwood)"/>
  <rect x="4" y="8" width="32" height="26" rx="2.5" fill="url(#skshade)"/>
  <rect x="4" y="8" width="32" height="26" rx="2.5" fill="none" stroke="#2a1b12" stroke-width="2"/>
  <path d="M4 20h32" stroke="#2a1b12" stroke-width="1.6" opacity=".7"/>
  <path d="M6 10l28 22M34 10L6 32" stroke="#3a2618" stroke-width="1.3" opacity=".55"/>
  <circle cx="20" cy="20" r="2.6" fill="#e0a24a" opacity=".9"/>
</svg>`;
/* магьосникът: качулка, наметало и пръчка — с обем, а не плоско петно */
const meArt = () => `<svg viewBox="0 0 40 40" class="sk-me" aria-hidden="true">
  <defs>
    <linearGradient id="skcloak" x1=".2" y1="0" x2=".9" y2="1">
      <stop offset="0" stop-color="#6a5aa8"/>
      <stop offset=".5" stop-color="#3a3060"/>
      <stop offset="1" stop-color="#1a1530"/>
    </linearGradient>
    <radialGradient id="skglow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffe9a8" stop-opacity=".85"/>
      <stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="20" cy="36" rx="11" ry="3" fill="#000" opacity=".45"/>
  <path d="M20 6c5.4 0 8.6 4 8.6 9 0 3-1 4.6-1 6.4 0 4.6 4.4 6.2 4.4 12.6H8c0-6.4 4.4-8 4.4-12.6 0-1.8-1-3.4-1-6.4 0-5 3.2-9 8.6-9z"
        fill="url(#skcloak)" stroke="#0d0a18" stroke-width="1.2"/>
  <path d="M20 6c5.4 0 8.6 4 8.6 9 0 1.6-.3 2.8-.6 3.9-2-2.4-4.7-3.6-8-3.6s-6 1.2-8 3.6c-.3-1.1-.6-2.3-.6-3.9 0-5 3.2-9 8.6-9z"
        fill="#0b0816" opacity=".85"/>
  <ellipse cx="20" cy="17.5" rx="4.2" ry="3.4" fill="#0a0714"/>
  <circle cx="18.4" cy="17.4" r=".9" fill="#cfe0ff" opacity=".85"/>
  <circle cx="21.6" cy="17.4" r=".9" fill="#cfe0ff" opacity=".85"/>
  <circle cx="33" cy="14" r="5" fill="url(#skglow)"/>
  <path d="M27.5 23.5L33.5 14" stroke="#c9a25a" stroke-width="2" stroke-linecap="round"/>
  <circle cx="33.6" cy="13.8" r="1.7" fill="#fff3cf"/>
</svg>`;

/* ---------- изненадата: адският огън ---------- */
function fiendfyre(api) {
  curtain((layer, close) => {
    layer.innerHTML = `<div class="ff-scene">
      <div class="ff-canvas" id="ff-canvas"></div>
      <p class="ff-line" id="ff-line">Кребе вдига пръчка и казва дума, която не е учил как да спре.</p>
    </div>`;
    const fire = makeFiendfyre(layer.querySelector('#ff-canvas'));
    api.sfx.bad();
    api.fx.shakeScreen(16, 2600);
    setTimeout(() => {
      const l = layer.querySelector('#ff-line');
      if (l) l.innerHTML = 'Огънят приема форма — змии, химери, дракони — и тръгва да яде стаята.';
    }, 1800);
    setTimeout(() => {
      const l = layer.querySelector('#ff-line');
      if (l) l.innerHTML = 'Диадемата изкрещява веднъж и се разтапя в ръцете на огъня.';
      fire.peak();
      api.fx.flash('rgba(255,150,60,.4)', 900);
    }, 3600);
    setTimeout(async () => {
      fire.stop();
      close();
      api.fx.celebrate(1.6);
      api.solve('Излизаш през вратата секунда преди огънят да я намери. В шепата ти е останало парче почерняло сребро — и една руна, която не се е стопила.');
    }, 5400);
  }, { cls: 'ff-curtain' });
}

function makeFiendfyre(host) {
  const P = Array.from({ length: 260 }, (_, i) => newP(i, rnd(i * 3.7)));
  let boost = 1;
  function newP(i, y) {
    return { x: rnd(i * 7.1), y, v: 0.18 + rnd(i * 2.3) * 0.5, r: 6 + rnd(i * 5.9) * 26,
             p: rnd(i * 11.7) * 6, hue: 8 + rnd(i * 4.4) * 36 };
  }
  const layer = canvasLayer(host, (g, t, Wd, Ht) => {
    g.globalCompositeOperation = 'lighter';
    P.forEach((c, i) => {
      c.y -= c.v * 0.006 * boost;
      if (c.y < -0.15) { const n = newP(i + Math.floor(t * 13), 1.15); c.x = n.x; c.y = n.y; c.r = n.r; c.hue = n.hue; }
      const x = (c.x + Math.sin(t * 1.6 + c.p) * 0.06) * Wd;
      const y = c.y * Ht;
      const r = c.r * boost;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `hsla(${c.hue},100%,64%,.5)`);
      grd.addColorStop(0.5, `hsla(${c.hue - 6},100%,48%,.22)`);
      grd.addColorStop(1, 'hsla(0,100%,40%,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    });
    g.globalCompositeOperation = 'source-over';
  }, { alpha: true });
  return { stop: layer.stop, peak() { boost = 2.1; } };
}

/* ---------- прах и отблясъци над купчината вещи ---------- */
function makeJunk(host) {
  return canvasLayer(host, (g, t, Wd, Ht) => {
    for (let i = 0; i < 34; i++) {
      const x = (rnd(i * 3.3) + Math.sin(t * 0.2 + i) * 0.01) * Wd;
      const y = ((rnd(i * 8.8) - t * 0.012) % 1 + 1) % 1 * Ht;
      g.fillStyle = `rgba(214,190,255,${(0.05 + rnd(i * 2.1) * 0.16).toFixed(3)})`;
      g.beginPath(); g.arc(x, y, 0.7 + rnd(i * 6.1) * 1.6, 0, 7); g.fill();
    }
  });
}
