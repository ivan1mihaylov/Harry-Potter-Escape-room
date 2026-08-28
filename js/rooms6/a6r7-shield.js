/* ============================================================
   ШЕСТА ЧАСТ · МЯСТО VII — Щитът над замъка
   Десет сегмента, три древни руни. Две съседни клетки не
   понасят една и съща руна — щитът се пука точно по шева.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { canvasLayer, revealPanel, wait, rnd } from './common6.js';

export const meta = {
  id: 'a6-shield',
  eyebrow: 'Място VII',
  title: 'Щитът над замъка',
  sub: 'Макгонагъл вдига камъните, Флитуик — куполa. Липсва последното: десетте сегмента да носят руни, които не си пречат.',
  rune: 'К',
  bg: 'off',
  tint: '#8fc8f0',
  hints: [
    'Три руни, десет сегмента. Гледай кой сегмент има <b>най-много съседи</b> — той е най-стегнат и почти няма избор.',
    'Сегмент, чиито двама съседи вече носят различни руни, е решен: остава му една-единствена.',
    'Готовите три (пети, седми и десети) държат целия купол. Тръгни от съседите им и не гадай — всяка стъпка е принудена.',
  ],
};

/* ---- проверено изчерпателно: с трите закрепени сегмента
        оцветяването е ЕДИНСТВЕНО (без тях са 60)              ---- */
const EDGES = [[0,1],[0,5],[0,9],[1,2],[1,5],[2,3],[2,4],[3,4],[3,7],[4,5],[5,6],[6,7],[7,8],[7,9],[8,9]];
const FIXED = { 4: 1, 6: 2, 9: 1 };
/* решението (пази се тук само за проверката): 2 1 0 2 1 0 2 0 2 1 */
const RUNES = [
  { g: 'ᛗ', name: 'Манназ', col: '#8fc8f0' },
  { g: 'ᛊ', name: 'Совило', col: '#f0c98f' },
  { g: 'ᛉ', name: 'Алгиз',  col: '#a8f0b0' },
];
/* положение на сегментите по купола */
const POS = [
  [120, 196], [196, 132], [292, 96], [396, 84], [500, 96],
  [596, 132], [672, 196], [560, 214], [420, 224], [268, 216],
];

let sky = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.c) { d.c = Array(10).fill(null); Object.entries(FIXED).forEach(([i, v]) => { d.c[+i] = v; }); }
  if (d.sel == null) d.sel = 0;
  api.saveData();

  root.innerHTML = `
    ${head(api)}

    <div class="panel">
      <p class="panel-title">Флитуик вика през рамо</p>
      <blockquote class="doors-rule">«Три руни имам, десет сегмента трябва да покрия!
      И за бога — <b>никои две допрени сегмента с една и съща руна</b>, че ще ни падне на главите!»</blockquote>
      <div class="rune-pick" id="rune-pick"></div>
    </div>

    <div class="panel shield-panel">
      <div class="shield-sky" id="shield-sky"></div>
      <div class="shield-in">
        <svg viewBox="0 0 800 330" class="shield-svg" id="shield-svg" aria-hidden="true">
          <g id="castle">
            <path d="M0 330h800V300q-40-10-70-30l-30 20-40-40-40 30-40-52-46 42-44-36-44 40-40-30-42 44-38-26-36 24-30-16-30 20z"
                  fill="#0b1020" stroke="#2a3552" stroke-width="2"/>
            <g fill="#f0d78a" opacity=".75">
              <rect x="120" y="292" width="6" height="9"/><rect x="210" y="284" width="6" height="9"/>
              <rect x="330" y="272" width="6" height="9"/><rect x="452" y="276" width="6" height="9"/>
              <rect x="596" y="286" width="6" height="9"/><rect x="690" y="296" width="6" height="9"/>
            </g>
          </g>
          <path id="dome" d="M60 250A360 250 0 0 1 740 250" fill="none"
                stroke="rgba(140,200,255,.18)" stroke-width="3"/>
          <g id="edges"></g>
          <g id="segs"></g>
        </svg>
        <div class="shield-status" id="shield-status"></div>
        <div class="flex flex-center mt">
          <button class="btn btn-house btn-sm" id="sh-raise"><span>Вдигни щита</span></button>
          <button class="btn btn-ghost btn-sm" id="sh-clear"><span>Изчисти</span></button>
        </div>
        <p class="center muted stage-help">Избери руна отгоре, после кликни сегмент. Свързаните линии са допрените сегменти.</p>
      </div>
    </div>`;

  drawPick(api);
  drawDome(api);
  $('#sh-raise').addEventListener('click', () => raise(api));
  $('#sh-clear').addEventListener('click', () => {
    if (api.solved) return;
    const dd = api.data;
    dd.c = Array(10).fill(null);
    Object.entries(FIXED).forEach(([i, v]) => { dd.c[+i] = v; });
    api.saveData(); api.sfx.click(); drawDome(api);
  });

  sky = canvasLayer($('#shield-sky'), (g, t, W, H) => {
    for (let i = 0; i < 40; i++) {
      const x = rnd(i * 4.7) * W, y = rnd(i * 8.3) * H * 0.8;
      const a = 0.15 + 0.35 * Math.abs(Math.sin(t * 0.6 + i));
      g.fillStyle = `rgba(200,220,255,${a.toFixed(3)})`;
      g.beginPath(); g.arc(x, y, 0.6 + rnd(i * 2.1) * 1.2, 0, 7); g.fill();
    }
  });
  api.onLeave = () => { if (sky) { sky.stop(); sky = null; } };
}

function drawPick(api) {
  const box = $('#rune-pick'); if (!box) return;
  box.innerHTML = RUNES.map((r, i) => `
    <button class="rp${api.data.sel === i ? ' on' : ''}" data-i="${i}" style="--rc:${r.col}">
      <b>${r.g}</b><span>${r.name}</span></button>`).join('');
  $$('.rp', box).forEach(b => b.addEventListener('click', () => {
    api.data.sel = +b.dataset.i; api.saveData(); api.sfx.tick(); drawPick(api);
  }));
}

function drawDome(api) {
  const d = api.data;
  const eg = $('#edges'), sg = $('#segs');
  if (!eg || !sg) return;
  eg.innerHTML = EDGES.map(([a, b]) => {
    const bad = d.c[a] != null && d.c[a] === d.c[b];
    return `<line x1="${POS[a][0]}" y1="${POS[a][1]}" x2="${POS[b][0]}" y2="${POS[b][1]}"
      class="sh-edge${bad ? ' clash' : ''}"/>`;
  }).join('');
  sg.innerHTML = POS.map((p, i) => {
    const v = d.c[i];
    const fx = FIXED[i] != null;
    return `<g class="seg${v == null ? ' empty' : ''}${fx ? ' fixed' : ''}" data-i="${i}"
              style="--sc:${v == null ? '#46567e' : RUNES[v].col}">
      <circle class="seg-disc" cx="${p[0]}" cy="${p[1]}" r="27"/>
      <text x="${p[0]}" y="${p[1] + 10}" text-anchor="middle" font-size="27">${v == null ? '·' : RUNES[v].g}</text>
      ${fx ? `<circle cx="${p[0]}" cy="${p[1]}" r="33" class="seg-lock"/>` : ''}
    </g>`;
  }).join('');
  if (!api.solved) $$('#segs .seg', sg).forEach(g => g.addEventListener('click', () => put(api, +g.dataset.i)));

  const filled = d.c.filter(v => v != null).length;
  const clashes = EDGES.filter(([a, b]) => d.c[a] != null && d.c[a] === d.c[b]).length;
  const st = $('#shield-status');
  if (st) st.innerHTML = api.solved
    ? '<b class="good">Куполът стои.</b>'
    : `сегменти: <b>${filled}</b> от 10 · допрени с една и съща руна: <b class="${clashes ? 'over' : 'good'}">${clashes}</b>`;
}

function put(api, i) {
  if (api.solved) return;
  if (FIXED[i] != null) { api.sfx.bad(); api.toast('Този сегмент вече е зашит от Флитуик.', 'bad'); return; }
  const d = api.data;
  d.c[i] = d.c[i] === d.sel ? null : d.sel;
  api.saveData(); api.sfx.tick();
  drawDome(api);
}

async function raise(api) {
  const d = api.data;
  if (api.solved) return;
  if (d.c.some(v => v == null)) { api.sfx.bad(); api.toast('Има непокрит сегмент.', 'bad'); return; }
  const clash = EDGES.find(([a, b]) => d.c[a] === d.c[b]);
  if (clash) {
    api.sfx.bad(); api.fx.shakeScreen(9, 400);
    api.fail(`Куполът се пука между сегменти ${clash[0] + 1} и ${clash[1] + 1} — носят една и съща руна.`);
    return;
  }
  api.sfx.unlock();
  const svg = $('#shield-svg');
  if (svg) svg.classList.add('raised');
  api.fx.flash('rgba(140,200,255,.24)', 900);
  await wait(900);
  siege(api);
}

/* ---------- изненадата: обсадата се разбива в щита ---------- */
function siege(api) {
  const host = $('.shield-in');
  const svg = $('#shield-svg');
  if (svg) svg.classList.add('under-siege');
  const bolts = document.createElement('div');
  bolts.className = 'siege-layer';
  (host || document.body).appendChild(bolts);
  const layer = canvasLayer(bolts, (g, t, W, H) => {
    const domeY = H * 0.62;
    for (let i = 0; i < 26; i++) {
      const k = ((t * (0.35 + rnd(i) * 0.4) + rnd(i * 3.3)) % 1);
      const x = (0.06 + rnd(i * 5.1) * 0.88) * W;
      const y = k * domeY;
      g.strokeStyle = `rgba(255,${120 + rnd(i * 2.2) * 80},90,${(1 - k).toFixed(3)})`;
      g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x, y); g.stroke();
      if (k > 0.94) {
        g.strokeStyle = 'rgba(160,215,255,.75)';
        g.lineWidth = 2;
        g.beginPath(); g.arc(x, domeY, (k - 0.94) * 340, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      }
    }
  });
  api.fx.shakeScreen(8, 1600);
  setTimeout(async () => {
    layer.stop(); bolts.remove();
    api.fx.celebrate(1.6);
    api.solve('Заклинанията се пръсват в купола като градушка в стъкло и нито едно не минава. На най-горния камък, там където двата шева се срещат, е издълбана руна.');
  }, 2300);
}
