/* ============================================================
   ЧЕТВЪРТА ЧАСТ · ЗАЛА I — Приливът
   Скалите пред Азкабан се заливат по график. Пътят не е най-късият,
   а онзи, който е сух точно когато стъпиш на него.
   ============================================================ */
import { head, $, $$, mountQuiz } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { AZK_STAGE, addSea, addFrost, stoneMat } from './common4.js';

export const meta = {
  id: 'a4-tide',
  eyebrow: 'Зала I',
  title: 'Приливът',
  sub: 'Между лодката и портата на Азкабан лежат тридесет и шест черни скали. Морето ги покрива и открива по свой ред — и не чака никого, {име}.',
  rune: 'О',
  bg: 'off',
  tint: '#7fb3d8',
  hints: [
    'Всяка скала има <b>височина от 1 до 4</b>. Приливът минава през осем нива: 0 · 1 · 2 · 3 · 3 · 2 · 1 · 0. Скалата е суха, докато височината ѝ е <b>по-голяма</b> от нивото на водата.',
    'Можеш и да <b>чакаш</b> на място — чакането също е ход и водата се мести. Понякога единственият път напред е да стоиш два хода на скала с височина 4.',
    'Най-краткият път е 10 крачки, но при прилив не се минава. Верният път е <b>16 хода</b> и минава ниско вляво, докато водата се оттегля.',
  ],
};

const W = 6, H = 6;
const TIDE = [0, 1, 2, 3, 3, 2, 1, 0];
const HEIGHTS = [
  [3, 2, 2, 4, 1, 4],
  [4, 1, 1, 4, 2, 2],
  [3, 3, 1, 3, 2, 1],
  [3, 4, 3, 3, 4, 1],
  [2, 2, 3, 4, 2, 1],
  [4, 1, 1, 4, 2, 3],
];
const START = { x: 0, y: 5 }, GOAL = { x: 5, y: 0 };
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], wait: [0, 0] };

const QUIZ = [
  { q: 'Кой пази Азкабан още от построяването му?',
    opts: [
      { t: 'Дименторите', ok: true },
      { t: 'Инферии', r: 'Инфериите служат на некроманти, не на Министерството.' },
      { t: 'Гоблини от Гринготс', r: 'Гоблините пазят злато, не затворници.' },
      { t: 'Аврори на смени', r: 'Аврорите водят затворниците дотам. После си тръгват.' },
    ] },
  { q: 'Кой е единственият, за когото се знае, че е избягал от Азкабан без чужда помощ?',
    opts: [
      { t: 'Сириус Блек', ok: true },
      { t: 'Барти Крауч младши', r: 'Него го изнасят от килията — с оборотно и жертва.' },
      { t: 'Белатрикс Лестранж', r: 'Нея я освобождават при масовото бягство.' },
      { t: 'Хагрид', r: 'Хагрид излиза, защото го пускат.' },
    ] },
  { q: 'Какво отнема дименторът с целувката си?',
    opts: [
      { t: 'Душата — тялото остава да живее празно', ok: true },
      { t: 'Магията на жертвата', r: 'Магията остава. Онова, което си отива, е по-важно.' },
      { t: 'Спомените от последната година', r: 'Заличаването на спомени е друга магия.' },
      { t: 'Живота', r: 'Не. Точно това е ужасът — човекът остава жив.' },
    ] },
];

let stage = null, pillars = [], marker = null, water = null;

export function mount(root, api) {
  const d = api.data;
  if (d.gate == null) d.gate = 0;
  if (d.x == null) { d.x = START.x; d.y = START.y; d.t = 0; }
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel" id="tide-gate"></div>
    <div class="panel stage-panel" id="tide-main" hidden>
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Таблицата на прилива</h4>
            <div class="tide-table" id="tide-table"></div>
            <p class="muted tide-rule">Скалата е суха, докато <b>височината ѝ е по-голяма</b> от нивото на водата. Чакането също е ход.</p>
          </div>
          <div class="tide-map" id="tide-map"></div>
          <div class="tide-pad" id="tide-pad">
            <button class="tp-btn" data-d="up">▲</button>
            <div class="tp-row">
              <button class="tp-btn" data-d="left">◀</button>
              <button class="tp-btn tp-wait" data-d="wait">чакай</button>
              <button class="tp-btn" data-d="right">▶</button>
            </div>
            <button class="tp-btn" data-d="down">▼</button>
          </div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Морето се отдръпва…</div></div>
      </div>
      <p class="center muted stage-help">Влачи, за да огледаш скалите. Кликни съседна скала или ползвай стрелките.</p>
    </div>`;

  mountQuiz($('#tide-gate'), {
    api, key: 'gate',
    title: 'Лодкарят иска да е сигурен, че знаеш къде отиваш',
    intro: 'Три въпроса. Сгрешиш ли, лодката се връща — и това ти струва време.',
    questions: QUIZ,
    doneText: 'Лодкарят кимва и те оставя на първата скала. Няма да се върне за теб.',
    onDone: () => { $('#tide-main').hidden = false; boot(api); },
  });

  $$('#tide-pad .tp-btn', root).forEach(b =>
    b.addEventListener('click', () => step(api, b.dataset.d)));

  drawTable(api); drawMap(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } pillars = []; marker = null; water = null; };
}

/* ---------- правила ---------- */
const level = (t) => TIDE[((t % TIDE.length) + TIDE.length) % TIDE.length];
const dry = (x, y, t) => HEIGHTS[y][x] > level(t);
const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

function legalMoves(d) {
  const out = [];
  for (const [k, [dx, dy]] of Object.entries(DIRS)) {
    const nx = d.x + dx, ny = d.y + dy;
    if (!inside(nx, ny)) continue;
    if (!dry(nx, ny, d.t + 1)) continue;
    out.push(k);
  }
  return out;
}

function step(api, dir) {
  if (api.solved) return;
  const d = api.data;
  const [dx, dy] = DIRS[dir] || [0, 0];
  const nx = d.x + dx, ny = d.y + dy;
  if (!inside(nx, ny)) { api.sfx.bad(); return; }

  if (!dry(nx, ny, d.t + 1)) {
    api.sfx.bad();
    api.fx.shakeScreen(8, 380);
    const legal = legalMoves(d);
    if (!legal.length) {
      d.x = START.x; d.y = START.y; d.t = 0; api.saveData();
      api.fail('Водата те обгради от всички страни. Изплуваш обратно на първата скала.', 45000);
    } else {
      api.fail('Тази скала вече е под водата.');
    }
    drawTable(api); drawMap(api); place(api, true);
    return;
  }

  d.x = nx; d.y = ny; d.t++; api.saveData();
  api.sfx.click();
  drawTable(api); drawMap(api); place(api);

  if (d.x === GOAL.x && d.y === GOAL.y) {
    api.sfx.unlock();
    api.fx.flash('rgba(150,200,255,.22)', 700);
    setTimeout(() => api.solve('Стигаш стъпалата на портата със сухи ходила. В процепа между два камъка е заклещена руна.'), 650);
  }
}

/* ---------- странични табла ---------- */
function drawTable(api) {
  const box = $('#tide-table'); if (!box) return;
  const t = api.data.t;
  box.innerHTML = TIDE.map((v, i) => {
    const now = (t % TIDE.length) === i;
    const next = ((t + 1) % TIDE.length) === i;
    return `<div class="tt-cell${now ? ' now' : ''}${next ? ' next' : ''}">
      <b>${v}</b><span>${i + 1}</span></div>`;
  }).join('');
}

function drawMap(api) {
  const box = $('#tide-map'); if (!box) return;
  const d = api.data;
  const lvl = level(d.t);
  let html = '';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const h = HEIGHTS[y][x];
    const under = h <= lvl;
    const here = d.x === x && d.y === y;
    const goal = GOAL.x === x && GOAL.y === y;
    html += `<div class="tm-cell${under ? ' wet' : ''}${here ? ' me' : ''}${goal ? ' goal' : ''}"
      data-x="${x}" data-y="${y}">${here ? '✦' : goal ? '⌂' : h}</div>`;
  }
  box.innerHTML = html;
  $$('.tm-cell', box).forEach(c => c.addEventListener('click', () => {
    const x = +c.dataset.x, y = +c.dataset.y;
    const dx = x - d.x, dy = y - d.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    step(api, dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up');
  }));
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...AZK_STAGE, ground: false, dist: 20, fov: 44, look: [0, 0.2, 0],
    theta: 0.34, phi: 0.74, minPolar: 0.24, maxPolar: 1.3,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за скалите — картата и стрелките вляво работят и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;
  const S = 2.1;
  const px = (x) => (x - (W - 1) / 2) * S;
  const pz = (y) => (y - (H - 1) / 2) * S;

  const rock = stoneMat(T, 0x30363f);
  const picks = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const h = HEIGHTS[y][x];
    const m = new T.Mesh(new T.BoxGeometry(S * 0.86, h * 0.7, S * 0.86), rock.clone());
    m.position.set(px(x), h * 0.35 - 1.6, pz(y));
    m.castShadow = m.receiveShadow = true;
    m.userData = { pick: true, x, y, h };
    stage.add(m);
    pillars.push(m);
    picks.push(m);

    const top = new T.Mesh(new T.PlaneGeometry(S * 0.5, S * 0.5),
      new T.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.1 }));
    top.rotation.x = -Math.PI / 2;
    top.position.set(px(x), h * 0.7 - 1.6 + 0.02, pz(y));
    stage.add(top);
    m.userData.top = top;
  }

  // портата в далечината
  const gate = new T.Mesh(new T.BoxGeometry(3.2, 6, 0.8), stoneMat(T, 0x1a1d24));
  gate.position.set(px(GOAL.x), 1.4, pz(GOAL.y) - 2.6);
  stage.add(gate);
  const arch = new T.Mesh(new T.TorusGeometry(1.2, 0.22, 8, 20, Math.PI),
    new T.MeshStandardMaterial({ color: 0x4a5260, roughness: 0.9 }));
  arch.position.set(px(GOAL.x), 2.6, pz(GOAL.y) - 2.2);
  stage.add(arch);

  water = addSea(stage, { radius: 34, y: -1.6, color: 0x0c1e30 });
  addFrost(stage, { count: 70, radius: 14, height: 10 });

  marker = new T.Group();
  const body = new T.Mesh(new T.CapsuleGeometry(0.26, 0.7, 6, 12),
    new T.MeshStandardMaterial({ color: 0xe8e2cf, roughness: 0.6, emissive: 0x5a6a80, emissiveIntensity: 0.35 }));
  body.position.y = 0.62;
  const glow = new T.Mesh(new T.SphereGeometry(0.6, 14, 12),
    new T.MeshBasicMaterial({ color: 0x9fd0ff, transparent: true, opacity: 0.16 }));
  glow.position.y = 0.7;
  marker.add(body, glow);
  stage.add(marker);

  stage.setPickables(picks);
  stage.onPick(o => {
    const u = o.userData || {};
    if (u.x == null) return;
    const d = api.data;
    const dx = u.x - d.x, dy = u.y - d.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) { api.toast('Само на съседна скала.', ''); return; }
    step(api, dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up');
  });
  stage.onHover(o => { stage.dom.style.cursor = o && o.userData.x != null ? 'pointer' : 'grab'; });

  stage.onFrame((t) => {
    const lvl = level(api.data.t);
    if (water) water.position.y += ((lvl * 0.7 - 1.55) - water.position.y) * 0.08;
    pillars.forEach(p => {
      const under = p.userData.h <= lvl;
      const target = under ? 0.02 : 0.16;
      p.userData.top.material.opacity += (target - p.userData.top.material.opacity) * 0.1;
      p.material.emissive = p.material.emissive || new T.Color(0x000000);
      p.material.emissiveIntensity = under ? 0 : 0.05 + Math.sin(t * 1.2 + p.userData.x) * 0.02;
    });
  });

  place(api, true);
}

function place(api, instant) {
  if (!stage || !marker) return;
  const S = 2.1;
  const d = api.data;
  const x = (d.x - (W - 1) / 2) * S;
  const z = (d.y - (H - 1) / 2) * S;
  const y = HEIGHTS[d.y][d.x] * 0.7 - 1.6;
  if (instant) { marker.position.set(x, y, z); return; }
  const from = marker.position.clone();
  const to = new stage.THREE.Vector3(x, y, z);
  const t0 = performance.now();
  const tick = () => {
    if (!marker) return;
    const k = Math.min(1, (performance.now() - t0) / 300);
    marker.position.lerpVectors(from, to, k);
    marker.position.y += Math.sin(k * Math.PI) * 0.5;
    if (k < 1) requestAnimationFrame(tick);
  };
  tick();
}
