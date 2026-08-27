/* ============================================================
   ЗАЛА II — Голямата зала: класирането на домовете и пясъчните часовници
   ============================================================ */
import { head, $, $$, el, shakeEl, mountQuiz } from './common.js';
import { crestSVG, HOUSES, hourglassSVG } from '../art.js';
import { IMG, photo } from '../config.js';

export const meta = {
  id: 'greathall',
  eyebrow: 'Зала II',
  title: 'Голямата зала',
  sub: 'Четири пясъчни часовника броят точките на домовете. Тази нощ те са замръзнали — и няма да пуснат никого, докато не бъдат подредени правилно.',
  rune: 'Р',
  bg: 'candles',
  tint: '#e0b45a',
  hints: [
    { text: 'Всеки дом си има свой призрак: Почтибезглавият Ник е на Грифиндор, Сивата дама — на Рейвънклоу, Дебелият монах — на Хафълпаф, Кървавият барон — на Слидерин.',
      done: d => !!d.ranked },
    { text: 'Призраците са ключът: Дебелият монах е на Хафълпаф, Сивата дама — на Рейвънклоу, Почтибезглавият Ник — на Грифиндор, а Кървавият барон — на Слидерин.',
      done: d => !!d.ranked },
    { text: 'От бележките: Хафълпаф е последен, а Сивата дама не е нито втора, нито трета — значи Рейвънклоу води.',
      done: d => !!d.ranked },
    'Подредбата е Рейвънклоу, Грифиндор, Слидерин, Хафълпаф. Кодът се чете по реда Грифиндор → Слидерин → Рейвънклоу → Хафълпаф, като се взема цифрата на стотиците: 3-2-4-1.',
  ],
};

const ORDER = ['ravenclaw', 'gryffindor', 'slytherin', 'hufflepuff']; // 1-во … 4-то
const POINTS = [482, 376, 291, 155];
const CODE = '3241'; // стотици на Гр, Сл, Ре, Ха

export function mount(root, api) {
  const d = api.data;
  if (!d.slots) d.slots = [null, null, null, null];
  if (d.ranked == null) d.ranked = false;
  if (!d.dials) d.dials = [0, 0, 0, 0];
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel hall-panel">
      ${photo(IMG.candles, 0.13)}
      <div id="ghost-quiz"></div>
      <div class="grid-2 tilt" id="hall-stage" hidden>
        <div>
          <p class="panel-title">Бележките на професор Макгонагъл</p>
          <div class="parchment">
            <h4>Класиране за нощта на печата</h4>
            <ul class="clue-list">
              <li>Домът на <b>Дебелия монах</b> е на последно място.</li>
              <li><b>Сивата дама</b> не е нито втора, нито трета.</li>
              <li><b>Почтибезглавият Ник</b> стои точно едно място над <b>Кървавия барон</b>.</li>
              <li>Домът на <b>Годрик</b> не води класирането.</li>
            </ul>
            <p style="font-size:.95rem">Пясъкът в часовниците пази точките: <b>482</b>, <b>376</b>, <b>291</b> и <b>155</b> —
            в низходящ ред, според мястото.</p>
          </div>
          <div class="hall-tray" id="tray"></div>
          <p class="center muted" style="font-size:.88rem;margin-top:10px">
            Избери дом, после докосни мястото му. Повторно докосване го връща обратно.</p>
        </div>
        <div>
          <p class="panel-title">Пясъчните часовници</p>
          <div class="podiums" id="podiums"></div>
          <div class="center mt"><button class="btn btn-house" id="check-rank"><span>Заключи класирането</span></button></div>
          <div id="lock-host"></div>
        </div>
      </div>
    </div>`;

  mountQuiz($('#ghost-quiz'), {
    api, key: 'quiz',
    title: 'Четиримата призраци на замъка',
    intro: 'Четири прозрачни фигури висят над катедрата и не пускат никого до часовниците, докато не ги назовеш по дом.',
    doneText: 'Призраците се разстъпват. Часовниците са твои.',
    questions: [
      { q: 'Кой призрак пази масата на <b>Хафълпаф</b>?',
        opts: [ { t: 'Дебелият монах', ok: true },
                { t: 'Кървавият барон', ok: false, r: 'Баронът е верен на друг дом — и на друга история.' },
                { t: 'Сивата дама', ok: false, r: 'Тя е дъщеря на една от основателките.' } ] },
      { q: 'Кой призрак витае над масата на <b>Слидерин</b>?',
        opts: [ { t: 'Кървавият барон', ok: true },
                { t: 'Почтибезглавият Ник', ok: false, r: 'Ник си е грифиндорец до последния сантиметър врат.' },
                { t: 'Плаксивата Миртъл', ok: false, r: 'Миртъл има собствена тоалетна, не маса.' } ] },
      { q: 'Как е истинското име на <b>Сивата дама</b>?',
        opts: [ { t: 'Хелена Рейвънклоу', ok: true },
                { t: 'Ровена Рейвънклоу', ok: false, r: 'Това е майка ѝ — основателката.' },
                { t: 'Хелга Хафълпаф', ok: false, r: 'Хелга е друга основателка.' } ] },
    ],
    onDone: () => { const st = $('#hall-stage'); if (st) st.hidden = false; },
  });

  renderTray(api);
  renderPodiums(api);
  $('#check-rank').addEventListener('click', () => checkRank(api));

  if (api.solved || api.data.ranked) { lockRanking(api, true); }
  if (api.solved) { renderLock(api, true); }
}

let picked = null;

function renderTray(api) {
  const tray = $('#tray');
  tray.innerHTML = '';
  Object.keys(HOUSES).forEach(h => {
    if (api.data.slots.includes(h)) return;
    const t = el('button', 'house-token', `<div class="ht-crest">${crestSVG(h)}</div><span>${HOUSES[h].name}</span>`);
    t.addEventListener('click', () => {
      if (api.data.ranked) return;
      api.sfx.click();
      picked = picked === h ? null : h;
      $$('.house-token').forEach(x => x.classList.remove('picked'));
      if (picked) t.classList.add('picked');
    });
    tray.appendChild(t);
  });
  if (!tray.children.length) tray.innerHTML = '<p class="muted center" style="width:100%">Всички домове са по местата си.</p>';
}

function renderPodiums(api) {
  const box = $('#podiums');
  box.innerHTML = '';
  const roman = ['I', 'II', 'III', 'IV'];
  for (let i = 0; i < 4; i++) {
    const h = api.data.slots[i];
    const info = h ? HOUSES[h] : null;
    const p = el('div', 'podium' + (h ? ' filled' : ''));
    p.innerHTML = `
      <div class="podium-rank">${roman[i]}</div>
      <div class="podium-glass">${hourglassSVG(info ? info.color : '#4a4335', 0.35 + (3 - i) * 0.18)}</div>
      <div class="podium-name">${info ? info.name : '— празно —'}</div>
      <div class="podium-pts">${api.data.ranked && h ? POINTS[i] + ' точки' : '??? точки'}</div>`;
    p.addEventListener('click', () => {
      if (api.data.ranked) return;
      const d = api.data;
      if (d.slots[i]) { d.slots[i] = null; api.saveData(); api.sfx.click(); renderTray(api); renderPodiums(api); return; }
      if (!picked) { api.toast('Първо избери дом от таблата долу.', ''); return; }
      d.slots[i] = picked; picked = null; api.saveData();
      api.sfx.chime();
      renderTray(api); renderPodiums(api);
      api.fx.sparksFrom(p, { count: 12, color: '#ffe9a8', spread: 90 });
    });
    box.appendChild(p);
  }
}

function checkRank(api) {
  const d = api.data;
  if (d.slots.some(x => !x)) { api.toast('Всички четири места трябва да са заети.', ''); return; }
  const ok = d.slots.every((h, i) => h === ORDER[i]);
  if (!ok) {
    api.sfx.bad();
    $$('.podium').forEach(shakeEl);
    api.fx.shakeScreen(7, 380);
    api.fail('Пясъкът се разбунтува и се изсипва обратно. Класирането не е вярно.');
    return;
  }
  d.ranked = true; api.saveData();
  api.sfx.unlock();
  api.fx.flash('rgba(217,180,91,.25)', 600);
  lockRanking(api, false);
  renderPodiums(api);
  renderLock(api, false);
  api.toast('Пясъкът потича! Часовниците разкриват точките си.', 'ok');
}

function lockRanking(api, silent) {
  $$('.podium').forEach(p => p.classList.add('locked'));
  const b = $('#check-rank');
  if (b) { b.disabled = true; b.querySelector('span').textContent = 'Класирането е заключено'; }
  const tray = $('#tray'); if (tray) tray.style.opacity = '.35';
  if (!silent) $$('.podium').forEach((p, i) => setTimeout(() => api.fx.sparksFrom(p, { count: 16, color: '#ffd98a' }), i * 140));
}

/* ---------- ключалката с четирите циферблата ---------- */
function renderLock(api, already) {
  const host = $('#lock-host');
  host.innerHTML = `
    <div class="rune-lock">
      <p class="panel-title">Ключалката на катедрата</p>
      <p class="muted center" style="font-size:.92rem;margin:-6px 0 14px">
        Четири колелца. Всяко иска <b>цифрата на стотиците</b> от точките на един дом —
        в реда <b>Грифиндор → Слидерин → Рейвънклоу → Хафълпаф</b>.</p>
      <div class="dials" id="dials"></div>
      <div class="center mt"><button class="btn btn-primary" id="dial-go"><span>Завърти ключа</span></button></div>
    </div>`;
  const labels = ['ГР', 'СЛ', 'РЕ', 'ХА'];
  const dials = $('#dials');
  api.data.dials.forEach((v, i) => {
    const dd = el('div', 'dial');
    dd.innerHTML = `<button class="dial-arrow up">▲</button>
      <div class="dial-window"><span class="dial-num">${v}</span></div>
      <button class="dial-arrow down">▼</button>
      <div class="dial-label">${labels[i]}</div>`;
    dd.querySelector('.up').addEventListener('click', () => spin(api, i, 1, dd));
    dd.querySelector('.down').addEventListener('click', () => spin(api, i, -1, dd));
    dials.appendChild(dd);
  });
  $('#dial-go').addEventListener('click', () => {
    const guess = api.data.dials.join('');
    if (guess === CODE) {
      api.sfx.unlock();
      api.fx.sparksFrom($('.rune-lock'), { count: 50, color: '#ffe9a8', spread: 280 });
      api.fx.flash('rgba(255,225,150,.3)', 700);
      $('#dial-go').disabled = true;
      api.solve('Ключалката поддава. Над Голямата зала свещите се изправят като войници.');
    } else {
      api.sfx.bad();
      shakeEl($('.dials'));
      api.fail('Колелцата се завъртат обратно с недоволно щракане.');
    }
  });
  if (already) { $('#dial-go').disabled = true; }
}

function spin(api, i, dir, node) {
  const d = api.data;
  d.dials[i] = (d.dials[i] + dir + 10) % 10;
  api.saveData();
  const num = node.querySelector('.dial-num');
  num.textContent = d.dials[i];
  num.style.animation = 'none'; void num.offsetWidth;
  num.style.animation = `dialSpin${dir > 0 ? 'Up' : 'Down'} .28s`;
  api.sfx.click();
}
