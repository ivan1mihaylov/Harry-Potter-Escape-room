/* ============================================================
   ЧЕТВЪРТА ЧАСТ · ЗАЛА IV — Разбитият спомен
   Девет каменни плочи в рамка на стената. Осем носят по парче
   от един и същи изгубен ден. Деветата липсва.
   ============================================================ */
import { head, $, $$, answerBar, wireAnswer } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';
import { AZK_STAGE, addWalls, addFrost, addSlit, stoneMat } from './common4.js';

export const meta = {
  id: 'a4-shards',
  eyebrow: 'Зала IV',
  title: 'Разбитият спомен',
  sub: 'Дименторите не унищожават онова, което вземат от теб, {име} — просто го разбъркват и го оставят на стената, за да го гледаш как не се подрежда.',
  rune: 'У',
  bg: 'off',
  tint: '#b8a2d8',
  hints: [
    'Плочите се плъзгат само в празното място, и то само отстрани — не по диагонал. Подреди <b>1 2 3</b> отгоре, после <b>4 5 6</b>, и накрая долния ред се нарежда сам.',
    'Когато вече си сложил горния ред, не го пипай повече: върти останалите шест плочи в кръг около празното.',
    'Последните три (7 · 8 и празното) се решават с въртене на долните две редици — ако заседнеш, разбъркай долните шест и започни оттам, без да пипаш горния ред.',
  ],
};

const GOAL = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const SCRAMBLE = [7, 5, 0, 3, 6, 2, 4, 8, 1];
const FRAG = {
  1: 'Беше', 2: 'петък.', 3: 'Дъждът',
  4: 'спря', 5: 'точно', 6: 'когато',
  7: 'тя', 8: 'се засмя.',
};

let stage = null, slabs = new Map();

export function mount(root, api) {
  const d = api.data;
  if (!d.tiles) { d.tiles = [...SCRAMBLE]; d.moves = 0; }
  if (d.opened == null) d.opened = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="slide-grid" id="slide-grid"></div>
          <div class="slide-info" id="slide-info"></div>
          <button class="btn btn-ghost btn-sm" id="slide-scramble"><span>Разбъркай отново</span></button>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Плочите се наместват…</div></div>
      </div>
      <p class="center muted stage-help">Кликни плоча до празното място — или плочата в 3D сцената. Целта е <b>1 2 3 / 4 5 6 / 7 8 ·</b></p>
    </div>
    <div class="panel" id="shard-note" hidden>
      <p class="panel-title">Споменът се сглобява</p>
      <blockquote class="memory-line" id="memory-line"></blockquote>
      <p>Под изречението, с друга ръка и много по-дребно, е издраскано още нещо:</p>
      <blockquote class="memory-count">«Броих дните с чертички. На всеки <b>седми</b> ден изтривах шестте и оставях една.
      Когато престанах да броя, чертичките бяха <b>дванадесет</b>.»</blockquote>
      <p class="muted">Колко дни е броил? Напиши числото.</p>
      ${answerBar('shard-in', 'брой дни', 'Пресметни')}
    </div>`;

  draw(api); boot(api);

  $('#slide-scramble').addEventListener('click', () => {
    if (api.solved || api.data.opened) return;
    api.data.tiles = [...SCRAMBLE]; api.data.moves = 0; api.saveData();
    api.sfx.whoosh(); draw(api); sync(api, true);
  });

  wireAnswer(root, 'shard-in', (v, input) => {
    if (api.solved) return;
    if (v === '84') {
      api.sfx.unlock();
      api.fx.celebrate(1.3);
      api.solve('Осемдесет и четири дни. Между дванадесетата чертичка и стената пада руна.');
    } else {
      input.value = '';
      api.fail('Не е това. Една чертичка струва седем дни.');
    }
  });

  if (d.opened) showNote(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } slabs = new Map(); };
}

/* ---------- механика ---------- */
function moveTile(api, i) {
  const d = api.data;
  if (api.solved || d.opened) return;
  const z = d.tiles.indexOf(0);
  const [r, c] = [Math.floor(i / 3), i % 3];
  const [zr, zc] = [Math.floor(z / 3), z % 3];
  if (Math.abs(r - zr) + Math.abs(c - zc) !== 1) return;
  d.tiles[z] = d.tiles[i]; d.tiles[i] = 0;
  d.moves++; api.saveData();
  api.sfx.click();
  draw(api); sync(api);
  if (d.tiles.every((v, k) => v === GOAL[k])) {
    d.opened = true; api.saveData();
    api.sfx.chime();
    api.fx.flash('rgba(200,170,255,.22)', 800);
    setTimeout(() => { draw(api); showNote(api); }, 400);
  }
}

/* ---------- 2D мрежа ---------- */
function draw(api) {
  const d = api.data;
  const box = $('#slide-grid'); if (!box) return;
  box.innerHTML = d.tiles.map((v, i) => v === 0
    ? '<div class="sg-cell empty"></div>'
    : `<div class="sg-cell" data-i="${i}"><b>${v}</b><span>${FRAG[v]}</span></div>`).join('');
  $$('.sg-cell[data-i]', box).forEach(c =>
    c.addEventListener('click', () => moveTile(api, +c.dataset.i)));
  const info = $('#slide-info');
  if (info) info.innerHTML = d.opened
    ? '<b>Споменът е цял.</b>'
    : `ходове: <b>${d.moves}</b>`;
}

/* ---------- бележката ---------- */
function showNote(api) {
  const box = $('#shard-note'); if (!box) return;
  box.hidden = false;
  const line = $('#memory-line');
  if (line && !line.dataset.on) {
    line.dataset.on = '1';
    line.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8]
      .map((n, i) => `<span class="ml-w" style="--dl:${i * 180}ms">${FRAG[n]}</span>`).join(' ');
  }
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...AZK_STAGE, ground: false, dist: 14, fov: 40, look: [0, 2.6, -1.4],
    theta: 0, phi: 1.2, minPolar: 0.7, maxPolar: 1.45,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за стената — мрежата вляво работи и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  addWalls(stage, { w: 18, h: 9, d: 14, tint: 0x171b22, floor: true });
  addFrost(stage, { count: 50, radius: 7, height: 8 });
  addSlit(stage, { x: -3.6, z: -4, w: 0.6, h: 10 });

  // рамка
  const frame = new T.Mesh(new T.BoxGeometry(6.6, 6.6, 0.4), stoneMat(T, 0x3b4250));
  frame.position.set(0, 2.6, -4.3);
  stage.add(frame);

  const picks = [];
  for (let n = 1; n <= 8; n++) {
    const g = new T.Group();
    const slab = new T.Mesh(new T.BoxGeometry(1.86, 1.86, 0.34), stoneMat(T, 0x555f72));
    slab.castShadow = true;
    const tex = labelTexture(T, String(n), { size: 256, color: '#f6e7bd' });
    const face = new T.Mesh(new T.PlaneGeometry(1.5, 1.5),
      new T.MeshBasicMaterial({ map: tex, transparent: true }));
    face.position.z = 0.18;
    g.add(slab, face);
    g.userData = { pick: true, n };
    stage.add(g);
    slabs.set(n, g);
    picks.push(g);
  }
  stage.setPickables(picks);
  stage.onPick(o => {
    const n = o.userData && o.userData.n;
    if (!n) return;
    const i = api.data.tiles.indexOf(n);
    if (i >= 0) moveTile(api, i);
  });
  stage.onHover(o => { stage.dom.style.cursor = o && o.userData.n ? 'pointer' : 'grab'; });

  const targets = new Map();
  stage.onFrame((t) => {
    slabs.forEach((g, n) => {
      const tg = targets.get(n);
      if (!tg) return;
      g.position.x += (tg.x - g.position.x) * 0.18;
      g.position.y += (tg.y - g.position.y) * 0.18;
      g.position.z += (tg.z - g.position.z) * 0.18;
      if (api.data.opened) g.rotation.z = Math.sin(t * 0.7 + n) * 0.012;
    });
  });
  stage.__targets = targets;
  sync(api, true);
}

function sync(api, instant) {
  if (!stage || !stage.__targets) return;
  const d = api.data;
  d.tiles.forEach((v, i) => {
    if (!v) return;
    const g = slabs.get(v); if (!g) return;
    const x = (i % 3 - 1) * 2.0;
    const y = 2.6 - (Math.floor(i / 3) - 1) * 2.0;
    stage.__targets.set(v, { x, y, z: -4.0 });
    if (instant) g.position.set(x, y, -4.0);
  });
}
