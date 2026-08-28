/* ============================================================
   ТРЕТА ЧАСТ · ПОЛЯНА V — Лунният лъч
   Раненият еднорог не издържа до сутринта без лунна светлина.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { plantForest, addFireflies, addMist, FOREST_STAGE } from './common3.js';

export const meta = {
  id: 'a3-moonbeam',
  eyebrow: 'Поляна V',
  title: 'Лунният лъч',
  sub: 'Сребърна кръв по листата, а в края на дирята — еднорог, който още диша. Лунната светлина ще го задържи жив, ако някой я доведе дотам.',
  rune: 'С',
  grain: null,
  bg: 'off',
  tint: '#cfe0ff',
  hints: [
    'Всяко огледало има две положения — <b>/</b> и <b>\\</b>. Докосни го, за да го обърнеш. Лъчът тръгва отляво и върви на изток, докато не срещне огледало, стена или ръба на поляната.',
    'Работи назад: от еднорога погледни от коя страна трябва да дойде лъчът и кое огледало може да го прати оттам. После нагласи предпоследното.',
    'Верните положения са: огледалото горе вляво <b>/</b>, следващите две по средата <b>\\</b> и <b>\\</b>, а двете вдясно <b>/</b> и <b>\\</b>. Ако броиш от началото на лъча: /, \\, \\, /, \\.',
  ],
};

const G = 6;
const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const SOLUTION = [
  { x: 0, y: 1, o: '/' }, { x: 2, y: 3, o: '\\' }, { x: 5, y: 3, o: '/' },
  { x: 2, y: 1, o: '\\' }, { x: 5, y: 2, o: '\\' },
];
const WALLS = [[4, 4], [5, 0], [2, 4]];
const TARGET = [0, 3];
const ENTRY = { pos: [-1, 2], dir: 'E' };

let stage = null, mirrorMeshes = [], beamGroup = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.orient) d.orient = SOLUTION.map(() => '/');
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Кръвта на еднорога</h4>
            <p>„Лъчът влиза откъм <b>запад</b> и върви право, докато не срещне нещо. Огледалата
            го чупят под прав ъгъл; камъните го поглъщат.“</p>
            <p style="font-size:.93rem">Обърни петте огледала така, че светлината да стигне до
            еднорога. Докосни огледало, за да смениш наклона му.</p>
          </div>
          <div class="beam-hud">
            <div class="bh-item"><span>стигна ли</span><b id="mb-hit">не</b></div>
            <div class="bh-item"><span>обръщания</span><b id="mb-turns">0</b></div>
          </div>
          <div class="mirror-list" id="mirror-list"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Луната се показва…</div></div>
      </div>
    </div>`;

  renderList(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } mirrorMeshes = []; beamGroup = null; };
}

function renderList(api) {
  const box = $('#mirror-list');
  if (!box) return;
  box.innerHTML = SOLUTION.map((m, i) =>
    `<button class="mirror-btn" data-i="${i}">
       <span class="mb-pos">${String.fromCharCode(65 + m.x)}${m.y + 1}</span>
       <span class="mb-slash">${api.data.orient[i]}</span>
     </button>`).join('');
  $$('.mirror-btn', box).forEach(b => b.addEventListener('click', () => flip(api, +b.dataset.i)));
  const t = $('#mb-turns');
  if (t) t.textContent = api.data.turns || 0;
}

function flip(api, i) {
  if (api.solved) return;
  const d = api.data;
  d.orient[i] = d.orient[i] === '/' ? '\\' : '/';
  d.turns = (d.turns || 0) + 1;
  api.saveData();
  api.sfx.click();
  renderList(api);
  updateBeam(api);
}

function trace(orient) {
  let [x, y] = ENTRY.pos, d = ENTRY.dir, steps = 0;
  const path = [];
  while (steps++ < 120) {
    const [dx, dy] = DIRS[d];
    x += dx; y += dy;
    if (x < 0 || y < 0 || x >= G || y >= G) return { hit: false, path };
    path.push([x, y]);
    if (WALLS.some(w => w[0] === x && w[1] === y)) return { hit: false, path };
    if (x === TARGET[0] && y === TARGET[1]) return { hit: true, path };
    const mi = SOLUTION.findIndex(m => m.x === x && m.y === y);
    if (mi >= 0) {
      const map = orient[mi] === '/'
        ? { E: 'N', N: 'E', W: 'S', S: 'W' }
        : { E: 'S', S: 'E', W: 'N', N: 'W' };
      d = map[d];
    }
  }
  return { hit: false, path };
}

function updateBeam(api) {
  applyOrient(api);
  const r = trace(api.data.orient);
  const h = $('#mb-hit');
  if (h) { h.textContent = r.hit ? 'да' : 'не'; h.classList.toggle('yes', r.hit); }
  drawBeam(r.path, r.hit);
  if (r.hit && !api.solved) {
    api.sfx.unlock();
    api.fx.flash('rgba(200,220,255,.26)', 900);
    api.fx.sparksFrom($('#stage'), { count: 50, color: '#dfe8ff', spread: 280 });
    setTimeout(() => api.solve('Лъчът ляга върху хълбока на еднорога и раната се затваря като процеп в лед. Той оставя в тревата руна и изчезва между дърветата.'), 1000);
  }
}

/* ---------- 3D ---------- */
const T_SZ = 2.2;
const gx = x => (x - (G - 1) / 2) * T_SZ;
const gz = y => (y - (G - 1) / 2) * T_SZ;

async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...FOREST_STAGE, dist: 22, fov: 44, look: [0, 0.6, 0],
    theta: 0.1, phi: 0.7, minPolar: 0.2, maxPolar: 1.34,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL, но огледалата вляво се обръщат и без него.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  plantForest(stage, { count: 36, inner: 13, outer: 28 });
  addMist(stage, { count: 8 });
  addFireflies(stage, { count: 40, color: 0xc0d8ff });

  const tile = new T.MeshStandardMaterial({ color: 0x1c2a22, roughness: 1 });
  const tileB = new T.MeshStandardMaterial({ color: 0x18241d, roughness: 1 });
  for (let x = 0; x < G; x++) for (let y = 0; y < G; y++) {
    const m = new T.Mesh(new T.BoxGeometry(T_SZ * 0.94, 0.1, T_SZ * 0.94), (x + y) % 2 ? tile : tileB);
    m.position.set(gx(x), 0, gz(y));
    m.receiveShadow = true;
    stage.add(m);
  }

  WALLS.forEach(([x, y]) => {
    const s = new T.Mesh(new T.DodecahedronGeometry(0.95, 0),
      new T.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 1 }));
    s.position.set(gx(x), 0.9, gz(y));
    s.castShadow = true;
    stage.add(s);
  });

  const picks = [];
  SOLUTION.forEach((m, i) => {
    const g = new T.Group();
    const post = new T.Mesh(new T.CylinderGeometry(0.09, 0.12, 1.3, 6),
      new T.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.85 }));
    post.position.y = 0.65;
    const glass = new T.Mesh(new T.BoxGeometry(1.7, 1.15, 0.08),
      new T.MeshStandardMaterial({ color: 0xdfe8ff, roughness: 0.06, metalness: 0.95,
        emissive: 0x2a3548, emissiveIntensity: 0.5 }));
    glass.position.y = 1.55; glass.castShadow = true;
    const frame = new T.Mesh(new T.BoxGeometry(1.9, 1.35, 0.05),
      new T.MeshStandardMaterial({ color: 0x8a7250, roughness: 0.5, metalness: 0.6 }));
    frame.position.set(0, 1.55, -0.05);
    g.add(post, frame, glass);
    g.position.set(gx(m.x), 0, gz(m.y));
    g.userData = { pick: true, mirror: i };
    g.traverse(c => { c.userData.pick = c.userData.pick || false; });
    stage.add(g);
    mirrorMeshes.push(g);
    picks.push(g);
  });

  // еднорогът
  const uni = buildUnicorn(T);
  uni.position.set(gx(TARGET[0]), 0, gz(TARGET[1]));
  stage.add(uni);

  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && !(n.userData && n.userData.mirror != null) && n.parent) n = n.parent;
    if (n && n.userData && n.userData.mirror != null) flip(api, n.userData.mirror);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  beamGroup = new T.Group();
  stage.add(beamGroup);

  applyOrient(api);
  updateBeam(api);

  stage.onFrame((t) => {
    uni.position.y = Math.sin(t * 0.8) * 0.04;
    beamGroup.children.forEach((c, i) => {
      if (c.material && c.material.opacity != null) c.material.opacity = 0.55 + Math.sin(t * 3 + i) * 0.2;
    });
  });
}

function applyOrient(api) {
  if (!mirrorMeshes.length) return;
  mirrorMeshes.forEach((g, i) => {
    g.rotation.y = api.data.orient[i] === '/' ? Math.PI / 4 : -Math.PI / 4;
  });
}

function drawBeam(path, hit) {
  if (!stage || !beamGroup) return;
  const T = stage.THREE;
  while (beamGroup.children.length) {
    const c = beamGroup.children.pop();
    if (c.geometry) c.geometry.dispose();
    beamGroup.remove(c);
  }
  const pts = [[ENTRY.pos[0], ENTRY.pos[1]], ...path];
  const color = hit ? 0xdfe8ff : 0x8fa8d8;
  for (let i = 1; i < pts.length; i++) {
    const a = new T.Vector3(gx(pts[i - 1][0]), 1.55, gz(pts[i - 1][1]));
    const b = new T.Vector3(gx(pts[i][0]), 1.55, gz(pts[i][1]));
    const len = a.distanceTo(b);
    if (!len) continue;
    const m = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, len, 6),
      new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
    m.position.copy(a).lerp(b, 0.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    beamGroup.add(m);
  }
}

function buildUnicorn(T) {
  /* Еднорогът лежи ранен в тревата и гледа към +X. */
  const g = new T.Group();
  const coat = new T.MeshStandardMaterial({ color: 0xf2f4f8, roughness: 0.5,
    emissive: 0x50607a, emissiveIntensity: 0.45 });
  const mane = new T.MeshStandardMaterial({ color: 0xdfe6f2, roughness: 0.35,
    emissive: 0x6a7ea0, emissiveIntensity: 0.6 });
  const hornMat = new T.MeshStandardMaterial({ color: 0xfff4d0, roughness: 0.18,
    metalness: 0.7, emissive: 0x8a7a40, emissiveIntensity: 0.6 });
  const hoofMat = new T.MeshStandardMaterial({ color: 0x2a2e38, roughness: 0.45, metalness: 0.2 });

  const body = new T.Mesh(new T.CapsuleGeometry(0.44, 1.15, 8, 16), coat);
  body.rotation.z = Math.PI / 2; body.position.set(0, 0.48, 0);
  body.scale.set(1, 1, 0.82);
  const rump = new T.Mesh(new T.SphereGeometry(0.44, 12, 10), coat);
  rump.position.set(-0.7, 0.5, 0); rump.scale.set(0.95, 1, 0.82);
  const chest = new T.Mesh(new T.SphereGeometry(0.42, 12, 10), coat);
  chest.position.set(0.66, 0.5, 0); chest.scale.set(1, 1.02, 0.85);
  g.add(body, rump, chest);

  /* прегънатите крака под тялото */
  [[0.52, 0.3], [0.5, -0.32], [-0.58, 0.28], [-0.56, -0.3]].forEach(([x, z], k) => {
    const up = new T.Mesh(new T.CylinderGeometry(0.11, 0.075, 0.62, 7), coat);
    up.position.set(x, 0.3, z * 1.15);
    up.rotation.set(Math.PI / 2 - 0.25, 0, k < 2 ? 0.35 : -0.3);
    const lo = new T.Mesh(new T.CylinderGeometry(0.06, 0.045, 0.56, 6), coat);
    lo.position.set(x + (k < 2 ? 0.36 : -0.34), 0.12, z * 1.5);
    lo.rotation.set(Math.PI / 2, 0, k < 2 ? -0.5 : 0.5);
    const hoof = new T.Mesh(new T.CylinderGeometry(0.06, 0.075, 0.12, 7), hoofMat);
    hoof.position.set(x + (k < 2 ? 0.62 : -0.58), 0.1, z * 1.7);
    hoof.rotation.z = Math.PI / 2;
    g.add(up, lo, hoof);
  });

  /* извит врат — главата е вдигната, животното още диша */
  const neck = new T.Group();
  neck.position.set(0.72, 0.72, 0);
  for (let k = 0; k < 5; k++) {
    const v = new T.Mesh(new T.CylinderGeometry(0.15 - k * 0.012, 0.19 - k * 0.012, 0.24, 8), coat);
    v.position.set(k * 0.1, k * 0.19, 0);
    v.rotation.z = -0.48;
    neck.add(v);
    const tuft = new T.Mesh(new T.CylinderGeometry(0.055, 0.02, 0.34, 5), mane);
    tuft.position.set(k * 0.1 - 0.11, k * 0.19 + 0.06, 0);
    tuft.rotation.z = 0.75;
    neck.add(tuft);
  }
  g.add(neck);

  /* конска глава: череп, муцуна, ноздра, ухо, око */
  const headG = new T.Group();
  headG.position.set(1.22, 1.62, 0);
  headG.rotation.z = -0.3;
  const skull = new T.Mesh(new T.SphereGeometry(0.19, 12, 10), coat);
  skull.scale.set(1.2, 0.95, 0.88);
  const muzzle = new T.Mesh(new T.CylinderGeometry(0.075, 0.13, 0.46, 8), coat);
  muzzle.rotation.z = Math.PI / 2 - 0.1; muzzle.position.set(0.3, -0.06, 0);
  const chin = new T.Mesh(new T.SphereGeometry(0.085, 8, 6), coat);
  chin.position.set(0.5, -0.09, 0);
  headG.add(skull, muzzle, chin);
  [-1, 1].forEach(sz => {
    const ear = new T.Mesh(new T.ConeGeometry(0.055, 0.2, 6), coat);
    ear.position.set(-0.12, 0.18, sz * 0.1); ear.rotation.set(sz * 0.3, 0, 0.25);
    const eye = new T.Mesh(new T.SphereGeometry(0.035, 8, 6),
      new T.MeshBasicMaterial({ color: 0x2b3550 }));
    eye.position.set(0.08, 0.03, sz * 0.14);
    const nos = new T.Mesh(new T.SphereGeometry(0.022, 6, 5),
      new T.MeshBasicMaterial({ color: 0x8f9ab0 }));
    nos.position.set(0.51, -0.04, sz * 0.05);
    headG.add(ear, eye, nos);
  });

  /* витият рог: конус с пръстени, които правят спиралата */
  const horn = new T.Mesh(new T.ConeGeometry(0.062, 0.86, 8), hornMat);
  horn.position.set(0.06, 0.52, 0); horn.rotation.z = -0.22;
  headG.add(horn);
  const HT = -0.22, hdx = Math.sin(-HT), hdy = Math.cos(HT);   /* оста на рога */
  for (let k = 0; k < 7; k++) {
    const t = k / 6, along = 0.1 + t * 0.68;
    const ring = new T.Mesh(
      new T.TorusGeometry(0.062 * (1 - t * 0.82) + 0.006, 0.013, 5, 12), hornMat);
    ring.position.set(0.06 + hdx * along, 0.09 + hdy * along, 0);
    ring.rotation.set(Math.PI / 2, Math.PI + HT, 0);
    headG.add(ring);
  }
  g.add(headG);

  /* грива и опашка */
  for (let k = 0; k < 6; k++) {
    const str = new T.Mesh(new T.CylinderGeometry(0.035, 0.012, 0.6 + (k % 3) * 0.2, 5), mane);
    str.position.set(-0.95 - k * 0.03, 0.5 - k * 0.05, (k - 2.5) * 0.06);
    str.rotation.set(0, 0, 1.05 + k * 0.05);
    g.add(str);
  }

  /* сребърната рана на хълбока — заради нея си тук */
  const wound = new T.Mesh(new T.SphereGeometry(0.17, 10, 8),
    new T.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.75 }));
  wound.position.set(-0.15, 0.62, 0.36); wound.scale.set(1.3, 0.7, 0.3);
  g.add(wound);

  g.scale.setScalar(0.95);
  return g;
}
