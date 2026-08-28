/* ============================================================
   ШЕСТА ЧАСТ · МЯСТО II — Пещерата
   Медальонът лежи на дъното на каменен басейн с осем дози
   отрова. Магията пуска само този, който я раздели поравно.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { canvasLayer, revealPanel, tween, wait, rnd } from './common6.js';

export const meta = {
  id: 'a6-cave',
  eyebrow: 'Място II',
  title: 'Пещерата',
  sub: 'Черно езеро под скалата и остров с каменен басейн. Отварата не се изчерпва, не се излива и не изчезва — може само да се мести.',
  rune: 'О',
  bg: 'off',
  tint: '#5fb0a8',
  hints: [
    { text: 'Нищо не се разлива и нищо не се долива: осемте дози само се местят между басейна и двете чаши. Наливаш, докато <b>или източникът се изпразни, или приемникът се напълни</b> — нищо по средата.',
      done: d => !!d.split },
    { text: 'Малката чаша е <b>мярка за три</b>. Пълни я и я връщай, докато в голямата остане количество, което не се дели на пет — оттам нататък числата сами се подреждат.',
      done: d => !!d.split },
    'Седем преливания: басейн→голяма (5), голяма→малка (3), малка→басейн (3), голяма→малка (2), басейн→голяма (5), голяма→малка (1), малка→басейн (3). Остават 4 и 4.',
  ],
};

/* проверено с изчерпателно търсене: от 16-те достижими състояния
   само (4,4,0) дели осемте дози поравно — и се стига за 7 преливания */
const CAP = [8, 5, 3];
const NAMES = ['басейнът', 'голямата чаша', 'малката чаша'];
const SHORT = ['басейн', 'голяма', 'малка'];
const MIN_POURS = 7;

let lake = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.v) { d.v = [8, 0, 0]; d.pours = 0; d.log = []; }
  if (d.sel == null) d.sel = null;
  if (d.split == null) d.split = false;
  if (d.drunk == null) d.drunk = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}

    <div class="panel">
      <p class="panel-title">Издълбано в ръба на басейна</p>
      <blockquote class="doors-rule">«Отварата не може да бъде премахната, а само изпита.
      Медальонът се вдига пред онзи, който я раздели <b>на две равни части</b> — а няма
      с какво да мери освен две чаши: за <b>пет</b> и за <b>три</b>.»</blockquote>
    </div>

    <div class="panel cave-panel">
      <div class="cave-lake" id="cave-lake"></div>
      <div class="cave-in">
        <div class="vessels" id="vessels"></div>
        <div class="cave-status" id="cave-status"></div>
        <div class="flex flex-center mt">
          <button class="btn btn-ghost btn-sm" id="cv-undo"><span>Върни преливане</span></button>
          <button class="btn btn-ghost btn-sm" id="cv-reset"><span>Отначало</span></button>
        </div>
        <p class="center muted stage-help">Кликни съда, от който наливаш, после този, в който наливаш.
        Спира се само на пълно или на празно.</p>
      </div>
    </div>

    <div class="panel" id="p-drink" hidden>
      <p class="panel-title">Четири и четири</p>
      <p>Двете половини стоят една до друга и не мърдат. Медальонът се вижда на дъното —
      но ръката ти минава през отварата само ако тя вече не е цяла.</p>
      <div class="flex flex-center mt">
        <button class="btn btn-house" id="cv-take"><span>Бръкни за медальона</span></button>
      </div>
    </div>`;

  draw(api);
  $('#cv-undo').addEventListener('click', () => undo(api));
  $('#cv-reset').addEventListener('click', () => {
    if (api.solved || api.data.split) return;
    api.data.v = [8, 0, 0]; api.data.pours = 0; api.data.log = []; api.data.sel = null;
    api.saveData(); api.sfx.click(); draw(api);
  });
  if (d.split || api.solved) openDrink(api, true);

  lake = makeLake($('#cave-lake'));
  api.onLeave = () => { if (lake) { lake.stop(); lake = null; } };
}

/* ---------- съдовете ---------- */
function draw(api) {
  const d = api.data;
  const box = $('#vessels'); if (!box) return;
  const done = d.split || api.solved;
  box.innerHTML = CAP.map((c, i) => {
    const v = d.v[i], pct = Math.round(v / c * 100);
    return `<button class="vessel v${i}${d.sel === i ? ' sel' : ''}${done ? ' locked' : ''}" data-i="${i}">
      <span class="vs-glass" style="--pct:${pct}%">
        <i class="vs-fill"></i>
        <em class="vs-num">${v}</em>
      </span>
      <span class="vs-name">${NAMES[i]}</span>
      <span class="vs-cap">побира ${c}</span>
    </button>`;
  }).join('');
  if (!done) $$('.vessel', box).forEach(b => b.addEventListener('click', () => tap(api, +b.dataset.i)));

  const st = $('#cave-status');
  if (st) st.innerHTML = done
    ? '<b class="good">Осемте дози стоят на две равни части.</b>'
    : `преливания: <b>${d.pours}</b> · ${d.log.length ? 'последно: ' + d.log[d.log.length - 1] : 'още не си пипал нищо'}`;
}

function tap(api, i) {
  const d = api.data;
  if (api.solved || d.split) return;
  if (d.sel == null) {
    if (!d.v[i]) { api.sfx.bad(); api.toast('Този съд е празен.', 'bad'); return; }
    d.sel = i; api.saveData(); api.sfx.tick(); draw(api); return;
  }
  if (d.sel === i) { d.sel = null; api.saveData(); api.sfx.click(); draw(api); return; }
  pour(api, d.sel, i);
}

function pour(api, from, to) {
  const d = api.data;
  const m = Math.min(d.v[from], CAP[to] - d.v[to]);
  if (!m) {
    api.sfx.bad(); d.sel = null; api.saveData(); draw(api);
    api.toast('Няма какво да се прелее натам.', 'bad'); return;
  }
  d.v[from] -= m; d.v[to] += m;
  d.pours++; d.sel = null;
  d.log.push(`${SHORT[from]} → ${SHORT[to]} · ${m}`);
  api.saveData();
  api.sfx.tick();
  draw(api);
  if (lake) lake.splash(m);

  const s = [...d.v].sort();
  if (s[0] === 0 && s[1] === 4 && s[2] === 4) {
    d.split = true; api.saveData();
    api.sfx.chime();
    api.fx.flash('rgba(110,220,205,.22)', 800);
    draw(api);
    openDrink(api, false);
  }
}

function undo(api) {
  const d = api.data;
  if (api.solved || d.split || !d.log.length) return;
  /* по-просто и по-честно е да превъртим отначало без последния ход */
  const log = d.log.slice(0, -1);
  d.v = [8, 0, 0]; d.pours = 0; d.log = []; d.sel = null;
  log.forEach(line => {
    const [a, rest] = line.split(' → ');
    const to = SHORT.indexOf(rest.split(' · ')[0]);
    const from = SHORT.indexOf(a);
    const m = Math.min(d.v[from], CAP[to] - d.v[to]);
    d.v[from] -= m; d.v[to] += m; d.pours++;
    d.log.push(`${SHORT[from]} → ${SHORT[to]} · ${m}`);
  });
  api.saveData(); api.sfx.click(); draw(api);
}

/* ---------- медальонът ---------- */
function openDrink(api, silent) {
  const p = $('#p-drink'); if (!p) return;
  if (silent) { p.hidden = false; p.classList.add('a6-reveal', 'on'); } else revealPanel(p);
  const b = $('#cv-take');
  if (!b) return;
  if (api.solved) { b.disabled = true; b.querySelector('span').textContent = 'Медальонът е у теб'; return; }
  b.addEventListener('click', async () => {
    if (api.data.drunk) return;
    api.data.drunk = true; api.saveData();
    b.disabled = true;
    api.sfx.bad();
    if (lake) lake.rise();
    api.fx.shakeScreen(12, 1400);
    api.toast('Водата зад теб се раздвижва. Ръцете излизат една след друга.', 'bad');
    await wait(1700);
    api.sfx.unlock();
    api.fx.flash('rgba(140,240,220,.3)', 900);
    api.fx.celebrate(1.6);
    api.solve('Инферите се дръпват от огъня и потъват обратно. Медальонът виси на веригата си, а под капачето му, вместо портрет, стои руна.');
  });
}

/* ---------- черното езеро ---------- */
function makeLake(host) {
  const hands = [];      // изплували ръце
  let splash = 0;
  const layer = canvasLayer(host, (g, t, W, H) => {
    const base = H * 0.84;   /* езерото е ивица най-долу, а не фон под текста */
    /* вода */
    g.save();
    const grd = g.createLinearGradient(0, base - 40, 0, H);
    grd.addColorStop(0, 'rgba(10,30,34,.9)');
    grd.addColorStop(1, 'rgba(4,10,14,1)');
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const y = base + Math.sin((x / W) * 7 + t * 0.9) * 4 + Math.sin(x * 0.03 - t * 1.7) * 2.5 * (1 + splash);
      g.lineTo(x, y);
    }
    g.lineTo(W, H); g.closePath(); g.fill();
    /* зелено сияние от басейна */
    const gl = g.createRadialGradient(W / 2, base - 10, 4, W / 2, base - 10, W * 0.42);
    gl.addColorStop(0, `rgba(90,230,200,${0.16 + 0.05 * Math.sin(t * 1.4)})`);
    gl.addColorStop(1, 'rgba(90,230,200,0)');
    g.fillStyle = gl; g.fillRect(0, 0, W, H);
    /* ръцете на инферите — китка, длан и пет пръста, а не гребло */
    hands.forEach(hd => {
      const k = Math.min(1, (t - hd.t0) / hd.dur);
      if (k <= 0) return;
      const y = base + 16 - k * hd.h;
      g.save();
      g.translate(hd.x * W, y);
      g.globalAlpha = 0.22 + k * 0.5;
      g.strokeStyle = 'rgba(196,220,218,.92)';
      g.lineCap = 'round'; g.lineJoin = 'round';
      /* предмишница */
      g.lineWidth = 3.4;
      g.beginPath(); g.moveTo(0, hd.h * 0.95); g.lineTo(0, 1); g.stroke();
      /* длан */
      g.lineWidth = 5.6;
      g.beginPath(); g.moveTo(0, 1); g.lineTo(0, -4); g.stroke();
      /* пръсти: различна дължина, палецът стои настрани */
      g.lineWidth = 2.2;
      const len = [7, 10.5, 11.5, 10, 7.5];
      for (let f = 0; f < 5; f++) {
        const sp = (f - 2) * 0.34 + Math.sin(t * 2.2 + f + hd.p) * 0.05;
        const L = len[f];
        g.beginPath();
        g.moveTo((f - 2) * 1.5, -4);
        g.lineTo((f - 2) * 1.5 + Math.sin(sp) * L, -4 - Math.cos(sp) * L);
        g.stroke();
      }
      g.restore();
    });
    splash *= 0.94;
  });

  return {
    stop: layer.stop,
    splash(m) {
      splash = Math.min(1.4, splash + m * 0.22);
      /* всяко преливане вдига по една ръка — езерото брои заедно с теб */
      if (hands.length < 9) {
        const i = hands.length;
        hands.push({ x: 0.08 + rnd(i * 4.7) * 0.84, h: 20 + rnd(i * 8.1) * 26,
                     t0: layer.now(), dur: 1.2, p: rnd(i) * 6 });
      }
    },
    rise() {
      for (let i = hands.length; i < 22; i++) {
        hands.push({ x: 0.03 + rnd(i * 3.3) * 0.94, h: 34 + rnd(i * 6.9) * 46,
                     t0: layer.now() + rnd(i * 2.2) * 0.7, dur: 0.9, p: rnd(i) * 6 });
      }
      host.classList.add('rising');
    },
  };
}
