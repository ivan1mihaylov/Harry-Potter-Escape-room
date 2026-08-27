/* ============================================================
   ЧЕТВЪРТА ЧАСТ · ЗАЛА V — Везните на пазача
   Дванадесет стъкленици с отнети спомени. Единадесет тежат
   еднакво. Едната лъже — но не се знае в коя посока.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { AZK_STAGE, addWalls, addFrost, addSlit, stoneMat } from './common4.js';

export const meta = {
  id: 'a4-scales',
  eyebrow: 'Зала V',
  title: 'Везните на пазача',
  sub: 'На каменната маса стоят дванадесет стъкленици и едни много стари везни. Пазачът пита кратко: «Коя от тях не е истинска — и по-тежка ли е, или по-лека?»',
  rune: 'М',
  bg: 'off',
  tint: '#d8c48f',
  hints: [
    'Три претегляния стигат за дванадесет — но само ако <b>първото е 4 срещу 4</b>. Никога не започвай с по-малко.',
    'Ако първите четири срещу четири са в равновесие, фалшивата е сред <b>останалите четири</b> и ти остават две претегляния за тях. Ако не са — знаеш и в коя четворка е, и коя посока подозираш.',
    'При второто претегляне <b>размесвай</b> стъклениците между блюдата и добавяй вече доказани като истински. Само така един наклон различава «по-тежка отляво» от «по-лека отдясно».',
  ],
};

const N = 12;
const FAKE = 8;          // индекс 0..11  → стъкленица №9
const FAKE_HEAVY = false; // фалшивата е по-лека
const FREE = 3;

let stage = null, beam = null, vials = [], panL = null, panR = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.side) d.side = Array(N).fill(0);   // 0 настрана, 1 ляво, 2 дясно
  if (!d.log) d.log = [];
  if (d.pickV == null) d.pickV = null;
  if (d.pickDir == null) d.pickDir = null;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <p class="panel-title">Стъклениците</p>
          <div class="vials" id="vials"></div>
          <div class="scale-ctl">
            <button class="btn btn-house btn-sm" id="do-weigh"><span>Претегли</span></button>
            <button class="btn btn-ghost btn-sm" id="do-clear"><span>Свали всичко</span></button>
          </div>
          <div class="weigh-log" id="weigh-log"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Везните се събуждат…</div></div>
      </div>
      <p class="center muted stage-help">Кликни стъкленица, за да я местиш: <b>настрана → ляво блюдо → дясно блюдо</b>.</p>
    </div>
    <div class="panel">
      <p class="panel-title">Отговорът пред пазача</p>
      <p class="muted">Посочи стъкленицата и кажи каква е. Един-единствен опит — сбъркаш ли, везните се изчистват и започваш отначало.</p>
      <div class="verdict">
        <div class="vd-row" id="vd-vials"></div>
        <div class="vd-row">
          <button class="vd-dir" data-dir="h">по-тежка</button>
          <button class="vd-dir" data-dir="l">по-лека</button>
        </div>
        <button class="btn btn-house" id="vd-go"><span>Пред пазача</span></button>
      </div>
    </div>`;

  drawVials(api); drawLog(api); drawVerdict(api); boot(api);

  $('#do-weigh').addEventListener('click', () => weigh(api));
  $('#do-clear').addEventListener('click', () => {
    if (api.solved) return;
    api.data.side = Array(N).fill(0); api.saveData();
    api.sfx.click(); drawVials(api); sync(api);
  });
  $('#vd-go').addEventListener('click', () => verdict(api));

  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } vials = []; beam = null; };
}

/* ---------- претегляне ---------- */
function weigh(api) {
  if (api.solved) return;
  const d = api.data;
  const L = [], R = [];
  d.side.forEach((s, i) => { if (s === 1) L.push(i); else if (s === 2) R.push(i); });
  if (!L.length || !R.length) { api.sfx.bad(); api.toast('Сложи стъкленици и от двете страни.', 'bad'); return; }
  if (L.length !== R.length) { api.sfx.bad(); api.toast('Блюдата трябва да носят по равен брой.', 'bad'); return; }

  const w = (i) => i === FAKE ? (FAKE_HEAVY ? 1.02 : 0.98) : 1;
  const sl = L.reduce((a, i) => a + w(i), 0);
  const sr = R.reduce((a, i) => a + w(i), 0);
  const res = sl > sr ? 'L' : sl < sr ? 'R' : '=';

  d.log.push({ L: [...L], R: [...R], res });
  api.saveData();
  api.sfx.coin();
  tilt(res);
  drawLog(api);

  if (d.log.length > FREE) {
    api.fail(`Четвърто претегляне. Пазачът въздиша и записва нещо.`, 45000);
  }
}

function tilt(res) {
  if (!beam) return;
  beam.userData.target = res === 'L' ? 0.22 : res === 'R' ? -0.22 : 0;
  setTimeout(() => { if (beam) beam.userData.target = 0; }, 2600);
}

/* ---------- присъда ---------- */
function verdict(api) {
  if (api.solved) return;
  const d = api.data;
  if (d.pickV == null || !d.pickDir) { api.sfx.bad(); api.toast('Избери стъкленица и посока.', 'bad'); return; }
  const right = d.pickV === FAKE && d.pickDir === (FAKE_HEAVY ? 'h' : 'l');
  if (!right) {
    d.log = []; d.side = Array(N).fill(0); d.pickV = null; d.pickDir = null;
    api.saveData();
    api.fx.shakeScreen(14, 600);
    api.fail('Пазачът поклаща глава. Везните се изчистват и трите претегляния се връщат отначало.', 60000);
    drawVials(api); drawLog(api); drawVerdict(api); sync(api);
    return;
  }
  api.sfx.unlock();
  api.fx.celebrate(1.5);
  api.solve(`Стъкленица №${FAKE + 1} — по-лека, защото в нея няма нищо. Пазачът я счупва в пода и от парчетата остава руна.`);
  drawVerdict(api);
}

/* ---------- рисуване ---------- */
function drawVials(api) {
  const d = api.data;
  const box = $('#vials'); if (!box) return;
  box.innerHTML = Array.from({ length: N }, (_, i) => {
    const s = d.side[i];
    return `<button class="vial${s === 1 ? ' left' : s === 2 ? ' right' : ''}" data-i="${i}">
      <span class="v-glass"></span><b>${i + 1}</b>
      <em>${s === 1 ? 'ляво' : s === 2 ? 'дясно' : '—'}</em></button>`;
  }).join('');
  $$('.vial', box).forEach(b => b.addEventListener('click', () => {
    if (api.solved) return;
    const i = +b.dataset.i;
    d.side[i] = (d.side[i] + 1) % 3;
    api.saveData(); api.sfx.tick();
    drawVials(api); sync(api);
  }));
}

function drawLog(api) {
  const box = $('#weigh-log'); if (!box) return;
  const d = api.data;
  const left = Math.max(0, FREE - d.log.length);
  box.innerHTML = `
    <div class="wl-head">претегляния: <b>${d.log.length}</b>${left ? ` · остават ${left} без глоба` : ' · всяко следващо струва време'}</div>
    ${d.log.map((e, i) => `<div class="wl-row">
      <span class="wl-n">${i + 1}</span>
      <span class="wl-set">${e.L.map(x => x + 1).join(' ')}</span>
      <span class="wl-sign ${e.res === 'L' ? 'gt' : e.res === 'R' ? 'lt' : 'eq'}">${e.res === 'L' ? '&gt;' : e.res === 'R' ? '&lt;' : '='}</span>
      <span class="wl-set">${e.R.map(x => x + 1).join(' ')}</span>
    </div>`).join('') || '<div class="wl-empty">още нищо не е тежено</div>'}`;
}

function drawVerdict(api) {
  const d = api.data;
  const row = $('#vd-vials'); if (!row) return;
  row.innerHTML = Array.from({ length: N }, (_, i) =>
    `<button class="vd-v${d.pickV === i ? ' on' : ''}" data-i="${i}">${i + 1}</button>`).join('');
  $$('.vd-v', row).forEach(b => b.addEventListener('click', () => {
    if (api.solved) return;
    d.pickV = +b.dataset.i; api.saveData(); api.sfx.tick(); drawVerdict(api);
  }));
  $$('.vd-dir').forEach(b => {
    b.classList.toggle('on', d.pickDir === b.dataset.dir);
    b.onclick = () => {
      if (api.solved) return;
      d.pickDir = b.dataset.dir; api.saveData(); api.sfx.tick(); drawVerdict(api);
    };
  });
  const go = $('#vd-go');
  if (go) go.disabled = !!api.solved;
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...AZK_STAGE, ground: true, groundColor: 0x14181f, dist: 17, fov: 42, look: [0, 2.6, 0],
    theta: 0.22, phi: 0.96, minPolar: 0.35, maxPolar: 1.34,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за везните — стъклениците и дневникът вляво работят и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  addWalls(stage, { w: 20, h: 9, d: 16, tint: 0x161a21 });
  addFrost(stage, { count: 40, radius: 7, height: 8 });
  addSlit(stage, { x: 0, z: -5, w: 0.8, h: 10 });

  const post = new T.Mesh(new T.CylinderGeometry(0.18, 0.28, 4.4, 12), stoneMat(T, 0x6a6152));
  post.position.set(0, 2.2, 0);
  post.castShadow = true;
  stage.add(post);
  const base = new T.Mesh(new T.CylinderGeometry(1.4, 1.7, 0.3, 20), stoneMat(T, 0x4a4740));
  base.position.y = 0.15;
  stage.add(base);

  beam = new T.Group();
  const bar = new T.Mesh(new T.BoxGeometry(7, 0.16, 0.22),
    new T.MeshStandardMaterial({ color: 0xb9a06a, roughness: 0.45, metalness: 0.7 }));
  beam.add(bar);
  beam.position.y = 4.3;
  beam.userData.target = 0;
  stage.add(beam);

  const mkPan = (sx) => {
    const g = new T.Group();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const w = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1.5, 4),
        new T.MeshStandardMaterial({ color: 0x8a7a55, metalness: 0.6, roughness: 0.5 }));
      w.position.set(Math.sin(a) * 0.75, -0.75, Math.cos(a) * 0.75);
      w.rotation.z = Math.sin(a) * 0.45;
      w.rotation.x = -Math.cos(a) * 0.45;
      g.add(w);
    }
    const dish = new T.Mesh(new T.CylinderGeometry(0.9, 0.7, 0.12, 22),
      new T.MeshStandardMaterial({ color: 0x9a8760, metalness: 0.75, roughness: 0.35 }));
    dish.position.y = -1.5;
    dish.receiveShadow = true;
    g.add(dish);
    g.position.x = sx;
    beam.add(g);
    return g;
  };
  panL = mkPan(-3.1);
  panR = mkPan(3.1);

  const glassMat = new T.MeshStandardMaterial({
    color: 0x9fd8e8, roughness: 0.12, metalness: 0.1,
    transparent: true, opacity: 0.55, emissive: 0x2a5a70, emissiveIntensity: 0.5,
  });
  for (let i = 0; i < N; i++) {
    const g = new T.Group();
    const body = new T.Mesh(new T.CylinderGeometry(0.19, 0.22, 0.5, 12), glassMat.clone());
    body.position.y = 0.25;
    const neck = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 0.2, 10), glassMat.clone());
    neck.position.y = 0.6;
    const cork = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.1, 10),
      new T.MeshStandardMaterial({ color: 0x8a6a44, roughness: 0.95 }));
    cork.position.y = 0.73;
    g.add(body, neck, cork);
    g.castShadow = true;
    stage.add(g);
    vials.push(g);
  }

  stage.onFrame((t, dt) => {
    if (!beam) return;
    const tg = beam.userData.target || 0;
    beam.rotation.z += (tg - beam.rotation.z) * 0.07;
    if (panL) panL.rotation.z = -beam.rotation.z;
    if (panR) panR.rotation.z = -beam.rotation.z;
    const sn = Math.sin(beam.rotation.z);
    vials.forEach(v => {
      if (!v.userData.to) return;
      const s = v.userData.pan || 0;
      const dy = s === 1 ? -3.1 * sn : s === 2 ? 3.1 * sn : 0;
      const to = v.userData.to;
      v.position.lerp(new T.Vector3(to.x, to.y + dy, to.z), 0.14);
    });
  });

  sync(api);
}

function sync(api) {
  if (!stage || !vials.length) return;
  const T = stage.THREE;
  const d = api.data;
  const li = [], ri = [], off = [];
  d.side.forEach((s, i) => (s === 1 ? li : s === 2 ? ri : off).push(i));
  const place = (list, cx, cy, cz, r, pan) => list.forEach((i, k) => {
    const a = (k / Math.max(1, list.length)) * Math.PI * 2;
    vials[i].userData.pan = pan;
    vials[i].userData.to = new T.Vector3(cx + Math.sin(a) * r, cy, cz + Math.cos(a) * r);
  });
  place(li, -3.1, 2.92, 0, 0.42, 1);
  place(ri, 3.1, 2.92, 0, 0.42, 2);
  off.forEach((i, k) => {
    vials[i].userData.pan = 0;
    vials[i].userData.to = new T.Vector3(-2.75 + (k % 6) * 1.1, 0.34, 3.4 + Math.floor(k / 6) * 1.0);
  });
}
