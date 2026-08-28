/* ============================================================
   ШЕСТА ЧАСТ · МЯСТО V — Змията
   Наджини не спи. Тя показва по кои пръстени ще мине —
   а мечът трябва да мине по същите, но отзад напред.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { canvasLayer, wait, rnd } from './common6.js';

export const meta = {
  id: 'a6-nagini',
  eyebrow: 'Място V',
  title: 'Змията',
  sub: 'Шест светещи пръстена по тялото ѝ. Тя ги подпалва един по един, за да ти каже откъде ще дойде — и очаква да си достатъчно бавен, за да ѝ повярваш.',
  rune: 'Р',
  bg: 'off',
  tint: '#7fd6a1',
  hints: [
    'Мечът никога не пада там, където змията вече е била. Удряй пръстените в <b>обратния</b> ред на светването — последният светнал е първият удар.',
    'Ако си объркал реда, натисни «Нека изсъска пак» — повторението не струва нищо освен време, а грешният удар струва повече.',
    'Три кръга: три, четири и пет пръстена. Гледай докрай, преди да посегнеш — мечът се вдига чак след като тя млъкне.',
  ],
};

/* фиксирани редици — една и съща змия при всяко зареждане */
const ROUNDS = [
  [2, 5, 0],
  [4, 1, 3, 5],
  [0, 3, 1, 4, 2],
];
const RING = [
  { x: 150, y: 300 }, { x: 250, y: 236 }, { x: 350, y: 300 },
  { x: 450, y: 236 }, { x: 550, y: 300 }, { x: 650, y: 236 },
];

let bgl = null, playing = false, token = 0;

export function mount(root, api) {
  const d = api.data;
  if (d.round == null) d.round = 0;
  if (d.seen == null) d.seen = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}

    <div class="panel">
      <p class="panel-title">Мечът на Грифиндор тежи повече, отколкото изглежда</p>
      <blockquote class="doors-rule">«Тя показва пътя си напред. Ти трябва да я срещнеш
      <b>отзад напред</b> — иначе ще удариш там, където вече я няма.»</blockquote>
    </div>

    <div class="panel snake-panel">
      <div class="snake-bg" id="snake-bg"></div>
      <div class="snake-in">
        <div class="snake-round" id="snake-round"></div>
        <div class="snake-stage">
          <svg viewBox="20 108 770 264" class="snake-svg" id="snake-svg" aria-hidden="true">
            <defs>
              <linearGradient id="skin" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stop-color="#3d7a52"/>
                <stop offset=".5" stop-color="#69b981"/>
                <stop offset="1" stop-color="#2f6440"/>
              </linearGradient>
            </defs>
            <path id="snake-body" d="M40 330Q100 250 150 300T250 236T350 300T450 236T550 300T650 236Q700 210 740 150"
                  fill="none" stroke="url(#skin)" stroke-width="52" stroke-linecap="round"/>
            <path d="M40 330Q100 250 150 300T250 236T350 300T450 236T550 300T650 236Q700 210 740 150"
                  fill="none" stroke="#cdeedb" stroke-width="3" opacity=".45"/>
            <g id="snake-head" class="snake-head">
              <path d="M726 168q30-24 52-6 18 15 2 34-20 22-48 6z" fill="#69b981" stroke="#cdeedb" stroke-width="2.4"/>
              <circle cx="748" cy="170" r="4.6" fill="#f0d060"/>
              <circle cx="762" cy="180" r="4.6" fill="#f0d060"/>
              <path d="M778 196l16 12-16 2 12 8" stroke="#e0625d" stroke-width="2.4" fill="none"/>
            </g>
            <g id="rings"></g>
          </svg>
        </div>
        <div class="snake-echo" id="snake-echo"></div>
        <div class="flex flex-center mt">
          <button class="btn btn-house btn-sm" id="sn-play"><span>Нека изсъска</span></button>
        </div>
        <p class="center muted stage-help">Гледай редицата, после удари пръстените в обратен ред.</p>
      </div>
    </div>`;

  drawRings(api);
  paintRound(api);
  $('#sn-play').addEventListener('click', () => play(api));
  bgl = canvasLayer($('#snake-bg'), (g, t, W, H) => {
    for (let i = 0; i < 26; i++) {
      const x = ((rnd(i * 4.1) + t * 0.008 * (1 + rnd(i))) % 1) * W;
      const y = rnd(i * 9.7) * H;
      g.fillStyle = `rgba(120,220,160,${(0.04 + rnd(i * 2.7) * 0.1).toFixed(3)})`;
      g.beginPath(); g.arc(x, y, 0.8 + rnd(i * 5.5) * 2, 0, 7); g.fill();
    }
  });

  api.onLeave = () => { token++; playing = false; if (bgl) { bgl.stop(); bgl = null; } };
}

function drawRings(api) {
  const g = $('#rings'); if (!g) return;
  g.innerHTML = RING.map((r, i) => `
    <g class="ring" data-i="${i}">
      <ellipse cx="${r.x}" cy="${r.y}" rx="30" ry="30" fill="rgba(12,28,18,.82)"
               stroke="#bff0d2" stroke-width="3"/>
      <text x="${r.x}" y="${r.y + 7}" text-anchor="middle" font-size="21"
            fill="#cdeedb" font-family="Cinzel, serif">${i + 1}</text>
    </g>`).join('');
  $$('#rings .ring').forEach(el => el.addEventListener('click', () => strike(api, +el.dataset.i)));
}

function paintRound(api) {
  const d = api.data;
  const el = $('#snake-round');
  const done = api.solved || d.round >= ROUNDS.length;
  if (el) el.innerHTML = done
    ? '<b class="good">Мечът мина и трите пъти.</b>'
    : `кръг <b>${d.round + 1}</b> от ${ROUNDS.length} · пръстени в редицата: <b>${ROUNDS[d.round].length}</b>`;
  const b = $('#sn-play');
  if (b) {
    b.disabled = !!done;
    b.querySelector('span').textContent = d.seen ? 'Нека изсъска пак' : 'Нека изсъска';
  }
  echo(api, null);
}

function echo(api, arr) {
  const el = $('#snake-echo'); if (!el) return;
  const d = api.data;
  if (api.solved || d.round >= ROUNDS.length) { el.innerHTML = ''; return; }
  const need = ROUNDS[d.round].length;
  const got = arr || [];
  el.innerHTML = Array.from({ length: need }, (_, i) =>
    `<i class="ec${got[i] != null ? ' on' : ''}">${got[i] != null ? got[i] + 1 : '·'}</i>`).join('');
}

let answer = [];

async function play(api) {
  const d = api.data;
  if (playing || api.solved || d.round >= ROUNDS.length) return;
  playing = true; answer = []; echo(api, []);
  const me = ++token;
  const seq = ROUNDS[d.round];
  $('#sn-play').disabled = true;
  $('#snake-svg').classList.add('hissing');
  for (const i of seq) {
    if (me !== token) { playing = false; return; }
    lightRing(i, true);
    api.sfx.tick();
    await wait(520);
    lightRing(i, false);
    await wait(190);
  }
  if (me !== token) { playing = false; return; }
  $('#snake-svg').classList.remove('hissing');
  $('#snake-svg').classList.add('ready');
  d.seen = true; api.saveData();
  $('#sn-play').disabled = false;
  $('#sn-play').querySelector('span').textContent = 'Нека изсъска пак';
  playing = false;
}

function lightRing(i, on) {
  const el = document.querySelector(`#rings .ring[data-i="${i}"]`);
  if (el) el.classList.toggle('lit', on);
}

async function strike(api, i) {
  const d = api.data;
  if (playing || api.solved || d.round >= ROUNDS.length) return;
  if (!d.seen) { api.sfx.bad(); api.toast('Първо я остави да покаже редицата.', 'bad'); return; }

  const want = [...ROUNDS[d.round]].reverse();
  const k = answer.length;
  const el = document.querySelector(`#rings .ring[data-i="${i}"]`);
  if (i !== want[k]) {
    answer = [];
    echo(api, []);
    api.sfx.bad();
    if (el) { el.classList.add('miss'); setTimeout(() => el.classList.remove('miss'), 500); }
    bite(api);
    api.fail('Мечът минава през въздуха. Наджини вече е другаде.');
    return;
  }
  answer.push(i);
  echo(api, answer);
  api.sfx.chime();
  if (el) { el.classList.add('cut'); setTimeout(() => el.classList.remove('cut'), 600); }

  if (answer.length === want.length) {
    d.round++; d.seen = false; api.saveData();
    answer = [];
    api.fx.flash('rgba(140,230,170,.18)', 500);
    if (d.round >= ROUNDS.length) return finish(api);
    api.toast(`Кръг ${d.round} от ${ROUNDS.length}. Тя се навива наново.`, 'good');
    paintRound(api);
  }
}

function bite(api) {
  const svg = $('#snake-svg'); if (!svg) return;
  svg.classList.add('bite');
  api.fx.shakeScreen(10, 420);
  setTimeout(() => svg.classList.remove('bite'), 620);
}

async function finish(api) {
  paintRound(api);
  const svg = $('#snake-svg');
  if (svg) { svg.classList.remove('ready'); svg.classList.add('fall'); }
  api.sfx.unlock();
  api.fx.shakeScreen(14, 900);
  api.fx.flash('rgba(230,120,120,.25)', 900);
  await wait(1200);
  api.fx.celebrate(1.6);
  api.solve('Главата пада преди тялото да е разбрало. От разсечения пръстен изпада нещо твърдо, което не е нито кост, нито люспа — руна.');
}
