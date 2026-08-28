/* ============================================================
   ШЕСТА ЧАСТ · МЯСТО IX — Приори Инкантатем
   Осемте руни се събират в дума. После двете пръчки се
   свързват и от лъча излиза всичко, което е било направено —
   включително последното парче, което никой не търсеше.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { playerName } from '../state.js';
import { canvasLayer, curtain, revealPanel, wait, rnd } from './common6.js';

export const meta = {
  id: 'a6-priori',
  eyebrow: 'Място IX · край',
  title: 'Приори Инкантатем',
  sub: 'Двете пръчки се разпознават през целия двор и лъчът между тях застива. Каквото е било направено, се връща назад — едно по едно.',
  rune: null,
  bg: 'off',
  tint: '#e0d0a0',
  hints: [
    { text: 'Осемте руни са една дума. Тя не е заклинание — тя е <b>име на нещо</b>, което Слъгхорн изрече на глас в подправения спомен.',
      done: d => !!d.spelled },
    { text: 'Осем букви. Започва с Х и означава съд, в който се държи откъснато парче душа.',
      done: d => !!d.spelled },
    'Думата е ХОРКРУКС. А после лъчът ще ти покаже нещо, за което няма подсказка.',
  ],
};

const SPELL = 'ХОРКРУКС';
const CHOICES = [
  { t: 'Бия се. Дошъл съм дотук през седем места и няма да спра точно сега.',
    r: 'Пръчката ти се вдига сама — и лъчът поглъща и нея. Ако седмото парче е в теб, всеки удар по него е удар по теб.' },
  { t: 'Затварям ума си. Ако не го чувам, него го няма.',
    r: 'Оклумантиката пази от четене, не от съжителство. Стената, която вдигаш, го оставя вътре — просто вече не го чуваш.' },
  { t: 'Спускам пръчката и го оставям да си отиде.', ok: true },
];

let beam = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.slots) d.slots = Array(SPELL.length).fill(null);
  if (d.spelled == null) d.spelled = false;
  if (d.faced == null) d.faced = false;
  api.saveData();

  const runes = api.allRunes();

  root.innerHTML = `
    ${head(api)}

    <div class="panel priori-panel">
      <div class="priori-beam" id="priori-beam"></div>
      <div class="priori-in">
        <p class="panel-title">Осемте руни</p>
        <div class="spell-slots" id="slots"></div>
        <div class="rune-bank" id="bank"></div>
        <div class="flex flex-center mt">
          <button class="btn btn-house btn-sm" id="pr-say"><span>Изречи думата</span></button>
          <button class="btn btn-ghost btn-sm" id="pr-clear"><span>Изчисти</span></button>
        </div>
        <p class="center muted stage-help">Наредѝ ги в реда, в който ги събра.</p>
      </div>
    </div>

    <div class="panel" id="p-face" hidden>
      <p class="panel-title" id="face-title">Лъчът връща направеното</p>
      <div class="ghosts-out" id="ghosts-out"></div>
      <div id="face-body"></div>
    </div>`;

  drawSlots(api, runes);
  $('#pr-say').addEventListener('click', () => say(api));
  $('#pr-clear').addEventListener('click', () => {
    if (api.solved || api.data.spelled) return;
    api.data.slots = Array(SPELL.length).fill(null);
    api.saveData(); api.sfx.click(); drawSlots(api, runes);
  });

  if (d.spelled || api.solved) openFace(api, true);

  beam = canvasLayer($('#priori-beam'), (g, t, W, H) => {
    const y = H * 0.5;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= W; x += 10) {
        const k = x / W;
        g.lineTo(x, y + Math.sin(k * 14 + t * 3 + i) * (6 + i * 4) * Math.sin(k * Math.PI));
      }
      g.strokeStyle = `rgba(${230 - i * 12},${200 - i * 30},${110 + i * 20},${0.16 - i * 0.02})`;
      g.lineWidth = 10 - i * 1.6;
      g.stroke();
    }
    for (let i = 0; i < 22; i++) {
      const k = ((t * 0.24 + rnd(i * 3.7)) % 1);
      const x = k * W;
      g.fillStyle = `rgba(255,232,170,${(0.5 * Math.sin(k * Math.PI)).toFixed(3)})`;
      g.beginPath(); g.arc(x, y + Math.sin(k * 9 + t * 2 + i) * 14, 1 + rnd(i) * 2, 0, 7); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  });

  api.onLeave = () => { if (beam) { beam.stop(); beam = null; } };
}

/* ---------- думата ---------- */
function drawSlots(api, runes) {
  const d = api.data;
  const sl = $('#slots'), bk = $('#bank');
  if (!sl || !bk) return;
  const done = d.spelled || api.solved;
  sl.innerHTML = d.slots.map((v, i) =>
    `<button class="spell-slot${v == null ? '' : ' full'}" data-i="${i}">${v == null ? '' : runes[v]}</button>`).join('');
  bk.innerHTML = runes.map((r, i) =>
    `<button class="rune-tile${d.slots.includes(i) ? ' used' : ''}" data-i="${i}">${r}</button>`).join('');
  if (done) return;
  $$('.rune-tile', bk).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i;
    if (d.slots.includes(i)) return;
    const k = d.slots.indexOf(null);
    if (k < 0) return;
    d.slots[k] = i; api.saveData(); api.sfx.tick(); drawSlots(api, runes);
  }));
  $$('.spell-slot', sl).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i;
    if (d.slots[i] == null) return;
    d.slots[i] = null; api.saveData(); api.sfx.click(); drawSlots(api, runes);
  }));
}

function say(api) {
  const d = api.data;
  const runes = api.allRunes();
  if (api.solved || d.spelled) return;
  if (d.slots.some(v => v == null)) { api.sfx.bad(); api.toast('Има празно място.', 'bad'); return; }
  const word = d.slots.map(i => runes[i]).join('');
  if (word !== SPELL) {
    api.sfx.bad(); api.fx.shakeScreen(7, 320);
    api.fail(`«${word}» не значи нищо. Лъчът трепва и се стяга.`);
    return;
  }
  d.spelled = true; api.saveData();
  api.sfx.unlock();
  api.fx.flash('rgba(240,215,140,.3)', 900);
  drawSlots(api, runes);
  openFace(api, false);
}

/* ---------- изненадата: седмото парче ---------- */
async function openFace(api, silent) {
  const p = $('#p-face'); if (!p) return;
  if (silent) { p.hidden = false; p.classList.add('a6-reveal', 'on'); } else revealPanel(p);

  const out = $('#ghosts-out');
  const items = ['пръстенът', 'медальонът', 'чашата', 'диадемата', 'дневникът', 'змията'];
  if (out) {
    out.innerHTML = '';
    for (const [i, t] of items.entries()) {
      const s = document.createElement('span');
      s.className = 'gh-out';
      s.style.setProperty('--i', i);
      s.textContent = t;
      out.appendChild(s);
      if (!silent && !api.solved) { api.sfx.tick(); await wait(320); }
    }
    const me = document.createElement('span');
    me.className = 'gh-out me';
    me.textContent = (playerName() || 'ти').toLowerCase();
    out.appendChild(me);
    if (!silent && !api.solved) { api.sfx.rune(); api.fx.shakeScreen(10, 600); }
  }

  const body = $('#face-body');
  if (!body) return;
  if (api.solved) {
    body.innerHTML = `<p class="muted">Лъчът угасна. Останалото беше твое решение.</p>`;
    return;
  }
  body.innerHTML = `
    <p class="face-line">Шест неща излизат от лъча и се разпадат. Седмото не се разпада —
    защото не е <em>предмет</em>.</p>
    <p class="face-line">Стои зад очите ти от толкова отдавна, че си свикнал да го смяташ
    за собствения си глас. Змийският език. Сънищата, които не са твои. Онова, което
    винаги знаеше отговора малко преди теб.</p>
    <p class="face-q">Какво правиш със седмото парче, {име}?</p>
    <div class="opts" id="opts">
      ${CHOICES.map((c, i) => `<button class="opt" data-i="${i}">${c.t}</button>`).join('')}
    </div>`;
  const { personalizeDOM } = await import('../state.js');
  personalizeDOM(body);

  $$('#opts .opt').forEach(b => b.addEventListener('click', () => choose(api, +b.dataset.i, b)));
}

function choose(api, i, btn) {
  if (api.solved) return;
  const c = CHOICES[i];
  if (!c.ok) {
    btn.classList.add('wrong'); btn.disabled = true;
    api.sfx.bad(); api.fx.shakeScreen(8, 380);
    api.fail(c.r, 40000);
    return;
  }
  btn.classList.add('right');
  $$('#opts .opt').forEach(b => { b.disabled = true; });
  api.sfx.unlock();
  letGo(api);
}

function letGo(api) {
  curtain((layer, close) => {
    layer.innerHTML = `
      <div class="letgo">
        <div class="lg-figure"></div>
        <p class="lg-line">Спускаш пръчката.</p>
        <p class="lg-sub">Нищо не пада, нищо не гърми. Нещо в теб просто <b>става по-тихо</b> —
        както става тихо стая, от която е излязъл човек, за когото не си знаел, че е вътре.</p>
      </div>`;
    api.fx.flash('rgba(255,240,210,.4)', 1400);
    setTimeout(async () => {
      const l = layer.querySelector('.lg-sub');
      if (l) l.innerHTML = 'За пръв път, откакто часовникът удари полунощ в Хогуортс, в главата ти няма никого освен теб.';
      await wait(1800);
      close();
      api.fx.celebrate(2.4);
      api.solve('Седмото парче си отива, без да се сбогува. Нищо не остава на негово място — и точно това е краят.');
    }, 2200);
  }, { cls: 'letgo-curtain' });
}
