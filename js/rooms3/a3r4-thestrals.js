/* ============================================================
   ТРЕТА ЧАСТ · ПОЛЯНА IV — Тестралите
   Не се виждат. Виждат се само нещата, които са докоснали.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';
import { plantForest, addFireflies, addMist, FOREST_STAGE } from './common3.js';

export const meta = {
  id: 'a3-thestrals',
  eyebrow: 'Поляна IV',
  title: 'Тестралите',
  sub: 'Поляната мирише на кръв и на кожа. Три тестрала стоят някъде тук — но ти още не си виждал смъртта, {име}, значи за теб те са въздух. Въздух, който мачка тревата.',
  rune: 'О',
  grain: null,
  bg: 'off',
  tint: '#8fa0b8',
  hints: [
    'Числото върху смачканата трева показва <b>колко тестрала</b> стоят в осемте съседни петна — включително по диагонал. Нула значи, че всичките осем са празни.',
    'Започни от нулите: те изчистват цели участъци. После търси число, около което са останали точно толкова свободни петна, колкото е самото число.',
    'Тестралите са на: ред 2 · петно 1; ред 3 · петно 2; ред 5 · петно 3. (Броенето започва от горе вляво.)',
  ],
};

const N = 5;
const THESTRALS = [[1, 0], [4, 2], [2, 1]];
const CLUES = [[3, 4, 0], [0, 3, 0], [0, 0, 1], [4, 0, 0], [2, 2, 1], [2, 0, 2], [2, 4, 0]];
const clueAt = (i, j) => CLUES.find(c => c[0] === i && c[1] === j);
const isThestral = (i, j) => THESTRALS.some(t => t[0] === i && t[1] === j);

let stage = null, cells = {};

export function mount(root, api) {
  const d = api.data;
  if (!d.marks) d.marks = [];
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Каквото Луна би ти казала</h4>
            <p>„Не ги гледай. Гледай <b>тревата</b>. Където са минали, тя е смачкана, а числото
            в петното казва колко от тях стоят наоколо — включително по ъглите.“</p>
            <p style="font-size:.93rem">Отбележи <b>трите</b> петна, в които стоят тестралите,
            и извикай Луна да провери. Върху петно с число не се стъпва.</p>
          </div>
          <div class="knight-hud">
            <div class="kh-item"><span>отбелязани</span><b id="th-count">0 / 3</b></div>
            <div class="kh-item"><span>опити</span><b id="th-tries">0</b></div>
          </div>
          <div class="flex flex-center mt">
            <button class="btn btn-house" id="th-check"><span>Извикай Луна</span></button>
            <button class="btn btn-ghost btn-sm" id="th-clear"><span>Изчисти</span></button>
          </div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Тревата се разстила…</div></div>
      </div>
      <p class="center muted stage-help">Влачи, за да обиколиш поляната. Докосни петно, за да го отбележиш.</p>
    </div>`;

  $('#th-check').addEventListener('click', () => check(api));
  $('#th-clear').addEventListener('click', () => { api.data.marks = []; api.saveData(); api.sfx.click(); refresh(api); });
  renderHud(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } cells = {}; };
}

function renderHud(api) {
  const c = $('#th-count'), t = $('#th-tries');
  if (c) c.textContent = `${api.data.marks.length} / 3`;
  if (t) t.textContent = api.data.tries || 0;
}

function toggle(api, i, j) {
  if (api.solved) return;
  if (clueAt(i, j)) { api.toast('Това петно е смачкано — там няма как да стои тестрал.', ''); return; }
  const d = api.data;
  const k = d.marks.findIndex(m => m[0] === i && m[1] === j);
  if (k >= 0) d.marks.splice(k, 1);
  else {
    if (d.marks.length >= 3) { api.toast('Тестралите са точно три. Махни някой, за да отбележиш друг.', ''); return; }
    d.marks.push([i, j]);
  }
  api.saveData(); api.sfx.click();
  refresh(api);
}

function check(api) {
  const d = api.data;
  if (d.marks.length !== 3) { api.toast('Отбележи и трите петна.', ''); return; }
  d.tries = (d.tries || 0) + 1; api.saveData();
  const ok = d.marks.every(m => isThestral(m[0], m[1]));
  renderHud(api);
  if (ok) {
    api.sfx.unlock();
    api.fx.flash('rgba(160,180,210,.22)', 800);
    api.fx.sparksFrom($('#stage'), { count: 44, color: '#c9d4e0', spread: 260 });
    revealAll();
    setTimeout(() => api.solve('Три черни силуета се проявяват като мокро петно върху плат. Единият навежда глава и в тревата пада руна.'), 900);
  } else {
    const right = d.marks.filter(m => isThestral(m[0], m[1])).length;
    api.sfx.bad();
    api.fx.shakeScreen(9, 420);
    api.fail(`Луна поклаща глава: <b>${right} от 3</b> са верни. Останалите петна са само трева.`, 45000);
  }
}

function refresh(api) {
  renderHud(api);
  Object.entries(cells).forEach(([k, c]) => {
    const [i, j] = k.split(',').map(Number);
    const marked = api.data.marks.some(m => m[0] === i && m[1] === j);
    c.mark.visible = marked;
  });
}

function revealAll() {
  THESTRALS.forEach(([i, j]) => {
    const c = cells[`${i},${j}`];
    if (c && c.ghost) c.ghost.visible = true;
  });
}

/* ---------- 3D ---------- */
const TILE = 2.4;
const wx = j => (j - (N - 1) / 2) * TILE;
const wz = i => (i - (N - 1) / 2) * TILE;

async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...FOREST_STAGE, dist: 21, fov: 44, look: [0, 0.5, 0],
    theta: 0.2, phi: 0.82, minPolar: 0.22, maxPolar: 1.36,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL за поляната.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  plantForest(stage, { count: 40, inner: 12, outer: 27 });
  addMist(stage, { count: 10 });
  addFireflies(stage, { count: 50, color: 0xa8c0d8 });

  const grassMat = new T.MeshStandardMaterial({ color: 0x2c4030, roughness: 1 });
  const flatMat = new T.MeshStandardMaterial({ color: 0x4a4436, roughness: 1 });
  const picks = [];

  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const clue = clueAt(i, j);
    const g = new T.Group();
    const pad = new T.Mesh(new T.BoxGeometry(TILE * 0.9, 0.12, TILE * 0.9),
      clue ? flatMat.clone() : grassMat.clone());
    pad.receiveShadow = true;
    g.add(pad);

    if (clue) {
      const lbl = new T.Mesh(new T.PlaneGeometry(1.2, 1.2),
        new T.MeshBasicMaterial({ map: labelTexture(T, String(clue[2]), { color: '#e8dcc0' }), transparent: true }));
      lbl.rotation.x = -Math.PI / 2;
      lbl.position.y = 0.1;
      g.add(lbl);
    } else {
      // туфи трева
      for (let k = 0; k < 5; k++) {
        const blade = new T.Mesh(new T.ConeGeometry(0.07, 0.5 + (k % 3) * 0.2, 4), grassMat);
        blade.position.set((k - 2) * 0.34, 0.3, ((k * 7) % 5 - 2) * 0.3);
        blade.rotation.z = (k - 2) * 0.12;
        g.add(blade);
      }
    }

    const mark = new T.Mesh(new T.TorusGeometry(0.85, 0.09, 8, 26),
      new T.MeshStandardMaterial({ color: 0xd06060, emissive: 0x7a2020, emissiveIntensity: 0.8 }));
    mark.rotation.x = -Math.PI / 2; mark.position.y = 0.24; mark.visible = false;
    g.add(mark);

    const ghost = buildThestral(T);
    ghost.visible = false;
    g.add(ghost);

    g.position.set(wx(j), 0, wz(i));
    g.userData = { pick: true, i, j };
    g.traverse(c => { c.userData.pick = c.userData.pick || false; });
    stage.add(g);
    cells[`${i},${j}`] = { g, mark, ghost };
    picks.push(g);
  }

  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && !(n.userData && n.userData.i != null) && n.parent) n = n.parent;
    if (n && n.userData && n.userData.i != null) toggle(api, n.userData.i, n.userData.j);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  refresh(api);
  if (api.solved) revealAll();

  stage.onFrame((t) => {
    Object.values(cells).forEach((c, i) => {
      if (c.mark.visible) c.mark.rotation.z = t * 0.9 + i;
      if (c.ghost.visible) c.ghost.position.y = Math.sin(t * 0.9 + i) * 0.08;
    });
  });
}

function buildThestral(T) {
  /* Тестралът е кон, от когото е останала само идеята: кожа, опъната
     върху ребра, и криле като на прилеп.  Гледа към +X.            */
  const g = new T.Group();
  const skin = new T.MeshStandardMaterial({ color: 0x14161c, roughness: 0.88,
    emissive: 0x0a1218, emissiveIntensity: 0.5, flatShading: true });
  const bone = new T.MeshStandardMaterial({ color: 0x2a2c33, roughness: 0.7,
    emissive: 0x0c1014, emissiveIntensity: 0.5 });
  const film = new T.MeshStandardMaterial({ color: 0x11141a, roughness: 0.95,
    transparent: true, opacity: 0.82, side: T.DoubleSide,
    emissive: 0x0b1016, emissiveIntensity: 0.4 });

  const body = new T.Mesh(new T.CapsuleGeometry(0.34, 1.0, 6, 12), skin);
  body.rotation.z = Math.PI / 2; body.position.y = 1.35;
  body.scale.set(1, 1, 0.78);
  g.add(body);

  /* ребрата се броят — заради тях изглежда изгладнял, а не надут */
  for (let k = 0; k < 6; k++) {
    const rib = new T.Mesh(new T.TorusGeometry(0.3 - k * 0.012, 0.028, 5, 16, Math.PI * 1.25), bone);
    rib.position.set(0.42 - k * 0.19, 1.36, 0);
    rib.rotation.set(0, Math.PI / 2, Math.PI * 0.87);
    rib.scale.set(1, 0.82, 1);
    g.add(rib);
  }
  const spine = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.5, 6), bone);
  spine.rotation.z = Math.PI / 2; spine.position.set(-0.05, 1.66, 0);
  const hip = new T.Mesh(new T.SphereGeometry(0.3, 10, 8), skin);
  hip.position.set(-0.66, 1.36, 0); hip.scale.set(0.9, 1.05, 0.78);
  const shoulder = new T.Mesh(new T.SphereGeometry(0.31, 10, 8), skin);
  shoulder.position.set(0.6, 1.42, 0); shoulder.scale.set(0.9, 1.05, 0.8);
  g.add(spine, hip, shoulder);

  /* врат на прешлени */
  const neck = new T.Group();
  neck.position.set(0.72, 1.6, 0);
  for (let k = 0; k < 6; k++) {
    const v = new T.Mesh(new T.CylinderGeometry(0.115 - k * 0.008, 0.14 - k * 0.008, 0.2, 7), skin);
    v.position.set(k * 0.115, k * 0.16, 0);
    v.rotation.z = -0.62;
    neck.add(v);
    if (k % 2 === 0) {
      const knob = new T.Mesh(new T.SphereGeometry(0.055, 6, 5), bone);
      knob.position.set(k * 0.115 - 0.06, k * 0.16 + 0.08, 0);
      neck.add(knob);
    }
  }
  g.add(neck);

  /* драконска глава: череп, муцуна, ноздра, хлътнало око, рогца */
  const headG = new T.Group();
  headG.position.set(1.44, 2.5, 0);
  headG.rotation.z = -0.24;
  const skull = new T.Mesh(new T.SphereGeometry(0.2, 12, 10), skin);
  skull.scale.set(1.25, 0.92, 0.85);
  const muzzle = new T.Mesh(new T.CylinderGeometry(0.075, 0.135, 0.52, 8), skin);
  muzzle.rotation.z = Math.PI / 2 - 0.12; muzzle.position.set(0.34, -0.05, 0);
  const jaw = new T.Mesh(new T.BoxGeometry(0.42, 0.07, 0.15), skin);
  jaw.position.set(0.3, -0.15, 0); jaw.rotation.z = -0.1;
  headG.add(skull, muzzle, jaw);
  [-1, 1].forEach(sz => {
    const socket = new T.Mesh(new T.SphereGeometry(0.075, 8, 6),
      new T.MeshStandardMaterial({ color: 0x080a0c, roughness: 1 }));
    socket.position.set(0.07, 0.05, sz * 0.14);
    const eye = new T.Mesh(new T.SphereGeometry(0.042, 8, 6),
      new T.MeshBasicMaterial({ color: 0xd8f0ff }));
    eye.position.set(0.1, 0.05, sz * 0.15);
    const nose = new T.Mesh(new T.SphereGeometry(0.022, 6, 5),
      new T.MeshBasicMaterial({ color: 0x05070a }));
    nose.position.set(0.56, -0.02, sz * 0.05);
    const hornM = new T.Mesh(new T.ConeGeometry(0.035, 0.26, 6), bone);
    hornM.position.set(-0.12, 0.16, sz * 0.09);
    hornM.rotation.set(sz * 0.25, 0, 0.5);
    const ear = new T.Mesh(new T.ConeGeometry(0.055, 0.2, 5), skin);
    ear.position.set(-0.16, 0.12, sz * 0.16); ear.rotation.set(sz * 0.5, 0, 0.3);
    headG.add(socket, eye, nose, hornM, ear);
  });
  g.add(headG);

  /* кокалести крака с копита */
  [[0.5, 0.26, 1], [0.5, -0.26, 1], [-0.55, 0.24, 0], [-0.55, -0.24, 0]].forEach(([x, z, front]) => {
    const leg = new T.Group();
    const up = new T.Mesh(new T.CylinderGeometry(0.075, 0.05, 0.7, 6), skin);
    up.position.y = -0.35; leg.add(up);
    const kneeJ = new T.Mesh(new T.SphereGeometry(0.062, 6, 5), bone);
    kneeJ.position.y = -0.7; leg.add(kneeJ);
    const knee = new T.Group(); knee.position.y = -0.7;
    const lo = new T.Mesh(new T.CylinderGeometry(0.04, 0.03, 0.62, 5), skin);
    lo.position.y = -0.31; knee.add(lo);
    const hoof = new T.Mesh(new T.CylinderGeometry(0.05, 0.062, 0.12, 6), bone);
    hoof.position.y = -0.66; knee.add(hoof);
    leg.add(knee);
    leg.position.set(x, 1.3, z);
    leg.rotation.x = front ? 0.12 : -0.18;
    knee.rotation.x = front ? -0.2 : 0.3;
    g.add(leg);
  });

  /* криле от прилепски тип: кости и мембрана между тях */
  [1, -1].forEach(sz => {
    const wing = new T.Group();
    wing.position.set(0.16, 1.72, sz * 0.26);
    wing.rotation.set(sz * 0.24, sz > 0 ? -0.62 : 0.62, 0.42);
    wing.scale.setScalar(0.92);
    const shape = new T.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(1.2, 0.62, 2.35, 0.5);      /* преден ръб */
    shape.quadraticCurveTo(2.1, 0.02, 1.82, -0.42);    /* фестоните */
    shape.quadraticCurveTo(1.6, -0.12, 1.3, -0.6);
    shape.quadraticCurveTo(1.08, -0.24, 0.8, -0.66);
    shape.quadraticCurveTo(0.6, -0.28, 0.3, -0.52);
    shape.quadraticCurveTo(0.14, -0.24, 0, 0);
    const mem = new T.Mesh(new T.ShapeGeometry(shape, 14), film);
    wing.add(mem);
    /* костите вървят вътре в мембраната, а не стърчат извън нея */
    const WRIST = [1.05, 0.5];
    const boneTo = (from, to, r0, r1) => {
      const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
      const m = new T.Mesh(new T.CylinderGeometry(r0, r1, len, 5), bone);
      m.position.set((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0.006);
      m.rotation.z = Math.atan2(to[1] - from[1], to[0] - from[0]) - Math.PI / 2;
      wing.add(m);
    };
    boneTo([0.05, 0.02], WRIST, 0.05, 0.032);            /* раменна кост */
    boneTo(WRIST, [2.28, 0.48], 0.03, 0.012);            /* преден ръб */
    [[1.8, -0.38], [1.28, -0.55], [0.79, -0.6], [0.32, -0.47]].forEach((tip, k) => {
      boneTo(WRIST, tip, 0.026 - k * 0.003, 0.009);
    });
    const claw = new T.Mesh(new T.ConeGeometry(0.03, 0.12, 5), bone);
    claw.position.set(WRIST[0] + 0.06, WRIST[1] + 0.1, 0.006);
    claw.rotation.z = -0.4;
    wing.add(claw);
    g.add(wing);
  });

  /* опашка — тънка, с кичур на върха */
  const tail = new T.Mesh(new T.CylinderGeometry(0.055, 0.014, 1.1, 6), skin);
  tail.position.set(-1.05, 1.24, 0); tail.rotation.z = 1.15;
  const tuft = new T.Mesh(new T.ConeGeometry(0.07, 0.34, 5), bone);
  tuft.position.set(-1.52, 0.86, 0); tuft.rotation.z = Math.PI - 0.35;
  g.add(tail, tuft);

  g.scale.setScalar(0.62);
  return g;
}
