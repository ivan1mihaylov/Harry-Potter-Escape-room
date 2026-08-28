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
    { text: 'Пътеката тръгва от горния ляв ъгъл на плочника. Всяка следваща плоча трябва да е съседна по хоризонтал или вертикал — по диагонал не се минава.',
      done: d => !!d.pathDone },
    { text: 'Първите стъпки са: С(1-1) → А(1-2) → Л(1-3) → надолу А(2-3) → надолу З(3-3) → надясно А(3-4) → надясно Р(3-5) → нагоре С(2-5) → нагоре Л(1-5).',
      done: d => !!d.pathDone },
    { text: 'След Л(1-5) продължава: И(1-6) → надолу З(2-6) → надолу Е(3-6) → надолу Р(4-6) → надясно И(4-7) → надясно Н(4-8). На чешмата търси кранчето с изгравирана змия — то е единственото с малка спирала до отвора.',
      done: d => !!d.pathDone },
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
  /* името стои скрито: всяка буква се показва чак когато я стъпиш */
  t.innerHTML = [...WORD].map((c, i) => {
    const on = i < n;
    return `<span class="wt${on ? ' on' : ''}${i === 7 ? ' gap' : ''}"
              ${on ? `style="animation-delay:${Math.min(i, 2) * 40}ms"` : ''}
            >${on ? c : ''}</span>`;
  }).join('');
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
/* Кранчето: бронзова розетка с кръстата ръкохватка. Гравюрата се рисува
   два пъти — тъмно надолу и светло нагоре — за да изглежда изсечена в
   метала, а не нарисувана върху него.                                  */
function tapSVG(motif, seed, big) {
  const w = big ? 3 : 1.5;
  const op = big ? 1 : 0.5;
  const uid = `${seed}${big ? 'b' : 's'}`;
  /* драскотини от времето — всяко кранче е протрито различно */
  const wear = [];
  for (let k = 0; k < 7; k++) {
    const a = (seed * 37 + k * 71) % 360 * Math.PI / 180;
    const r1 = 20 + ((seed * 13 + k * 7) % 8);
    const x1 = 40 + Math.cos(a) * r1, y1 = 40 + Math.sin(a) * r1;
    const x2 = 40 + Math.cos(a + 0.42) * (r1 - 3), y2 = 40 + Math.sin(a + 0.42) * (r1 - 3);
    wear.push(`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"
      stroke="#2b2015" stroke-width="${big ? 1.2 : .6}" opacity=".4"/>`);
  }
  const eng = engraving(motif, big, w);
  return `<svg viewBox="0 0 80 80">
    <defs>
      <radialGradient id="tb${uid}" cx="34%" cy="26%" r="78%">
        <stop offset="0" stop-color="#e8c98a"/>
        <stop offset=".38" stop-color="#b08a4a"/>
        <stop offset=".72" stop-color="#6d5228"/>
        <stop offset="1" stop-color="#33260f"/>
      </radialGradient>
      <linearGradient id="th${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f0d9a4"/><stop offset=".5" stop-color="#a8813f"/>
        <stop offset="1" stop-color="#5c451f"/>
      </linearGradient>
      <radialGradient id="tc${uid}" cx="42%" cy="34%" r="70%">
        <stop offset="0" stop-color="#3a2c16"/><stop offset="1" stop-color="#0e0a05"/>
      </radialGradient>
    </defs>

    <!-- розетката -->
    <circle cx="40" cy="40" r="33" fill="url(#tb${uid})" stroke="#1a1208" stroke-width="2"/>
    <circle cx="40" cy="40" r="33" fill="none" stroke="#f0dcae" stroke-width="1" opacity=".28"/>
    <circle cx="40" cy="40" r="26.5" fill="none" stroke="#241a0c" stroke-width="2" opacity=".55"/>
    <circle cx="40" cy="40" r="25" fill="none" stroke="#e0c489" stroke-width="1" opacity=".22"/>

    <!-- кръстатата ръкохватка -->
    <g stroke="url(#th${uid})" stroke-width="${big ? 8 : 6}" stroke-linecap="round">
      <path d="M40 9v11M40 60v11M9 40h11M60 40h11"/>
    </g>
    <g stroke="#1a1208" stroke-width="${big ? 1.4 : 1}" opacity=".5" fill="none">
      <path d="M40 9v11M40 60v11M9 40h11M60 40h11"/>
    </g>

    <!-- гнездото, в което е изсечена гравюрата -->
    <circle cx="40" cy="40" r="21" fill="url(#tc${uid})" stroke="#4a3a1c" stroke-width="1.6"/>
    <circle cx="40" cy="40" r="21" fill="none" stroke="#000" stroke-width="3" opacity=".35"/>
    ${wear.join('')}

    <!-- гравюрата: тъмна бразда и светъл ръб -->
    <g class="tap-engraving" data-motif="${motif}" transform="translate(40,40) scale(${big ? 1.28 : 1.05})">
      <g fill="none" stroke="#080502" stroke-width="${w + 1.4}" stroke-linecap="round"
         stroke-linejoin="round" opacity="${op * 0.85}" transform="translate(0,1)">${eng}</g>
      <g fill="none" stroke="#f2dcae" stroke-width="${w}" stroke-linecap="round"
         stroke-linejoin="round" opacity="${op * 0.9}" transform="translate(0,-0.6)">${eng}</g>
      <g fill="none" stroke="#8a6c33" stroke-width="${w * 0.6}" stroke-linecap="round"
         stroke-linejoin="round" opacity="${op * 0.8}">${eng}</g>
    </g>
  </svg>`;
}

/* Мотивите са истински фигури, а не заврънтулки: змията има глава, око,
   раздвоен език и три навивки — за да може да се различи от лозата.   */
function engraving(id, big, w = 2) {
  switch (id) {
    case 'snake':
      /* Тялото се изтънява към опашката (три дъги с различна дебелина),
         главата е плътна с око и раздвоен език — за да е змия, а не черта */
      return `<path d="M-17 13Q-11 16-8 10" stroke-width="${(w * 0.5).toFixed(2)}"/>
              <path d="M-8 10Q-3 4-6-2" stroke-width="${(w * 0.8).toFixed(2)}"/>
              <path d="M-6-2Q-9-9-3-13" stroke-width="${(w * 1.05).toFixed(2)}"/>
              <path d="M-3-13Q3-17 8-16" stroke-width="${(w * 1.3).toFixed(2)}"/>
              <path d="M7.4-17.2c5.2-1 10.6.9 12.4 3.4-1.8 2.5-7.2 4.2-12.4 3.2
                       -2.2-.4-3.2-1.5-3.2-3.3s1-2.9 3.2-3.3Z"
                    fill="#f2dcae" stroke-width="${(w * 0.5).toFixed(2)}"/>
              <circle cx="12.6" cy="-15.2" r="${(w * 0.4 + .45).toFixed(2)}" fill="#0a0703" stroke="none"/>
              <path d="M19.8-13.8l5.4-3.2M19.8-13.8l5.6 1.4M19.8-13.8l3.4-.6"
                    stroke-width="${(w * 0.5).toFixed(2)}"/>
              <path d="M-17 13q-3 1-4.5 3" stroke-width="${(w * 0.42).toFixed(2)}"/>`;
    case 'eel':
      return `<path d="M-16 9c9 6 17-2 15-9s-13-7-13-14"/>
              <path d="M-16 9l-5 5M-14 3l-6 2"/>
              <circle cx="-13" cy="-16" r="1.2" fill="#f2dcae" stroke="none"/>`;
    case 'vine':
      return `<path d="M-13 14C-6 7-9-2-2-8s10 3 15-4"/>
              <path d="M-6 6c-4-3-8-2-9 2 4 3 8 2 9-2Z"/>
              <path d="M4-4c1-5 5-7 9-5-1 5-5 7-9 5Z"/>`;
    case 'ivy':
      return `<path d="M-13 12C-5 6-4-4 6-9s8-6 10-9"/>
              <path d="M-7 4c-4-4-8-3-9 1 4 4 8 3 9-1ZM3-5c-4-4-8-3-9 1 4 4 8 3 9-1Z"/>`;
    case 'fish':
      return `<path d="M-15 0c7-9 19-9 26 0-7 9-19 9-26 0Z"/>
              <path d="M11-7l8-7v14l-8-7"/>
              <path d="M-4-5c3 3 3 7 0 10"/>
              <circle cx="-7" cy="-2" r="1.4" fill="#f2dcae" stroke="none"/>`;
    case 'wave':
      return `<path d="M-17 6c5-9 12 9 17 0s12 9 17 0"/>
              <path d="M-17-3c5-9 12 9 17 0s12 9 17 0"/>
              <path d="M-17-12c5-9 12 9 17 0s12 9 17 0" opacity=".7"/>`;
    case 'chain':
      return `<ellipse cx="-12" cy="0" rx="6.5" ry="4.5"/><ellipse cx="0" cy="0" rx="6.5" ry="4.5"/>
              <ellipse cx="12" cy="0" rx="6.5" ry="4.5"/>
              <path d="M-6 0h1M5 0h2"/>`;
    case 'feather':
      return `<path d="M-13 14C-4 1 5-8 15-15"/>
              <path d="M-7 8c2-5 6-8 10-9M-2 2c2-5 6-8 10-9M3-4c2-5 6-7 9-8"/>
              <path d="M-9 11c-3 1-5 3-5 5"/>`;
    case 'knot':
      return `<path d="M-9-7c11 0 11 14 0 14s-11-14 0-14"/>
              <path d="M9-7c-11 0-11 14 0 14s11-14 0-14"/>
              <path d="M0-7v14"/>`;
    case 'crack':
      return `<path d="M-13-14l7 10-5 6 9 7-4 7"/>
              <path d="M-6-4l7 3M-4 12l5 3"/>`;
    case 'thorn':
      return `<path d="M-15 9L15-9"/>
              <path d="M-7 3l-3-7M2-2l5-6M-11 6l-6-1M7-6l6 2"/>`;
    case 'spiral':
      return `<path d="M0 0c0-4 4-4 4 0s-6 7-10 2-1-13 6-13 12 7 12 14"/>`;
    default:
      return `<path d="M0 0c0-5 5-5 5 0s-8 8-11 0 8-14 15-6"/>`;
  }
}

