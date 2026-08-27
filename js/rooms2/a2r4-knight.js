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
  sub: 'Каменна дъска, на която някой преди трийсет години е пожертвал коня си, за да мине приятелят му. Този път конят си ти — и този път трябва да оцелееш.',
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

let stage = null, knight = null, tiles = {}, marks = [];

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
            Седмият скок е забранен: дъската се връща в началото.</p>
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

  $('#kn-reset').addEventListener('click', () => resetRun(api, false));
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
    `<span class="mv${i ? '' : ' start'}">${n}</span>`).join('<i>→</i>');
}

function resetRun(api, penalty) {
  const d = api.data;
  d.at = { ...START }; d.path = []; api.saveData();
  if (knight) placeKnight(api, false);
  renderHud(api);
  highlightMoves(api);
  if (penalty) api.fail('Седмият скок е излишен. Дъската изтръсква коня обратно на b1.');
  else api.sfx.click();
}

function tryMove(api, x, y) {
  if (api.solved) return;
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
    setTimeout(() => resetRun(api, true), 600);
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

/* ---------- прости фигури ---------- */
function pedestal(T, mat, r = 0.42) {
  const g = new T.Group();
  const base = new T.Mesh(new T.CylinderGeometry(r, r * 1.25, 0.2, 18), mat);
  base.position.y = 0.24; base.castShadow = true;
  const stem = new T.Mesh(new T.CylinderGeometry(r * 0.5, r * 0.72, 0.7, 16), mat);
  stem.position.y = 0.68; stem.castShadow = true;
  g.add(base, stem);
  return g;
}

function buildPiece(T, p) {
  const mat = new T.MeshStandardMaterial({
    color: 0xe8ebef, roughness: 0.45, metalness: 0.25,
    emissive: 0x223047, emissiveIntensity: 0.25,
  });
  const g = pedestal(T, mat);
  if (p.t === 'K') {
    const body = new T.Mesh(new T.CylinderGeometry(0.34, 0.44, 1.0, 16), mat);
    body.position.y = 1.5; body.castShadow = true;
    const crown = new T.Mesh(new T.SphereGeometry(0.3, 14, 12), mat);
    crown.position.y = 2.1;
    const c1 = new T.Mesh(new T.BoxGeometry(0.12, 0.55, 0.12), mat); c1.position.y = 2.55;
    const c2 = new T.Mesh(new T.BoxGeometry(0.38, 0.12, 0.12), mat); c2.position.y = 2.45;
    g.add(body, crown, c1, c2);
  } else if (p.t === 'R') {
    const body = new T.Mesh(new T.CylinderGeometry(0.4, 0.46, 1.1, 14), mat);
    body.position.y = 1.55; body.castShadow = true;
    g.add(body);
    for (let i = 0; i < 4; i++) {
      const b = new T.Mesh(new T.BoxGeometry(0.2, 0.3, 0.2), mat);
      const a = (i / 4) * Math.PI * 2;
      b.position.set(Math.sin(a) * 0.3, 2.2, Math.cos(a) * 0.3);
      g.add(b);
    }
  } else {
    const body = new T.Mesh(new T.ConeGeometry(0.42, 1.5, 16), mat);
    body.position.y = 1.75; body.castShadow = true;
    const tip = new T.Mesh(new T.SphereGeometry(0.17, 12, 10), mat);
    tip.position.y = 2.6;
    g.add(body, tip);
  }
  g.position.set(wx(p.x), 0, wz(p.y));
  return g;
}

function buildKnight(T) {
  const mat = new T.MeshStandardMaterial({
    color: 0x2b2f3a, roughness: 0.4, metalness: 0.55,
    emissive: 0x1e3a5a, emissiveIntensity: 0.55,
  });
  const g = pedestal(T, mat, 0.44);
  const neck = new T.Mesh(new T.BoxGeometry(0.5, 1.0, 0.42), mat);
  neck.position.set(0, 1.5, -0.05); neck.rotation.x = -0.2; neck.castShadow = true;
  const headM = new T.Mesh(new T.BoxGeometry(0.46, 0.5, 0.85), mat);
  headM.position.set(0, 2.05, 0.2); headM.rotation.x = 0.22; headM.castShadow = true;
  const ear1 = new T.Mesh(new T.ConeGeometry(0.1, 0.3, 8), mat); ear1.position.set(-0.14, 2.35, -0.1);
  const ear2 = new T.Mesh(new T.ConeGeometry(0.1, 0.3, 8), mat); ear2.position.set(0.14, 2.35, -0.1);
  const mane = new T.Mesh(new T.BoxGeometry(0.16, 0.9, 0.3), mat);
  mane.position.set(0, 1.95, -0.32); mane.rotation.x = -0.35;
  g.add(neck, headM, ear1, ear2, mane);
  return g;
}
