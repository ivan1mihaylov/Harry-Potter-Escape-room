/* ============================================================
   ЗАЛА VII — Стаята на тайните: змийската пътека и мивката
   ============================================================ */
import { head, $, $$, el, shakeEl, shuffle } from './common.js';
import { IMG, photo } from '../config.js';

export const meta = {
  id: 'chamber',
  eyebrow: 'Зала VII',
  title: 'Стаята на тайните',
  sub: 'Под моминската тоалетна има вход, който се отваря само за змиеуст. Ти не си — но каменният под помни името на своя създател.',
  rune: 'Л',
  bg: 'off',
  tint: '#2e9e6b',
  hints: [
    'Пътеката тръгва от горния ляв ъгъл на плочника. Всяка следваща плоча трябва да е съседна по хоризонтал или вертикал — по диагонал не се минава.',
    'Първите стъпки са: С(1-1) → А(1-2) → Л(1-3) → надолу А(2-3) → надолу З(3-3) → надясно А(3-4) → надясно Р(3-5) → нагоре С(2-5) → нагоре Л(1-5).',
    'След Л(1-5) продължава: И(1-6) → надолу З(2-6) → надолу Е(3-6) → надолу Р(4-6) → надясно И(4-7) → надясно Н(4-8). На чешмата търси кранчето с изгравирана змия — то е единственото с малка спирала до отвора.',
  ],
};

const GRID = [
  ['С', 'А', 'Л', 'Т', 'Л', 'И', 'Р', 'О'],
  ['Н', 'Е', 'А', 'Ж', 'С', 'Д', 'В', 'Т'],
  ['К', 'И', 'З', 'А', 'Р', 'Е', 'Н', 'Й'],
  ['О', 'Р', 'Т', 'Ш', 'М', 'Р', 'И', 'Н'],
  ['В', 'Я', 'Л', 'Б', 'Е', 'Ч', 'А', 'К'],
  ['Д', 'У', 'Х', 'Г', 'Ю', 'П', 'С', 'Ф'],
];
const WORD = 'САЛАЗАРСЛИДЕРИН';

export function mount(root, api) {
  const d = api.data;
  if (!d.path) d.path = [];
  if (d.pathDone == null) d.pathDone = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel chamber-panel">
      ${photo(IMG.snake, 0.09)}
      <div class="grid-2 tilt">
        <div>
          <p class="panel-title">Плочникът на подземието</p>
          <p class="muted" style="font-size:.94rem;margin:-6px 0 12px">
            Стъпвай само по съседни плочи — нагоре, надолу, наляво или надясно. Никакви диагонали.
            Плочите трябва да изпишат името на основателя.</p>
          <div class="word-track" id="track"></div>
          <div class="stone-grid" id="grid"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-ghost btn-sm" id="undo"><span>Крачка назад</span></button>
            <button class="btn btn-ghost btn-sm" id="clear"><span>Изчисти пътеката</span></button>
          </div>
        </div>
        <div>
          <p class="panel-title">Моминската тоалетна</p>
          <div class="sink-area" id="sink">
            <div class="sink-locked" id="sink-locked">
              <div class="sink-lock-ico">&#128274;</div>
              <p>Мивката е студена и няма нито един процеп. Плочникът долу още не е събуден.</p>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  renderTrack(api);
  renderGrid(api);
  $('#undo').addEventListener('click', () => { const d = api.data; d.path.pop(); api.saveData(); api.sfx.click(); renderGrid(api); renderTrack(api); });
  $('#clear').addEventListener('click', () => { const d = api.data; d.path = []; api.saveData(); api.sfx.click(); renderGrid(api); renderTrack(api); });

  if (d.pathDone || api.solved) openSink(api, api.solved);
}

function renderTrack(api) {
  const t = $('#track');
  const n = api.data.pathDone ? WORD.length : api.data.path.length;
  t.innerHTML = [...WORD].map((c, i) =>
    `<span class="wt${i < n ? ' on' : ''}${i === 7 ? ' gap' : ''}">${c}</span>`).join('');
}

function renderGrid(api) {
  const g = $('#grid');
  g.innerHTML = '';
  const path = api.data.path;
  GRID.forEach((row, r) => row.forEach((ch, c) => {
    const idx = path.findIndex(p => p[0] === r && p[1] === c);
    const b = el('button', 'stone' + (idx >= 0 ? ' on' : '') + (idx === path.length - 1 ? ' head' : ''), ch);
    if (idx >= 0) b.dataset.step = idx + 1;
    b.addEventListener('click', () => step(api, r, c));
    g.appendChild(b);
  }));
  if (api.data.pathDone) g.classList.add('done');
}

function step(api, r, c) {
  const d = api.data;
  if (d.pathDone) return;
  const path = d.path;
  const last = path[path.length - 1];

  // повторно докосване на последната плоча = крачка назад
  if (last && last[0] === r && last[1] === c) { path.pop(); api.saveData(); api.sfx.click(); renderGrid(api); renderTrack(api); return; }
  if (path.some(p => p[0] === r && p[1] === c)) { api.toast('По една плоча се минава само веднъж.', ''); return; }

  const need = WORD[path.length];
  if (GRID[r][c] !== need) {
    api.sfx.bad(); api.fx.shakeScreen(5, 240);
    api.toast(`Следващата буква трябва да е <b>${need}</b>. Плочата изсъсква и потъмнява.`, 'bad');
    return;
  }
  if (last) {
    const adj = Math.abs(last[0] - r) + Math.abs(last[1] - c) === 1;
    if (!adj) { api.sfx.bad(); api.toast('Плочата не е съседна на предишната. Змиите не скачат.', 'bad'); return; }
  }

  path.push([r, c]); api.saveData();
  api.sfx.hiss();
  renderGrid(api); renderTrack(api);
  const node = $$('.stone')[r * 8 + c];
  api.fx.sparksFrom(node, { count: 10, color: '#7fe0a8', spread: 70 });

  if (path.length === WORD.length) {
    d.pathDone = true; api.saveData();
    api.sfx.unlock();
    api.fx.flash('rgba(60,200,140,.22)', 700);
    renderGrid(api); renderTrack(api);
    setTimeout(() => openSink(api, false), 600);
  }
}

/* ---------- мивката с кранчетата ---------- */
const MOTIFS = [
  { id: 'vine',    name: 'лоза' },
  { id: 'fish',    name: 'риба' },
  { id: 'wave',    name: 'вълна' },
  { id: 'snake',   name: 'змия' },
  { id: 'chain',   name: 'верига' },
  { id: 'feather', name: 'перо' },
  { id: 'knot',    name: 'възел' },
  { id: 'crack',   name: 'пукнатина' },
  { id: 'eel',     name: 'змиорка' },
  { id: 'thorn',   name: 'трън' },
  { id: 'spiral',  name: 'спирала' },
  { id: 'ivy',     name: 'бръшлян' },
];
/* разбъркване с постоянно семе — подредбата е една и съща при всяко зареждане */
const TAPS = shuffle(MOTIFS, 97);
const SNAKE_TAP = TAPS.findIndex(m => m.id === 'snake');

function openSink(api, already) {
  const sink = $('#sink');
  sink.innerHTML = `
    <p class="muted center" style="font-size:.94rem">Плочникът светна и мивката се пробуди.
    Дванайсет кранчета, всяко издраскано от времето. Само по едно от тях е минала ръка на
    змиеуст — търси <b>змия с раздвоен език и око</b>, не просто виеща се черта.</p>
    <div class="taps" id="taps"></div>
    <div class="loupe" id="loupe">
      <div class="loupe-glass" id="loupe-glass">
        <div class="loupe-empty">докосни кранче, за да го огледаш отблизо</div>
      </div>
      <div class="loupe-side">
        <div class="loupe-label" id="loupe-label">нищо избрано</div>
        <button class="btn btn-house btn-sm" id="turn-tap" disabled><span>Завърти това кранче</span></button>
        <p class="muted" style="font-size:.8rem;margin-top:8px">Гравюрата се вижда само през лупата.
        Грешното кранче пуска ръждива вода и ти струва време.</p>
      </div>
    </div>`;

  const taps = $('#taps');
  TAPS.forEach((m, i) => {
    const t = el('button', 'tap', tapSVG(m.id, i, false));
    t.addEventListener('click', () => inspect(api, i, t));
    taps.appendChild(t);
  });
  $('#turn-tap').addEventListener('click', () => turnTap(api));
  if (already) { sink.classList.add('opening'); $('#turn-tap').disabled = true; }
}

let picked = -1;

function inspect(api, i, node) {
  if (api.solved) return;
  picked = i;
  api.sfx.click();
  $$('.tap').forEach(x => x.classList.remove('sel'));
  node.classList.add('sel');
  $('#loupe-glass').innerHTML = tapSVG(TAPS[i].id, i, true);
  $('#loupe-label').textContent = `кранче №${i + 1}`;
  $('#turn-tap').disabled = false;
}

function turnTap(api) {
  if (api.solved || picked < 0) return;
  if (picked === SNAKE_TAP) {
    api.sfx.hiss();
    api.fx.sparksFrom($('#loupe-glass'), { count: 44, color: '#7fe0a8', spread: 260 });
    api.fx.flash('rgba(60,200,140,.25)', 800);
    $('#sink').classList.add('opening');
    $('#turn-tap').disabled = true;
    setTimeout(() => api.solve('Мивката потъва в пода и разкрива тъмна тръба. Върху ръба ѝ проблясва руна.'), 900);
  } else {
    api.sfx.bad();
    shakeEl($('#loupe-glass'));
    api.fail(`Кранче №${picked + 1} изскърцва и плюе ръждива вода. Гравюрата беше ${TAPS[picked].name}.`);
  }
}

/* кранче: отдалеч всички са еднакви, гравюрата се чете само уголемена */
function tapSVG(motif, seed, big) {
  const w = big ? 2.4 : 1.1;
  const op = big ? 0.92 : 0.32;
  const wear = [];
  for (let k = 0; k < 5; k++) {
    const a = (seed * 37 + k * 71) % 360 * Math.PI / 180;
    const r1 = 22 + ((seed * 13 + k * 7) % 6);
    const x1 = 40 + Math.cos(a) * r1, y1 = 40 + Math.sin(a) * r1;
    const x2 = 40 + Math.cos(a + 0.5) * (r1 - 4), y2 = 40 + Math.sin(a + 0.5) * (r1 - 4);
    wear.push(`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#6f7178" stroke-width="${big ? 1.4 : .7}" opacity=".45"/>`);
  }
  return `<svg viewBox="0 0 80 80">
    <defs>
      <radialGradient id="tp${seed}${big ? 'b' : 's'}" cx="35%" cy="28%">
        <stop offset="0" stop-color="#9aa0a8"/><stop offset=".55" stop-color="#5c6068"/>
        <stop offset="1" stop-color="#2b2e34"/>
      </radialGradient>
    </defs>
    <circle cx="40" cy="40" r="32" fill="url(#tp${seed}${big ? 'b' : 's'})" stroke="#1d1f24" stroke-width="2"/>
    <circle cx="40" cy="40" r="24" fill="none" stroke="#7d828c" stroke-width="1.4" opacity=".55"/>
    <circle cx="40" cy="40" r="12" fill="#20232a" stroke="#4a4e56" stroke-width="1.6"/>
    <g stroke="#8d939c" stroke-width="${big ? 6 : 4}" stroke-linecap="round" opacity=".9">
      <path d="M40 12v8M40 60v8M12 40h8M60 40h8"/>
    </g>
    ${wear.join('')}
    <g stroke="#8f959e" fill="none" stroke-width="${w}" stroke-linecap="round" opacity="${op}"
       transform="translate(40,40) scale(${big ? 1.15 : 1})">
      ${engraving(motif, big)}
    </g>
  </svg>`;
}

function engraving(id, big) {
  switch (id) {
    case 'snake':
      return `<path d="M-13 9c9 3 14-2 11-7s-13-4-11-11 10-8 16-5"/>
              <circle cx="16" cy="-14" r="1.6" fill="#8f959e" stroke="none"/>
              <path d="M19-15l5-2M19-13l5 2"/>`;
    case 'eel':   return `<path d="M-14 8c8 5 16-1 14-8s-12-6-12-13"/><path d="M-14 8l-4 4"/>`;
    case 'vine':  return `<path d="M-12 12c6-6 4-14 10-18s10 2 14-3"/><path d="M-4 4l-5-3M2-2l5 3M8-8l-4-4"/>`;
    case 'ivy':   return `<path d="M-12 10c8-4 8-12 16-16"/><path d="M-6 5c-3-3-7-3-9 0M2-3c-3-3-7-3-9 0M10-11c-3-3-7-3-9 0"/>`;
    case 'fish':  return `<path d="M-14 0c6-8 18-8 24 0-6 8-18 8-24 0Z"/><path d="M10-6l7-6v12l-7-6"/><circle cx="-6" cy="-2" r="1.4" fill="#8f959e" stroke="none"/>`;
    case 'wave':  return `<path d="M-16 4c5-8 11 8 16 0s11 8 16 0"/><path d="M-16-6c5-8 11 8 16 0s11 8 16 0" opacity=".6"/>`;
    case 'chain': return `<ellipse cx="-10" cy="0" rx="6" ry="4"/><ellipse cx="0" cy="0" rx="6" ry="4"/><ellipse cx="10" cy="0" rx="6" ry="4"/>`;
    case 'feather': return `<path d="M-12 12C-4 0 4-8 14-14"/><path d="M-6 6l-6 1M-2 0l-6 0M4-6l-6-1M10-11l-6-2"/>`;
    case 'knot':  return `<path d="M-8-6c10 0 10 12 0 12s-10-12 0-12"/><path d="M8-6c-10 0-10 12 0 12s10-12 0-12"/>`;
    case 'crack': return `<path d="M-12-12l6 9-4 5 8 6-3 6"/><path d="M-6-3l6 2"/>`;
    case 'thorn': return `<path d="M-14 8L14-8"/><path d="M-6 2l-2-6M2-3l4-5M-10 5l-5-1M6-6l5 2"/>`;
    default:      return `<path d="M0 0c0-5 5-5 5 0s-8 8-11 0 8-14 15-6"/>`;
  }
}
