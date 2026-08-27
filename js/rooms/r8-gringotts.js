/* ============================================================
   ЗАЛА VIII — Гринготс: ключалката със скъпоценни камъни
   ============================================================ */
import { head, $, $$, el, shakeEl, mountQuiz } from './common.js';
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
    'Отговори първо на трите въпроса на гоблина — той плаща за знание с знание и ти издава един от камъните даром.',
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
      <div id="goblin-quiz"></div>
      <div class="grid-2 tilt" id="vault-stage" hidden>
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

  mountQuiz($('#goblin-quiz'), {
    api, key: 'quiz',
    title: 'Гоблинът Грипкук иска да те провери',
    intro: 'Той не отваря трезори на непознати. Три въпроса — и ако ги издържиш, ще ти каже един от камъните даром.',
    doneText: 'Грипкук изсумтява доволно: „Третият камък е <b>топаз</b>. Останалите ще си ги изкараш сам.“',
    questions: [
      { q: 'Кое същество пази най-дълбоките трезори на „Гринготс“?',
        opts: [ { t: 'Сляп украински железокорем — дракон.', ok: true },
                { t: 'Тристав пес.', ok: false, r: 'Пухчо пази друго и на друго място.' },
                { t: 'Базилиск.', ok: false, r: 'Базилискът спи под училището, не под банката.' } ] },
      { q: 'Какво представлява „Клеймото на крадеца“?',
        opts: [ { t: 'Водопад, който отмива всяка магия и всяка маскировка.', ok: true },
                { t: 'Печат, който изгаря дланта на крадеца.', ok: false, r: 'Гоблините са по-изобретателни.' },
                { t: 'Заклинание, което заключва трезора завинаги.', ok: false, r: 'Не заключва — разсъблича.' } ] },
      { q: 'Какво пази съкровището в трезора на Лестрейндж от докосване?',
        opts: [ { t: 'Умножаващи и парещи заклинания.', ok: true },
                { t: 'Отровен газ.', ok: false, r: 'Гоблините не хабят отрова, когато магията стига.' },
                { t: 'Нищо — трезорът просто е дълбок.', ok: false, r: 'Ако беше така, Хари нямаше да излезе с изгорени ръце.' } ] },
    ],
    onDone: () => { const st = $('#vault-stage'); if (st) st.hidden = false; },
  });

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
  return `<figure class="dragon-photo">
    <img src="assets/dragon.jpg" alt="Драконът, който пази трезора" loading="lazy" decoding="async">
    <span class="dragon-eye"></span>
    <span class="dragon-smoke"><i></i><i></i><i></i></span>
  </figure>`;
}
