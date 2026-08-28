/* ============================================================
   ТРЕТА ЧАСТ · ПОЛЯНА VIII — Сърцето на гората
   Най-старото дърво. То не пита нищо, което не знае.
   ============================================================ */
import { head, $, $$, el, shakeEl, norm, answerBar, wireAnswer, mountQuiz } from '../rooms/common.js';
import { createStage, tex } from '../three-stage.js';
import { plantForest, addFireflies, addMoonshaft, addMist, FOREST_STAGE, rnd } from './common3.js';

export const meta = {
  id: 'a3-heart',
  eyebrow: 'Поляна VIII',
  title: 'Сърцето на гората',
  sub: 'В средата стои дърво, по-старо от замъка. Кората му е нарязана с хиляда резки — по една за всяко нещо, което гората помни. Има място за още една: за {име|теб}.',
  rune: 'Р',
  grain: null,
  bg: 'off',
  tint: '#8fd0a8',
  hints: [
    { text: 'Първата гатанка пита за нещо, което си дал на замъка, за да те забрави. Три букви, а на български се пише и с четири.',
      done: d => !!d.riddle },
    { text: 'Подредбата на резките започва от Основателите и свършва с последната битка. Между тях се вместват нощта, в която Хари остана сирак, и турнирът с трите задачи.',
      done: d => !!d.ordered },
    'Отговорът на гатанката е <b>ИМЕ</b>. Редът е: основаването → чудовището в подземието → нощта в Годрикова падина → Турнирът → Битката за Хогуортс.',
  ],
};

const RIDDLE_ANSWERS = ['ИМЕ', 'ИМЕТО'];

const MARKS = [
  { t: 'Четиримата основатели засаждат замъка и гората около него.', y: 990 },
  { t: 'Салазар си тръгва и оставя чудовището си в подземието.', y: 1000 },
  { t: 'В Годрикова падина едно момче остава сираче с белег на челото.', y: 1981 },
  { t: 'Турнирът на Трима магьосници се завръща след столетия.', y: 1994 },
  { t: 'Гората чува как замъкът се пропуква — последната битка.', y: 1998 },
];

let stage = null, tree = null;

export function mount(root, api) {
  const d = api.data;
  if (d.riddle == null) d.riddle = false;
  if (!d.order) d.order = [];
  if (d.ordered == null) d.ordered = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div id="heart-stage1"></div>
          <div id="heart-stage2"></div>
          <div id="heart-stage3"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Кората се разтваря…</div></div>
      </div>
    </div>`;

  renderStage1(api);
  if (d.riddle) renderStage2(api);
  if (d.ordered) renderStage3(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } tree = null; };
}

/* ---------- стъпка 1: гатанката ---------- */
function renderStage1(api) {
  const host = $('#heart-stage1');
  if (api.data.riddle) {
    host.innerHTML = `<div class="quiz done"><p class="panel-title">Първата резка</p>
      <p class="quiz-done">Дървото прие отговора и кората се разтвори още малко.</p></div>`;
    return;
  }
  host.innerHTML = `
    <div class="parchment">
      <h4>Дървото пита</h4>
      <p><i>„Дават ти го, но ти го изричаш най-рядко.<br>
      Другите го казват по-често от теб самия.<br>
      Замъкът вече го забрави — защото ти му го даде.<br>
      Как се казва това, което ти остана без?“</i></p>
      ${answerBar('heart-riddle', 'ОТГОВОРЪТ', 'Кажи')}
    </div>`;
  wireAnswer(host, 'heart-riddle', (val, input) => {
    if (RIDDLE_ANSWERS.includes(val)) {
      api.data.riddle = true; api.saveData();
      api.sfx.chime();
      api.fx.sparksFrom(input, { count: 24, color: '#a8f0c0', spread: 150 });
      renderStage1(api); renderStage2(api);
    } else {
      api.sfx.bad(); shakeEl(input);
      api.fail('Дървото не помръдва. Това не е отговорът.', 40000);
    }
  });
}

/* ---------- стъпка 2: резките по кората ---------- */
function renderStage2(api) {
  const host = $('#heart-stage2');
  const d = api.data;
  if (d.ordered) {
    host.innerHTML = `<div class="quiz done"><p class="panel-title">Резките по кората</p>
      <p class="quiz-done">Хилядата резки светват една след друга в правилния ред.</p></div>`;
    return;
  }
  const chosen = d.order.map(i => MARKS[i]);
  const left = MARKS.map((m, i) => i).filter(i => !d.order.includes(i));
  host.innerHTML = `
    <div class="sub-step">
      <p class="panel-title">Резките по кората</p>
      <p class="muted" style="font-size:.93rem;margin:-6px 0 12px">
        Гората помни всичко, но вече не помни в какъв ред. Подреди петте резки
        <b>от най-старата към най-новата</b>.</p>
      <ol class="mark-order" id="mark-order">
        ${chosen.map((m, k) => `<li><span class="mo-n">${k + 1}</span>${m.t}</li>`).join('')}
      </ol>
      <div class="mark-pool">
        ${left.map(i => `<button class="mark-btn" data-i="${i}">${MARKS[i].t}</button>`).join('')}
      </div>
      <div class="flex flex-center mt">
        ${d.order.length ? '<button class="btn btn-ghost btn-sm" id="mark-undo"><span>Махни последната</span></button>' : ''}
        ${d.order.length === MARKS.length ? '<button class="btn btn-house btn-sm" id="mark-check"><span>Нареж резките</span></button>' : ''}
      </div>
    </div>`;

  $$('.mark-btn', host).forEach(b => b.addEventListener('click', () => {
    d.order.push(+b.dataset.i); api.saveData(); api.sfx.click(); renderStage2(api);
  }));
  const u = $('#mark-undo');
  if (u) u.addEventListener('click', () => { d.order.pop(); api.saveData(); api.sfx.click(); renderStage2(api); });
  const c = $('#mark-check');
  if (c) c.addEventListener('click', () => {
    const ok = d.order.every((idx, k) => MARKS[idx].y === [...MARKS].sort((a, b) => a.y - b.y)[k].y);
    if (ok) {
      d.ordered = true; api.saveData();
      api.sfx.unlock();
      api.fx.flash('rgba(150,220,180,.2)', 700);
      renderStage2(api); renderStage3(api);
    } else {
      api.sfx.bad(); shakeEl($('#mark-order'));
      d.order = []; api.saveData();
      api.fail('Резките изгасват и се разбъркват. Редът не е този.', 45000);
      renderStage2(api);
    }
  });
}

/* ---------- стъпка 3: какво знае гората ---------- */
function renderStage3(api) {
  const host = $('#heart-stage3');
  mountQuiz(host, {
    api, key: 'quiz',
    title: 'И накрая — какво знаеш ти за нея',
    intro: 'Кората се е разтворила докрай. Вътре свети нещо, но дървото пита още три пъти.',
    doneText: 'Дървото затваря кората и оставя руната в дланта ти.',
    questions: [
      { q: 'Как се казваше акромантулът, когото Хагрид отгледа в замъка?',
        opts: [ { t: 'Арагог', ok: true },
                { t: 'Мосаг', ok: false, r: 'Мосаг беше жената на Арагог.' },
                { t: 'Норберт', ok: false, r: 'Норберт беше дракон, не паяк.' } ] },
      { q: 'Кой кентавър наруши закона на стадото си, за да преподава в Хогуортс?',
        opts: [ { t: 'Фиренце', ok: true },
                { t: 'Бейн', ok: false, r: 'Бейн беше най-яростният противник на това.' },
                { t: 'Магориан', ok: false, r: 'Магориан водеше стадото, но не отиде в замъка.' } ] },
      { q: 'Кого доведе Хагрид от планините и скри в гората?',
        opts: [ { t: 'Гроуп — своя полубрат великан.', ok: true },
                { t: 'Клуб — тристав пес.', ok: false, r: 'Пухчо пазеше камъка, не гората.' },
                { t: 'Бъкбийк — хипогриф.', ok: false, r: 'Бъкбийк дойде от урок, не от планините.' } ] },
    ],
    onDone: () => {
      if (tree) tree.userData.awake = true;
      setTimeout(() => api.solve('Кората се затваря с влажен звук. В дланта ти остава топла руна с формата на листо.'), 600);
    },
  });
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...FOREST_STAGE, dist: 36, fov: 46, look: [0, 9.5, 0],
    theta: 0.2, phi: 1.18, minPolar: 0.4, maxPolar: 1.45, autoSpin: 0.02,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL за дървото, но гатанките вляво работят.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  plantForest(stage, { count: 48, inner: 22, outer: 44 });
  addMist(stage, { count: 10 });
  addFireflies(stage, { count: 70, radius: 12 });
  addMoonshaft(stage, { r: 7, h: 34, color: 0xcfe8d0 });

  tree = new T.Group();
  const bark = new T.MeshStandardMaterial({
    color: 0x3a2c1e, roughness: 1, map: tex(T, 'wood-dark', 2, 4),
    emissive: 0x1a2a18, emissiveIntensity: 0.2 });
  const barkOld = new T.MeshStandardMaterial({
    color: 0x2c2116, roughness: 1, map: tex(T, 'wood-dark', 1, 2),
    emissive: 0x121e10, emissiveIntensity: 0.2 });

  /* стволът е от няколко пръстена с различен наклон — така се извива
     и престава да прилича на канализационна тръба                   */
  const RING = [[4.2, 0], [3.6, 3], [3.1, 6], [2.7, 9], [2.3, 12], [1.8, 15.4]];
  for (let k = 0; k < RING.length - 1; k++) {
    const [r0, y0] = RING[k], [r1, y1] = RING[k + 1];
    const seg = new T.Mesh(new T.CylinderGeometry(r1, r0, y1 - y0, 14, 1, true), bark);
    seg.position.set(Math.sin(k * 1.7) * 0.22 * k, (y0 + y1) / 2, Math.cos(k * 1.9) * 0.2 * k);
    seg.rotation.z = Math.sin(k * 1.3) * 0.035;
    seg.castShadow = true;
    tree.add(seg);
  }

  /* контрафорсни корени: издути ребра, които слизат до земята */
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const h = 3.4 + rnd(i * 7) * 2.2;
    const root = new T.Mesh(new T.CylinderGeometry(0.28, 1.1, h, 7), barkOld);
    root.position.set(Math.sin(a) * 2.5, h * 0.36, Math.cos(a) * 2.5);
    root.rotation.set(Math.cos(a) * 0.62, 0, -Math.sin(a) * 0.62);
    root.castShadow = true;
    tree.add(root);
  }

  const leafMat = new T.MeshStandardMaterial({ color: 0x2e5233, roughness: 1,
    emissive: 0x163018, emissiveIntensity: 0.55, flatShading: true });
  const leafMat2 = new T.MeshStandardMaterial({ color: 0x3d663c, roughness: 1,
    emissive: 0x1b3a1c, emissiveIntensity: 0.5, flatShading: true });

  /* клони, които излизат от ствола и носят короната */
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.6;
    const y = 9.5 + rnd(i * 13) * 4.5;
    const len = 3.6 + rnd(i * 17) * 2.6;
    const br = new T.Mesh(new T.CylinderGeometry(0.16, 0.55, len, 7), bark);
    br.position.set(Math.sin(a) * len * 0.34, y + len * 0.24, Math.cos(a) * len * 0.34);
    br.rotation.set(Math.cos(a) * 0.95, 0, -Math.sin(a) * 0.95);
    br.castShadow = true;
    tree.add(br);
    /* по-тънко разклонение от върха на клона */
    const tw = new T.Mesh(new T.CylinderGeometry(0.07, 0.2, len * 0.55, 5), bark);
    tw.position.set(Math.sin(a) * len * 0.72, y + len * 0.72, Math.cos(a) * len * 0.72);
    tw.rotation.set(Math.cos(a + 0.6) * 0.8, 0, -Math.sin(a + 0.6) * 0.8);
    tree.add(tw);
  }

  /* короната: двайсетина неправилни гроздове вместо пет гладки топки */
  for (let k = 0; k < 40; k++) {
    const a = rnd(k * 23) * Math.PI * 2;
    const rr = 0.9 + rnd(k * 29) * 7.2;
    const c = new T.Mesh(
      new T.IcosahedronGeometry(0.95 + rnd(k * 31) * 1.35, 1),
      k % 3 ? leafMat : leafMat2);
    c.position.set(Math.sin(a) * rr, 12.8 + rnd(k * 37) * 7.4 - rr * 0.35, Math.cos(a) * rr);
    c.scale.set(1, 0.68 + rnd(k * 41) * 0.34, 1);
    c.rotation.set(rnd(k * 43) * 3, rnd(k * 47) * 3, rnd(k * 53) * 3);
    c.castShadow = true;
    tree.add(c);
  }

  // светещите резки по кората
  const scars = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 * 3;
    const y = 2 + (i / 26) * 11;
    const r = 3.3 - (y / 15) * 1.8;
    const m = new T.Mesh(new T.BoxGeometry(0.1, 0.7, 0.12),
      new T.MeshBasicMaterial({ color: 0x8fd0a8, transparent: true, opacity: 0.35 }));
    m.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
    m.lookAt(0, y, 0);
    tree.add(m);
    scars.push(m);
  }
  tree.userData = { awake: false, scars };
  stage.add(tree);

  stage.onFrame((t) => {
    const on = tree.userData.awake;
    scars.forEach((s, i) => {
      s.material.opacity = (on ? 0.6 : 0.22) + Math.sin(t * 1.6 + i * 0.4) * (on ? 0.3 : 0.12);
    });
  });
}
