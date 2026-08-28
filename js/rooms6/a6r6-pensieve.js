/* ============================================================
   ШЕСТА ЧАСТ · МЯСТО VI — Ситото на спомените
   Слъгхорн е дал спомена си два пъти: веднъж както се е случил
   и веднъж както му се иска да се е случил. Разликите са пет.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { canvasLayer, revealPanel, wait, rnd } from './common6.js';

export const meta = {
  id: 'a6-pensieve',
  eyebrow: 'Място VI',
  title: 'Ситото на спомените',
  sub: 'Две сребърни нишки от една и съща вечер. Едната е спомен, другата е желание — и се различават само на пет места.',
  rune: 'У',
  bg: 'off',
  tint: '#a8c8ff',
  hints: [
    { text: 'Гледай <b>предметите</b>, не хората: колко са свещите, къде сочат стрелките, какво има в чашата, колко книги стоят на рафта. Подправеният спомен винаги подрежда дреболиите по-хубаво.',
      done: d => (d.found || []).length >= 5 },
    { text: 'Едно от петте е <b>върху ръката на момчето</b>. Слъгхорн упорито не иска да го помни.',
      done: d => (d.found || []).length >= 5 },
    'Петте разлики: часовникът, свещите, чашата на Слъгхорн, книгите на рафта и пръстенът на ръката на Том. Кликни ги в дясната, подправената нишка.',
  ],
};

/* Всички области за кликане са с еднакъв невидим правоъгълник — иначе
   играчът щеше да ги намери, като разходи мишката по картината.        */
const ZONES = [
  { id: 'books',   x: 12,  y: 36,  w: 100, h: 94 },
  { id: 'clock',   x: 270, y: 32,  w: 60,  h: 60 },
  { id: 'candles', x: 128, y: 78,  w: 104, h: 50 },
  { id: 'glass',   x: 124, y: 120, w: 40,  h: 38 },
  { id: 'ring',    x: 238, y: 162, w: 40,  h: 36 },
  { id: 'slug',    x: 48,  y: 110, w: 66,  h: 50 },   /* примамка */
  { id: 'table',   x: 94,  y: 144, w: 184, h: 22 },   /* примамка */
  { id: 'hair',    x: 264, y: 116, w: 46,  h: 30 },   /* примамка */
  { id: 'floor',   x: 4,   y: 200, w: 110, h: 44 },   /* примамка */
];

/* петте различия: id → как изглеждат в истинския и в подправения спомен */
const DIFFS = [
  { id: 'clock', label: 'часовникът', why: 'Единадесет без пет, не осем. Разговорът е бил късно през нощта, когато никой не е гледал.' },
  { id: 'candles', label: 'свещите', why: 'Три свещи, не пет. Стаята е била по-тъмна, отколкото Слъгхорн я помни.' },
  { id: 'glass', label: 'чашата', why: 'Пълна, не празна. Той е налял на момчето — и на себе си.' },
  { id: 'books', label: 'книгите', why: 'Една книга е извадена от рафта. Онази за най-тъмната магия.' },
  { id: 'ring', label: 'пръстенът', why: 'На ръката на Том има пръстен с черен камък. Слъгхорн го е видял и не е попитал.' },
];

let mist = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.found) d.found = [];
  if (d.told == null) d.told = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}

    <div class="panel">
      <p class="panel-title">Ситото свети с две нишки наведнъж</p>
      <p class="muted">Вляво е споменът, който Дъмбълдор пази от години — истинският, но накъсан.
      Вдясно е онова, което Слъгхорн предаде доброволно. Наглед са една и съща вечер.
      <b>Пет неща</b> в дясната нишка са разместени. Кликни ги.</p>
    </div>

    <div class="panel pens-panel">
      <div class="pens-mist" id="pens-mist"></div>
      <div class="pens-grid">
        <figure class="memory true">
          <figcaption>както е било</figcaption>
          ${scene(false)}
        </figure>
        <figure class="memory fake" id="fake">
          <figcaption>както го дава Слъгхорн</figcaption>
          ${scene(true)}
        </figure>
      </div>
      <div class="pens-score" id="pens-score"></div>
      <div class="pens-list" id="pens-list"></div>
    </div>

    <div class="panel" id="p-word" hidden>
      <p class="panel-title">Споменът се изправя</p>
      <p id="p-word-body">Сребърната нишка се разгъва наново и този път звукът идва с нея.
      Слъгхорн говори тихо, а момчето слуша, без да мига.</p>
      <blockquote class="doors-rule" id="slug-line"></blockquote>
      <div class="flex flex-center mt">
        <button class="btn btn-house" id="pw-go"><span>Извади нишката от ситото</span></button>
      </div>
    </div>`;

  wire(api);
  paint(api);
  if ((api.data.found || []).length >= DIFFS.length) openWord(api, true);

  mist = canvasLayer($('#pens-mist'), (g, t, W, H) => {
    for (let i = 0; i < 18; i++) {
      const x = (rnd(i * 3.1) + Math.sin(t * 0.25 + i) * 0.05) * W;
      const y = (rnd(i * 7.3) + Math.cos(t * 0.18 + i * 1.7) * 0.04) * H;
      const r = 40 + rnd(i * 5.5) * 90;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(180,205,255,${(0.05 + rnd(i) * 0.05).toFixed(3)})`);
      grd.addColorStop(1, 'rgba(180,205,255,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  });
  api.onLeave = () => { if (mist) { mist.stop(); mist = null; } };
}

/* ---------- сцената ---------- */
function scene(fake) {
  return `<svg viewBox="0 0 360 250" class="mem-svg" aria-hidden="true">
    <rect x="0" y="0" width="360" height="250" fill="#0d1424"/>
    <rect x="0" y="196" width="360" height="54" fill="#141d33"/>
    <!-- рафт с книги -->
    <rect x="14" y="40" width="96" height="86" fill="#1a2440" stroke="#3a4a70" stroke-width="2"/>
    <g>
      ${[0, 1, 2, 3, 4].map(i => (fake || i !== 2)
        ? `<rect x="${20 + i * 18}" y="${52 + (i % 2) * 4}" width="13" height="${58 - (i % 3) * 6}"
             fill="${['#7a3b46', '#3b5a7a', '#6a5a2a', '#43704f', '#5a3b6a'][i]}" stroke="#0b1120" stroke-width="1.4"/>`
        : '').join('')}
    </g>
    <!-- часовник -->
    <g>
      <circle cx="300" cy="62" r="26" fill="#101a30" stroke="#c9b07a" stroke-width="2.4"/>
      <circle cx="300" cy="62" r="2.6" fill="#c9b07a"/>
      ${fake
        ? '<path d="M300 62V44M300 62l16 8" stroke="#e6d8b0" stroke-width="2.6" stroke-linecap="round"/>'
        : '<path d="M300 62l-9-15M300 62l14-4" stroke="#e6d8b0" stroke-width="2.6" stroke-linecap="round"/>'}
    </g>
    <!-- свещи -->
    <g>
      ${Array.from({ length: fake ? 5 : 3 }, (_, i) => {
        const x = 138 + i * 17;
        return `<rect x="${x}" y="96" width="7" height="26" fill="#e6ddc4"/>
                <ellipse cx="${x + 3.5}" cy="92" rx="4" ry="7" fill="#ffd77a" opacity=".95"/>`;
      }).join('')}
    </g>
    <!-- маса -->
    <rect x="96" y="150" width="176" height="10" rx="3" fill="#4a3a2c"/>
    <rect x="112" y="160" width="10" height="36" fill="#3a2c22"/>
    <rect x="246" y="160" width="10" height="36" fill="#3a2c22"/>
    <!-- чашата -->
    <g>
      <path d="M132 128h22l-3 20h-16z" fill="none" stroke="#cbd8ee" stroke-width="2"/>
      ${fake ? '' : '<path d="M133.4 136h19.2l-2 12h-15.2z" fill="#7a2a3a" opacity=".9"/>'}
      <rect x="140" y="148" width="6" height="4" fill="#cbd8ee"/>
    </g>
    <!-- Слъгхорн и Том: истински човешки силуети (Wikimedia, обществено
         достояние), а не две петна с топка отгоре -->
    <g opacity=".92">
      <image href="assets/img/figure-2.svg" x="46" y="112" width="58" height="86"
             preserveAspectRatio="xMidYMax meet" style="filter:brightness(0) saturate(100%)
             invert(28%) sepia(24%) saturate(520%) hue-rotate(6deg) brightness(92%)"/>
    </g>
    <g opacity=".95">
      <image href="assets/img/figure-3.svg" x="250" y="98" width="70" height="102"
             preserveAspectRatio="xMidYMax meet" style="filter:brightness(0) saturate(100%)
             invert(14%) sepia(30%) saturate(700%) hue-rotate(196deg) brightness(88%)"/>
      <g>
        <path d="M264 176l-12 10" stroke="#e6d8c8" stroke-width="7" stroke-linecap="round"/>
        ${fake ? '' : '<circle cx="254" cy="184" r="4.4" fill="#141018" stroke="#d9b45b" stroke-width="2"/>'}
      </g>
    </g>
    ${fake ? `<g class="zones">${ZONES.map(z =>
      `<rect class="pdiff" data-d="${z.id}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}"
             rx="4" fill="rgba(0,0,0,0)"/>`).join('')}</g>` : ''}
  </svg>`;
}

function wire(api) {
  $$('#fake .pdiff').forEach(el => el.addEventListener('click', () => hit(api, el.dataset.d, el)));
}

function hit(api, id, el) {
  const d = api.data;
  if (api.solved || d.found.length >= DIFFS.length) return;
  if (d.found.includes(id)) return;
  if (!DIFFS.some(x => x.id === id)) {
    api.sfx.bad();
    el.classList.add('miss'); setTimeout(() => el.classList.remove('miss'), 500);
    api.fail('Тук двете нишки съвпадат.', 20000);
    return;
  }
  d.found = [...d.found, id];
  api.saveData();
  api.sfx.chime();
  el.classList.add('found');
  api.fx.sparksFrom(el, { count: 12, color: '#b8d0ff', spread: 80 });
  paint(api);
  if (d.found.length >= DIFFS.length) {
    api.fx.flash('rgba(150,190,255,.2)', 700);
    setTimeout(() => openWord(api, false), 500);
  }
}

function paint(api) {
  const d = api.data;
  const sc = $('#pens-score');
  const done = d.found.length >= DIFFS.length;
  if (sc) sc.innerHTML = done
    ? '<b class="good">И петте разминавания са намерени.</b>'
    : `намерени: <b>${d.found.length}</b> от ${DIFFS.length}`;
  const li = $('#pens-list');
  if (li) li.innerHTML = DIFFS.map(x => d.found.includes(x.id)
    ? `<div class="pd-row"><b>${x.label}</b><span>${x.why}</span></div>`
    : `<div class="pd-row hidden-row"><b>·····</b><span>още не си го видял</span></div>`).join('');
  $$('#fake .pdiff').forEach(el => el.classList.toggle('found', d.found.includes(el.dataset.d)));
}

async function openWord(api, silent) {
  const p = $('#p-word'); if (!p) return;
  if (silent) { p.hidden = false; p.classList.add('a6-reveal', 'on'); } else revealPanel(p);
  const q = $('#slug-line');
  const line = '«Разкъсва се на две, сър? Може ли душата да се раздели на… повече от две?»';
  if (q) {
    if (silent || api.solved) q.textContent = line;
    else { q.textContent = ''; api.fx.typewriter ? api.fx.typewriter(q, line, 26) : (q.textContent = line); }
  }
  const b = $('#pw-go'); if (!b) return;
  if (api.solved) { b.disabled = true; b.querySelector('span').textContent = 'Нишката е у теб'; return; }
  b.addEventListener('click', async () => {
    b.disabled = true;
    api.sfx.unlock();
    api.fx.flash('rgba(180,210,255,.24)', 800);
    await wait(600);
    api.fx.celebrate(1.4);
    api.solve('Истинската нишка се навива на пръста ти и изстива. Сега вече знаеш колко са парчетата — и че последното не е предмет. В сребърната ѝ опашка е вплетена руна.');
  });
}
