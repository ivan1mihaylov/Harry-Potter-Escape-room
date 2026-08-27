/* ============================================================
   ЗАЛА VI — Защита срещу Черните изкуства: дуел с богърта
   ============================================================ */
import { head, $, $$, el, norm, shakeEl, shuffle, mountQuiz } from './common.js';

export const meta = {
  id: 'dada',
  eyebrow: 'Зала VI',
  title: 'Кабинетът по Защита',
  sub: 'Гардеробът в ъгъла трепери. Вътре има богърт, който вече е научил осемте неща, от които се страхуваш, {име}. Имаш пръчка, три сърца и много малко време.',
  rune: 'М',
  bg: 'dim',
  tint: '#c86a6a',
  hints: [
    { text: 'Заклинанията в дясната колона са точно колкото трябват плюс няколко примамки. Прочети опасността и си спомни какво прави всяко заклинание.',
      done: d => (d.wave || 0) >= 4 },
    { text: 'Тъмнина → Люмос. Ключалка → Алохомора. Насочена пръчка → Експелиармус. Счупено стъкло → Окулус Репаро.',
      done: d => (d.wave || 0) >= 4 },
    'Дяволска примка → Инсендио. Летящо заклинание → Протего. Диментор → Експекто Патронум. Богърт → Ридикулус.',
  ],
};

const WAVES = [
  { kind: 'dark',    text: 'Свещите изгасват. Тъмнината е толкова гъста, че не виждаш собствената си ръка.', spell: 'ЛЮМОС', time: 15000 },
  { kind: 'door',    text: 'Тежка врата се захлопва зад гърба ти. Бравата щраква три пъти.', spell: 'АЛОХОМОРА', time: 14000 },
  { kind: 'duel',    text: 'Фигура в маска вдига пръчката си право срещу теб.', spell: 'ЕКСПЕЛИАРМУС', time: 13000 },
  { kind: 'glass',   text: 'Очилата ти се пръсват на парчета. Светът се разми до петна.', spell: 'ОКУЛУСРЕПАРО', time: 12000, show: 'Окулус Репаро' },
  { kind: 'vines',   text: 'Дяволска примка се увива около глезена ти и стяга колкото повече се дърпаш.', spell: 'ИНСЕНДИО', time: 11000 },
  { kind: 'bolt',    text: 'Зелен лъч лети право към лицето ти. Няма време да отскочиш.', spell: 'ПРОТЕГО', time: 10000 },
  { kind: 'dementor',text: 'Стъклата побеляват от скреж. Нещо в качулка се спуска и радостта изтича от теб.', spell: 'ЕКСПЕКТОПАТРОНУМ', time: 9500, show: 'Експекто Патронум' },
  { kind: 'boggart', text: 'Богъртът най-сетне приема формата на най-големия ти страх и се усмихва.', spell: 'РИДИКУЛУС', time: 9000 },
];

const BANK = [
  'Люмос', 'Алохомора', 'Експелиармус', 'Окулус Репаро', 'Инсендио', 'Протего',
  'Експекто Патронум', 'Ридикулус', 'Акцио', 'Импедимента', 'Агуаменти', 'Хоменум Ревелио',
  'Петрификус Тоталус', 'Обливиате',
];

let loopId = null, deadline = 0, lives = 3, active = false;

export function mount(root, api) {
  const d = api.data;
  if (d.wave == null) d.wave = 0;
  api.saveData();
  lives = 3;

  root.innerHTML = `
    ${head(api)}
    <div class="panel duel-panel">
      <div class="grid-2 tilt">
        <div>
          <div class="wardrobe" id="wardrobe">
            <div class="wardrobe-inner" id="threat"></div>
            <div class="wardrobe-doors"><i class="wd-l"></i><i class="wd-r"></i></div>
          </div>
          <div class="duel-hud">
            <div class="lives" id="lives"></div>
            <div class="wave-count" id="wavec"></div>
          </div>
          <div class="cast-timer"><div id="cast-bar"></div></div>
          <p class="threat-text" id="threat-text">Гардеробът трепери…</p>
          <div class="answer-bar" style="margin-top:12px">
            <input class="rune-input wand-input" id="cast" autocomplete="off" spellcheck="false"
                   placeholder="ИЗРЕЧИ ЗАКЛИНАНИЕ" disabled>
            <button class="btn btn-house" id="cast-go"><span>Замахни</span></button>
          </div>
          <div class="center mt"><button class="btn btn-primary" id="start-duel"><span>Отвори гардероба</span></button></div>
        </div>
        <div>
          <p class="panel-title">Списък със заклинания от учебника</p>
          <div class="spell-bank" id="bank"></div>
          <p class="muted" style="font-size:.88rem">Не всички са ти нужни. Пиши заклинанието и натисни <b>Enter</b>.
          Малки и главни букви нямат значение.</p>
        </div>
      </div>
    </div>`;

  const bank = $('#bank');
  shuffle(BANK, 41).forEach(s => {
    const b = el('button', 'bank-item', s);
    b.addEventListener('click', () => {
      const i = $('#cast');
      if (i.disabled) return;
      i.value = s; i.focus(); api.sfx.click();
    });
    bank.appendChild(b);
  });

  renderHud(api);
  $('#start-duel').addEventListener('click', () => startDuel(api));
  $('#cast-go').addEventListener('click', () => cast(api));
  $('#cast').addEventListener('keydown', e => { if (e.key === 'Enter') cast(api); });

  if (api.solved) {
    $('#start-duel').disabled = true;
    $('#threat-text').textContent = 'Гардеробът мълчи. Богъртът е заключен вътре, унизен и смалèн.';
    $('#threat').innerHTML = threatSVG('boggart', true);
    $('#wardrobe').classList.add('open', 'won');
  } else if (d.wave > 0) {
    $('#start-duel').querySelector('span').textContent = `Продължи от вълна ${d.wave + 1}`;
  }

  api.onLeave = () => { cancelAnimationFrame(loopId); active = false; };
}

function renderHud(api) {
  const l = $('#lives');
  if (l) l.innerHTML = Array.from({ length: 3 }, (_, i) =>
    `<span class="life${i < lives ? '' : ' gone'}">♥</span>`).join('');
  const w = $('#wavec');
  if (w) w.textContent = `Вълна ${Math.min(api.data.wave + 1, WAVES.length)} / ${WAVES.length}`;
}

function startDuel(api) {
  active = true;
  $('#start-duel').disabled = true;
  $('#wardrobe').classList.add('open');
  api.sfx.door();
  const i = $('#cast'); i.disabled = false; i.value = ''; i.focus();
  nextWave(api);
}

function nextWave(api) {
  const d = api.data;
  if (d.wave >= WAVES.length) return finish(api);
  const w = WAVES[d.wave];
  $('#threat').innerHTML = threatSVG(w.kind);
  $('#threat-text').innerHTML = w.text;
  renderHud(api);
  api.sfx.whoosh();
  deadline = performance.now() + w.time;
  cancelAnimationFrame(loopId);
  tickBar(api, w.time);
  const i = $('#cast'); i.value = ''; i.focus();
}

function tickBar(api, total) {
  const bar = $('#cast-bar');
  if (!bar || !active) return;
  const left = deadline - performance.now();
  const p = Math.max(0, left / total);
  bar.style.width = (p * 100) + '%';
  bar.style.background = p > .5 ? 'linear-gradient(90deg,#7fd6a1,#d9b45b)'
    : p > .25 ? 'linear-gradient(90deg,#d9b45b,#e0a24a)' : 'linear-gradient(90deg,#e0625d,#ff9d99)';
  if (left <= 0) { miss(api, 'Закъсня. Заклинанието умря на върха на пръчката ти.'); return; }
  loopId = requestAnimationFrame(() => tickBar(api, total));
}

function cast(api) {
  if (!active) return;
  const d = api.data;
  const inp = $('#cast');
  const val = norm(inp.value);
  if (!val) return;
  const w = WAVES[d.wave];
  if (val === w.spell) {
    cancelAnimationFrame(loopId);
    api.sfx.spell();
    bolt(api);
    api.fx.flash('rgba(255,240,200,.16)', 300);
    d.wave++; api.saveData();
    inp.value = '';
    $('#threat').classList.add('struck');
    setTimeout(() => {
      $('#threat').classList.remove('struck');
      if (d.wave >= WAVES.length) finish(api); else nextWave(api);
    }, 700);
  } else {
    api.sfx.bad();
    shakeEl(inp);
    inp.value = '';
    miss(api, 'Грешно заклинание. Пръчката ти изплюва искри и нищо повече.');
  }
}

function miss(api, msg) {
  cancelAnimationFrame(loopId);
  lives--;
  renderHud(api);
  api.fx.shakeScreen(11, 480);
  api.fx.flash('rgba(200,60,60,.2)', 400);
  if (lives <= 0) {
    active = false;
    $('#cast').disabled = true;
    $('#wardrobe').classList.remove('open');
    api.data.wave = 0; api.saveData();
    renderHud(api);
    $('#start-duel').disabled = false;
    $('#start-duel').querySelector('span').textContent = 'Изправи се отново';
    api.fail('Богъртът те повали. Гардеробът се затръшва — дуелът започва отначало.', 60000);
    $('#threat-text').textContent = 'Дишаш тежко. Гардеробът трепери отново.';
    $('#cast-bar').style.width = '0%';
  } else {
    api.toast(msg + ` Остават ти ${lives} ${lives === 1 ? 'сърце' : 'сърца'}.`, 'bad');
    const w = WAVES[api.data.wave];
    deadline = performance.now() + w.time * 0.8;
    tickBar(api, w.time * 0.8);
    $('#cast').focus();
  }
}

function bolt(api) {
  const from = $('#cast').getBoundingClientRect();
  const to = $('#threat').getBoundingClientRect();
  const b = document.createElement('div');
  b.className = 'spell-bolt';
  b.style.left = (from.left + from.width / 2) + 'px';
  b.style.top = (from.top + from.height / 2) + 'px';
  b.style.setProperty('--bx', (to.left + to.width / 2 - from.left - from.width / 2) + 'px');
  b.style.setProperty('--by', (to.top + to.height / 2 - from.top - from.height / 2) + 'px');
  document.getElementById('spell-layer').appendChild(b);
  setTimeout(() => { api.fx.sparks(to.left + to.width / 2, to.top + to.height / 2, { count: 30, color: '#ffe9a8', spread: 200 }); b.remove(); }, 420);
}

function finish(api) {
  active = false;
  cancelAnimationFrame(loopId);
  $('#cast').disabled = true;
  $('#cast-bar').style.width = '0%';
  $('#threat').innerHTML = threatSVG('boggart', true);
  $('#wardrobe').classList.add('won');
  const sd = $('#start-duel'); if (sd) sd.style.display = 'none';
  $('#threat-text').textContent = 'Богъртът се пръсва на облак от смях и изчезва обратно в гардероба.';
  api.sfx.unlock();
  api.fx.celebrate(1.5);
  setTimeout(() => askLast(api), 700);
}

/* последната стъпка: защо изобщо това проработи */
function askLast(api) {
  const host = document.createElement('div');
  host.className = 'mt';
  $('#threat-text').after(host);
  mountQuiz(host, {
    api, key: 'lastq',
    title: 'Люпин пита от портрета',
    doneText: 'Портретът кимва. Дръжката на гардероба щраква.',
    questions: [
      { q: 'Какво всъщност унищожава богърта?',
        opts: [ { t: 'Смехът.', ok: true },
                { t: 'Силата на заклинанието.', ok: false, r: 'Богъртът не се плаши от сила. Плаши се от нещо друго.' },
                { t: 'Тъмнината в гардероба.', ok: false, r: 'Тъмнината е неговият дом, не негов враг.' } ] },
      { q: 'Защо срещу богърт е по-добре да си в група?',
        opts: [ { t: 'Защото се обърква на кого да се яви.', ok: true },
                { t: 'Защото няколко заклинания са по-силни от едно.', ok: false, r: 'Не е въпрос на сила.' },
                { t: 'Защото някой трябва да държи гардероба.', ok: false, r: 'Гардеробът се справя сам.' } ] },
    ],
    onDone: () => setTimeout(() => api.solve('Осем страха, осем заклинания. Върху дръжката на гардероба е издълбана руна.'), 500),
  });
}

/* ---------- силуетите на заплахите ---------- */
function threatSVG(kind, funny = false) {
  const S = (inner, cls = '') => `<svg viewBox="0 0 200 200" class="threat-svg ${cls}">${inner}</svg>`;
  switch (kind) {
    case 'dark': return S(`<circle cx="100" cy="100" r="78" fill="#0a0810"/>
      <circle cx="82" cy="92" r="6" fill="#e0625d"><animate attributeName="opacity" values="1;.2;1" dur="1.6s" repeatCount="indefinite"/></circle>
      <circle cx="118" cy="92" r="6" fill="#e0625d"><animate attributeName="opacity" values="1;.2;1" dur="1.6s" begin=".2s" repeatCount="indefinite"/></circle>`);
    case 'door': return S(`<rect x="52" y="26" width="96" height="150" rx="8" fill="#3a2b1c" stroke="#6b5233" stroke-width="4"/>
      <circle cx="130" cy="104" r="8" fill="#d9b45b"/>
      <rect x="66" y="44" width="30" height="46" rx="3" fill="#241a10"/><rect x="104" y="44" width="30" height="46" rx="3" fill="#241a10"/>
      <path d="M120 96h34v18h-34z" fill="#8a6a2a"><animate attributeName="x" values="120;126;120" dur=".7s" repeatCount="indefinite"/></path>`);
    case 'duel': return S(`<g fill="#191722" stroke="#4a4358" stroke-width="3">
      <circle cx="100" cy="62" r="26"/><path d="M74 96h52l16 78H58l16-78Z"/></g>
      <path d="M124 96 176 44" stroke="#d9b45b" stroke-width="5" stroke-linecap="round"/>
      <circle cx="178" cy="42" r="7" fill="#ffe9a8"><animate attributeName="r" values="5;11;5" dur=".8s" repeatCount="indefinite"/></circle>
      <path d="M88 58h10M102 58h10" stroke="#e0625d" stroke-width="4"/>`);
    case 'glass': return S(`<g fill="none" stroke="#cfe0ee" stroke-width="5">
      <circle cx="66" cy="104" r="30"/><circle cx="134" cy="104" r="30"/><path d="M96 104h8M36 96 16 82M164 96l20-14"/></g>
      <path d="M50 88 84 120M84 88 50 120M118 88l32 32M150 88l-32 32" stroke="#8fb6cc" stroke-width="2.5"/>`);
    case 'vines': return S(`<g fill="none" stroke="#2f6b3a" stroke-width="7" stroke-linecap="round">
      <path d="M30 190c20-40 4-70 30-96s60-4 74-34"><animate attributeName="stroke-width" values="7;10;7" dur="1.4s" repeatCount="indefinite"/></path>
      <path d="M170 190c-24-34-6-66-34-92s-58-6-70-38"/></g>
      <g fill="#3f8a4a"><ellipse cx="72" cy="96" rx="13" ry="7" transform="rotate(-30 72 96)"/>
      <ellipse cx="126" cy="76" rx="13" ry="7" transform="rotate(20 126 76)"/>
      <ellipse cx="96" cy="140" rx="13" ry="7" transform="rotate(-10 96 140)"/></g>`);
    case 'bolt': return S(`<path d="M180 40 40 160" stroke="#4ce07a" stroke-width="9" stroke-linecap="round">
      <animate attributeName="stroke-width" values="6;14;6" dur=".45s" repeatCount="indefinite"/></path>
      <circle cx="40" cy="160" r="16" fill="#8ef0b0" opacity=".8"><animate attributeName="r" values="10;24;10" dur=".45s" repeatCount="indefinite"/></circle>`);
    case 'dementor': return S(`<g>
      <path d="M100 22c34 0 54 26 54 60 0 44-14 70-54 96-40-26-54-52-54-96 0-34 20-60 54-60Z" fill="#12111a" stroke="#2c2a3d" stroke-width="3"/>
      <path d="M100 46c22 0 34 18 34 40s-14 32-34 32-34-10-34-32 12-40 34-40Z" fill="#05050a"/>
      <path d="M62 96c-16 22-28 26-40 24M138 96c16 22 28 26 40 24" stroke="#2c2a3d" stroke-width="5" fill="none" stroke-linecap="round">
      <animate attributeName="opacity" values=".5;1;.5" dur="2s" repeatCount="indefinite"/></path></g>`);
    case 'boggart': default:
      return funny
        ? S(`<g><ellipse cx="100" cy="120" rx="58" ry="52" fill="#c86a9a"/>
            <circle cx="80" cy="106" r="9" fill="#fff"/><circle cx="120" cy="106" r="9" fill="#fff"/>
            <circle cx="82" cy="108" r="4" fill="#241"/><circle cx="122" cy="108" r="4" fill="#241"/>
            <path d="M76 140c14 14 34 14 48 0" stroke="#5a2340" stroke-width="5" fill="none" stroke-linecap="round"/>
            <circle cx="100" cy="60" r="16" fill="#e0625d"/><path d="M100 76v14" stroke="#e0625d" stroke-width="5"/>
            <animateTransform attributeName="transform" type="rotate" values="-6 100 120;6 100 120;-6 100 120" dur="1.2s" repeatCount="indefinite"/></g>`, 'funny')
        : S(`<g><path d="M100 24c40 0 66 30 66 70s-26 82-66 82-66-42-66-82 26-70 66-70Z" fill="#1b1826">
            <animate attributeName="d" dur="2.6s" repeatCount="indefinite"
              values="M100 24c40 0 66 30 66 70s-26 82-66 82-66-42-66-82 26-70 66-70Z;
                      M100 30c46 0 60 38 60 74s-20 72-60 72-60-36-60-72 14-74 60-74Z;
                      M100 24c40 0 66 30 66 70s-26 82-66 82-66-42-66-82 26-70 66-70Z"/></path>
            <circle cx="80" cy="92" r="8" fill="#e0625d"/><circle cx="122" cy="92" r="8" fill="#e0625d"/>
            <path d="M74 128c16 18 38 18 54 0" stroke="#e0625d" stroke-width="4" fill="none"/></g>`);
  }
}
