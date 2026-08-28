/* ============================================================
   ШЕСТА ЧАСТ · МЯСТО VIII — Кингс Крос
   Гара, която е бяла и празна, и знае за теб повече,
   отколкото ти самият си казвал на някого.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { S, playerName, playerHouse, hintsUsed, remainingMs } from '../state.js';
import { HOUSES } from '../art.js';
import { revealPanel, wait } from './common6.js';

export const meta = {
  id: 'a6-kingscross',
  eyebrow: 'Място VIII',
  title: 'Кингс Крос',
  sub: 'Гара без сенки, без хора и без тавана, който би трябвало да има. Табелата над перона щрака и се готви да изпише нещо.',
  rune: 'С',
  bg: 'off',
  tint: '#f0f4ff',
  hints: [
    { text: 'Табелата не иска отговор — само те гледа. Пусни я да се превърти докрай.',
      done: d => !!d.boarded },
    'Петте изречения говорят <b>за самите себе си</b>. Пробвай двете възможности за първото и виж коя не се самоизяжда: ако «точно две са верни» е вярно, преброй колко излизат — и ще видиш, че не са две.',
    'Отсъждането е: <b>лъжа · истина · истина · истина · лъжа</b>. Три верни, точно както казва второто.',
  ],
};

/* ---- проверено изчерпателно: единствената непротиворечива
        отсъдба на петте самоописателни изречения          ---- */
const CLAIMS = [
  'Точно две от тези пет изречения са верни.',
  'Точно три от тези пет изречения са верни.',
  'Верните изречения са повече от лъжливите.',
  'Точно едно от изречения 1 и 2 е вярно.',
  'Изречения 3 и 5 са с еднаква истинност.',
];
const TRUTH = [false, true, true, true, false];

const FLAP = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ0123456789· ';

export function mount(root, api) {
  const d = api.data;
  if (!d.mark) d.mark = [null, null, null, null, null];
  if (d.boarded == null) d.boarded = false;
  api.saveData();

  const name = (playerName() || 'ПЪТНИК').toUpperCase();
  const house = HOUSES[playerHouse()] || null;
  const rooms = Object.keys(S.solved || {}).length;
  const mist = S.mistakes || 0;
  const hnt = hintsUsed();
  const left = Math.round(remainingMs() / 60000);

  root.innerHTML = `
    ${head(api)}

    <div class="panel kx-panel">
      <p class="panel-title">Табелата над перон девет и три четвърти</p>
      <div class="flapboard" id="flapboard"></div>
      <p class="center muted stage-help">Никой не ти го е казвал. Гарата просто го знае.</p>
    </div>

    <div class="panel">
      <p class="panel-title">На пейката лежи лист, написан с твоя почерк</p>
      <p class="muted">Пет изречения. Всяко говори само за тези пет изречения и за нищо друго.
      Отсъди всяко поотделно — само едно отсъждане не си противоречи.</p>
      <div class="claims" id="claims"></div>
      <div class="flex flex-center mt">
        <button class="btn btn-house btn-sm" id="kx-go"><span>Отсъди</span></button>
        <button class="btn btn-ghost btn-sm" id="kx-clear"><span>Изчисти</span></button>
      </div>
    </div>

    <div class="panel" id="p-train" hidden>
      <p class="panel-title">Влакът пристига без звук</p>
      <p>Листът се разпада на светлина. Влакът стои с отворени врати и чака точно колкото трябва.
      Под пейката нещо диша тежко — и ти вече знаеш какво е, {име}.</p>
      <div class="flex flex-center mt">
        <button class="btn btn-house" id="kx-back"><span>Върни се обратно</span></button>
      </div>
    </div>`;

  const rows = [
    ['ПЪТНИК', name],
    ['ДОМ', house ? house.name.toUpperCase() : 'НЕИЗВЕСТЕН'],
    ['ПРЕМИНАТИ МЕСТА', String(rooms)],
    ['ГРЕШКИ', String(mist)],
    ['ПОДСКАЗКИ', String(hnt)],
    ['ОСТАВАЩО ВРЕМЕ', left + ' МИН'],
    ['ПЕРОН', '9 3/4'],
  ];
  flapboard($('#flapboard'), rows, api);

  drawClaims(api);
  $('#kx-go').addEventListener('click', () => judge(api));
  $('#kx-clear').addEventListener('click', () => {
    if (api.solved || api.data.boarded) return;
    api.data.mark = [null, null, null, null, null];
    api.saveData(); api.sfx.click(); drawClaims(api);
  });
  if (d.boarded || api.solved) openTrain(api, true);

  document.body.classList.add('kx-white');
  api.onLeave = () => document.body.classList.remove('kx-white');
}

/* ---------- сплит-флап табелата ---------- */
function flapboard(host, rows, api) {
  if (!host) return;
  host.innerHTML = rows.map(([k, v]) => `
    <div class="fb-row">
      <span class="fb-key">${k}</span>
      <span class="fb-val" data-v="${v}">${[...v].map(() =>
        '<i class="fb-c">·</i>').join('')}</span>
    </div>`).join('');

  const vals = $$('.fb-val', host);
  vals.forEach((el, r) => {
    const target = el.dataset.v;
    [...el.querySelectorAll('.fb-c')].forEach((c, i) => {
      const want = target[i];
      let n = 0;
      const spins = 6 + ((i * 3 + r * 5) % 7);
      const tick = () => {
        if (!c.isConnected) return;
        if (n >= spins) { c.textContent = want; c.classList.add('set'); return; }
        c.textContent = FLAP[(n * 7 + i * 3 + r) % FLAP.length];
        c.classList.add('spin');
        setTimeout(() => c.classList.remove('spin'), 60);
        n++;
        setTimeout(tick, 55);
      };
      setTimeout(tick, 260 + r * 190 + i * 34);
    });
  });
  setTimeout(() => { if (host.isConnected) api.sfx.page(); }, 500);
}

/* ---------- петте изречения ---------- */
function drawClaims(api) {
  const d = api.data;
  const box = $('#claims'); if (!box) return;
  const done = d.boarded || api.solved;
  box.innerHTML = CLAIMS.map((t, i) => `
    <div class="claim${d.mark[i] ? ' marked' : ''}${done ? ' locked' : ''}">
      <span class="cl-n">${i + 1}</span>
      <span class="cl-t">${t}</span>
      <span class="cl-pick">
        <button class="sp${d.mark[i] === 'в' ? ' on' : ''}" data-i="${i}" data-v="в">вярно</button>
        <button class="sp${d.mark[i] === 'л' ? ' on' : ''}" data-i="${i}" data-v="л">лъжливо</button>
      </span>
    </div>`).join('');
  if (!done) $$('.sp', box).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i;
    api.data.mark[i] = api.data.mark[i] === b.dataset.v ? null : b.dataset.v;
    api.saveData(); api.sfx.tick(); drawClaims(api);
  }));
}

function judge(api) {
  const d = api.data;
  if (api.solved || d.boarded) return;
  if (d.mark.some(m => !m)) { api.sfx.bad(); api.toast('Отсъди и петте.', 'bad'); return; }
  const got = d.mark.map(m => m === 'в');
  if (got.some((v, i) => v !== TRUTH[i])) {
    api.sfx.bad(); api.fx.shakeScreen(6, 300);
    const n = got.filter((v, i) => v === TRUTH[i]).length;
    api.fail(`Листът се пренаписва сам. ${n} от 5 съвпадат — но той иска и петте наведнъж.`);
    return;
  }
  d.boarded = true; api.saveData();
  api.sfx.chime();
  api.fx.flash('rgba(255,255,255,.5)', 900);
  drawClaims(api);
  openTrain(api, false);
}

function openTrain(api, silent) {
  const p = $('#p-train'); if (!p) return;
  if (silent) { p.hidden = false; p.classList.add('a6-reveal', 'on'); } else revealPanel(p);
  const b = $('#kx-back'); if (!b) return;
  if (api.solved) { b.disabled = true; b.querySelector('span').textContent = 'Върна се'; return; }
  b.addEventListener('click', async () => {
    b.disabled = true;
    api.sfx.unlock();
    api.fx.flash('rgba(255,255,255,.65)', 1100);
    await wait(900);
    api.fx.celebrate(1.5);
    api.solve('Обръщаш гръб на влака и белотата се пука като лед. Последното, което виждаш на перона, е руна — изписана с тебешир, ниско долу, там където пише човек, който е клечал.');
  });
}
