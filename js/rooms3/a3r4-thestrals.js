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
  const g = new T.Group();
  const skin = new T.MeshStandardMaterial({ color: 0x14161c, roughness: 0.85,
    emissive: 0x0a1218, emissiveIntensity: 0.5 });
  const body = new T.Mesh(new T.CapsuleGeometry(0.4, 1.1, 5, 10), skin);
  body.rotation.z = Math.PI / 2; body.position.y = 1.35;
  const neck = new T.Mesh(new T.CylinderGeometry(0.14, 0.22, 1.1, 6), skin);
  neck.position.set(0.75, 1.85, 0); neck.rotation.z = -0.5;
  const head = new T.Mesh(new T.BoxGeometry(0.7, 0.28, 0.26), skin);
  head.position.set(1.2, 2.15, 0);
  const eye = new T.Mesh(new T.SphereGeometry(0.06, 8, 6),
    new T.MeshBasicMaterial({ color: 0xd8f0ff }));
  eye.position.set(1.05, 2.22, 0.14);
  g.add(body, neck, head, eye);
  [[-0.4, 0.35], [-0.4, -0.35], [0.5, 0.3], [0.5, -0.3]].forEach(([z, x]) => {
    const leg = new T.Mesh(new T.CylinderGeometry(0.06, 0.05, 1.3, 5), skin);
    leg.position.set(z, 0.65, x);
    g.add(leg);
  });
  [1, -1].forEach(s => {
    const wing = new T.Mesh(new T.SphereGeometry(1.0, 10, 8, 0, Math.PI), skin);
    wing.scale.set(1, 0.55, 0.06);
    wing.position.set(-0.1, 1.75, s * 0.4);
    wing.rotation.set(0, s > 0 ? 0.5 : -0.5, s * 0.4);
    g.add(wing);
  });
  g.scale.setScalar(0.62);
  return g;
}
