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
  sub: 'Пътеката зад теб я няма, {име}. Пред теб дърветата се разтварят на три и всеки път изглежда еднакво погрешен. Хагрид обаче е учил цял живот тази гора да се чете.',
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
    emissive: c, emissiveIntensity: 0.28, flatShading: true });

  /* нишка/пръчка по лека дъга — нищо в гората не е право */
  let sd = 0;
  const strand = (pa, pb, r, m, bow = 0.06) => {
    const s = ++sd, pts = [];
    const len = pa.distanceTo(pb);
    for (let k = 0; k <= 4; k++) {
      const u = k / 4, p = pa.clone().lerp(pb, u), w = Math.sin(u * Math.PI);
      p.y -= w * len * bow;
      p.z += w * (rnd(s * 17 + k) - 0.5) * 0.16;
      pts.push(p);
    }
    const mesh = new T.Mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(pts), 12, r, 5, false), m || mat);
    g.add(mesh);
    return mesh;
  };

  if (kind === 'moss') {
    const rock = new T.MeshStandardMaterial({ color: 0x5f6060, roughness: 1, flatShading: true });
    const stone = new T.Mesh(new T.DodecahedronGeometry(0.95, 1), rock);
    stone.position.y = 0.72; stone.scale.set(1.1, 0.85, 0.95);
    stone.rotation.set(0.3, 0.7, 0.2);
    stone.castShadow = true;
    g.add(stone);
    /* мъхът е петна по северната страна, не шапка */
    for (let k = 0; k < 7; k++) {
      const a = -0.9 + rnd(k * 13) * 1.8;
      const y = 0.55 + rnd(k * 17) * 0.8;
      const blob = new T.Mesh(new T.IcosahedronGeometry(0.2 + rnd(k * 19) * 0.16, 0), mat);
      blob.position.set(Math.sin(a) * 0.78, y, Math.cos(a) * 0.78 - 0.1);
      blob.scale.set(1, 0.55, 0.7);
      g.add(blob);
    }
  } else if (kind === 'spider') {
    /* провиснала кръгла паяжина: лъчи и фестони между тях */
    const Y = 2.1, RAY = 7;
    const at = (k, r) => new T.Vector3(
      Math.cos(Math.PI / 2 + k * (Math.PI * 2 / RAY)) * r,
      Y + Math.sin(Math.PI / 2 + k * (Math.PI * 2 / RAY)) * r, 0);
    for (let k = 0; k < RAY; k++) strand(at(k, 0.1), at(k, 1.7), 0.018, null, 0.02);
    [0.45, 0.85, 1.25, 1.65].forEach((r, ri) => {
      for (let k = 0; k < RAY; k++) {
        const r1 = r * (1 + (rnd(ri * 7 + k) - 0.5) * 0.12);
        strand(at(k, r1), at(k + 1, r1), 0.014, null, 0.16);
      }
    });
    /* две провиснали нишки надолу — тя е „провиснала“ все пак */
    strand(at(4, 1.7), new T.Vector3(-0.5, 0.1, 0.1), 0.012, null, 0.12);
    strand(at(3, 1.7), new T.Vector3(0.6, 0.1, -0.1), 0.012, null, 0.12);
  } else if (kind === 'hoof') {
    /* раздвоено копито: две капки на отпечатък, в редица */
    for (let i = 0; i < 5; i++) {
      const x = (i % 2 ? 0.45 : -0.45), z = -i * 0.9 + 1.6;
      for (const sx of [-1, 1]) {
        const half = new T.Mesh(new T.SphereGeometry(0.19, 10, 8), mat);
        half.position.set(x + sx * 0.13, 0.03, z);
        half.scale.set(0.62, 0.22, 1.35);
        half.rotation.y = sx * 0.16;
        g.add(half);
      }
      const rim = new T.Mesh(new T.TorusGeometry(0.3, 0.03, 5, 16), mat);
      rim.rotation.x = Math.PI / 2; rim.position.set(x, 0.01, z);
      rim.scale.set(1, 1.25, 1);
      g.add(rim);
    }
  } else if (kind === 'ring') {
    /* кръг от гъби с шапки, ламели и различен ръст */
    const stemMat = new T.MeshStandardMaterial({ color: 0xe0d4ba, roughness: 1 });
    const gillMat = new T.MeshStandardMaterial({ color: 0xf0e4cc, roughness: 1 });
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      const h = 0.26 + rnd(i * 23) * 0.34;
      const cr = 0.2 + rnd(i * 29) * 0.14;
      const rr = 1.25 + (rnd(i * 31) - 0.5) * 0.3;
      const x = Math.sin(a) * rr, z = Math.cos(a) * rr;
      const stem = new T.Mesh(new T.CylinderGeometry(0.05, 0.08, h, 7), stemMat);
      stem.position.set(x, h / 2, z);
      stem.rotation.z = (rnd(i * 37) - 0.5) * 0.25;
      const gills = new T.Mesh(new T.CylinderGeometry(cr * 0.92, cr * 0.5, 0.05, 12), gillMat);
      gills.position.set(x, h, z);
      const cap = new T.Mesh(new T.SphereGeometry(cr, 12, 8, 0, 6.3, 0, Math.PI / 2), mat);
      cap.position.set(x, h + 0.02, z);
      cap.scale.set(1, 0.62 + rnd(i * 41) * 0.3, 1);
      g.add(stem, gills, cap);
    }
  } else if (kind === 'branch') {
    /* пречупен клон: две парчета с назъбени краища и вейки */
    const b1 = new T.Mesh(new T.CylinderGeometry(0.11, 0.19, 2.4, 7), mat);
    b1.position.set(-0.55, 0.82, 0); b1.rotation.set(0.1, 0, 0.72); b1.castShadow = true;
    const b2 = new T.Mesh(new T.CylinderGeometry(0.07, 0.14, 1.7, 7), mat);
    b2.position.set(0.72, 0.34, 0.22); b2.rotation.set(-0.1, 0, -1.25); b2.castShadow = true;
    g.add(b1, b2);
    [[0.1, 1.7, 0.05], [0.32, 1.5, -0.1]].forEach(([x, y, z], k) => {
      const sp = new T.Mesh(new T.ConeGeometry(0.09 - k * 0.02, 0.42, 5), mat);
      sp.position.set(x, y, z); sp.rotation.z = 0.7 + k * 0.4;
      g.add(sp);
    });
    for (let k = 0; k < 4; k++) {                     /* вейки */
      const tw = new T.Mesh(new T.CylinderGeometry(0.02, 0.045, 0.5 + rnd(k * 11) * 0.4, 5), mat);
      tw.position.set(-1.1 + k * 0.42, 0.45 + rnd(k * 13) * 0.7, (rnd(k * 17) - 0.5) * 0.5);
      tw.rotation.set(rnd(k * 19) * 2, 0, 0.5 + rnd(k * 23));
      g.add(tw);
    }
  } else {
    /* черно перо: стъбло и ветрило от власинки, а не смачкана топка */
    const quill = new T.Mesh(new T.CylinderGeometry(0.014, 0.028, 1.7, 5), mat);
    quill.position.set(0, 0.88, 0); quill.rotation.z = 0.26;
    g.add(quill);
    const barb = new T.MeshStandardMaterial({ color: c, roughness: 0.75,
      emissive: c, emissiveIntensity: 0.35, side: T.DoubleSide, flatShading: true });
    for (let k = 0; k < 16; k++) {
      const u = k / 15;
      const y = 0.35 + u * 1.25;
      const x = (y - 0.88) * -0.26 * -1 + Math.sin(0.26) * 0;
      const len = 0.42 * Math.sin(Math.PI * (0.14 + u * 0.82));
      for (const sx of [-1, 1]) {
        const v = new T.Mesh(new T.PlaneGeometry(len, 0.075), barb);
        v.position.set(x * 0 + (y - 0.88) * 0.26 + sx * len * 0.5, y, 0);
        v.rotation.set(0, 0, sx * 0.42);
        g.add(v);
      }
    }
    const tipF = new T.Mesh(new T.ConeGeometry(0.05, 0.22, 6), mat);
    tipF.position.set(0.21, 1.74, 0); tipF.rotation.z = 0.26;
    g.add(tipF);
  }
  return g;
}
