/* ============================================================
   ВТОРА ЧАСТ · ЗАЛА VI — Хлъзгавият под
   Перлата не спира, докато не удари нещо. Мисли предварително.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage } from '../three-stage.js';

export const meta = {
  id: 'a2-laby',
  eyebrow: 'Зала VI',
  title: 'Хлъзгавият под',
  sub: 'Подът е застлан с пясъка на Основателите. Перлата на печата не се търкаля — тя се хлъзга, докато не се блъсне. А ямите не прощават на никого, {име}.',
  rune: 'Л',
  grain: 9,
  bg: 'off',
  tint: '#6fd8c8',
  hints: [
    'Перлата не спира по средата. Всеки натиснат бутон я праща до първата колона или стена по пътя ѝ. Мисли къде ще <b>спре</b>, не накъде тръгва.',
    'Ямите поглъщат перлата и по средата на пътя, не само в края. Провери целия коридор, преди да пуснеш.',
    'Началото е <b>север, изток, север, запад</b> — и оттам нататък пътят се вие. Най-краткото решение е <b>17</b> хлъзгания; ако си над 25, значи обикаляш в кръг.',
  ],
};

const N = 9;
const WALLS = ['000000000', '000000100', '000011010', '000000100', '000001000',
               '100000100', '000010001', '000000000', '000001000'];
const HOLES = [[4, 1], [4, 8], [4, 0], [5, 3]];
const START = { x: 0, y: 8 }, GOAL = { x: 8, y: 0 };
const TILE = 1.5;
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

const isWall = (x, y) => x < 0 || y < 0 || x >= N || y >= N || WALLS[y][x] === '1';
const isHole = (x, y) => HOLES.some(h => h[0] === x && h[1] === y);

let stage = null, pearl = null, keyHandler = null, sliding = false;

export function mount(root, api) {
  const d = api.data;
  if (!d.at) { d.at = { ...START }; d.slides = 0; d.falls = 0; }
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Изсечено на прага</h4>
            <p>„Пясъкът не помни стъпки. Пусни перлата и тя ще спре сама — там,
            където камъкът ѝ каже.“</p>
            <p style="font-size:.94rem">Изведи перлата от долния ляв ъгъл до <b>златния кръг</b>
            горе вдясно. Тъмните кръгове са ями: перлата пропада и в тях,
            и когато само мине през тях.</p>
          </div>
          <div class="knight-hud">
            <div class="kh-item"><span>хлъзгания</span><b id="lb-slides">0</b></div>
            <div class="kh-item"><span>пропадания</span><b id="lb-falls">0</b></div>
          </div>
          <div class="dpad">
            <button class="dp dp-n" data-d="N">▲</button>
            <button class="dp dp-w" data-d="W">◀</button>
            <button class="dp dp-e" data-d="E">▶</button>
            <button class="dp dp-s" data-d="S">▼</button>
            <span class="dp-mid">●</span>
          </div>
          <p class="center muted" style="font-size:.84rem">Работят и стрелките на клавиатурата.</p>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Пясъкът се разстила…</div></div>
      </div>
    </div>`;

  $$('.dp').forEach(b => b.addEventListener('click', () => go(api, b.dataset.d)));
  keyHandler = (e) => {
    const map = { ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E' };
    if (map[e.key]) { e.preventDefault(); go(api, map[e.key]); }
  };
  window.addEventListener('keydown', keyHandler);

  renderHud(api);
  boot(api);
  api.onLeave = () => {
    if (stage) { stage.dispose(); stage = null; }
    pearl = null;
    if (keyHandler) { window.removeEventListener('keydown', keyHandler); keyHandler = null; }
  };
}

function renderHud(api) {
  const s = $('#lb-slides'), f = $('#lb-falls');
  if (s) s.textContent = api.data.slides || 0;
  if (f) f.textContent = api.data.falls || 0;
}

function go(api, dir) {
  if (sliding || api.solved || !pearl) return;
  const d = api.data;
  const [dx, dy] = DIRS[dir];
  let cx = d.at.x, cy = d.at.y;
  const path = [];
  let dead = false;
  while (true) {
    const nx = cx + dx, ny = cy + dy;
    if (isWall(nx, ny)) break;
    cx = nx; cy = ny;
    path.push([cx, cy]);
    if (isHole(cx, cy)) { dead = true; break; }
  }
  if (!path.length) {
    api.sfx.bad();
    api.toast('Камък точно отпред. Перлата дори не помръдва.', '');
    return;
  }
  sliding = true;
  d.slides = (d.slides || 0) + 1;
  api.sfx.whoosh();
  animateSlide(path, () => {
    if (dead) {
      d.falls = (d.falls || 0) + 1;
      d.at = { ...START };
      api.saveData(); renderHud(api);
      api.sfx.bad();
      api.fx.shakeScreen(10, 420);
      dropPearl(() => { placePearl(api); sliding = false; });
      api.fail('Перлата пропадна в яма. Пясъкът я изплю обратно в началото.');
      return;
    }
    d.at = { x: cx, y: cy };
    api.saveData(); renderHud(api);
    sliding = false;
    api.sfx.click();
    if (cx === GOAL.x && cy === GOAL.y) {
      api.sfx.unlock();
      api.fx.flash('rgba(120,220,200,.24)', 800);
      api.fx.sparksFrom($('#stage'), { count: 50, color: '#aef0e2', spread: 280 });
      setTimeout(() => api.solve('Перлата щраква в златния кръг. Подът застива и ти подава руна и зърно пясък.'), 800);
    }
  });
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    dist: 20, fov: 40, look: [0, 0.3, 0], theta: 0.12, phi: 0.66,
    minPolar: 0.16, maxPolar: 1.3, ground: true, groundColor: 0x0a1110,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL. Бутоните вляво пак движат перлата.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  const floorGeo = new T.BoxGeometry(TILE * 0.96, 0.2, TILE * 0.96);
  const floorMatA = new T.MeshStandardMaterial({ color: 0x2a3a38, roughness: 0.9 });
  const floorMatB = new T.MeshStandardMaterial({ color: 0x22302f, roughness: 0.9 });
  const wallMat = new T.MeshStandardMaterial({ color: 0x4a5450, roughness: 0.65, metalness: 0.25 });
  const holeMat = new T.MeshStandardMaterial({ color: 0x07090a, roughness: 1, emissive: 0x000000 });

  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (isWall(x, y)) {
      const w = new T.Mesh(new T.BoxGeometry(TILE * 0.86, 1.9, TILE * 0.86), wallMat);
      w.position.set(wx(x), 0.95, wz(y));
      w.castShadow = true; w.receiveShadow = true;
      stage.add(w);
      continue;
    }
    const f = new T.Mesh(floorGeo, (x + y) % 2 ? floorMatA : floorMatB);
    f.position.set(wx(x), 0, wz(y));
    f.receiveShadow = true;
    stage.add(f);
    if (isHole(x, y)) {
      const h = new T.Mesh(new T.CylinderGeometry(TILE * 0.4, TILE * 0.28, 0.6, 18), holeMat);
      h.position.set(wx(x), -0.06, wz(y));
      stage.add(h);
      const ring = new T.Mesh(
        new T.TorusGeometry(TILE * 0.4, 0.04, 8, 26),
        new T.MeshBasicMaterial({ color: 0x7a3a3a, transparent: true, opacity: 0.7 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(wx(x), 0.12, wz(y));
      stage.add(ring);
    }
  }

  // целта
  const goal = new T.Mesh(
    new T.TorusGeometry(TILE * 0.36, 0.09, 10, 32),
    new T.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xd9b45b, emissiveIntensity: 0.9, metalness: 0.9, roughness: 0.2 })
  );
  goal.rotation.x = -Math.PI / 2;
  goal.position.set(wx(GOAL.x), 0.15, wz(GOAL.y));
  stage.add(goal);

  // началото
  const st = new T.Mesh(
    new T.RingGeometry(TILE * 0.28, TILE * 0.36, 24),
    new T.MeshBasicMaterial({ color: 0x6fd8c8, transparent: true, opacity: 0.35, side: T.DoubleSide })
  );
  st.rotation.x = -Math.PI / 2;
  st.position.set(wx(START.x), 0.12, wz(START.y));
  stage.add(st);

  pearl = new T.Mesh(
    new T.SphereGeometry(TILE * 0.32, 24, 20),
    new T.MeshStandardMaterial({
      color: 0xdff6f2, roughness: 0.08, metalness: 0.5,
      emissive: 0x2a6f66, emissiveIntensity: 0.55,
    })
  );
  pearl.castShadow = true;
  stage.add(pearl);
  placePearl(api);

  stage.onFrame((t) => {
    goal.rotation.z = t * 0.8;
    goal.material.emissiveIntensity = 0.6 + Math.sin(t * 2.4) * 0.35;
    if (pearl && !sliding) pearl.position.y = TILE * 0.32 + 0.12 + Math.sin(t * 2) * 0.06;
  });
}

function wx(x) { return (x - (N - 1) / 2) * TILE; }
function wz(y) { return (y - (N - 1) / 2) * TILE; }

function placePearl(api) {
  if (!pearl) return;
  pearl.position.set(wx(api.data.at.x), TILE * 0.32 + 0.12, wz(api.data.at.y));
  pearl.scale.setScalar(1);
}

function animateSlide(path, done) {
  if (!pearl) { done(); return; }
  const pts = path.map(([x, y]) => ({ x: wx(x), z: wz(y) }));
  const from = { x: pearl.position.x, z: pearl.position.z };
  const all = [from, ...pts];
  const perStep = 95;
  const t0 = performance.now();
  const total = perStep * pts.length;
  (function step() {
    const el = performance.now() - t0;
    const p = Math.min(1, el / total);
    const f = p * pts.length;
    const i = Math.min(pts.length - 1, Math.floor(f));
    const frac = f - i;
    const a = all[i], b = all[i + 1] || all[all.length - 1];
    pearl.position.x = a.x + (b.x - a.x) * frac;
    pearl.position.z = a.z + (b.z - a.z) * frac;
    pearl.rotation.x += 0.24; pearl.rotation.z += 0.16;
    if (p < 1) requestAnimationFrame(step);
    else done();
  })();
}

function dropPearl(done) {
  if (!pearl) { done(); return; }
  const t0 = performance.now(), dur = 420;
  const y0 = pearl.position.y;
  (function step() {
    const p = Math.min(1, (performance.now() - t0) / dur);
    pearl.position.y = y0 - p * 2.4;
    pearl.scale.setScalar(1 - p * 0.75);
    if (p < 1) requestAnimationFrame(step);
    else done();
  })();
}
