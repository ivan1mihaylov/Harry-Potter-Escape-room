/* ============================================================
   ВТОРА ЧАСТ · ЗАЛА III — Кубът на Ровена
   Търкаля се, не се вдига. Важно е коя стена ляга надолу.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';

export const meta = {
  id: 'a2-cube',
  eyebrow: 'Зала III',
  title: 'Кубът на Ровена',
  sub: 'Каменен куб върху решетка от плочи. Ровена го е оставила с една бележка: „Не питай къде е кубът. Питай коя му стена гледа надолу.“',
  rune: 'Ф',
  grain: 7,
  bg: 'off',
  tint: '#5f8fd0',
  hints: [
    'Кубът се търкаля през ръба си — след всяко търкаляне долната стена става друга. Следи малката схема вдясно: тя показва коя стена е отдолу в момента.',
    'Счупените плочи не издържат тежестта му. Планирай пътя предварително: първо стигни до златната плоча, чак после мисли за втората.',
    'Решение отначало: <b>С, С, И, И, И, Ю, Ю, И</b> за първата плоча, после <b>С, З, Ю, З, З, З, С, С, С, С</b> за втората. (С = север/нагоре по схемата, Ю = юг, И = изток, З = запад.)',
  ],
};

const N = 5, TILE = 2.2, HALF = 1.0;
const BLOCKED = [[1, 1], [3, 1], [2, 3], [1, 3]];
const FACES = ['Ф', 'И', 'Д', 'Е', 'Л', 'С'];      // 0..5
const START = { x: 0, z: 4, ori: [0, 1, 2, 3, 4, 5] }; // U D N S E W
const GOALS = [
  { x: 4, z: 4, face: 0, label: 'Ф' },
  { x: 0, z: 0, face: 2, label: 'Д' },
];

const ROLL = {
  N: o => [o[3], o[2], o[0], o[1], o[4], o[5]],
  S: o => [o[2], o[3], o[1], o[0], o[4], o[5]],
  E: o => [o[5], o[4], o[2], o[3], o[0], o[1]],
  W: o => [o[4], o[5], o[2], o[3], o[1], o[0]],
};
const STEP = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

let stage = null, cube = null, rolling = false, tileMeshes = {};
let keyHandler = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.pos) { d.pos = { x: START.x, z: START.z }; d.ori = [...START.ori]; d.stage = 0; d.moves = 0; }
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Бележката на Ровена</h4>
            <p>Кубът има шест стени: <b>Ф · И · Д · Е · Л · С</b>. Търкаляй го, докато поисканата
            стена <b>легне надолу</b> върху златната плоча.</p>
            <p style="font-size:.94rem">Счупените плочи не го издържат. Кубът не се вдига и не се
            завърта на място — само се преобръща през ръба си.</p>
          </div>
          <div class="cube-goals" id="cube-goals"></div>
          <div class="cube-state">
            <div class="cs-item"><span>отдолу</span><b id="cs-down">?</b></div>
            <div class="cs-item"><span>отгоре</span><b id="cs-up">?</b></div>
            <div class="cs-item"><span>ходове</span><b id="cs-moves">0</b></div>
          </div>
          <div class="dpad">
            <button class="dp dp-n" data-d="N">▲</button>
            <button class="dp dp-w" data-d="W">◀</button>
            <button class="dp dp-e" data-d="E">▶</button>
            <button class="dp dp-s" data-d="S">▼</button>
            <span class="dp-mid">↻</span>
          </div>
          <p class="center muted" style="font-size:.84rem">Работят и стрелките на клавиатурата.</p>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Плочите се подреждат…</div></div>
      </div>
    </div>`;

  $$('.dp').forEach(b => b.addEventListener('click', () => move(api, b.dataset.d)));
  keyHandler = (e) => {
    const map = { ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E' };
    if (map[e.key]) { e.preventDefault(); move(api, map[e.key]); }
  };
  window.addEventListener('keydown', keyHandler);

  renderGoals(api); renderState(api);
  boot(api);

  api.onLeave = () => {
    if (stage) { stage.dispose(); stage = null; }
    cube = null; tileMeshes = {};
    if (keyHandler) { window.removeEventListener('keydown', keyHandler); keyHandler = null; }
  };
}

function renderGoals(api) {
  const g = $('#cube-goals');
  if (!g) return;
  g.innerHTML = GOALS.map((go, i) => `
    <div class="goal ${api.data.stage > i ? 'done' : api.data.stage === i ? 'active' : ''}">
      <span class="goal-n">${i + 1}</span>
      <span>Стена <b>${go.label}</b> надолу върху ${i === 0 ? 'далечната' : 'близката'} златна плоча</span>
    </div>`).join('');
}

function renderState(api) {
  const o = api.data.ori;
  const d = $('#cs-down'), u = $('#cs-up'), m = $('#cs-moves');
  if (d) d.textContent = FACES[o[1]];
  if (u) u.textContent = FACES[o[0]];
  if (m) m.textContent = api.data.moves || 0;
}

function move(api, dir) {
  if (rolling || api.solved || !cube) return;
  const d = api.data;
  const nx = d.pos.x + STEP[dir][0], nz = d.pos.z + STEP[dir][1];
  if (nx < 0 || nz < 0 || nx >= N || nz >= N) {
    api.sfx.bad(); api.toast('Отвъд плочите има само пясък. Кубът не мърда.', '');
    return;
  }
  if (BLOCKED.some(b => b[0] === nx && b[1] === nz)) {
    api.sfx.bad();
    api.fx.shakeScreen(6, 260);
    api.fail('Плочата е счупена — кубът щеше да пропадне. Изгуби време да го задържиш.');
    return;
  }
  rolling = true;
  animateRoll(api, dir, () => {
    d.pos = { x: nx, z: nz };
    d.ori = ROLL[dir](d.ori);
    d.moves = (d.moves || 0) + 1;
    api.saveData();
    renderState(api);
    api.sfx.click();
    rolling = false;
    checkGoal(api);
  });
}

function checkGoal(api) {
  const d = api.data;
  const g = GOALS[d.stage];
  if (!g) return;
  if (d.pos.x === g.x && d.pos.z === g.z && d.ori[1] === g.face) {
    d.stage++; api.saveData();
    api.sfx.unlock();
    api.fx.flash('rgba(120,170,230,.24)', 700);
    api.fx.sparksFrom($('#stage'), { count: 42, color: '#bcd8ff', spread: 260 });
    lightTile(g, true);
    renderGoals(api);
    if (d.stage >= GOALS.length) {
      setTimeout(() => api.solve('Плочите потъват една след друга. Под последната блести руна и още едно зърно пясък.'), 800);
    } else {
      api.toast('Плочата пое стената и светна. Остава втората.', 'magic');
    }
  }
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    dist: 17, fov: 42, look: [0, 0.4, 0], theta: 0.34, phi: 0.72,
    minPolar: 0.2, maxPolar: 1.32, ground: true, groundColor: 0x0d0c14,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL. Бутоните вляво пак движат куба, но без картина.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  const tileGeo = new T.BoxGeometry(TILE * 0.94, 0.3, TILE * 0.94);
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    const broken = BLOCKED.some(b => b[0] === x && b[1] === z);
    const goal = GOALS.find(g => g.x === x && g.z === z);
    const mat = new T.MeshStandardMaterial({
      color: broken ? 0x2a2028 : goal ? 0x6d5a2a : 0x39404f,
      roughness: broken ? 1 : 0.7, metalness: goal ? 0.6 : 0.15,
      emissive: goal ? 0x3a2c08 : 0x000000, emissiveIntensity: goal ? 0.8 : 0,
    });
    const m = new T.Mesh(tileGeo, mat);
    m.position.set(wx(x), broken ? -0.32 : 0, wz(z));
    m.receiveShadow = true;
    if (broken) m.rotation.set(0.16, 0.4, -0.1);
    stage.add(m);
    tileMeshes[`${x},${z}`] = m;

    if (goal) {
      const gl = new T.Mesh(
        new T.PlaneGeometry(TILE * 0.7, TILE * 0.7),
        new T.MeshBasicMaterial({ map: labelTexture(T, goal.label, { color: '#ffe9a8' }), transparent: true })
      );
      gl.rotation.x = -Math.PI / 2;
      gl.position.set(wx(x), 0.17, wz(z));
      stage.add(gl);
    }
  }

  // кубът
  const mats = [4, 5, 0, 1, 3, 2].map(fi => new T.MeshStandardMaterial({
    map: labelTexture(T, FACES[fi], { color: '#f3e2b4', bg: '#2c2636' }),
    roughness: 0.55, metalness: 0.25,
  }));
  cube = new T.Mesh(new T.BoxGeometry(TILE * 0.9, TILE * 0.9, TILE * 0.9), mats);
  cube.castShadow = true;
  placeCube(api);
  stage.add(cube);

  // ако залата вече е решена — светваме плочите
  if (api.data.stage > 0) GOALS.slice(0, api.data.stage).forEach(g => lightTile(g, false));

  stage.onFrame((t) => {
    Object.entries(tileMeshes).forEach(([k, m]) => {
      const g = GOALS.find(go => `${go.x},${go.z}` === k);
      if (g && m.material.emissiveIntensity) {
        m.material.emissiveIntensity = 0.5 + Math.sin(t * 2.2) * 0.35;
      }
    });
  });
}

function wx(x) { return (x - (N - 1) / 2) * TILE; }
function wz(z) { return (z - (N - 1) / 2) * TILE; }

function placeCube(api) {
  if (!cube) return;
  cube.position.set(wx(api.data.pos.x), HALF * 0.9 + 0.15, wz(api.data.pos.z));
  cube.quaternion.identity();
  // възстановяваме въртенето от запазената подредба
  applyOrientation(api.data.ori);
}

/* привеждаме мрежата към логическата подредба чрез търсене на въртене */
function applyOrientation(ori) {
  if (!stage || !cube) return;
  const T = stage.THREE;
  const base = [0, 1, 2, 3, 4, 5];
  if (ori.every((v, i) => v === base[i])) return;
  // прилагаме същата поредица завъртания, която води до тази подредба
  const seq = findSequence(ori);
  const q = new T.Quaternion();
  seq.forEach(dir => {
    const axis = (dir === 'N' || dir === 'S') ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1);
    const ang = (dir === 'N' || dir === 'E') ? -Math.PI / 2 : Math.PI / 2;
    q.premultiply(new T.Quaternion().setFromAxisAngle(axis, ang));
  });
  cube.quaternion.copy(q);
}

function findSequence(target) {
  const start = [0, 1, 2, 3, 4, 5].join('');
  const goal = target.join('');
  if (start === goal) return [];
  const seen = new Set([start]);
  const q = [[[0, 1, 2, 3, 4, 5], []]];
  while (q.length) {
    const [o, path] = q.shift();
    for (const d of ['N', 'S', 'E', 'W']) {
      const no = ROLL[d](o), k = no.join('');
      if (seen.has(k)) continue;
      if (k === goal) return [...path, d];
      seen.add(k);
      if (path.length < 6) q.push([no, [...path, d]]);
    }
  }
  return [];
}

function animateRoll(api, dir, done) {
  const T = stage.THREE;
  const startPos = cube.position.clone();
  const startQuat = cube.quaternion.clone();
  const s = TILE * 0.9 / 2;
  const edge = startPos.clone();
  edge.y = 0.15;
  if (dir === 'N') edge.z -= s;
  if (dir === 'S') edge.z += s;
  if (dir === 'E') edge.x += s;
  if (dir === 'W') edge.x -= s;
  const axis = (dir === 'N' || dir === 'S') ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1);
  const total = (dir === 'N' || dir === 'E') ? -Math.PI / 2 : Math.PI / 2;

  const t0 = performance.now(), dur = 260;
  (function step() {
    const p = Math.min(1, (performance.now() - t0) / dur);
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const q = new T.Quaternion().setFromAxisAngle(axis, total * e);
    cube.position.copy(startPos).sub(edge).applyQuaternion(q).add(edge);
    cube.quaternion.copy(q).multiply(startQuat);
    if (p < 1) requestAnimationFrame(step);
    else done();
  })();
}

function lightTile(goal, burst) {
  const m = tileMeshes[`${goal.x},${goal.z}`];
  if (!m) return;
  m.material.color.setHex(0x2e8f5f);
  m.material.emissive.setHex(0x1c6b46);
  m.material.emissiveIntensity = 0;
}
