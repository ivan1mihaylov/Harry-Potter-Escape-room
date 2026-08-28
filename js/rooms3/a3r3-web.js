/* ============================================================
   ТРЕТА ЧАСТ · ПОЛЯНА III — Паяжината
   Мине ли се два пъти по една нишка, тя пее. А те слушат.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';
import { plantForest, addFireflies, FOREST_STAGE, rnd } from './common3.js';

export const meta = {
  id: 'a3-web',
  eyebrow: 'Поляна III',
  title: 'Паяжината',
  sub: 'Между четири дървета виси мрежа, широка колкото стая. По нея се минава само веднъж през всеки възел — акромантулите усещат повторенията и се будят от тях.',
  rune: 'П',
  grain: null,
  bg: 'off',
  tint: '#c9d4e0',
  hints: [
    'Тръгваш от възел <b>7</b> и трябва да свършиш при възел <b>9</b>, като минеш през <b>всичките десет</b> възела по веднъж.',
    'Възел <b>2</b> има само две нишки — значи по него се минава транзитно и той не може да е нито първи, нито последен. Затова влизаш в него от 5 и излизаш към 3.',
    'Единственият път е: <b>7 → 8 → 5 → 2 → 3 → 0 → 1 → 4 → 6 → 9</b>.',
  ],
};

const EDGES = [[0,1],[0,3],[1,4],[2,5],[3,6],[4,5],[5,6],[6,4],[4,7],[5,8],[6,9],[7,8],[8,9],[2,3]];
const START = 7, END = 9, N = 10;

/* възлите: център, вътрешен, среден и външен пръстен в отвесна равнина */
const NODE_POS = (() => {
  const p = [[0, 0]];
  const ang = [Math.PI / 2, Math.PI * 7 / 6, Math.PI * 11 / 6];
  [3.2, 6.2, 9.2].forEach(r => ang.forEach(a => p.push([Math.cos(a) * r, Math.sin(a) * r])));
  return p;
})();

const adjacent = (a, b) => EDGES.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));

let stage = null, nodeMeshes = [], threadLines = [], drawn = null, drawnCount = 0;
let spider = null, spiderLegs = [], lungeAt = null, clock = 0;

export function mount(root, api) {
  const d = api.data;
  if (!d.path) d.path = [START];
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Издрано в кората до мрежата</h4>
            <p>„Влез от <b>възел 7</b> и излез при <b>възел 9</b>. Стъпи по веднъж на
            <b>всеки</b> от десетте възела. Върнеш ли се на вече докоснат — нишката пее.“</p>
            <p style="font-size:.93rem">Движиш се само по опънати нишки. Възлите не се прескачат.</p>
          </div>
          <div class="web-hud">
            <div class="wh-item"><span>докоснати</span><b id="web-count">1 / ${N}</b></div>
            <div class="wh-item"><span>сега на</span><b id="web-at">${START}</b></div>
          </div>
          <div class="web-path" id="web-path"></div>
          <div class="near-list" id="web-near"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-ghost btn-sm" id="web-undo"><span>Стъпка назад</span></button>
            <button class="btn btn-ghost btn-sm" id="web-clear"><span>Слез от мрежата</span></button>
          </div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Мрежата се обтяга…</div></div>
      </div>
    </div>`;

  $('#web-undo').addEventListener('click', () => { const d = api.data;
    if (d.path.length > 1) { d.path.pop(); api.saveData(); api.sfx.click(); refresh(api); } });
  $('#web-clear').addEventListener('click', () => { api.data.path = [START]; api.saveData(); api.sfx.click(); refresh(api); });

  window.__webApi = api;
  renderHud(api);
  boot(api);
  api.onLeave = () => {
    if (stage) { stage.dispose(); stage = null; }
    nodeMeshes = []; threadLines = []; drawn = null; window.__webApi = null;
    spider = null; spiderLegs = []; lungeAt = null;
  };
}

function renderHud(api) {
  const d = api.data;
  const c = $('#web-count'), a = $('#web-at'), p = $('#web-path');
  const last = d.path[d.path.length - 1];
  if (c) c.textContent = `${d.path.length} / ${N}`;
  if (a) a.textContent = last;
  if (p) p.innerHTML = d.path.map((n, i) => `<span class="wp${i ? '' : ' start'}">${n}</span>`).join('<i>→</i>');

  const near = $('#web-near');
  if (near) {
    const opts = [];
    for (let i = 0; i < N; i++) if (adjacent(last, i)) opts.push(i);
    near.innerHTML = `<div class="near-title">нишки от възел ${last}</div>` +
      opts.map(i => `<button class="near-btn${d.path.includes(i) ? ' used' : ''}" data-n="${i}">${i}</button>`).join('');
    $$('.near-btn', near).forEach(b => b.addEventListener('click', () => step(window.__webApi, +b.dataset.n)));
  }
}

function step(api, id) {
  if (api.solved) return;
  const d = api.data;
  const last = d.path[d.path.length - 1];
  if (id === last) return;
  if (d.path.includes(id)) {
    api.sfx.bad();
    api.fx.shakeScreen(8, 380);
    lungeAt = clock;
    api.fail(`Възел ${id} вече е докоснат. Нишката запя и нещо горе се размърда.`, 45000);
    return;
  }
  if (!adjacent(last, id)) {
    api.sfx.bad();
    api.toast(`От ${last} няма опъната нишка към ${id}.`, '');
    return;
  }
  d.path.push(id); api.saveData();
  api.sfx.hiss();
  refresh(api);

  if (d.path.length === N) {
    if (d.path[N - 1] === END) {
      api.sfx.unlock();
      api.fx.flash('rgba(210,225,240,.24)', 800);
      api.fx.sparksFrom($('#stage'), { count: 50, color: '#dfe8f2', spread: 280 });
      setTimeout(() => api.solve('Мрежата увисва отпусната. В центъра ѝ, вплетена като муха, лежи руна.'), 800);
    } else {
      api.toast(`Мина по всички възли, но свърши на ${d.path[N - 1]} вместо на ${END}. Слез и опитай друг ред.`, 'bad');
    }
  }
}

function refresh(api) {
  renderHud(api);
  paintWeb(api);
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...FOREST_STAGE, dist: 25, fov: 44, look: [0, 9.0, 0],
    theta: 0, phi: 1.32, minPolar: 0.6, maxPolar: 1.62, ground: true,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL, за да се види мрежата.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  plantForest(stage, { count: 34, inner: 16, outer: 30 });
  addFireflies(stage, { count: 40, radius: 12, color: 0x9fd0b0 });

  const Y = 9.3;
  const at = (a, r) => new T.Vector3(Math.cos(a) * r, Y + Math.sin(a) * r, 0);
  /* цялата мрежа живее в един възел, за да се събере в кадъра наведнъж */
  const SC = 0.8;
  const webRoot = new T.Group();
  webRoot.scale.setScalar(SC);
  webRoot.position.y = Y * (1 - SC);
  stage.add(webRoot);
  const web = new T.Group();
  webRoot.add(web);

  /* Нишката не е права пръчка: провисва, лъщи и не е съвсем в равнината.
     Затова всяка се строи като тръбичка по лека дъга.                    */
  const silk = new T.MeshStandardMaterial({
    color: 0xeaf2fb, roughness: 0.26, metalness: 0.06,
    emissive: 0x3c4753, emissiveIntensity: 0.55,
  });
  const cobweb = new T.MeshStandardMaterial({
    color: 0xb9c6d4, roughness: 0.5, transparent: true, opacity: 0.4,
    emissive: 0x28313a, emissiveIntensity: 0.5, depthWrite: false,
  });
  const DOWN = new T.Vector3(0, -1, 0);
  let seed = 0;
  function strand(pa, pb, o = {}) {
    const { r = 0.038, mat = silk, sag = 1, seg = 16, bow = DOWN } = o;
    const len = pa.distanceTo(pb);
    const s = ++seed;
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const u = i / 4;
      const p = pa.clone().lerp(pb, u);
      const k = Math.sin(u * Math.PI);
      p.addScaledVector(bow, k * len * 0.055 * sag);
      p.z += k * (rnd(s * 13 + i) - 0.5) * 0.45;
      pts.push(p);
    }
    const curve = new T.CatmullRomCurve3(pts);
    const m = new T.Mesh(new T.TubeGeometry(curve, seg, r, 5, false), mat);
    web.add(m);
    m.userData.curve = curve;
    return m;
  }

  /* Фоновата плетка — шест лъча и спирала между тях.  Тя е, която прави
     мрежата да изглежда мрежа, а не схема с топчета по права линия.    */
  const RAYS = [];
  for (let k = 0; k < 6; k++) RAYS.push(Math.PI / 2 + k * Math.PI / 3);
  const rayCurves = [];
  RAYS.forEach((a) => {
    rayCurves.push(strand(at(a, 0.25), at(a, 11.4), { r: 0.03, mat: cobweb, sag: 0.3, seg: 26 })
      .userData.curve);
    /* обтяжка към тъмното между дърветата */
    const far = at(a, 19);
    far.y = Math.max(0.6, far.y);
    strand(at(a, 11.4), far, { r: 0.024, mat: cobweb, sag: 0.5, seg: 12 });
  });
  [1.5, 3.2, 4.7, 6.2, 7.7, 9.2, 10.6].forEach((rr, ri) => {
    for (let k = 0; k < 6; k++) {
      const a1 = RAYS[k], a2 = RAYS[(k + 1) % 6];
      const r1 = rr * (1 + (rnd(ri * 31 + k) - 0.5) * 0.07);
      const r2 = rr * (1 + (rnd(ri * 37 + k) - 0.5) * 0.07);
      const am = (a1 + a2) / 2;
      const bow = new T.Vector3(-Math.cos(am), -Math.sin(am), 0);
      strand(at(a1, r1), at(a2, r2), { r: 0.019, mat: cobweb, sag: 1.5, seg: 12, bow });
    }
  });

  /* играещите нишки: по-дебели и по-светли от фоновата плетка */
  const P = i => new T.Vector3(NODE_POS[i][0], Y + NODE_POS[i][1], 0);
  EDGES.forEach(([a, b]) => {
    const m = strand(P(a), P(b), { r: 0.042, mat: silk, sag: 0.55, seg: 18 });
    threadLines.push({ m, a, b });
  });

  /* роса по нишките — заради нея мрежата хваща светлината */
  const dewGeo = new T.SphereGeometry(1, 8, 6);
  const dewMat = new T.MeshStandardMaterial({
    color: 0xd6ebff, roughness: 0.04, metalness: 0.15,
    emissive: 0x6d8ba8, emissiveIntensity: 0.75,
  });
  for (let i = 0; i < 30; i++) {
    const c = rayCurves[i % rayCurves.length];
    const dd = new T.Mesh(dewGeo, dewMat);
    dd.position.copy(c.getPointAt(0.14 + rnd(i * 11) * 0.82));
    dd.position.y -= 0.03;
    const sc = 0.036 + rnd(i * 19) * 0.05;
    dd.scale.set(sc, sc * 1.45, sc);
    web.add(dd);
  }

  const picks = [];
  for (let i = 0; i < N; i++) {
    const g = new T.Group();
    /* възелът е навито кълбо коприна, не билярдна топка */
    const knotMat = new T.MeshStandardMaterial({ color: 0xdfe8f2, roughness: 0.45,
      emissive: 0x2a3038, emissiveIntensity: 0.6, flatShading: true });
    const knot = new T.Mesh(new T.IcosahedronGeometry(0.36, 1), knotMat);
    knot.scale.set(1, 0.92, 0.8);
    for (let w = 0; w < 3; w++) {
      const wrap = new T.Mesh(new T.TorusGeometry(0.38 - w * 0.03, 0.024, 5, 18), knotMat);
      wrap.rotation.set(rnd(i * 23 + w) * 3, rnd(i * 29 + w) * 3, rnd(i * 41 + w) * 3);
      g.add(wrap);
    }
    const halo = new T.Mesh(new T.TorusGeometry(0.78, 0.045, 8, 26),
      new T.MeshBasicMaterial({ color: 0x9fd0b0, transparent: true, opacity: 0.35,
        depthWrite: false }));
    /* номерът стои до възела — иначе бутоните вляво не се връзват с мрежата */
    const tag = new T.Mesh(new T.PlaneGeometry(0.9, 0.9),
      new T.MeshBasicMaterial({ map: labelTexture(T, String(i), { color: '#eaf2fb' }),
        transparent: true, depthTest: false }));
    tag.position.set(0.72, 0.66, 0.4);
    tag.renderOrder = 7;
    g.add(knot, halo, tag);
    g.position.set(NODE_POS[i][0], Y + NODE_POS[i][1], 0);
    g.userData = { pick: true, node: i };
    g.traverse(c => { c.userData.pick = c.userData.pick || false; });
    webRoot.add(g);
    nodeMeshes.push({ g, knot, halo, mat: knotMat });
    picks.push(g);
  }

  /* И нещо, което чака в края на мрежата. */
  spider = buildSpider(T);
  webRoot.add(spider);

  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && !(n.userData && n.userData.node != null) && n.parent) n = n.parent;
    if (n && n.userData && n.userData.node != null) step(api, n.userData.node);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array(3 * 2 * (N - 1)), 3));
  drawn = new T.LineSegments(geo, new T.LineBasicMaterial({
    color: 0x9ff0b0, linewidth: 3, transparent: true, opacity: 0.95, depthTest: false }));
  drawn.renderOrder = 6;
  drawn.frustumCulled = false;
  webRoot.add(drawn);

  paintWeb(api);
  stage.onFrame((t) => {
    clock = t;
    nodeMeshes.forEach((n, i) => {
      const used = api.data.path.includes(i);
      n.halo.material.opacity = used ? 0.6 + Math.sin(t * 2 + i) * 0.2 : 0.18;
      n.halo.rotation.z = t * 0.4 + i;
    });
    if (spider) {
      let k = 0;
      if (lungeAt != null) {
        const u = (t - lungeAt) / 1.6;
        if (u >= 1 || u < 0) lungeAt = null; else k = Math.sin(u * Math.PI);
      }
      const a = 0.85 + t * 0.045;
      const r = (10.2 + Math.sin(t * 0.4) * 0.6) * (1 - k) + 2.3 * k;
      spider.position.set(Math.cos(a) * r, Y + Math.sin(a) * r, -0.5 + k * 0.9);
      spider.rotation.set(Math.PI / 2, a - Math.PI / 2, 0);
      spider.scale.setScalar(0.62 + k * 0.5);
      spiderLegs.forEach((L, i) => {
        L.leg.rotation.y = L.by + Math.sin(t * (2.6 + k * 8) + i * 1.7) * (0.09 + k * 0.3);
        L.kn.rotation.z = L.bz + Math.sin(t * (3.1 + k * 8) + i) * (0.1 + k * 0.35);
      });
    }
  });
}

/* акромантул в края на мрежата: коремче, главогръд, осем стави и очи */
function buildSpider(T) {
  const g = new T.Group();
  spiderLegs = [];
  const dark = new T.MeshStandardMaterial({ color: 0x15110d, roughness: 0.62, metalness: 0.18 });
  const abd = new T.Mesh(new T.SphereGeometry(0.44, 14, 12), dark);
  abd.scale.set(1, 0.82, 1.2); abd.position.z = -0.42;
  const ceph = new T.Mesh(new T.SphereGeometry(0.26, 12, 10), dark);
  ceph.position.z = 0.3; ceph.scale.set(1.1, 0.8, 1);
  g.add(abd, ceph);
  const eye = new T.MeshBasicMaterial({ color: 0xd6f2b6 });
  [[-0.1, 0.07], [0.1, 0.07], [-0.17, 0.01], [0.17, 0.01]].forEach(([x, y]) => {
    const e = new T.Mesh(new T.SphereGeometry(0.042, 6, 6), eye);
    e.position.set(x, 0.1 + y, 0.5); g.add(e);
  });
  for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 4; k++) {
    const leg = new T.Group();
    const th = new T.Mesh(new T.CylinderGeometry(0.038, 0.022, 0.74, 5), dark);
    th.position.y = 0.37; leg.add(th);
    const kn = new T.Group(); kn.position.y = 0.74;
    const sh = new T.Mesh(new T.CylinderGeometry(0.024, 0.009, 0.82, 5), dark);
    sh.position.y = 0.41; kn.add(sh); leg.add(kn);
    const spread = s * (Math.PI / 2 - 0.22);
    leg.position.set(s * 0.16, 0, 0.22 - k * 0.15);
    leg.rotation.z = -spread;
    leg.rotation.y = s * (1.5 - k) * 0.38;
    kn.rotation.z = spread * 0.5;
    g.add(leg);
    spiderLegs.push({ leg, kn, by: leg.rotation.y, bz: kn.rotation.z });
  }
  return g;
}

function paintWeb(api) {
  if (!stage) return;
  const d = api.data;
  nodeMeshes.forEach((n, i) => {
    const idx = d.path.indexOf(i);
    const isLast = idx === d.path.length - 1;
    n.mat.color.setHex(idx >= 0 ? (isLast ? 0xffe9a8 : 0x9ff0b0) : 0xdfe8f2);
    n.mat.emissive.setHex(idx >= 0 ? (isLast ? 0x8a6a20 : 0x2a6a3a) : 0x2a3038);
    n.g.scale.setScalar(isLast ? 1.35 : idx >= 0 ? 1.12 : 1);
  });
  if (!drawn) return;
  const Y = 9.3;
  const arr = drawn.geometry.attributes.position.array;
  drawnCount = 0;
  for (let i = 1; i < d.path.length; i++) {
    const a = NODE_POS[d.path[i - 1]], b = NODE_POS[d.path[i]];
    const k = drawnCount * 6;
    arr[k] = a[0]; arr[k + 1] = Y + a[1]; arr[k + 2] = 0.55;
    arr[k + 3] = b[0]; arr[k + 4] = Y + b[1]; arr[k + 5] = 0.55;
    drawnCount++;
  }
  drawn.geometry.setDrawRange(0, drawnCount * 2);
  drawn.geometry.attributes.position.needsUpdate = true;
}
