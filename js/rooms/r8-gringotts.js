/* ============================================================
   ЗАЛА VIII — Гринготс: ключалката със скъпоценни камъни
   ============================================================ */
import { head, $, $$, el, shakeEl } from './common.js';
import { gemSVG } from '../art.js';
import { IMG, photo } from '../config.js';

export const meta = {
  id: 'gringotts',
  eyebrow: 'Зала VIII',
  title: 'Трезор 713',
  sub: 'Гоблинска ключалка с пет гнезда. Тя не пита за ключ — пита за търпение. И пази дракон, който спи леко.',
  rune: 'О',
  bg: 'off',
  tint: '#d9b45b',
  hints: [
    'Първият камък е „по-студен от огъня“ — сапфир, изумруд или аметист. Диамант не участва никъде.',
    'Точно един камък се повтаря два пъти и двете му копия не са съседни. Значи в петте гнезда има само четири различни вида.',
    'Комбинацията е: сапфир, рубин, топаз, рубин, изумруд.',
  ],
};

const GEMS = [
  { id: 'ruby',     name: 'Рубин',    color: '#d33a3a' },
  { id: 'emerald',  name: 'Изумруд',  color: '#2ea86b' },
  { id: 'sapphire', name: 'Сапфир',   color: '#3f6fd8' },
  { id: 'topaz',    name: 'Топаз',    color: '#e0b32a' },
  { id: 'amethyst', name: 'Аметист',  color: '#9b5fd0' },
  { id: 'diamond',  name: 'Диамант',  color: '#dfe8f0' },
];
const SECRET = ['sapphire', 'ruby', 'topaz', 'ruby', 'emerald'];
const MAX_TRIES = 10;

export function mount(root, api) {
  const d = api.data;
  if (!d.guess) d.guess = [null, null, null, null, null];
  if (!d.history) d.history = [];
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel vault-panel">
      ${photo(IMG.gold, 0.12)}
      <div class="grid-2 tilt">
        <div>
          <p class="panel-title">Условията на гоблина Грипкук</p>
          <div class="parchment">
            <ul class="clue-list">
              <li>Нито един <b>диамант</b> не влиза в този трезор. Гоблините не търгуват с прозрачни лъжи.</li>
              <li>Точно <b>един</b> камък се среща <b>два пъти</b>. Всички останали са различни помежду си.</li>
              <li>Двата еднакви камъка <b>не се допират</b>.</li>
              <li>Камъкът най-вляво е <b>по-студен от огъня</b>.</li>
            </ul>
            <p style="font-size:.92rem">След всеки опит ключалката отговаря с точки:
            <b class="peg-gold-t">златна</b> = верен камък на вярно място;
            <b class="peg-silver-t">сребърна</b> = верен камък, но на грешно място. Точките не издават кое гнездо.</p>
          </div>
          <div class="dragon" id="dragon">${dragonSVG()}</div>
          <p class="center muted" style="font-size:.85rem">Драконът пази. Всеки грешен опит го буди малко повече.</p>
        </div>
        <div>
          <p class="panel-title">Ключалката · опит <span id="try-n">1</span> от ${MAX_TRIES}</p>
          <div class="slots" id="slots"></div>
          <div class="gem-tray" id="tray"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-house" id="try"><span>Опитай ключалката</span></button>
            <button class="btn btn-ghost btn-sm" id="clear-g"><span>Изчисти</span></button>
          </div>
          <div class="history" id="history"></div>
        </div>
      </div>
    </div>`;

  renderSlots(api); renderTray(api); renderHistory(api);
  $('#try').addEventListener('click', () => attempt(api));
  $('#clear-g').addEventListener('click', () => { api.data.guess = [null, null, null, null, null]; api.saveData(); api.sfx.click(); renderSlots(api); });

  if (api.solved) { $('#try').disabled = true; $('.slots').classList.add('open'); }
}

let activeSlot = 0;

function renderSlots(api) {
  const box = $('#slots'); box.innerHTML = '';
  const g = api.solved ? SECRET : api.data.guess;
  g.forEach((id, i) => {
    const gem = GEMS.find(x => x.id === id);
    const s = el('div', 'slot' + (id ? ' filled' : '') + (i === activeSlot && !api.solved ? ' active' : ''));
    s.innerHTML = gem ? gemSVG(gem.color, gem.id) : '<span class="slot-empty">?</span>';
    s.addEventListener('click', () => {
      if (api.solved) return;
      if (api.data.guess[i]) { api.data.guess[i] = null; api.saveData(); }
      activeSlot = i; api.sfx.click(); renderSlots(api);
    });
    box.appendChild(s);
  });
  $('#try-n').textContent = Math.min(api.data.history.length + 1, MAX_TRIES);
}

function renderTray(api) {
  const t = $('#tray'); t.innerHTML = '';
  GEMS.forEach(g => {
    const b = el('button', 'gem-btn', `${gemSVG(g.color, g.id)}<span>${g.name}</span>`);
    b.addEventListener('click', () => {
      if (api.solved) return;
      const d = api.data;
      let i = d.guess.findIndex((x, k) => k === activeSlot && !x);
      if (i < 0) i = d.guess.findIndex(x => !x);
      if (i < 0) { api.toast('Всички пет гнезда са пълни. Докосни гнездо, за да го изпразниш.', ''); return; }
      d.guess[i] = g.id; api.saveData(); api.sfx.coin();
      activeSlot = d.guess.findIndex(x => !x);
      if (activeSlot < 0) activeSlot = 4;
      renderSlots(api);
    });
    t.appendChild(b);
  });
}

function score(guess) {
  let gold = 0, silver = 0;
  const s = [...SECRET], g = [...guess];
  for (let i = 0; i < 5; i++) if (g[i] === s[i]) { gold++; s[i] = g[i] = null; }
  for (let i = 0; i < 5; i++) {
    if (!g[i]) continue;
    const j = s.indexOf(g[i]);
    if (j >= 0) { silver++; s[j] = null; }
  }
  return { gold, silver };
}

function attempt(api) {
  const d = api.data;
  if (d.guess.some(x => !x)) { api.toast('Ключалката иска и петте гнезда пълни.', ''); return; }
  const res = score(d.guess);
  d.history.unshift({ g: [...d.guess], ...res });
  api.saveData();

  if (res.gold === 5) {
    api.sfx.unlock();
    $('.slots').classList.add('open');
    api.fx.sparksFrom($('#slots'), { count: 60, color: '#ffd98a', spread: 320 });
    api.fx.flash('rgba(255,215,120,.28)', 800);
    $('#try').disabled = true;
    renderHistory(api);
    setTimeout(() => api.solve('Ключалката се разтваря като цвете. Вътре, върху купчина галеони, лежи руна.'), 800);
    return;
  }

  api.sfx.bad();
  $('#dragon').classList.add('stir');
  setTimeout(() => $('#dragon').classList.remove('stir'), 900);
  renderSlots(api); renderHistory(api);

  if (d.history.length >= MAX_TRIES) {
    api.sfx.roar();
    api.fx.shakeScreen(16, 700);
    api.fx.flash('rgba(220,120,40,.25)', 700);
    d.history = []; api.saveData();
    renderHistory(api); renderSlots(api);
    api.fail('Драконът реве и ключалката се самозаключва. Опитите започват отначало.', 90000);
  } else {
    api.toast(`Ключалката отвръща: <b class="peg-gold-t">${res.gold} златни</b>, <b class="peg-silver-t">${res.silver} сребърни</b>.`, '');
  }
}

function renderHistory(api) {
  const h = $('#history'); h.innerHTML = '';
  api.data.history.forEach((row, n) => {
    const r = el('div', 'hist-row');
    const gems = row.g.map(id => {
      const g = GEMS.find(x => x.id === id);
      return `<i class="hg">${gemSVG(g.color, g.id)}</i>`;
    }).join('');
    const pegs = Array.from({ length: 5 }, (_, i) =>
      `<b class="peg ${i < row.gold ? 'gold' : i < row.gold + row.silver ? 'silver' : 'none'}"></b>`).join('');
    r.innerHTML = `<span class="hist-n">${api.data.history.length - n}</span><div class="hist-gems">${gems}</div><div class="pegs">${pegs}</div>`;
    h.appendChild(r);
  });
}

function dragonSVG() {
  return `<svg viewBox="0 0 320 170">
    <defs>
      <linearGradient id="drg" x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0" stop-color="#948a6d"/><stop offset="1" stop-color="#403b2e"/>
      </linearGradient>
    </defs>
    <g stroke="#221e17" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
      <!-- опашка, увита около тялото -->
      <path d="M44 142c-16-4-22-18-14-30 10-16 34-16 46-4" fill="none" stroke="#4b4536" stroke-width="15"/>
      <path d="M30 118l-16-4 12-12 8 8-4 8Z" fill="#4b4536"/>
      <!-- врат (рисуван преди тялото, за да се слее с него) -->
      <path d="M170 92c22 4 42 6 60 14" fill="none" stroke="#5c5544" stroke-width="34"/>
      <!-- тяло -->
      <ellipse cx="132" cy="104" rx="76" ry="48" fill="url(#drg)"/>
      <!-- гребен от шипове -->
      <path d="M84 60l6-18 9 15M108 54l7-18 9 16M134 52l8-17 8 17M160 58l9-15 6 17" fill="#a2946d"/>
      <!-- сгънато крило -->
      <g class="dr-wing">
        <path d="M96 100c-6-32 10-54 40-60-8 20-2 34 14 44-8 10-20 17-32 20-8 2-16 1-22-4Z" fill="#6d6552"/>
        <path d="M118 44c1 16 6 28 18 36M130 42c-1 14 3 24 12 32" fill="none" stroke="#332f25" stroke-width="2"/>
      </g>
      <!-- глава -->
      <path d="M226 92c14-4 30-2 42 6 10 6 12 16 4 22-10 8-28 8-42 2-10-4-14-10-14-16 0-6 4-11 10-14Z" fill="#6b6350"/>
      <path d="M266 96c14-1 30 3 40 12-10 8-26 10-40 7-6-2-8-6-8-10s3-8 8-9Z" fill="#7d7460"/>
      <!-- рога -->
      <path d="M244 82l4-20 10 17M228 84l-2-18 12 14" fill="#a2946d"/>
      <!-- око (затворено, отваря се при събуждане) -->
      <ellipse class="dr-eye" cx="252" cy="102" rx="6" ry="4" fill="#e0a24a" stroke="none"/>
      <path class="dr-lid" d="M245 101c5-4 11-4 15 0" fill="none" stroke="#221e17" stroke-width="3"/>
      <!-- ноздра и уста -->
      <circle cx="298" cy="104" r="2.2" fill="#221e17" stroke="none"/>
      <path d="M270 114c12 3 24 3 32-1" fill="none" stroke="#221e17" stroke-width="2.4"/>
      <!-- лапа -->
      <path d="M150 148c-6-12 2-22 14-22s20 10 14 22" fill="#6b6350"/>
      <path d="M155 148l2-10M164 148l1-11M173 148l-2-10" stroke="#332f25" stroke-width="2" fill="none"/>
    </g>
    <g class="dr-smoke" fill="rgba(200,190,175,.22)">
      <circle cx="314" cy="110" r="5"/><circle cx="310" cy="96" r="8"/>
    </g>
  </svg>`;
}
