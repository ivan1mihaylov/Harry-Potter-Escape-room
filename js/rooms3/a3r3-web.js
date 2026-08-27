/* ============================================================
   ТРЕТА ЧАСТ · ПОЛЯНА III — Паяжината
   Мине ли се два пъти по една нишка, тя пее. А те слушат.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { plantForest, addFireflies, FOREST_STAGE } from './common3.js';

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
    'Тръгваш от долния възел и трябва да свършиш при съседния му отдясно, като минеш през <b>всичките десет</b> възела по веднъж.',
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
            <p>„Влез от <b>долния възел</b> и излез от съседния му. Стъпи по веднъж на
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
    ...FOREST_STAGE, dist: 24, fov: 44, look: [0, 6.5, 0],
    theta: 0, phi: 1.32, minPolar: 0.6, maxPolar: 1.62, ground: true,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL, за да се види мрежата.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  plantForest(stage, { count: 34, inner: 16, outer: 30 });
  addFireflies(stage, { count: 40, radius: 12, color: 0x9fd0b0 });

  const Y = 7.5;
  const silk = new T.MeshStandardMaterial({ color: 0xdfe8f2, roughness: 0.4,
    emissive: 0x4a5560, emissiveIntensity: 0.5 });

  EDGES.forEach(([a, b]) => {
    const pa = new T.Vector3(NODE_POS[a][0], Y + NODE_POS[a][1], 0);
    const pb = new T.Vector3(NODE_POS[b][0], Y + NODE_POS[b][1], 0);
    const len = pa.distanceTo(pb);
    const m = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, len, 5), silk.clone());
    m.position.copy(pa).lerp(pb, 0.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), pb.clone().sub(pa).normalize());
    stage.add(m);
    threadLines.push({ m, a, b });
  });

  // опъващи нишки към дърветата
  [[-13, 15], [13, 15], [-13, -1], [13, -1]].forEach(([x, y]) => {
    const pa = new T.Vector3(0, Y, 0), pb = new T.Vector3(x, y, 0);
    const len = pa.distanceTo(pb);
    const m = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, len, 4),
      new T.MeshBasicMaterial({ color: 0x8f9aa6, transparent: true, opacity: 0.35 }));
    m.position.copy(pa).lerp(pb, 0.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), pb.clone().sub(pa).normalize());
    stage.add(m);
  });

  const picks = [];
  for (let i = 0; i < N; i++) {
    const g = new T.Group();
    const knot = new T.Mesh(new T.SphereGeometry(0.52, 16, 14),
      new T.MeshStandardMaterial({ color: 0xdfe8f2, roughness: 0.5,
        emissive: 0x2a3038, emissiveIntensity: 0.6 }));
    const halo = new T.Mesh(new T.TorusGeometry(0.8, 0.05, 8, 24),
      new T.MeshBasicMaterial({ color: 0x9fd0b0, transparent: true, opacity: 0.35 }));
    halo.rotation.x = Math.PI / 2;
    g.add(knot, halo);
    g.position.set(NODE_POS[i][0], Y + NODE_POS[i][1], 0);
    g.userData = { pick: true, node: i };
    g.traverse(c => { c.userData.pick = c.userData.pick || false; });
    stage.add(g);
    nodeMeshes.push({ g, knot, halo });
    picks.push(g);
  }
  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && !(n.userData && n.userData.node != null) && n.parent) n = n.parent;
    if (n && n.userData && n.userData.node != null) step(api, n.userData.node);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array(3 * 2 * (N - 1)), 3));
  drawn = new T.LineSegments(geo, new T.LineBasicMaterial({ color: 0x9ff0b0, linewidth: 3 }));
  drawn.frustumCulled = false;
  stage.add(drawn);

  paintWeb(api);
  stage.onFrame((t) => {
    nodeMeshes.forEach((n, i) => {
      const used = api.data.path.includes(i);
      n.halo.material.opacity = used ? 0.6 + Math.sin(t * 2 + i) * 0.2 : 0.18;
      n.halo.rotation.z = t * 0.4 + i;
    });
  });
}

function paintWeb(api) {
  if (!stage) return;
  const d = api.data;
  nodeMeshes.forEach((n, i) => {
    const idx = d.path.indexOf(i);
    const isLast = idx === d.path.length - 1;
    n.knot.material.color.setHex(idx >= 0 ? (isLast ? 0xffe9a8 : 0x9ff0b0) : 0xdfe8f2);
    n.knot.material.emissive.setHex(idx >= 0 ? (isLast ? 0x8a6a20 : 0x2a6a3a) : 0x2a3038);
    n.g.scale.setScalar(isLast ? 1.35 : idx >= 0 ? 1.12 : 1);
  });
  if (!drawn) return;
  const Y = 7.5;
  const arr = drawn.geometry.attributes.position.array;
  drawnCount = 0;
  for (let i = 1; i < d.path.length; i++) {
    const a = NODE_POS[d.path[i - 1]], b = NODE_POS[d.path[i]];
    const k = drawnCount * 6;
    arr[k] = a[0]; arr[k + 1] = Y + a[1]; arr[k + 2] = 0.05;
    arr[k + 3] = b[0]; arr[k + 4] = Y + b[1]; arr[k + 5] = 0.05;
    drawnCount++;
  }
  drawn.geometry.setDrawRange(0, drawnCount * 2);
  drawn.geometry.attributes.position.needsUpdate = true;
}
