/* ============================================================
   ЧЕТВЪРТА ЧАСТ · ЗАЛА II — Патрулът
   Два диментора обикалят приземния коридор по един и същи ритъм.
   Студът се усеща една клетка преди тях.
   ============================================================ */
import { head, $, $$, answerBar, wireAnswer } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { AZK_STAGE, addWalls, addFrost, addSlit, buildDementor, stoneMat } from './common4.js';

export const meta = {
  id: 'a4-patrol',
  eyebrow: 'Зала II',
  title: 'Патрулът',
  sub: 'Приземният коридор е седем на седем плочи. Два диментора се плъзгат по своите отсечки и никога не бързат — защото не се налага.',
  rune: 'К',
  bg: 'off',
  tint: '#8f9fc8',
  hints: [
    'Студът се усеща <b>една клетка около</b> диментора — на плочата му и на четирите ѝ съседки. Червените плочи на картата показват къде ще е студът <b>след следващия ти ход</b>.',
    'Чакането на място е пълноценен ход. Двата патрула се повтарят на всеки <b>осем хода</b> — застани на безопасна плоча и ги изчакай да се разминат.',
    'Пътят е 23 хода: изчакай <b>четири</b> хода на входа, мини надясно по долния ред до десния ръб, изкачи се и <b>изчакай шест хода</b>, преди да продължиш нагоре — после излез вляво в колона 5 и се качи до стълбите.',
  ],
};

const N = 7;
const WALLS = [[3, 6], [0, 0], [3, 2], [4, 0], [6, 1], [1, 4], [1, 1], [3, 1]];
const PATROL_A = [[4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 5], [4, 4], [4, 3]];
const PATROL_B = [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 3], [5, 2], [5, 1]];
const PATROLS = [PATROL_A, PATROL_B];
const START = { x: 0, y: 6 }, GOAL = { x: 6, y: 0 };
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], wait: [0, 0] };

let stage = null, dem = [], marker = null, tileMap = new Map();

export function mount(root, api) {
  const d = api.data;
  if (d.x == null) { d.x = START.x; d.y = START.y; d.t = 0; d.caught = 0; }
  if (d.crossed == null) d.crossed = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="patrol-map" id="patrol-map"></div>
          <div class="patrol-legend">
            <span><i class="pl-me"></i>ти</span>
            <span><i class="pl-cold"></i>студ след хода</span>
            <span><i class="pl-wall"></i>зид</span>
            <span><i class="pl-goal"></i>стълбите</span>
          </div>
          <div class="tide-pad" id="patrol-pad">
            <button class="tp-btn" data-d="up">▲</button>
            <div class="tp-row">
              <button class="tp-btn" data-d="left">◀</button>
              <button class="tp-btn tp-wait" data-d="wait">чакай</button>
              <button class="tp-btn" data-d="right">▶</button>
            </div>
            <button class="tp-btn" data-d="down">▼</button>
          </div>
          <div class="patrol-count" id="patrol-count"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Коридорът се отваря…</div></div>
      </div>
      <p class="center muted stage-help">Кликни съседна плоча или ползвай стрелките. «Чакай» също е ход.</p>
    </div>
    <div class="panel" id="ledger" hidden>
      <p class="panel-title">Дневникът на пазача</p>
      <p>На стълбите виси счупена плоча с една-единствена, изтъркана от пръсти дума: <em>«обиколка»</em>.
      Отдолу някой е драскал чертички, докато е чакал — и е броял по колко хода дименторът се връща на същата плоча.</p>
      <p class="muted">След колко хода патрулът се повтаря изцяло? Напиши числото.</p>
      ${answerBar('ledger-in', 'число', 'Запиши')}
    </div>`;

  $$('#patrol-pad .tp-btn', root).forEach(b =>
    b.addEventListener('click', () => step(api, b.dataset.d)));

  wireAnswer(root, 'ledger-in', (v, input) => {
    if (api.solved) return;
    if (v === '8') {
      api.sfx.unlock();
      api.fx.celebrate(1.2);
      api.solve('Осем хода. Толкова трае вечността на един диментор. Между чертичките е втъкната руна.');
    } else {
      input.value = '';
      api.fail('Не е това. Проследи една плоча от маршрута и брой, докато дименторът се върне на нея.');
    }
  });

  if (d.crossed) $('#ledger').hidden = false;
  draw(api); boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } dem = []; marker = null; tileMap = new Map(); };
}

/* ---------- правила ---------- */
const isWall = (x, y) => WALLS.some(w => w[0] === x && w[1] === y);
const inside = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

function coldAt(t) {
  const s = new Set();
  PATROLS.forEach(r => {
    const c = r[((t % r.length) + r.length) % r.length];
    s.add(c[0] + ',' + c[1]);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => s.add((c[0] + d[0]) + ',' + (c[1] + d[1])));
  });
  return s;
}

function step(api, dir) {
  const d = api.data;
  if (d.crossed) return;
  const [dx, dy] = DIRS[dir] || [0, 0];
  const nx = d.x + dx, ny = d.y + dy;
  if (!inside(nx, ny) || isWall(nx, ny)) { api.sfx.bad(); return; }

  d.t++;
  if (coldAt(d.t).has(nx + ',' + ny)) {
    d.x = START.x; d.y = START.y; d.t = 0; d.caught++;
    api.saveData();
    api.sfx.roar();
    api.fx.flash('rgba(20,30,60,.45)', 800);
    api.fx.shakeScreen(16, 700);
    api.fail('Студът те намери. Изгубваш секунди, които няма да си спомниш — и се събуждаш обратно на входа.', 45000);
    draw(api); place(api, true);
    return;
  }

  d.x = nx; d.y = ny; api.saveData();
  api.sfx.click();
  draw(api); place(api);

  if (d.x === GOAL.x && d.y === GOAL.y) {
    d.crossed = true; api.saveData();
    api.sfx.chime();
    api.fx.sparksFrom($('#stage'), { count: 22, color: '#a8c8ff', spread: 140 });
    const l = $('#ledger'); if (l) { l.hidden = false; l.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    draw(api);
  }
}

/* ---------- карта ---------- */
function draw(api) {
  const d = api.data;
  const box = $('#patrol-map'); if (!box) return;
  const cold = coldAt(d.t + 1);
  const now = coldAt(d.t);
  let html = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const k = x + ',' + y;
    const cls = [
      isWall(x, y) ? 'wall' : '',
      cold.has(k) ? 'cold' : '',
      now.has(k) ? 'cold-now' : '',
      d.x === x && d.y === y ? 'me' : '',
      GOAL.x === x && GOAL.y === y ? 'goal' : '',
    ].filter(Boolean).join(' ');
    const dm = PATROLS.some(r => { const c = r[d.t % r.length]; return c[0] === x && c[1] === y; });
    html += `<div class="pm-cell ${cls}" data-x="${x}" data-y="${y}">${
      isWall(x, y) ? '' : dm ? '☠' : d.x === x && d.y === y ? '✦' : GOAL.x === x && GOAL.y === y ? '⌂' : ''}</div>`;
  }
  box.innerHTML = html;
  $$('.pm-cell', box).forEach(c => c.addEventListener('click', () => {
    const x = +c.dataset.x, y = +c.dataset.y;
    const ddx = x - d.x, ddy = y - d.y;
    if (Math.abs(ddx) + Math.abs(ddy) !== 1) return;
    step(api, ddx === 1 ? 'right' : ddx === -1 ? 'left' : ddy === 1 ? 'down' : 'up');
  }));

  const cnt = $('#patrol-count');
  if (cnt) cnt.innerHTML = d.crossed
    ? '<b>Стигна стълбите.</b>'
    : `ход <b>${d.t}</b> · фаза на патрула <b>${(d.t % 8) + 1}/8</b>${d.caught ? ` · хванат <b>${d.caught}</b> пъти` : ''}`;
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...AZK_STAGE, ground: false, dist: 21, fov: 45, look: [0, 1, 0],
    theta: 0.3, phi: 0.72, minPolar: 0.22, maxPolar: 1.28,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за коридора — картата вляво работи и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;
  const S = 2.2;
  const px = (x) => (x - (N - 1) / 2) * S;
  const pz = (y) => (y - (N - 1) / 2) * S;

  const floorMat = stoneMat(T, 0x1b1f27);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (isWall(x, y)) {
      const w = new T.Mesh(new T.BoxGeometry(S * 0.92, 3.2, S * 0.92), stoneMat(T, 0x2b303a));
      w.position.set(px(x), 1.6, pz(y));
      w.castShadow = w.receiveShadow = true;
      stage.add(w);
      continue;
    }
    const m = new T.Mesh(new T.BoxGeometry(S * 0.9, 0.3, S * 0.9), floorMat.clone());
    m.position.set(px(x), -0.15, pz(y));
    m.receiveShadow = true;
    m.userData = { pick: true, x, y };
    stage.add(m);
    tileMap.set(x + ',' + y, m);
  }
  stage.setPickables([...tileMap.values()]);
  stage.onPick(o => {
    const u = o.userData || {};
    if (u.x == null) return;
    const d = api.data;
    const dx = u.x - d.x, dy = u.y - d.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) { api.toast('Само на съседна плоча.', ''); return; }
    step(api, dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up');
  });
  stage.onHover(o => { stage.dom.style.cursor = o && o.userData.x != null ? 'pointer' : 'grab'; });

  addWalls(stage, { w: N * S + 3.2, h: 7, d: N * S + 3.2, tint: 0x171b22, floor: true });
  addFrost(stage, { count: 80, radius: 9, height: 7 });
  addSlit(stage, { x: px(GOAL.x), z: pz(GOAL.y), w: 1.2, h: 9 });

  // стълбите при целта
  for (let i = 0; i < 4; i++) {
    const s = new T.Mesh(new T.BoxGeometry(S * 0.9, 0.28, S * 0.5 - i * 0.1), stoneMat(T, 0x3a4150));
    s.position.set(px(GOAL.x), 0.14 + i * 0.28, pz(GOAL.y) - 0.5 - i * 0.3);
    stage.add(s);
  }

  PATROLS.forEach((r, i) => {
    const g = buildDementor(T, { scale: 0.95 });
    stage.add(g);
    dem.push({ g, route: r });
  });

  marker = new T.Group();
  const body = new T.Mesh(new T.CapsuleGeometry(0.28, 0.8, 6, 12),
    new T.MeshStandardMaterial({ color: 0xf0e8d4, roughness: 0.55, emissive: 0x6a7a94, emissiveIntensity: 0.4 }));
  body.position.y = 0.75;
  const glow = new T.Mesh(new T.SphereGeometry(0.7, 14, 12),
    new T.MeshBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.14 }));
  glow.position.y = 0.8;
  marker.add(body, glow);
  stage.add(marker);

  stage.onFrame((t) => {
    const d = api.data;
    dem.forEach((o, i) => {
      const c = o.route[d.t % o.route.length];
      const tx = px(c[0]), tz = pz(c[1]);
      o.g.position.x += (tx - o.g.position.x) * 0.09;
      o.g.position.z += (tz - o.g.position.z) * 0.09;
      if (o.g.userData.animate) o.g.userData.animate(t + i * 1.7);
    });
    const cold = coldAt(d.t + 1);
    tileMap.forEach((m, k) => {
      const want = cold.has(k) ? 0x3a1f28 : 0x1b1f27;
      m.material.color.lerp(new T.Color(want), 0.08);
    });
  });

  place(api, true);
}

function place(api, instant) {
  if (!stage || !marker) return;
  const S = 2.2;
  const d = api.data;
  const x = (d.x - (N - 1) / 2) * S, z = (d.y - (N - 1) / 2) * S;
  if (instant) { marker.position.set(x, 0, z); return; }
  const from = marker.position.clone();
  const to = new stage.THREE.Vector3(x, 0, z);
  const t0 = performance.now();
  const tick = () => {
    if (!marker) return;
    const k = Math.min(1, (performance.now() - t0) / 260);
    marker.position.lerpVectors(from, to, k);
    if (k < 1) requestAnimationFrame(tick);
  };
  tick();
}
