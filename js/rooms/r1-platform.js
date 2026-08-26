/* ============================================================
   ЗАЛА I — Перон 9¾ (бариерата и тухлената стена)
   ============================================================ */
import { head, $, $$, el, shakeEl } from './common.js';
import { IMG, photo } from '../config.js';

export const meta = {
  id: 'platform',
  eyebrow: 'Зала I',
  title: 'Перон 9¾',
  sub: 'Гара Кингс Крос, 23:58. Влакът за Хогуортс още диша пара някъде оттатък тухлите — трябва само да намериш пролуката.',
  rune: 'О',
  bg: 'dim',
  tint: '#c9a34a',
  hints: [
    'Перонът на магьосниците не е нито девети, нито десети. Той е между тях — потърси колоната, а не табелата.',
    'Даровете на Смъртта са три: Бъзовата пръчка, Възкресяващият камък и Мантията невидимка. Пухчо има три глави.',
    'Тухлата е три реда НАД тухлата над кошчето и две тухли НАДЯСНО от нея. Броенето започва от самата тухла над кошчето — тя е нула.',
  ],
};

const COLS = 9, ROWS = 7, BIN_COL = 1, BIN_ROW = 6;
const TARGET = { r: BIN_ROW - 3, c: BIN_COL + 2 };

export function mount(root, api) {
  const d = api.data;
  if (d.stage == null) d.stage = 0;   // 0 = бариера, 1 = стена
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel platform-panel">
      ${photo(IMG.stoneWall, 0.10)}
      <div id="stage-host"></div>
    </div>`;

  if (api.solved) { renderOpen(api, true); return; }
  d.stage === 0 ? renderBarrier(api) : renderWall(api);
}

/* ---------- Етап 1: коя бариера? ---------- */
function renderBarrier(api) {
  const host = $('#stage-host');
  host.innerHTML = `
    <p class="panel-title">Табло за заминаващите</p>
    <p class="center muted" style="max-width:640px;margin:0 auto 18px">
      Влакът тръгва в полунощ, но перонът му го няма в разписанието.
      <b>„Нито девети, нито десети — а между тях.“</b> Докосни мястото, което не е перон.
    </p>
    <div class="platform-row" id="prow"></div>
    <p class="center muted mt" style="font-size:.9rem">Колоните между пероните изглеждат съвсем обикновени. Една от тях не е.</p>`;

  const row = $('#prow');
  const items = [
    { t: 'sign', n: 7 }, { t: 'col', id: 'c78' },
    { t: 'sign', n: 8 }, { t: 'col', id: 'c89' },
    { t: 'sign', n: 9 }, { t: 'col', id: 'c910', target: true },
    { t: 'sign', n: 10 }, { t: 'col', id: 'c1011' },
    { t: 'sign', n: 11 },
  ];

  items.forEach(it => {
    if (it.t === 'sign') {
      const s = el('div', 'platform-sign', `<span>PLATFORM</span><b>${it.n}</b>`);
      s.addEventListener('click', () => {
        api.sfx.click();
        shakeEl(s);
        api.toast(`Перон ${it.n} е съвсем обикновен. Мъгълски. Скучен.`, '');
      });
      row.appendChild(s);
    } else {
      const c = el('div', 'platform-col' + (it.target ? ' is-target' : ''), `<i></i><i></i><i></i>`);
      c.addEventListener('click', (e) => {
        if (it.target) {
          api.sfx.whoosh();
          api.fx.sparksFrom(c, { count: 40, color: '#ffe9a8', spread: 240 });
          api.fx.shockwaveFrom(c);
          c.classList.add('opening');
          api.toast('Ръката ти потъва в камъка. Барие­рата е мека като мъгла…', 'magic');
          setTimeout(() => {
            const d = api.data; d.stage = 1; api.saveData();
            renderWall(api);
          }, 1100);
        } else {
          api.sfx.bad();
          shakeEl(c);
          api.fx.shakeScreen(4, 250);
          api.toast('Тъп удар в студен камък. Не е тази.', 'bad');
        }
      });
      row.appendChild(c);
    }
  });
}

/* ---------- Етап 2: тухлената стена ---------- */
function renderWall(api) {
  const host = $('#stage-host');
  host.innerHTML = `
    <p class="panel-title">Тухлената стена зад бариерата</p>
    <div class="grid-2 tilt">
      <div>
        <div class="parchment">
          <h4>Бележка, забодена с игла на камъка</h4>
          <p>„Влезеш ли, потропай по <b>една-единствена</b> тухла. Тръгни от онази точно
          <b>над кошчето</b> — тя е нулевата. После:“</p>
          <ul class="clue-list">
            <li>Нагоре — толкова тухли, колкото са <b>Даровете на Смъртта</b>.</li>
            <li>Надясно — толкова тухли, колкото са <b>главите на Пухчо, минус една</b>.</li>
          </ul>
          <p class="muted" style="font-size:.92rem">Ако сбъркаш — стената ще те посипе с прах и ще ти отнеме време.</p>
        </div>
      </div>
      <div>
        <div class="brickwall" id="bw"></div>
        <div class="bin-row"><div class="bin" id="bin">${binSVG()}</div><span class="bin-label">кошчето</span></div>
      </div>
    </div>`;

  const wall = $('#bw');
  wall.style.setProperty('--cols', COLS);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const b = el('button', 'brick');
      b.dataset.r = r; b.dataset.c = c;
      if (r === BIN_ROW && c === BIN_COL) b.classList.add('anchor');
      b.addEventListener('click', () => tapBrick(api, b, r, c, wall));
      wall.appendChild(b);
    }
  }
  const bin = $('#bin');
  bin.style.marginLeft = `calc((100% / ${COLS}) * ${BIN_COL})`;
}

function tapBrick(api, b, r, c, wall) {
  if (r === TARGET.r && c === TARGET.c) {
    api.sfx.unlock();
    b.classList.add('hit');
    api.fx.sparksFrom(b, { count: 46, color: '#ffd98a', spread: 300 });
    api.fx.shockwaveFrom(b);
    api.fx.flash('rgba(255,220,150,.28)', 600);
    // тухлите се разтварят на арка
    $$('.brick', wall).forEach(x => {
      const dx = (+x.dataset.c - c), dy = (+x.dataset.r - r);
      const dist = Math.hypot(dx, dy);
      x.style.transitionDelay = (dist * 55) + 'ms';
      x.style.transform = `translate(${dx * 34}px, ${dy * 26}px) rotate(${dx * 9}deg) scale(.2)`;
      x.style.opacity = '0';
    });
    setTimeout(() => renderOpen(api, false), 1300);
  } else {
    api.sfx.bad();
    b.classList.add('dusty');
    setTimeout(() => b.classList.remove('dusty'), 700);
    api.fx.shakeScreen(5, 260);
    api.fail('Кухо тупкане и облак прах. Не е тази тухла.');
  }
}

/* ---------- отворената арка ---------- */
function renderOpen(api, already) {
  const host = $('#stage-host');
  host.innerHTML = `
    <div class="archway">
      <div class="arch-glow"></div>
      ${trainSVG()}
      <div class="steam"><i></i><i></i><i></i><i></i><i></i></div>
    </div>
    <p class="center" style="margin-top:18px;font-size:1.1rem">
      Стената се разтваря в арка. Оттатък свисти аленочервен локомотив,
      а върху перона, изписана със сажди, стои първата ти руна.
    </p>`;
  if (!already) api.solve('Перонът е твой. Влакът те чака — но замъкът е още по-нетърпелив.');
}

/* ---------- дребна графика ---------- */
function binSVG() {
  return `<svg viewBox="0 0 60 70">
    <path d="M12 18h36l-4 46a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4L12 18Z" fill="#33302b" stroke="#6b6558" stroke-width="2"/>
    <rect x="8" y="12" width="44" height="7" rx="3" fill="#4a463e" stroke="#6b6558" stroke-width="1.6"/>
    <path d="M22 26v34M30 26v34M38 26v34" stroke="#5a554a" stroke-width="2"/>
  </svg>`;
}

function trainSVG() {
  return `<svg viewBox="0 0 420 180" class="train">
    <defs><linearGradient id="tr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b8332a"/><stop offset="1" stop-color="#63130f"/></linearGradient></defs>
    <g>
      <rect x="150" y="60" width="230" height="62" rx="8" fill="url(#tr)" stroke="#2b0a08" stroke-width="2"/>
      <rect x="60" y="40" width="100" height="82" rx="10" fill="url(#tr)" stroke="#2b0a08" stroke-width="2"/>
      <rect x="76" y="16" width="26" height="30" rx="4" fill="#2f2c2a" stroke="#151312" stroke-width="2"/>
      <rect x="76" y="56" width="30" height="26" rx="4" fill="#f6d98a" opacity=".85"/>
      <g fill="#f6d98a" opacity=".8">
        <rect x="170" y="74" width="26" height="24" rx="3"/><rect x="212" y="74" width="26" height="24" rx="3"/>
        <rect x="254" y="74" width="26" height="24" rx="3"/><rect x="296" y="74" width="26" height="24" rx="3"/>
        <rect x="338" y="74" width="26" height="24" rx="3"/>
      </g>
      <rect x="40" y="122" width="350" height="9" rx="4" fill="#241f1c"/>
      <g fill="#1b1817" stroke="#463f39" stroke-width="2">
        <circle cx="90" cy="140" r="15"/><circle cx="140" cy="140" r="11"/>
        <circle cx="210" cy="140" r="11"/><circle cx="270" cy="140" r="11"/><circle cx="340" cy="140" r="11"/>
      </g>
      <text x="265" y="52" text-anchor="middle" font-family="Cinzel, serif" font-size="15" fill="#f0d79a" letter-spacing="2">HOGWARTS EXPRESS</text>
    </g>
  </svg>`;
}
