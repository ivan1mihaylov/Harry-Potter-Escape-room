/* ============================================================
   ПЕТА ЧАСТ · КАМЕРА II — Дванадесетте врати
   Кръглата зала се завърта и обърква посоките. Тебеширът
   на Хърмаяни е единственият начин да разбереш с колко.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { MYSTERY_STAGE, addChamber, addBlueFlames, addDust, buildDoor, addMysteryLight } from './common5.js';

export const meta = {
  id: 'a5-doors',
  eyebrow: 'Камера II',
  title: 'Дванадесетте врати',
  sub: 'Кръгла зала без прозорци и с дванадесет еднакви врати. Затвориш ли входа, стените се завъртат — и всяка врата изглежда като всяка друга.',
  rune: 'Н',
  bg: 'off',
  tint: '#7f6fc0',
  hints: [
    'Вратите са неразличими, но <b>тебеширът остава по тях</b>. Отбележи една и завърти залата — къде отиде белегът, това е завъртането.',
    'Залата се завърта с един и същ брой врати всеки път. Едно наблюдение стига, за да го изчислиш.',
    'Изходът е зад вратата, която <b>при влизане</b> е стояла на позиция <b>8</b>. Завъртането е <b>5</b> врати по посока на часовника, така че след <i>k</i> завъртания изходът е на позиция <b>(8 + 5k) mod 12</b>.',
  ],
};

const D = 12;         // врати
const SPIN = 5;       // с колко врати се завърта залата
const EXIT_AT_ENTRY = 8;

let stage = null, ring = null, doorMeshes = [], chalkMarks = [], API = null;

export function mount(root, api) {
  const d = api.data;
  if (d.spins == null) d.spins = 0;
  if (!d.marks) d.marks = [];      // позиции (в текущата ориентация) с тебешир
  if (d.tries == null) d.tries = 0;
  API = api;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel">
      <p class="panel-title">Издълбано над входа</p>
      <blockquote class="doors-rule">«Изходът е зад вратата, която те гледаше <b>осма</b>, когато
      влезе. Залата ще се върти. Тебеширът няма да ѝ попречи — но ще ти каже колко.»</blockquote>
    </div>

    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="doors-ring" id="doors-ring"></div>
          <div class="doors-info" id="doors-info"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-ghost btn-sm" id="do-spin"><span>Завърти залата</span></button>
            <button class="btn btn-ghost btn-sm" id="do-wipe"><span>Изтрий тебешира</span></button>
          </div>
          <p class="muted center doors-help">Кликни врата, за да я <b>отбележиш</b> с тебешир.
          Натисни я втори път, за да я <b>отвориш</b>.</p>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Стените се въртят…</div></div>
      </div>
    </div>`;

  draw(api);
  $('#do-spin').addEventListener('click', () => spin(api));
  $('#do-wipe').addEventListener('click', () => {
    if (api.solved) return;
    api.data.marks = []; api.saveData(); api.sfx.click(); draw(api); sync();
  });

  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } doorMeshes = []; chalkMarks = []; ring = null; API = null; };
}

/* коя позиция заема изходът в момента */
const exitNow = (spins) => (EXIT_AT_ENTRY + SPIN * spins) % D;

function spin(api) {
  if (api.solved) return;
  const d = api.data;
  d.spins++;
  /* тебеширът се върти заедно със стената */
  d.marks = d.marks.map(p => (p + SPIN) % D);
  api.saveData();
  api.sfx.whoosh();
  if (ring) {
    ring.userData.target = (ring.userData.target || 0) + (SPIN / D) * Math.PI * 2;
  }
  draw(api);
  sync();
}

function tap(api, pos) {
  if (api.solved) return;
  const d = api.data;
  if (!d.marks.includes(pos)) {
    d.marks = [...d.marks, pos];
    api.saveData(); api.sfx.tick();
    draw(api); sync();
    return;
  }
  /* втори натиск = отваряме */
  d.tries++;
  api.saveData();
  if (pos === exitNow(d.spins)) {
    api.sfx.unlock();
    api.fx.flash('rgba(160,190,255,.24)', 700);
    api.fx.celebrate(1.4);
    setTimeout(() => api.solve('Вратата се отваря към коридор, който не се върти. На прага, изписана с тебешир от нечия чужда ръка, стои руна.'), 650);
  } else {
    api.sfx.bad();
    api.fx.shakeScreen(9, 380);
    api.fail('Зад вратата има само още една стая без изход. Залата се завърта отново.');
    spin(api);
  }
}

function draw(api) {
  const d = api.data;
  const box = $('#doors-ring'); if (!box) return;
  box.innerHTML = Array.from({ length: D }, (_, i) => {
    const marked = d.marks.includes(i);
    return `<button class="door-cell${marked ? ' marked' : ''}" data-p="${i}">
      <b>${i}</b>${marked ? '<i>✕</i>' : ''}</button>`;
  }).join('');
  $$('.door-cell', box).forEach(b => b.addEventListener('click', () => tap(api, +b.dataset.p)));

  const info = $('#doors-info');
  if (info) info.innerHTML = api.solved
    ? '<b>Изходът е зад теб.</b>'
    : `завъртания: <b>${d.spins}</b> · отбелязани врати: <b>${d.marks.length}</b>${
        d.tries ? ` · отваряни: <b>${d.tries}</b>` : ''}`;
}

/* ---------- 3D ---------- */
/* Физическата врата с номер i стои на позиция (i + SPIN·завъртания) mod 12,
   защото пръстенът се върти заедно с тебешира по него. */
function sync() {
  if (!stage || !chalkMarks.length || !API) return;
  const d = API.data;
  chalkMarks.forEach((m, i) => {
    m.visible = d.marks.includes((i + SPIN * d.spins) % D);
  });
}

async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...MYSTERY_STAGE, ground: false, dist: 16, fov: 46, look: [0, 1.6, 0],
    theta: 0, phi: 1.12, minPolar: 0.4, maxPolar: 1.42,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за залата — кръгът вляво работи и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  addMysteryLight(stage);
  const T = stage.THREE;

  addChamber(stage, { r: 9.4, h: 6.5, seg: 24 });
  addBlueFlames(stage, { count: 12, r: 8.4, h: 4.6 });
  addDust(stage, { count: 70, radius: 8, height: 6 });

  ring = new T.Group();
  ring.userData.target = 0;
  stage.add(ring);

  const picks = [];
  for (let i = 0; i < D; i++) {
    const a = (i / D) * Math.PI * 2;
    const g = buildDoor(T, { w: 1.5, h: 3.2 });
    g.position.set(Math.sin(a) * 8.6, 0, Math.cos(a) * 8.6);
    g.lookAt(0, 1.6, 0);
    g.userData.pick = true;
    g.userData.pos = i;
    ring.add(g);
    doorMeshes.push(g);
    picks.push(g);

    /* тебеширеният кръст — скрит, докато не бъде сложен */
    const mark = new T.Mesh(new T.PlaneGeometry(0.6, 0.6),
      new T.MeshBasicMaterial({ color: 0xf2efe6, transparent: true, opacity: 0.9 }));
    mark.position.set(0, 1.9, 0.12);
    mark.visible = false;
    g.add(mark);
    chalkMarks.push(mark);
  }

  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && n.userData.pos == null && n.parent) n = n.parent;
    if (n && n.userData.pos != null) tap(api, n.userData.pos);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  stage.onFrame(() => {
    if (!ring) return;
    const t = ring.userData.target || 0;
    ring.rotation.y += (t - ring.rotation.y) * 0.06;
  });

  sync();
}
