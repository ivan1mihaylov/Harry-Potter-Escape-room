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
  const g = new T.Group();
  const hide = new T.MeshStandardMaterial({
    color: [0x5a4632, 0x3e3226, 0x6b5340, 0x8a7256, 0x2e2820][i % 5],
    roughness: 0.92, metalness: 0.02,
  });
  const skin = new T.MeshStandardMaterial({ color: 0x8a6a4e, roughness: 0.8 });

  const body = new T.Mesh(new T.CapsuleGeometry(0.62, 1.5, 6, 12), hide);
  body.rotation.z = Math.PI / 2; body.position.y = 1.75; body.castShadow = true;
  g.add(body);

  [[-0.55, 0.55], [-0.55, -0.55], [0.75, 0.5], [0.75, -0.5]].forEach(([z, x]) => {
    const leg = new T.Mesh(new T.CylinderGeometry(0.13, 0.09, 1.75, 6), hide);
    leg.position.set(x, 0.88, z); leg.castShadow = true;
    g.add(leg);
  });

  const torso = new T.Mesh(new T.CapsuleGeometry(0.36, 0.85, 5, 10), skin);
  torso.position.set(0, 2.85, -0.95); torso.castShadow = true;
  const head = new T.Mesh(new T.SphereGeometry(0.3, 14, 12), skin);
  head.position.set(0, 3.55, -1.0);
  const hair = new T.Mesh(new T.SphereGeometry(0.33, 12, 10, 0, 6.3, 0, 1.6),
    new T.MeshStandardMaterial({ color: 0x2a1f16, roughness: 1 }));
  hair.position.set(0, 3.6, -1.02);
  g.add(torso, head, hair);

  // лък
  const bow = new T.Mesh(new T.TorusGeometry(0.85, 0.05, 6, 20, Math.PI * 1.1),
    new T.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.7 }));
  bow.position.set(0.42, 2.9, -1.0);
  bow.rotation.set(0, Math.PI / 2, 0.4);
  const string = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1.5, 4),
    new T.MeshBasicMaterial({ color: 0xd8d2c0 }));
  string.position.set(0.42, 2.9, -1.0); string.rotation.z = 0.4;
  g.add(bow, string);

  const arm = new T.Mesh(new T.CapsuleGeometry(0.1, 0.6, 4, 8), skin);
  arm.position.set(0.3, 3.05, -1.0); arm.rotation.z = -0.9;
  g.add(arm);

  g.scale.setScalar(1.05);
  return g;
}
