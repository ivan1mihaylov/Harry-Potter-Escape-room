/* ============================================================
   ЗАЛА VII — Стаята на тайните: змийската пътека и мивката
   ============================================================ */
import { head, $, $$, el, shakeEl } from './common.js';
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
  ['Н', 'Е', 'А', 'Ж', 'С', 'З', 'В', 'Т'],
  ['К', 'И', 'З', 'А', 'Р', 'Е', 'Н', 'Й'],
  ['О', 'Р', 'Т', 'Ш', 'М', 'Р', 'И', 'Н'],
  ['В', 'Я', 'Л', 'Б', 'Е', 'Ч', 'А', 'К'],
  ['Д', 'У', 'Х', 'Г', 'Ю', 'П', 'С', 'Ф'],
];
const WORD = 'САЛАЗАРСЛИЗЕРИН';
const SNAKE_TAP = 5; // кранчето със змията

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
function openSink(api, already) {
  const sink = $('#sink');
  sink.innerHTML = `
    <p class="muted center" style="font-size:.94rem">Плочникът светна и мивката се пробуди.
    Осем кранчета. Само едно е било докосвано от змиеуст — потърси <b>малката змия</b>, издълбана до отвора.</p>
    <div class="taps" id="taps"></div>`;
  const taps = $('#taps');
  for (let i = 0; i < 8; i++) {
    const t = el('button', 'tap', tapSVG(i === SNAKE_TAP));
    t.addEventListener('click', () => {
      if (api.solved) return;
      if (i === SNAKE_TAP) {
        api.sfx.hiss();
        api.fx.sparksFrom(t, { count: 40, color: '#7fe0a8', spread: 260 });
        api.fx.flash('rgba(60,200,140,.25)', 800);
        sink.classList.add('opening');
        setTimeout(() => api.solve('Мивката потъва в пода и разкрива тъмна тръба. Върху ръба ѝ проблясва руна.'), 900);
      } else {
        api.sfx.bad(); shakeEl(t);
        api.fail('Кранчето изскърцва и пуска ръждива вода. Не е това.');
      }
    });
    taps.appendChild(t);
  }
  if (already) sink.classList.add('opening');
}

function tapSVG(snake) {
  return `<svg viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="30" fill="#2b2b2f" stroke="#7a7a82" stroke-width="3"/>
    <circle cx="40" cy="40" r="20" fill="#3c3c42" stroke="#5c5c64" stroke-width="2"/>
    <g stroke="#8d8d96" stroke-width="4" stroke-linecap="round">
      <path d="M40 16v10M40 54v10M16 40h10M54 40h10"/>
    </g>
    <circle cx="40" cy="40" r="7" fill="#1c1c20"/>
    ${snake ? `<path d="M56 58c5-2 6-7 2-9s-8 1-6 4" fill="none" stroke="#7fe0a8" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>
      <circle cx="58" cy="49" r="1.3" fill="#7fe0a8"/>` : ''}
  </svg>`;
}
