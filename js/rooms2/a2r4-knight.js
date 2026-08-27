/* ============================================================
   ВТОРА ЧАСТ · ЗАЛА IV — Рицарската задача
   Живият шах на Уизли, но само с една фигура: твоята.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage } from '../three-stage.js';

export const meta = {
  id: 'a2-knight',
  eyebrow: 'Зала IV',
  title: 'Рицарската задача',
  sub: 'Каменна дъска, на която някой преди трийсет години е пожертвал коня си, за да мине приятелят му. Този път конят си ти, {име} — и този път трябва да оцелееш.',
  rune: 'У',
  grain: 9,
  bg: 'off',
  tint: '#c9cdd4',
  hints: [
    'Червените полета са под обстрел — стъпиш ли там, дъската те взема. Белият цар обаче е целта: на него се стъпва.',
    'Шест скока, нито повече, нито по-малко. Ако си на седмия — значи някъде си направил излишен ход.',
    'Единственият път (с две разновидности в началото): b1 → <b>d2</b> (или a3) → <b>c4</b> → <b>d6</b> → <b>f7</b> → <b>h6</b> → <b>g8</b>.',
  ],
};

const T_SIZE = 1.5, MAX_JUMPS = 6;
const START = { x: 1, y: 0 };
const GOAL = { x: 6, y: 7 };
const PIECES = [
  { t: 'K', x: 6, y: 7, name: 'бял цар' },
  { t: 'R', x: 4, y: 4, name: 'бял топ' },
  { t: 'B', x: 7, y: 2, name: 'бял офицер' },
  { t: 'B', x: 0, y: 0, name: 'бял офицер' },
];
const JUMPS = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];

const inB = (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8;
const nameOf = (x, y) => String.fromCharCode(97 + x) + (y + 1);

/* полетата под обстрел се смятат веднъж, при зареждане */
const ATTACKED = (() => {
  const occ = new Set(PIECES.map(p => p.x + ',' + p.y));
  const A = new Set();
  const ray = (x, y, dirs) => {
    for (const [dx, dy] of dirs) {
      let cx = x + dx, cy = y + dy;
      while (inB(cx, cy)) { A.add(cx + ',' + cy); if (occ.has(cx + ',' + cy)) break; cx += dx; cy += dy; }
    }
  };
  PIECES.forEach(p => {
    if (p.t === 'R') ray(p.x, p.y, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
    if (p.t === 'B') ray(p.x, p.y, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  });
  return A;
})();
const OCCUPIED = new Set(PIECES.filter(p => p.t !== 'K').map(p => p.x + ',' + p.y));
const isBad = (x, y) => ATTACKED.has(x + ',' + y) || OCCUPIED.has(x + ',' + y);

let stage = null, knight = null, tiles = {}, marks = [], busy = false;

export function mount(root, api) {
  const d = api.data;
  if (!d.at) { d.at = { ...START }; d.path = []; }
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Издълбано в ръба на дъската</h4>
            <p>„Конят тръгва от <b>b1</b> и трябва да стигне белия цар на <b>g8</b> за
            <b>точно шест скока</b>. Полетата в червено са под обстрел — там дъската взема фигурата.“</p>
            <p style="font-size:.94rem">На белия цар <b>се стъпва</b> — това е целта, не капан.
            Шестият скок трябва да падне точно върху него: стигнеш ли го по-рано или изразходваш
            ли и шестия другаде, дъската те връща на <b>b1</b>.</p>
          </div>
          <div class="knight-hud">
            <div class="kh-item"><span>скокове</span><b id="kh-jumps">0 / ${MAX_JUMPS}</b></div>
            <div class="kh-item"><span>поле</span><b id="kh-sq">b1</b></div>
          </div>
          <div class="move-list" id="move-list"></div>
          <div class="center mt"><button class="btn btn-ghost btn-sm" id="kn-reset"><span>Върни коня в началото</span></button></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Дъската оживява…</div></div>
      </div>
    </div>`;

  busy = false;
  $('#kn-reset').addEventListener('click', () => { if (!busy) resetRun(api, false); });
  renderHud(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } knight = null; tiles = {}; marks = []; };
}

function renderHud(api) {
  const d = api.data;
  const j = $('#kh-jumps'), s = $('#kh-sq');
  if (j) j.textContent = `${d.path.length} / ${MAX_JUMPS}`;
  if (s) s.textContent = nameOf(d.at.x, d.at.y);
  const ml = $('#move-list');
  if (ml) ml.innerHTML = ['b1', ...d.path].map((n, i) =>
    `<span class="mv${i ? '' : ' start'}">${i ? `<b>${i}</b>` : ''}${n}</span>`).join('<i>→</i>');
}

function resetRun(api, penalty) {
  const d = api.data;
  busy = false;
  d.at = { ...START }; d.path = []; api.saveData();
  if (knight) placeKnight(api, false);
  renderHud(api);
  highlightMoves(api);
  if (penalty) api.fail('Седмият скок е излишен. Дъската изтръсква коня обратно на b1.');
  else api.sfx.click();
}

function tryMove(api, x, y) {
  if (api.solved || busy) return;
  const d = api.data;
  const dx = x - d.at.x, dy = y - d.at.y;
  if (!JUMPS.some(j => j[0] === dx && j[1] === dy)) {
    api.sfx.bad();
    api.toast('Конят не ходи така. Две напред и една встрани — или обратното.', '');
    return;
  }
  const isGoal = x === GOAL.x && y === GOAL.y;
  if (!isGoal && isBad(x, y)) {
    api.sfx.bad();
    api.fx.shakeScreen(9, 400);
    api.fx.flash('rgba(200,60,60,.22)', 500);
    api.fail(`Полето ${nameOf(x, y)} е под обстрел. Дъската щеше да те смачка.`);
    return;
  }
  d.at = { x, y };
  d.path.push(nameOf(x, y));
  api.saveData();
  api.sfx.click();
  placeKnight(api, true);
  renderHud(api);

  if (isGoal) {
    busy = true;
    highlightMoves(api, true);
    if (d.path.length === MAX_JUMPS) {
      api.sfx.unlock();
      api.fx.flash('rgba(230,230,240,.3)', 800);
      api.fx.sparksFrom($('#stage'), { count: 50, color: '#ffffff', spread: 300 });
      highlightMoves(api, true);
      setTimeout(() => api.solve('Царят се пропуква на две и се разсипва на прах. Между отломките — руна и зърно пясък.'), 900);
    } else {
      api.toast(`Стигна царя за ${d.path.length} скока — задачата иска <b>точно ${MAX_JUMPS}</b>. Дъската те връща.`, 'bad');
      setTimeout(() => resetRun(api, false), 900);
    }
    return;
  }
  if (d.path.length >= MAX_JUMPS) {
    busy = true;
    highlightMoves(api, true);
    setTimeout(() => resetRun(api, true), 700);
    return;
  }
  highlightMoves(api);
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    dist: 19, fov: 40, look: [0, 0.2, 0], theta: 0.1, phi: 0.72,
    minPolar: 0.18, maxPolar: 1.3, ground: true, groundColor: 0x0b0a10,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL, за да се покаже дъската.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  const geo = new T.BoxGeometry(T_SIZE * 0.97, 0.26, T_SIZE * 0.97);
  const picks = [];
  for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) {
    const light = (x + y) % 2 === 1;
    const bad = isBad(x, y);
    const goal = x === GOAL.x && y === GOAL.y;
    const mat = new T.MeshStandardMaterial({
      color: goal ? 0xd9c07a : bad ? (light ? 0x6a2b2b : 0x4a1c1c) : (light ? 0xcfd3da : 0x2e3440),
      roughness: 0.72, metalness: 0.12,
      emissive: bad ? 0x3a0d0d : 0x000000, emissiveIntensity: bad ? 0.5 : 0,
    });
    const m = new T.Mesh(geo, mat);
    m.position.set(wx(x), 0, wz(y));
    m.receiveShadow = true;
    m.userData = { pick: true, x, y, base: mat.color.clone(), bad, goal };
    stage.add(m);
    tiles[`${x},${y}`] = m;
    picks.push(m);
  }
  stage.setPickables(picks);
  stage.onPick((obj) => { if (obj && obj.userData && obj.userData.pick) tryMove(api, obj.userData.x, obj.userData.y); });

  PIECES.forEach(p => stage.add(buildPiece(T, p)));

  knight = buildKnight(T);
  stage.add(knight);
  placeKnight(api, false);
  highlightMoves(api, api.solved);

  stage.onFrame((t) => {
    marks.forEach((m, i) => { m.position.y = 0.2 + Math.sin(t * 3 + i) * 0.07; });
    const g = tiles[`${GOAL.x},${GOAL.y}`];
    if (g) g.material.emissiveIntensity = 0.25 + Math.sin(t * 2) * 0.2;
    if (g) g.material.emissive.setHex(0x6d5a2a);
  });
}

function wx(x) { return (x - 3.5) * T_SIZE; }
function wz(y) { return -(y - 3.5) * T_SIZE; }

function placeKnight(api, animate) {
  if (!knight) return;
  const d = api.data;
  const tx = wx(d.at.x), tz = wz(d.at.y);
  if (!animate) { knight.position.set(tx, 0.16, tz); return; }
  const from = knight.position.clone();
  const t0 = performance.now(), dur = 340;
  (function step() {
    const p = Math.min(1, (performance.now() - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    knight.position.x = from.x + (tx - from.x) * e;
    knight.position.z = from.z + (tz - from.z) * e;
    knight.position.y = 0.16 + Math.sin(p * Math.PI) * 1.5;
    knight.rotation.y = p * Math.PI * 2;
    if (p < 1) requestAnimationFrame(step);
  })();
}

function highlightMoves(api, clear) {
  if (!stage) return;
  const T = stage.THREE;
  marks.forEach(m => stage.pivot.remove(m));
  marks = [];
  if (clear || api.solved) return;
  const d = api.data;
  JUMPS.forEach(([dx, dy]) => {
    const x = d.at.x + dx, y = d.at.y + dy;
    if (!inB(x, y)) return;
    const goal = x === GOAL.x && y === GOAL.y;
    if (!goal && isBad(x, y)) return;
    const ring = new T.Mesh(
      new T.TorusGeometry(0.42, 0.07, 8, 28),
      new T.MeshBasicMaterial({ color: goal ? 0xffd98a : 0x8fd8ff, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(wx(x), 0.2, wz(y));
    stage.add(ring);
    marks.push(ring);
  });
}

/* ---------- фигури, изтеглени на струг (както са истинските) ---------- */
const STEM = [
  [0.00, 0.00], [0.56, 0.00], [0.56, 0.07], [0.50, 0.17], [0.42, 0.24],
  [0.45, 0.29], [0.36, 0.38], [0.29, 0.56],
];

function lathe(T, profile, mat, seg = 28) {
  const pts = profile.map(([x, y]) => new T.Vector2(Math.max(0.0001, x), y));
  const g = new T.LatheGeometry(pts, seg);
  g.computeVertexNormals();
  const m = new T.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function pieceMaterial(T, white) {
  return white
    ? new T.MeshStandardMaterial({ color: 0xf2eee4, roughness: 0.38, metalness: 0.08,
        emissive: 0x2a3348, emissiveIntensity: 0.18 })
    : new T.MeshStandardMaterial({ color: 0x24262f, roughness: 0.32, metalness: 0.35,
        emissive: 0x16324f, emissiveIntensity: 0.42 });
}

function buildPiece(T, p) {
  const mat = pieceMaterial(T, true);
  const g = new T.Group();
  let prof;

  if (p.t === 'K') {
    prof = [...STEM,
      [0.33, 0.63], [0.39, 0.74], [0.36, 1.06], [0.29, 1.30], [0.34, 1.39],
      [0.27, 1.47], [0.36, 1.57], [0.31, 1.68], [0.36, 1.77], [0.30, 1.86], [0.0, 1.90]];
    g.add(lathe(T, prof, mat));
    const v = new T.Mesh(new T.BoxGeometry(0.11, 0.46, 0.11), mat);
    v.position.y = 2.08; v.castShadow = true;
    const h = new T.Mesh(new T.BoxGeometry(0.34, 0.11, 0.11), mat);
    h.position.y = 2.14; h.castShadow = true;
    g.add(v, h);
  } else if (p.t === 'R') {
    prof = [...STEM,
      [0.33, 0.62], [0.38, 0.72], [0.37, 1.24], [0.43, 1.32], [0.45, 1.48],
      [0.38, 1.52], [0.0, 1.52]];
    g.add(lathe(T, prof, mat));
    const tooth = new T.BoxGeometry(0.17, 0.24, 0.17);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const b = new T.Mesh(tooth, mat);
      b.position.set(Math.sin(a) * 0.32, 1.62, Math.cos(a) * 0.32);
      b.rotation.y = a; b.castShadow = true;
      g.add(b);
    }
  } else {
    prof = [...STEM,
      [0.33, 0.62], [0.39, 0.73], [0.36, 0.98], [0.29, 1.18], [0.33, 1.28],
      [0.25, 1.35], [0.32, 1.44], [0.27, 1.58], [0.17, 1.80], [0.10, 1.94],
      [0.15, 2.00], [0.07, 2.08], [0.0, 2.12]];
    g.add(lathe(T, prof, mat));
    const knob = new T.Mesh(new T.SphereGeometry(0.10, 14, 12), mat);
    knob.position.y = 2.18; knob.castShadow = true;
    const slit = new T.Mesh(new T.BoxGeometry(0.05, 0.34, 0.30), pieceMaterial(T, true));
    slit.material = new T.MeshStandardMaterial({ color: 0x9aa0ab, roughness: .6 });
    slit.position.set(0, 1.80, 0.06); slit.rotation.z = 0.32;
    g.add(knob, slit);
  }
  g.position.set(wx(p.x), 0.14, wz(p.y));
  g.scale.setScalar(1.28);
  return g;
}

function buildKnight(T) {
  const mat = pieceMaterial(T, false);
  const g = new T.Group();
  g.add(lathe(T, [...STEM, [0.33, 0.62], [0.40, 0.72], [0.36, 0.86], [0.30, 0.94], [0.0, 0.96]], mat));

  // главата: истински профил на кон, изтеглен в дълбочина
  const sh = new T.Shape();
  const pts = [
    [-0.30, 0.00], [0.26, 0.00], [0.31, 0.30], [0.44, 0.52], [0.63, 0.64],
    [0.68, 0.83], [0.52, 0.93], [0.33, 0.98], [0.22, 1.22], [0.10, 1.04],
    [-0.02, 1.24], [-0.12, 0.98], [-0.30, 0.82], [-0.42, 0.54], [-0.36, 0.26],
  ];
  sh.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
  sh.closePath();

  const head = new T.Mesh(new T.ExtrudeGeometry(sh, {
    depth: 0.34, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3, curveSegments: 6,
  }), mat);
  head.position.set(0, 0.9, -0.17);
  head.castShadow = true;
  g.add(head);

  // око и ноздра
  const dot = new T.MeshStandardMaterial({ color: 0x0b0d12, roughness: .5 });
  const eye = new T.Mesh(new T.SphereGeometry(0.055, 10, 8), dot);
  eye.position.set(0.26, 1.72, 0.21); g.add(eye);
  const eye2 = eye.clone(); eye2.position.z = -0.21; g.add(eye2);
  const nos = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), dot);
  nos.position.set(0.60, 1.64, 0.10); g.add(nos);

  // грива
  const mane = new T.Mesh(new T.BoxGeometry(0.12, 0.62, 0.30), mat);
  mane.position.set(-0.30, 1.52, 0); mane.rotation.z = -0.30; mane.castShadow = true;
  g.add(mane);

  g.scale.setScalar(1.28);
  return g;
}
