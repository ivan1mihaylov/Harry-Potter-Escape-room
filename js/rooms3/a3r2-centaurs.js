/* ============================================================
   ТРЕТА ЧАСТ · ПОЛЯНА II — Кентаврите
   Четири лъка, насочени към теб, и по едно изречение всеки.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { plantForest, addFireflies, addMoonshaft, FOREST_STAGE } from './common3.js';

export const meta = {
  id: 'a3-centaurs',
  eyebrow: 'Поляна II',
  title: 'Кентаврите',
  sub: 'Копитата се чуват отвсякъде и спират в кръг около теб. Кентаврите не убиват жребчета и не лъжат звездите — но не са обещавали да не лъжат {име|теб}.',
  rune: 'У',
  grain: null,
  bg: 'stars',
  tint: '#9fb8ff',
  hints: [
    'Провери всяка пътека поотделно: приеми, че тя е безопасната, и преброй колко изречения излизат верни. Търсиш пътеката, при която броят съвпада с обявения.',
    'Изречение от вида „Не е Южната“ е <b>вярно</b> за всяка друга пътека. „Нито А, нито Б“ е вярно, само ако отговорът не е нито едното от двете.',
    'Отговорите по кръгове са: <b>Източната</b>, после <b>Северната</b>, накрая <b>Южната</b>.',
  ],
};

const ROUNDS = [
  {
    nTrue: 1,
    paths: ['Северната', 'Източната', 'Южната', 'Западната'],
    say: [
      ['Ронан', 'Безопасната пътека е Северната.'],
      ['Бейн', 'Не е Северната.'],
      ['Магориан', 'Не е Източната.'],
      ['Фиренце', 'Безопасната е Западната.'],
    ],
    answer: 'Източната',
  },
  {
    nTrue: 2,
    paths: ['Северната', 'Източната', 'Южната', 'Западната', 'Дълбоката'],
    say: [
      ['Ронан', 'Не е Южната.'],
      ['Бейн', 'Безопасната е Западната.'],
      ['Магориан', 'Нито Южната, нито Западната.'],
      ['Фиренце', 'Безопасната е Дълбоката.'],
      ['Аген', 'Не е Северната.'],
    ],
    answer: 'Северната',
  },
  {
    nTrue: 3,
    paths: ['Северната', 'Източната', 'Южната', 'Западната', 'Дълбоката'],
    say: [
      ['Ронан', 'Нито Дълбоката, нито Северната.'],
      ['Бейн', 'Или Западната, или Дълбоката.'],
      ['Магориан', 'Не е Дълбоката.'],
      ['Фиренце', 'Нито Южната, нито Северната.'],
      ['Аген', 'Нито Дълбоката, нито Северната.'],
    ],
    answer: 'Южната',
  },
];

let stage = null, herd = [];

export function mount(root, api) {
  const d = api.data;
  if (d.round == null) d.round = 0;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Магориан вдига ръка</h4>
            <div id="cent-intro"></div>
          </div>
          <div class="say-list" id="say-list"></div>
          <div class="path-picks" id="path-picks"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Копитата спират…</div></div>
      </div>
    </div>`;

  renderRound(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } herd = []; };
}

function renderRound(api) {
  const d = api.data;
  const done = d.round >= ROUNDS.length;
  const intro = $('#cent-intro');
  if (intro) intro.innerHTML = done
    ? '<p>Кентаврите свалят лъковете и се разстъпват. „Небето каза, че ще познаеш. Небето рядко греши.“</p>'
    : `<p><b>Кръг ${d.round + 1} от ${ROUNDS.length}.</b> „Пред теб има
       ${ROUNDS[d.round].paths.length} пътеки и само една е безопасна.
       От нас <b>точно ${bg(ROUNDS[d.round].nTrue)}</b> казва истината. Останалите те лъжат в очите.“</p>`;

  const list = $('#say-list');
  if (list) list.innerHTML = done ? '' : ROUNDS[d.round].say.map(([who, what]) =>
    `<div class="say"><b>${who}</b><span>„${what}“</span></div>`).join('');

  const picks = $('#path-picks');
  if (picks) {
    picks.innerHTML = done ? '' : ROUNDS[d.round].paths.map(p =>
      `<button class="opt path-opt" data-p="${p}">${p} пътека</button>`).join('');
    $$('.path-opt', picks).forEach(b => b.addEventListener('click', () => choose(api, b.dataset.p, b)));
  }
}

function bg(n) { return ['нула', 'един', 'двама', 'трима', 'четирима'][n] || n; }

function choose(api, path, node) {
  if (api.solved) return;
  const d = api.data;
  const r = ROUNDS[d.round];
  if (path === r.answer) {
    node.classList.add('right');
    api.sfx.chime();
    api.fx.sparksFrom(node, { count: 18, color: '#cfe0ff', spread: 120 });
    d.round++; api.saveData();
    setTimeout(() => {
      renderRound(api);
      if (d.round >= ROUNDS.length) {
        api.sfx.unlock();
        api.fx.flash('rgba(150,180,255,.22)', 800);
        setTimeout(() => api.solve('Фиренце ти подава нещо, без да поглежда: студена руна с формата на копито.'), 700);
      }
    }, 700);
  } else {
    node.classList.add('wrong');
    node.disabled = true;
    api.sfx.bad();
    api.fx.shakeScreen(10, 460);
    api.fail('Тетивите изскърцват едновременно. Сгреши — и кентаврите го знаят.', 45000);
  }
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...FOREST_STAGE, dist: 20, fov: 46, look: [0, 2.4, 0],
    theta: 0.25, phi: 1.16, minPolar: 0.35, maxPolar: 1.42, autoSpin: 0.03,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL, но изреченията вляво стигат за загадката.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  plantForest(stage, { count: 44, inner: 12, outer: 27 });
  addFireflies(stage, { count: 60, color: 0xbfd0ff });
  addMoonshaft(stage, { r: 5.5, h: 26 });

  const names = ['Ронан', 'Бейн', 'Магориан', 'Фиренце', 'Аген'];
  names.forEach((n, i) => {
    const a = (i / names.length) * Math.PI * 2 + 0.3;
    const g = buildCentaur(T, i);
    g.position.set(Math.sin(a) * 8.2, 0, Math.cos(a) * 8.2);
    g.rotation.y = a + Math.PI;
    stage.add(g);
    herd.push({ g, ph: i * 1.3 });
  });

  stage.onFrame((t) => {
    herd.forEach(h => {
      h.g.position.y = Math.sin(t * 0.7 + h.ph) * 0.06;
      h.g.rotation.z = Math.sin(t * 0.5 + h.ph) * 0.012;
    });
  });
}

function buildCentaur(T, i) {
  /* Моделът гледа към +Z — натам е кръгът, в който стоиш ти. */
  const g = new T.Group();
  const coat = [0x5a4632, 0x3e3226, 0x6b5340, 0x8a7256, 0x2e2820][i % 5];
  const hide = new T.MeshStandardMaterial({ color: coat, roughness: 0.94, metalness: 0.02 });
  const hideDark = new T.MeshStandardMaterial({ color: shade(coat, -0.3), roughness: 0.95 });
  const skin = new T.MeshStandardMaterial({ color: 0x8a6a4e, roughness: 0.78 });
  const hairMat = new T.MeshStandardMaterial({
    color: [0x2a1f16, 0x4a3626, 0x14100c, 0x6b5a3a, 0x1c1610][i % 5], roughness: 1 });
  const horn = new T.MeshStandardMaterial({ color: 0x1d1712, roughness: 0.45, metalness: 0.2 });
  const woodMat = new T.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.62 });

  /* --- конската част --- */
  const barrel = new T.Mesh(new T.CapsuleGeometry(0.58, 1.5, 8, 16), hide);
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 1.72, 0);
  barrel.scale.set(1, 1, 0.92);
  barrel.castShadow = true;
  g.add(barrel);

  const rump = new T.Mesh(new T.SphereGeometry(0.6, 14, 12), hide);
  rump.position.set(0, 1.76, -0.86); rump.scale.set(1, 1.02, 0.9);
  const chest = new T.Mesh(new T.SphereGeometry(0.58, 14, 12), hide);
  chest.position.set(0, 1.74, 0.84); chest.scale.set(1.02, 1.04, 0.95);
  g.add(rump, chest);

  /* краката са на стави и с копита — заради тях спира да прилича на маса */
  const legAt = (x, z, front) => {
    const leg = new T.Group();
    const up = new T.Mesh(new T.CylinderGeometry(0.17, 0.11, 0.86, 8), hide);
    up.position.y = -0.43; leg.add(up);
    const knee = new T.Group(); knee.position.y = -0.86;
    const lo = new T.Mesh(new T.CylinderGeometry(0.085, 0.055, 0.72, 7), hide);
    lo.position.y = -0.36; knee.add(lo);
    const hoof = new T.Mesh(new T.CylinderGeometry(0.085, 0.1, 0.18, 8), horn);
    hoof.position.y = -0.79; knee.add(hoof);
    leg.add(knee);
    leg.position.set(x, 1.62, z);
    leg.rotation.x = front ? 0.1 : -0.16;
    knee.rotation.x = front ? -0.14 : 0.24;
    leg.castShadow = true;
    return leg;
  };
  const legs = [legAt(-0.34, 0.66, true), legAt(0.34, 0.66, true),
                legAt(-0.4, -0.66, false), legAt(0.4, -0.66, false)];
  legs.forEach(l => g.add(l));

  /* опашка */
  const tail = new T.Mesh(new T.CylinderGeometry(0.12, 0.02, 1.15, 6), hairMat);
  tail.position.set(0, 1.74, -1.34); tail.rotation.x = 1.1;
  g.add(tail);
  for (let k = 0; k < 4; k++) {
    const str = new T.Mesh(new T.CylinderGeometry(0.03, 0.008, 0.95, 4), hairMat);
    str.position.set((k - 1.5) * 0.07, 1.5, -1.5 - (k % 2) * 0.06);
    str.rotation.x = 1.25 + k * 0.05;
    g.add(str);
  }

  /* --- човешката част: израства от плешките, а не стърчи от гърба --- */
  const waist = new T.Mesh(new T.CylinderGeometry(0.34, 0.52, 0.62, 14), hide);
  waist.position.set(0, 2.2, 0.8); waist.rotation.x = -0.16;
  const belt = new T.Mesh(new T.TorusGeometry(0.35, 0.05, 6, 16), hideDark);
  belt.position.set(0, 2.46, 0.84); belt.rotation.x = Math.PI / 2 - 0.16;
  g.add(belt);
  const torso = new T.Mesh(new T.CapsuleGeometry(0.33, 0.72, 6, 14), skin);
  torso.position.set(0, 2.76, 0.9); torso.rotation.x = -0.1;
  torso.scale.set(1.12, 1, 0.82);
  const shoulders = new T.Mesh(new T.SphereGeometry(0.36, 12, 10), skin);
  shoulders.position.set(0, 3.16, 0.94); shoulders.scale.set(1.35, 0.62, 0.8);
  const neck = new T.Mesh(new T.CylinderGeometry(0.11, 0.15, 0.24, 8), skin);
  neck.position.set(0, 3.32, 0.94);
  const head = new T.Mesh(new T.SphereGeometry(0.27, 16, 14), skin);
  head.position.set(0, 3.56, 0.95); head.scale.set(0.92, 1.08, 1);
  g.add(waist, torso, shoulders, neck, head);
  torso.castShadow = true;

  /* коса, брада, очи */
  const cap = new T.Mesh(new T.SphereGeometry(0.29, 14, 12, 0, 6.3, 0, 1.5), hairMat);
  cap.position.set(0, 3.58, 0.94); cap.scale.set(0.95, 1.1, 1.02);
  g.add(cap);
  for (let k = 0; k < 7; k++) {
    const lock = new T.Mesh(new T.CylinderGeometry(0.045, 0.02, 0.5 + (k % 3) * 0.16, 4), hairMat);
    const a = -0.6 + k * 0.2;
    lock.position.set(Math.sin(a) * 0.26, 3.34, 0.93 - Math.cos(a) * 0.22);
    lock.rotation.x = -0.12;
    g.add(lock);
  }
  if (i % 2 === 0) {
    const beard = new T.Mesh(new T.ConeGeometry(0.16, 0.42, 8), hairMat);
    beard.position.set(0, 3.3, 1.06); beard.rotation.x = Math.PI + 0.16;
    g.add(beard);
  }
  const eyeMat = new T.MeshBasicMaterial({ color: 0xe8e2c8 });
  [-1, 1].forEach(sx => {
    const e = new T.Mesh(new T.SphereGeometry(0.033, 6, 6), eyeMat);
    e.position.set(sx * 0.1, 3.6, 1.18); g.add(e);
  });

  /* --- лъкът е опънат и стрелата гледа към теб --- */
  const ARC = Math.PI * 0.78, R = 0.8;
  const ex = Math.cos(ARC / 2) * R, ey = Math.sin(ARC / 2) * R;
  const NOCK = -0.22;                       /* докъдето е издърпана тетивата */
  const bowG = new T.Group();
  bowG.position.set(0.3, 3.0, 1.12);
  bowG.rotation.set(0, -Math.PI / 2, 0.2);  /* стрелата сочи напред, към теб */
  const bow = new T.Mesh(new T.TorusGeometry(R, 0.042, 6, 26, ARC), woodMat);
  bow.rotation.z = -ARC / 2;
  bowG.add(bow);
  [1, -1].forEach(sy => {
    const tipW = new T.Mesh(new T.CylinderGeometry(0.042, 0.018, 0.15, 5), horn);
    tipW.position.set(ex, sy * ey, 0);
    tipW.rotation.z = -sy * (Math.PI / 2 - ARC / 2);
    bowG.add(tipW);
    /* тетивата: два клона към точката, в която е хванала стрелата */
    const dx = NOCK - ex, dy = -sy * ey;
    const len = Math.hypot(dx, dy);
    const str = new T.Mesh(new T.CylinderGeometry(0.009, 0.009, len, 4),
      new T.MeshBasicMaterial({ color: 0xd8d2c0 }));
    str.position.set((ex + NOCK) / 2, sy * ey / 2, 0);
    str.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
    bowG.add(str);
  });
  const shaft = new T.Mesh(new T.CylinderGeometry(0.016, 0.016, 1.45, 5), woodMat);
  shaft.rotation.z = Math.PI / 2; shaft.position.set(NOCK + 0.72, 0, 0);
  const tipC = new T.Mesh(new T.ConeGeometry(0.048, 0.17, 6), horn);
  tipC.rotation.z = -Math.PI / 2; tipC.position.set(NOCK + 1.52, 0, 0);
  bowG.add(shaft, tipC);
  for (let k = 0; k < 3; k++) {                 /* перо */
    const fl = new T.Mesh(new T.PlaneGeometry(0.19, 0.1), hideDark);
    fl.position.set(NOCK + 0.14, 0, 0);
    fl.rotation.set(k * 2.1, 0, 0);
    fl.material.side = T.DoubleSide;
    bowG.add(fl);
  }
  g.add(bowG);

  /* ръцете държат лъка: лявата опъната напред, дясната — при бузата */
  const armL = new T.Mesh(new T.CapsuleGeometry(0.082, 0.6, 5, 10), skin);
  armL.position.set(0.26, 3.02, 1.02); armL.rotation.set(1.3, 0, -0.3);
  const armR = new T.Mesh(new T.CapsuleGeometry(0.082, 0.46, 5, 10), skin);
  armR.position.set(-0.2, 3.06, 0.88); armR.rotation.set(0.85, 0, 0.55);
  g.add(armL, armR);

  g.scale.setScalar(1.05);
  return g;
}

/* по-светъл/по-тъмен нюанс на един цвят */
function shade(hex, k) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return (f(r) << 16) | (f(g) << 8) | f(b);
}
