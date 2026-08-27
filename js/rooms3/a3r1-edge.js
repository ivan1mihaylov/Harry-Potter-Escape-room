/* ============================================================
   ТРЕТА ЧАСТ · ПОЛЯНА I — Ръбът на гората
   Шест разклонения. Пътеката се чете по знаци, не по посока.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { plantForest, addFireflies, addMist, FOREST_STAGE, rnd } from './common3.js';

export const meta = {
  id: 'a3-edge',
  eyebrow: 'Поляна I',
  title: 'Ръбът на гората',
  sub: 'Пътеката зад теб я няма. Пред теб дърветата се разтварят на три и всеки път изглежда еднакво погрешен. Хагрид обаче е учил цял живот тази гора да се чете.',
  rune: 'Н',
  bg: 'off',
  tint: '#6fd8a0',
  hints: [
    'Всяко разклонение носи природен знак. Прочети правилото над трите пътеки — то ти казва кой знак да следваш или кой да избягваш.',
    'Мъхът расте на север. Паяците водят навътре в гората, но Хагрид казва „следвайте паяците“. В кръг от гъби не се стъпва — там танцуват феи.',
    'Сгрешиш ли, гората те връща <b>две разклонения назад</b>. Чети правилото два пъти, преди да тръгнеш.',
  ],
};

const SIGNS = {
  moss:      { name: 'обрасъл с мъх камък',   color: 0x4a7a42 },
  spider:    { name: 'провиснала паяжина',    color: 0xd8e0e8 },
  hoof:      { name: 'раздвоени копита',      color: 0x2a2622 },
  ring:      { name: 'кръг от гъби',          color: 0xb87a5a },
  branch:    { name: 'пречупен клон',         color: 0x6b4a2a },
  feather:   { name: 'черно перо',            color: 0x1e2230 },
};

const FORKS = [
  { rule: 'Хагрид повтаряше едно и също: <b>„Следвайте паяците.“</b>',
    take: 'spider', with: ['spider', 'moss', 'branch'] },
  { rule: 'Мъхът расте на северната страна. Тръгни <b>натам, накъдето мъхът е дебел</b>.',
    take: 'moss', with: ['hoof', 'moss', 'ring'] },
  { rule: 'В <b>кръг от гъби</b> не се стъпва — там танцуват феи, а времето вътре не тече. Всичко друго е по-добро от него; избягвай и мястото, където паяците вече са били.',
    take: 'branch', with: ['ring', 'spider', 'branch'] },
  { rule: 'Тестралите ядат месо и не се боят от нищо. <b>Следвай раздвоените им копита</b> — те знаят пряк път.',
    take: 'hoof', with: ['feather', 'hoof', 'ring'] },
  { rule: 'Черните пера падат от врани, а враните кръжат над мърша. <b>Не тръгвай натам.</b> Не тръгвай и по паяжина — тя вече те заведе веднъж.',
    take: 'moss', with: ['feather', 'spider', 'moss'] },
  { rule: 'Последното разклонение: гората иска да си спомниш първото правило. <b>Направи същото като тогава.</b>',
    take: 'spider', with: ['ring', 'hoof', 'spider'] },
];

let stage = null, trailNodes = [];

export function mount(root, api) {
  const d = api.data;
  if (d.fork == null) d.fork = 0;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Наученото от Хагрид</h4>
            <div id="fork-rule"></div>
          </div>
          <div class="trail-progress" id="trail-progress"></div>
          <div class="trail-picks" id="trail-picks"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Дърветата се разтварят…</div></div>
      </div>
      <p class="center muted stage-help">Влачи, за да се огледаш. Докосни знака на пътеката, по която тръгваш.</p>
    </div>`;

  renderRule(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } trailNodes = []; };
}

function renderRule(api) {
  const d = api.data;
  const done = d.fork >= FORKS.length;
  const r = $('#fork-rule');
  if (r) r.innerHTML = done
    ? '<p>Шестте разклонения останаха зад теб. Гората те пусна навътре.</p>'
    : `<p><b>Разклонение ${d.fork + 1} от ${FORKS.length}.</b></p><p>${FORKS[d.fork].rule}</p>`;

  const p = $('#trail-progress');
  if (p) p.innerHTML = FORKS.map((_, i) =>
    `<i class="tp${i < d.fork ? ' done' : i === d.fork ? ' now' : ''}"></i>`).join('');

  const picks = $('#trail-picks');
  if (picks) {
    if (done) { picks.innerHTML = ''; return; }
    picks.innerHTML = FORKS[d.fork].with.map((s, i) =>
      `<button class="trail-btn" data-s="${s}">
         <span class="tb-dot" style="background:#${SIGNS[s].color.toString(16).padStart(6, '0')}"></span>
         ${SIGNS[s].name}
       </button>`).join('');
    $$('.trail-btn', picks).forEach(b => b.addEventListener('click', () => choose(api, b.dataset.s)));
  }
}

function choose(api, sign) {
  if (api.solved) return;
  const d = api.data;
  const fork = FORKS[d.fork];
  if (sign === fork.take) {
    d.fork++; api.saveData();
    api.sfx.whoosh();
    api.fx.sparksFrom($('#stage'), { count: 16, color: '#9ff0b0', spread: 120 });
    renderRule(api);
    layTrail(api);
    if (d.fork >= FORKS.length) {
      api.sfx.unlock();
      api.fx.flash('rgba(110,220,150,.2)', 700);
      setTimeout(() => api.solve('Шест пъти позна и гората престана да те връща. Върху пъна пред теб лежи руна.'), 700);
    }
  } else {
    api.sfx.bad();
    api.fx.shakeScreen(9, 420);
    d.fork = Math.max(0, d.fork - 2); api.saveData();
    renderRule(api);
    layTrail(api);
    api.fail(`Пътеката се затваря зад гърба ти. Гората те връща две разклонения назад.`, 45000);
  }
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...FOREST_STAGE, dist: 19, fov: 48, look: [0, 2.2, 0],
    theta: 0, phi: 1.14, minPolar: 0.3, maxPolar: 1.44,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL за гората, но пътеките вляво се избират и без нея.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  plantForest(stage, { count: 54, inner: 9, outer: 26 });
  addMist(stage, { count: 12 });
  addFireflies(stage, { count: 80 });

  // трите пътеки напред
  const pathMat = new T.MeshStandardMaterial({ color: 0x2a2418, roughness: 1 });
  [-1, 0, 1].forEach((k) => {
    const a = k * 0.42;
    const strip = new T.Mesh(new T.PlaneGeometry(2.6, 22), pathMat);
    strip.rotation.x = -Math.PI / 2;
    strip.rotation.z = a;
    strip.position.set(Math.sin(a) * 9, 0.02, -Math.cos(a) * 9);
    strip.receiveShadow = true;
    stage.add(strip);
  });

  layTrail(api);
}

/* знаците по трите пътеки */
function layTrail(api) {
  if (!stage) return;
  const T = stage.THREE;
  trailNodes.forEach(n => stage.pivot.remove(n));
  trailNodes = [];
  const d = api.data;
  if (d.fork >= FORKS.length) return;

  const picks = [];
  FORKS[d.fork].with.forEach((sign, i) => {
    const a = (i - 1) * 0.42;
    const g = buildSign(T, sign);
    g.position.set(Math.sin(a) * 6.5, 0, -Math.cos(a) * 6.5);
    g.userData = { pick: true, sign };
    g.traverse(c => { c.userData.pick = c.userData.pick || false; });
    stage.add(g);
    trailNodes.push(g);
    picks.push(g);
  });
  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && !(n.userData && n.userData.sign) && n.parent) n = n.parent;
    if (n && n.userData && n.userData.sign) choose(api, n.userData.sign);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });
}

function buildSign(T, kind) {
  const g = new T.Group();
  const c = SIGNS[kind].color;
  const mat = new T.MeshStandardMaterial({ color: c, roughness: 0.9,
    emissive: c, emissiveIntensity: 0.28 });

  if (kind === 'moss') {
    const stone = new T.Mesh(new T.DodecahedronGeometry(0.95, 0),
      new T.MeshStandardMaterial({ color: 0x5a5a56, roughness: 1 }));
    stone.position.y = 0.8; stone.castShadow = true;
    const moss = new T.Mesh(new T.SphereGeometry(0.7, 12, 10, 0, Math.PI), mat);
    moss.position.set(0, 0.95, -0.35); moss.rotation.x = -0.4;
    g.add(stone, moss);
  } else if (kind === 'spider') {
    const web = new T.Group();
    for (let r = 0.4; r <= 1.6; r += 0.4) {
      const ring = new T.Mesh(new T.TorusGeometry(r, 0.02, 5, 18), mat);
      web.add(ring);
    }
    for (let i = 0; i < 6; i++) {
      const spoke = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 3.2, 4), mat);
      spoke.rotation.z = (i / 6) * Math.PI;
      web.add(spoke);
    }
    web.position.y = 2.1;
    g.add(web);
  } else if (kind === 'hoof') {
    for (let i = 0; i < 5; i++) {
      const p = new T.Mesh(new T.CylinderGeometry(0.22, 0.26, 0.08, 10), mat);
      p.position.set((i % 2 ? 0.45 : -0.45), 0.05, -i * 0.9 + 1.6);
      p.scale.z = 1.5;
      g.add(p);
    }
  } else if (kind === 'ring') {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const cap = new T.Mesh(new T.SphereGeometry(0.24, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      cap.position.set(Math.sin(a) * 1.3, 0.3, Math.cos(a) * 1.3);
      const stem = new T.Mesh(new T.CylinderGeometry(0.07, 0.09, 0.3, 6),
        new T.MeshStandardMaterial({ color: 0xd8cbb0, roughness: 1 }));
      stem.position.set(cap.position.x, 0.15, cap.position.z);
      g.add(cap, stem);
    }
  } else if (kind === 'branch') {
    const b1 = new T.Mesh(new T.CylinderGeometry(0.16, 0.2, 2.6, 6), mat);
    b1.position.set(-0.5, 0.9, 0); b1.rotation.z = 0.7; b1.castShadow = true;
    const b2 = new T.Mesh(new T.CylinderGeometry(0.12, 0.16, 1.8, 6), mat);
    b2.position.set(0.7, 0.4, 0.2); b2.rotation.z = -1.2; b2.castShadow = true;
    g.add(b1, b2);
  } else {
    const q = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 1.8, 4), mat);
    q.position.y = 0.9; q.rotation.z = 0.3;
    const vane = new T.Mesh(new T.SphereGeometry(0.5, 10, 8), mat);
    vane.scale.set(0.28, 1.1, 0.1);
    vane.position.set(0.13, 1.0, 0); vane.rotation.z = 0.3;
    g.add(q, vane);
  }
  return g;
}
