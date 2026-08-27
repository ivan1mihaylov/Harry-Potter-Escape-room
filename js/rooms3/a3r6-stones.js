/* ============================================================
   ТРЕТА ЧАСТ · ПОЛЯНА VI — Камъните на гората
   Шестнайсет изправени камъка. Пипнеш ли един, будиш и съседите му.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { plantForest, addFireflies, addMoonshaft, FOREST_STAGE } from './common3.js';

export const meta = {
  id: 'a3-stones',
  eyebrow: 'Поляна VI',
  title: 'Камъните на гората',
  sub: 'Кръг от шестнайсет камъка, повечето потънали в мъха. Гората ги е забила тук преди Основателите и иска всичките отново да стоят изправени.',
  rune: 'Т',
  grain: null,
  bg: 'off',
  tint: '#a8d8b8',
  hints: [
    'Всяко докосване обръща <b>самия камък и четиримата му съседи</b> — горе, долу, ляво и дясно. По диагонал нищо не се случва.',
    'Редът няма значение, а двукратното докосване на един и същ камък не променя нищо. Значи търсиш <b>кои</b> камъни да докоснеш, не в какъв ред.',
    'Работи ред по ред: щом даден камък от горния ред е още потънал, натисни камъка <b>точно под него</b>. Стигнеш ли до последния ред и той не е изправен — започни отначало с друга комбинация в първия ред.',
    'Решението е седем докосвания: ред 2 — камъни 3 и 4; ред 3 — камъни 1, 3 и 4; ред 4 — камъни 2 и 4.',
  ],
};

const N = 4;
const START = [[0, 0, 1, 1], [1, 1, 1, 1], [1, 1, 1, 0], [0, 1, 1, 0]];

let stage = null, stoneObjs = [];

export function mount(root, api) {
  const d = api.data;
  if (!d.grid) { d.grid = START.map(r => [...r]); d.taps = 0; }
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Гората иска реда си обратно</h4>
            <p>Камък, който <b>спи</b>, е потънал в мъха. Камък, който <b>стои</b>, свети слабо.
            Изправи и шестнайсетте.</p>
            <p style="font-size:.93rem">Докосването буди камъка <b>и четиримата му съседи</b> —
            онова, което е било изправено, потъва, и обратно.</p>
          </div>
          <div class="knight-hud">
            <div class="kh-item"><span>изправени</span><b id="st-up">0 / 16</b></div>
            <div class="kh-item"><span>докосвания</span><b id="st-taps">0</b></div>
          </div>
          <div class="stone-mini" id="stone-mini"></div>
          <div class="center mt"><button class="btn btn-ghost btn-sm" id="st-reset"><span>Върни камъните както бяха</span></button></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Мъхът се раздвижва…</div></div>
      </div>
    </div>`;

  $('#st-reset').addEventListener('click', () => {
    const d = api.data;
    d.grid = START.map(r => [...r]); d.taps = 0; api.saveData();
    api.sfx.click(); refresh(api);
  });

  renderMini(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } stoneObjs = []; };
}

function renderMini(api) {
  const box = $('#stone-mini');
  if (!box) return;
  box.innerHTML = api.data.grid.map((row, i) =>
    row.map((v, j) => `<button class="sm${v ? '' : ' up'}" data-i="${i}" data-j="${j}"></button>`).join('')
  ).join('');
  $$('.sm', box).forEach(b => b.addEventListener('click', () => tap(api, +b.dataset.i, +b.dataset.j)));
  const up = $('#st-up'), t = $('#st-taps');
  const count = api.data.grid.flat().filter(v => v === 0).length;
  if (up) up.textContent = `${count} / 16`;
  if (t) t.textContent = api.data.taps || 0;
}

function tap(api, i, j) {
  if (api.solved) return;
  const d = api.data;
  [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => {
    const x = i + a, y = j + b;
    if (x >= 0 && y >= 0 && x < N && y < N) d.grid[x][y] ^= 1;
  });
  d.taps = (d.taps || 0) + 1;
  api.saveData();
  api.sfx.click();
  refresh(api);

  if (d.grid.flat().every(v => v === 0)) {
    api.sfx.unlock();
    api.fx.flash('rgba(150,220,180,.24)', 900);
    api.fx.sparksFrom($('#stage'), { count: 55, color: '#a8f0c0', spread: 300 });
    setTimeout(() => api.solve('Шестнайсетте камъка стоят изправени за пръв път от хиляда години. В средата на кръга свети руна.'), 900);
  }
}

function refresh(api) {
  renderMini(api);
  stoneObjs.forEach(o => { o.target = api.data.grid[o.i][o.j] ? -1.55 : 0; });
}

/* ---------- 3D ---------- */
const SP = 3.0;
const px = j => (j - (N - 1) / 2) * SP;
const pz = i => (i - (N - 1) / 2) * SP;

async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...FOREST_STAGE, dist: 21, fov: 46, look: [0, 1.2, 0],
    theta: 0.3, phi: 0.86, minPolar: 0.24, maxPolar: 1.36,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL, но малката схема вляво работи и без него.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  plantForest(stage, { count: 38, inner: 13, outer: 28 });
  addFireflies(stage, { count: 55, color: 0xa8f0c0 });
  addMoonshaft(stage, { r: 6.5, h: 24, color: 0xcfe8d8 });

  const picks = [];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const g = new T.Group();
    const mat = new T.MeshStandardMaterial({ color: 0x6a6a62, roughness: 0.95,
      emissive: 0x1a3a26, emissiveIntensity: 0.2 });
    const stone = new T.Mesh(new T.CylinderGeometry(0.55, 0.75, 3.1, 7), mat);
    stone.position.y = 1.55;
    stone.rotation.y = (i * 7 + j * 3) * 0.4;
    stone.castShadow = true; stone.receiveShadow = true;
    const cap = new T.Mesh(new T.SphereGeometry(0.58, 10, 6, 0, 6.3, 0, 1.2), mat);
    cap.position.y = 3.05;
    const moss = new T.Mesh(new T.TorusGeometry(0.78, 0.16, 6, 16),
      new T.MeshStandardMaterial({ color: 0x2e5a38, roughness: 1 }));
    moss.rotation.x = Math.PI / 2; moss.position.y = 0.12;
    g.add(stone, cap, moss);
    g.position.set(px(j), 0, pz(i));
    g.userData = { pick: true, i, j };
    g.traverse(c => { c.userData.pick = c.userData.pick || false; });
    stage.add(g);
    stoneObjs.push({ g, i, j, mat, cur: 0, target: 0 });
    picks.push(g);
  }

  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && !(n.userData && n.userData.i != null) && n.parent) n = n.parent;
    if (n && n.userData && n.userData.i != null) tap(api, n.userData.i, n.userData.j);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  refresh(api);
  stoneObjs.forEach(o => { o.cur = o.target; o.g.position.y = o.target; });

  stage.onFrame((t) => {
    stoneObjs.forEach((o, k) => {
      o.cur += (o.target - o.cur) * 0.12;
      o.g.position.y = o.cur;
      const up = o.target === 0;
      o.mat.emissiveIntensity = up ? 0.35 + Math.sin(t * 1.6 + k) * 0.18 : 0.05;
      o.mat.emissive.setHex(up ? 0x2e7a4a : 0x101a12);
    });
  });
}
