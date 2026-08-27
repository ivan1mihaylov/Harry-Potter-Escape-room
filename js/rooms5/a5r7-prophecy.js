/* ============================================================
   ПЕТА ЧАСТ · КАМЕРА VII — Залата на пророчествата
   Рафт 97, пет реда на пет. Всяка сфера носи число, и никой
   ред и никоя колона не търпи две еднакви.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { MYSTERY_STAGE, addDust, buildOrb, addMysteryLight } from './common5.js';

export const meta = {
  id: 'a5-prophecy',
  eyebrow: 'Камера VII',
  title: 'Залата на пророчествата',
  sub: 'Рафт деветдесет и седми. Пет реда по пет гнезда, а сферите са разбъркани от някого, който е бързал. Празно гнездо значи счупена сфера.',
  rune: 'И',
  bg: 'off',
  tint: '#b9a6e8',
  hints: [
    'Всяко число от <b>1 до 5</b> се среща точно веднъж във всеки ред и точно веднъж във всяка колона. Нищо повече.',
    'Търси реда или колоната, в която липсва само едно число — там няма избор.',
    'Започни от четвъртата колона: в нея вече стоят 2 и 1, а третият ред иска 3 — тогава редовете се затварят един по един.',
  ],
};

const S = 5;
/* проверено: с тези осем дадени числа решението е единствено */
const GIVEN = [
  [5, 0, 0, 2, 0],
  [0, 0, 0, 1, 0],
  [4, 0, 5, 0, 0],
  [0, 1, 3, 0, 0],
  [0, 0, 4, 0, 0],
];
const SOLVED = [
  [5, 4, 1, 2, 3],
  [3, 5, 2, 1, 4],
  [4, 2, 5, 3, 1],
  [2, 1, 3, 4, 5],
  [1, 3, 4, 5, 2],
];
const ORB_COLOR = [0, 0x8fb4ff, 0x7fd6a1, 0xffd77a, 0xff9a8f, 0xc79bff];

let stage = null, orbMeshes = [];

export function mount(root, api) {
  const d = api.data;
  if (!d.grid) d.grid = GIVEN.map(r => [...r]);
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="shelf-grid" id="shelf-grid"></div>
          <div class="shelf-info" id="shelf-info"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-house btn-sm" id="sh-check"><span>Провери рафта</span></button>
            <button class="btn btn-ghost btn-sm" id="sh-clear"><span>Върни както беше</span></button>
          </div>
          <p class="muted center doors-help">Кликни гнездо, за да сложиш следващото число.
          След 5 се изпразва. Тъмните гнезда не се местят.</p>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Рафтовете се проясняват…</div></div>
      </div>
    </div>`;

  draw(api);
  $('#sh-check').addEventListener('click', () => check(api));
  $('#sh-clear').addEventListener('click', () => {
    if (api.solved) return;
    api.data.grid = GIVEN.map(r => [...r]);
    api.saveData(); api.sfx.click(); draw(api); sync();
  });

  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } orbMeshes = []; };
}

const fixed = (r, c) => GIVEN[r][c] !== 0;

function bump(api, r, c) {
  if (api.solved || fixed(r, c)) return;
  const d = api.data;
  d.grid[r][c] = (d.grid[r][c] + 1) % (S + 1);
  api.saveData(); api.sfx.tick();
  draw(api); sync();
}

function conflicts(g) {
  const bad = new Set();
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
    const v = g[r][c];
    if (!v) continue;
    for (let k = 0; k < S; k++) {
      if (k !== c && g[r][k] === v) { bad.add(r + ',' + c); bad.add(r + ',' + k); }
      if (k !== r && g[k][c] === v) { bad.add(r + ',' + c); bad.add(k + ',' + c); }
    }
  }
  return bad;
}

function check(api) {
  const g = api.data.grid;
  if (g.some(r => r.some(v => !v))) { api.sfx.bad(); api.toast('Има празни гнезда.', 'bad'); return; }
  if (conflicts(g).size) { api.sfx.bad(); api.fail('Две еднакви сфери се виждат в един ред или колона.'); return; }
  if (!g.every((r, i) => r.every((v, j) => v === SOLVED[i][j]))) {
    api.sfx.bad(); api.fail('Рафтът мълчи. Нещо не е на мястото си.'); return;
  }
  api.sfx.unlock();
  api.fx.flash('rgba(190,160,255,.24)', 800);
  api.fx.celebrate(1.5);
  if (stage) stage.__lit = true;
  setTimeout(() => api.solve('Двадесет и петте сфери светват в един и същи миг. Една от тях е топла — и на етикета ѝ вместо име стои руна.'), 700);
}

function draw(api) {
  const box = $('#shelf-grid'); if (!box) return;
  const g = api.data.grid;
  const bad = conflicts(g);
  let html = '';
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
    const v = g[r][c];
    const cls = [
      fixed(r, c) ? 'fixed' : '',
      bad.has(r + ',' + c) ? 'bad' : '',
      v ? 'set' : 'empty',
    ].filter(Boolean).join(' ');
    html += `<button class="sh-cell ${cls}" data-r="${r}" data-c="${c}"
      style="--oc:#${(ORB_COLOR[v] || 0x2a2438).toString(16).padStart(6, '0')}">
      ${v || ''}</button>`;
  }
  box.innerHTML = html;
  $$('.sh-cell', box).forEach(b =>
    b.addEventListener('click', () => bump(api, +b.dataset.r, +b.dataset.c)));

  const info = $('#shelf-info');
  if (info) {
    const filled = g.flat().filter(Boolean).length;
    info.innerHTML = api.solved
      ? '<b>Рафтът е подреден.</b>'
      : `запълнени <b>${filled}</b> от 25${bad.size ? ' · <span class="sh-warn">има повторения</span>' : ''}`;
  }
}

/* ---------- 3D ---------- */
function sync() {
  if (!stage || !orbMeshes.length) return;
  const g = stage.__grid ? stage.__grid() : GIVEN;
  orbMeshes.forEach(o => {
    const v = g[o.userData.r][o.userData.c];
    o.visible = v > 0;
    if (v > 0) {
      const col = new stage.THREE.Color(ORB_COLOR[v]);
      o.userData.glass.material.color.copy(col);
      o.userData.glass.material.emissive.copy(col);
    }
  });
}

async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...MYSTERY_STAGE, ground: false, dist: 10, fov: 44, look: [0, 1.9, 0],
    theta: 0, phi: 1.24, minPolar: 0.7, maxPolar: 1.45,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за рафта — мрежата вляво работи и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  addMysteryLight(stage);
  stage.__grid = () => api.data.grid;
  const T = stage.THREE;

  /* рафтовете */
  const wood = new T.MeshStandardMaterial({ color: 0x4a3d68, roughness: 0.7, metalness: 0.18,
    emissive: 0x1e1740, emissiveIntensity: 0.5 });
  for (let r = 0; r <= S; r++) {
    const plank = new T.Mesh(new T.BoxGeometry(5.6, 0.12, 0.9), wood);
    plank.position.set(0, 0.3 + r * 0.8, -1.4);
    stage.add(plank);
  }
  [-2.85, 2.85].forEach(x => {
    const side = new T.Mesh(new T.BoxGeometry(0.14, S * 0.8 + 0.5, 0.9), wood);
    side.position.set(x, 0.3 + (S * 0.8) / 2, -1.4);
    stage.add(side);
  });

  const picks = [];
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
    const g = buildOrb(T, { r: 0.2 });
    g.position.set(-2.2 + c * 1.1, 0.56 + (S - 1 - r) * 0.8, -1.4);
    g.userData = { pick: true, r, c, glass: g.userData.glass, ph: (r * S + c) * 0.4 };
    stage.add(g);
    orbMeshes.push(g);
    picks.push(g);

    /* гнездото винаги се вижда, дори сферата да я няма */
    const socket = new T.Mesh(new T.CylinderGeometry(0.19, 0.22, 0.07, 12),
      new T.MeshStandardMaterial({ color: 0x2c2450, roughness: 0.75 }));
    socket.position.set(g.position.x, 0.4 + (S - 1 - r) * 0.8, -1.4);
    stage.add(socket);
  }

  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && n.userData.r == null && n.parent) n = n.parent;
    if (n && n.userData.r != null) bump(api, n.userData.r, n.userData.c);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  addDust(stage, { count: 70, radius: 6, height: 6 });

  stage.onFrame(t => {
    orbMeshes.forEach(o => {
      o.userData.glass.material.emissiveIntensity = stage.__lit
        ? 0.7 + Math.sin(t * 2 + o.userData.ph) * 0.3
        : 0.4;
    });
  });

  sync();
}
