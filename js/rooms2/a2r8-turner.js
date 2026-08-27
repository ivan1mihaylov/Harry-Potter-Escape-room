/* ============================================================
   ВТОРА ЧАСТ · ЗАЛА VIII — Хроноворотът
   Тук зърната пясък от предишните зали най-после влизат в употреба.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';

export const meta = {
  id: 'a2-turner',
  eyebrow: 'Зала VIII',
  title: 'Хроноворотът',
  sub: 'Помещение без врата, в средата — часовник колкото човек. Основателите са го въртели веднъж на сто години. Ти ще го завъртиш тази нощ.',
  rune: 'Е',
  grain: null,
  bg: 'dim',
  tint: '#e0c07a',
  hints: [
    'Пясъкът показва само по едно зърно наведнъж. Отвориш ли друго, предишното се затваря и зърната се разместват — но разместването е бавно и можеш да проследиш с поглед кое къде отива.',
    'Годината се чете и без зърна: последната битка за Хогуортс, втори май. Ако помниш книгата, помниш и годината.',
    'Годината е <b>1998</b>. След това дръпни веригата точно <b>три</b> пъти — толкова, колкото Хърмаяни завъртя своя хроноворот, за да спаси Бъкбийк.',
  ],
};

const YEAR = [1, 9, 9, 8];
const TURNS = 3;
const SOURCES = ['Обсерваторията на времето', 'Рицарската задача', 'Хлъзгавият под', 'Воалът'];

let stage = null, rings = [], glass = null, spinT = 0;

export function mount(root, api) {
  const d = api.data;
  if (!d.dials) d.dials = [0, 0, 0, 0];
  if (d.yearSet == null) d.yearSet = false;
  if (d.turns == null) d.turns = 0;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Гравирано по обръча</h4>
            <p>„Върни ме до годината, в която замъкът кървя за последен път.“</p>
            <p style="font-size:.94rem">Ако не помниш годината — зърната пясък я помнят.
            Четирите цифри идват от:</p>
            <ol class="grain-src">${SOURCES.map(s => `<li>${s}</li>`).join('')}</ol>
          </div>
          <div class="grain-memory">
            <p class="gm-head">Седемте зърна лежат с лицето надолу. Пясъкът разкрива само едно —
            отвориш ли следващото, предишното се затваря и зърната се разбъркват.
            <b>Запомняй.</b></p>
            <div class="gm-board" id="gm-board"></div>
            <div class="gm-note" id="gm-note">докосни зърно, за да го обърнеш</div>
          </div>
          <div class="dials big" id="dials"></div>
          <div class="center mt" id="turner-ctl"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Пясъкът се събира…</div></div>
      </div>
    </div>`;

  renderGrains(api);
  renderDials(api);
  renderCtl(api);
  boot(api);
  api.onLeave = () => {
    if (stage) { stage.dispose(); stage = null; }
    rings = []; glass = null;
    deck = []; openCard = null; gmBusy = false;
  };
}

let deck = [], openCard = null, gmBusy = false;

function renderGrains(api) {
  const board = $('#gm-board');
  if (!board) return;
  const g = api.allGrains ? api.allGrains() : {};
  deck = Object.entries(g).map(([room, digit]) => ({ room, digit, need: SOURCES.indexOf(room) }));
  if (!deck.length) {
    board.innerHTML = '<p class="gm-empty">Още нямаш зърна пясък.</p>';
    return;
  }
  deck = shuffleOnce(deck, 41);
  board.innerHTML = '';
  deck.forEach(card => board.appendChild(makeCard(api, card)));
}

function makeCard(api, card) {
  const b = el('button', 'gm-card');
  b._card = card;
  b.innerHTML = `<span class="gm-inner">
      <span class="gm-back"><i></i></span>
      <span class="gm-face">
        <b>${card.digit}</b>
        <small>${card.room}</small>
        ${card.need >= 0 ? `<i class="gm-badge">${card.need + 1}</i>` : ''}
      </span>
    </span>`;
  b.addEventListener('click', () => tapCard(api, b));
  return b;
}

function tapCard(api, node) {
  if (gmBusy) return;
  const board = $('#gm-board');

  // затваряне на същото зърно
  if (openCard === node) {
    node.classList.remove('open');
    openCard = null;
    setNote('докосни зърно, за да го обърнеш');
    api.sfx.page();
    return;
  }

  // първото отваряне — без разбъркване
  if (!openCard) {
    node.classList.add('open');
    openCard = node;
    setNote('запомни го — щом отвориш друго, зърната ще се разместят');
    api.sfx.chime();
    return;
  }

  // затваряме предишното, разбъркваме, после отваряме избраното
  gmBusy = true;
  const target = node;
  openCard.classList.remove('open');
  openCard = null;
  api.sfx.page();
  setNote('пясъкът разбърква зърната…');

  setTimeout(() => {
    shuffleBoard(board, () => {
      target.classList.add('open');
      openCard = target;
      gmBusy = false;
      api.sfx.chime();
      setNote('запомни го — щом отвориш друго, зърната ще се разместят');
    });
  }, 420);
}

function setNote(t) { const n = $('#gm-note'); if (n) n.textContent = t; }

/* разместване, което може да се проследи с поглед (техниката FLIP) */
function shuffleBoard(board, done) {
  const els = [...board.children];
  if (els.length < 2) { done(); return; }
  const first = els.map(e => e.getBoundingClientRect());

  const order = [...els];
  const swaps = Math.min(3, Math.floor(order.length / 2));
  for (let k = 0; k < swaps; k++) {
    const i = Math.floor(Math.random() * order.length);
    let j = Math.floor(Math.random() * order.length);
    if (i === j) j = (j + 1) % order.length;
    [order[i], order[j]] = [order[j], order[i]];
  }
  order.forEach(e => board.appendChild(e));
  deck = order.map(e => e._card);

  const last = els.map(e => e.getBoundingClientRect());
  els.forEach((e, i) => {
    const dx = first[i].left - last[i].left, dy = first[i].top - last[i].top;
    if (!dx && !dy) return;
    e.style.transition = 'none';
    e.style.transform = `translate(${dx}px,${dy}px)`;
    e.style.zIndex = '6';
  });

  requestAnimationFrame(() => requestAnimationFrame(() => {
    els.forEach(e => {
      e.style.transition = 'transform 1.15s cubic-bezier(.35,.05,.2,1)';
      e.style.transform = 'translate(0,0)';
    });
    setTimeout(() => {
      els.forEach(e => { e.style.transition = ''; e.style.transform = ''; e.style.zIndex = ''; });
      done();
    }, 1220);
  }));
}

/* еднократно разбъркване с постоянно семе — подредбата е една и съща при презареждане */
function shuffleOnce(arr, seed) {
  const a = [...arr];
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderDials(api) {
  const box = $('#dials');
  box.innerHTML = '';
  api.data.dials.forEach((v, i) => {
    const d = el('div', 'dial');
    d.innerHTML = `<button class="dial-arrow up">▲</button>
      <div class="dial-window"><span class="dial-num">${v}</span></div>
      <button class="dial-arrow down">▼</button>
      <div class="dial-label">${i + 1}</div>`;
    d.querySelector('.up').addEventListener('click', () => spin(api, i, 1, d));
    d.querySelector('.down').addEventListener('click', () => spin(api, i, -1, d));
    box.appendChild(d);
  });
  if (api.data.yearSet) $$('.dial-arrow', box).forEach(b => b.disabled = true);
}

function renderCtl(api) {
  const box = $('#turner-ctl');
  if (api.solved) { box.innerHTML = '<p class="muted">Часовникът спря. Пясъкът стои.</p>'; return; }
  if (!api.data.yearSet) {
    box.innerHTML = `<button class="btn btn-house" id="year-go"><span>Заключи годината</span></button>`;
    $('#year-go').addEventListener('click', () => lockYear(api));
  } else {
    box.innerHTML = `
      <p class="muted" style="font-size:.94rem">Годината е заключена. Сега дръпни веригата —
      толкова пъти, колкото трябва.</p>
      <button class="btn btn-primary" id="chain"><span>Дръпни веригата</span></button>
      <div class="turn-count">завъртания: <b id="turn-n">${api.data.turns}</b></div>`;
    $('#chain').addEventListener('click', () => pull(api));
  }
}

function spin(api, i, dir, node) {
  if (api.data.yearSet) return;
  const d = api.data;
  d.dials[i] = (d.dials[i] + dir + 10) % 10;
  api.saveData();
  const n = node.querySelector('.dial-num');
  n.textContent = d.dials[i];
  n.style.animation = 'none'; void n.offsetWidth;
  n.style.animation = `dialSpin${dir > 0 ? 'Up' : 'Down'} .28s`;
  api.sfx.click();
  if (rings[i]) rings[i].target = -(d.dials[i] / 10) * Math.PI * 2;
}

function lockYear(api) {
  const d = api.data;
  if (d.dials.join('') !== YEAR.join('')) {
    api.sfx.bad();
    $$('.dial').forEach(x => { x.classList.remove('shake'); void x.offsetWidth; x.classList.add('shake'); });
    api.fail('Пясъкът се разсипва настрани. Не е тази година.');
    return;
  }
  d.yearSet = true; api.saveData();
  api.sfx.unlock();
  api.fx.flash('rgba(230,200,120,.24)', 700);
  api.toast('Четирите пръстена щракват. Часовникът чака веригата.', 'magic');
  renderDials(api); renderCtl(api);
}

function pull(api) {
  const d = api.data;
  d.turns++;
  api.saveData();
  api.sfx.chime();
  spinT = 1;
  const n = $('#turn-n'); if (n) n.textContent = d.turns;
  api.fx.sparksFrom($('#stage'), { count: 18, color: '#ffd98a', spread: 120 });

  if (d.turns === TURNS) {
    setTimeout(() => {
      api.sfx.unlock();
      api.fx.flash('rgba(255,225,150,.3)', 1000);
      api.fx.sparksFrom($('#stage'), { count: 60, color: '#ffe9a8', spread: 320 });
      $('#chain').disabled = true;
      api.solve('Пясъкът тръгва нагоре. Три часа се навиват обратно и в дланта ти пада руна.');
    }, 700);
  } else if (d.turns > TURNS) {
    d.turns = 0; api.saveData();
    if (n) n.textContent = 0;
    api.fx.shakeScreen(12, 500);
    api.fail('Едно завъртане в повече. Часовникът се разтриса и връща брояча на нула.');
  }
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    dist: 15, fov: 42, look: [0, 3.4, 0], theta: 0.3, phi: 1.05,
    minPolar: 0.3, maxPolar: 1.5, ground: true, groundColor: 0x14110c,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL за часовника, но колелцата вляво работят.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  const gold = new T.MeshStandardMaterial({ color: 0xd9b45b, metalness: 0.92, roughness: 0.22 });
  const goldDim = new T.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.85, roughness: 0.35 });

  const base = new T.Mesh(new T.CylinderGeometry(3.2, 3.8, 0.5, 24), goldDim);
  base.position.y = 0.25; base.receiveShadow = true; stage.add(base);
  const column = new T.Mesh(new T.CylinderGeometry(0.3, 0.42, 1.6, 16), goldDim);
  column.position.y = 1.2; stage.add(column);

  // самият пясъчен часовник
  const glassMat = new T.MeshStandardMaterial({
    color: 0xcfe6ee, roughness: 0.05, metalness: 0.05, transparent: true, opacity: 0.35,
  });
  const gTop = new T.Mesh(new T.ConeGeometry(1.15, 1.7, 24), glassMat); gTop.position.y = 4.4;
  const gBot = new T.Mesh(new T.ConeGeometry(1.15, 1.7, 24), glassMat); gBot.position.y = 2.7; gBot.rotation.x = Math.PI;
  const capT = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 0.24, 20), gold); capT.position.y = 5.3;
  const capB = new T.Mesh(new T.CylinderGeometry(1.3, 1.3, 0.24, 20), gold); capB.position.y = 1.8;
  const sandMat = new T.MeshStandardMaterial({ color: 0xe8c98a, roughness: 0.95, emissive: 0x6a4c10, emissiveIntensity: 0.35 });
  const sandBot = new T.Mesh(new T.ConeGeometry(1.0, 0.9, 20), sandMat);
  sandBot.position.y = 2.35; sandBot.rotation.x = Math.PI;
  const stream = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.4, 8), sandMat);
  stream.position.y = 3.55;
  glass = new T.Group();
  glass.add(gTop, gBot, capT, capB, sandBot, stream);
  stage.add(glass);

  // четирите пръстена с цифри
  const radii = [3.0, 2.6, 2.2, 1.8];
  radii.forEach((r, idx) => {
    const g = new T.Group();
    const torus = new T.Mesh(new T.TorusGeometry(r, 0.075, 10, 64), gold);
    g.add(torus);
    for (let n = 0; n < 10; n++) {
      const a = (n / 10) * Math.PI * 2;
      const p = new T.Mesh(
        new T.PlaneGeometry(0.5, 0.5),
        new T.MeshBasicMaterial({ map: labelTexture(T, String(n), { color: '#ffe9a8', size: 128, font: 'bold 92px Cinzel, Georgia, serif' }), transparent: true, side: T.DoubleSide })
      );
      p.position.set(Math.sin(a) * r, 0, Math.cos(a) * r);
      p.rotation.x = -Math.PI / 2;
      p.rotation.z = -a;
      g.add(p);
    }
    g.position.y = 3.55;
    g.rotation.x = 0.24 + idx * 0.16;
    g.rotation.z = idx * 0.3;
    stage.add(g);
    rings.push({ g, cur: 0, target: -(api.data.dials[idx] / 10) * Math.PI * 2, spin: 0.1 + idx * 0.05 });
  });

  // верижка
  const chain = new T.Mesh(new T.TorusGeometry(0.9, 0.03, 6, 40), gold);
  chain.position.set(0, 6.0, 0); chain.rotation.x = Math.PI / 2.2;
  stage.add(chain);

  stage.onFrame((t, dt) => {
    rings.forEach((r, i) => {
      r.cur += (r.target - r.cur) * 0.12;
      r.g.rotation.y = r.cur + (spinT > 0 ? spinT * (i + 1) * 3 : 0);
    });
    if (spinT > 0) {
      spinT = Math.max(0, spinT - dt * 1.2);
      glass.rotation.y += dt * 9 * spinT;
      glass.rotation.z = Math.sin(t * 12) * 0.08 * spinT;
    } else {
      glass.rotation.z *= 0.9;
      glass.rotation.y += dt * 0.15;
    }
    stream.material.emissiveIntensity = 0.3 + Math.sin(t * 5) * 0.15;
  });
}
