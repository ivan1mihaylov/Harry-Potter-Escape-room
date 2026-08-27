/* ============================================================
   ТРЕТА ЧАСТ · ПОЛЯНА VII — Пълнолунието
   Луната изгрява след двайсет и осем минути. Толкова имаш.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';
import { plantForest, addFireflies, FOREST_STAGE } from './common3.js';

export const meta = {
  id: 'a3-moon',
  eyebrow: 'Поляна VII',
  title: 'Пълнолунието',
  sub: 'Някъде вляво нещо вие и не е куче. Луната ще излезе над върховете след двайсет и осем минути, а дотогава трябва да си в заслона — но не с празни ръце.',
  rune: 'А',
  grain: null,
  bg: 'off',
  tint: '#d8c8a0',
  hints: [
    'Пътищата имат различна цена в минути. Пресметни целия маршрут, преди да тръгнеш — двайсет и осем минути са точно колкото трябват, ако не се лутаеш.',
    'Трите места, които трябва да минеш, са <b>Гнездото</b>, <b>Тресавището</b> и <b>Кръговете</b>. Заслонът е последен.',
    'Единственият маршрут в срока е: Поляната → Изворът → Скалата → Гнездото → Хралупата → Тресавището → Кръговете → Заслонът (4+3+4+5+3+4+5 = 28).',
  ],
};

const NODES = ['Поляната', 'Изворът', 'Скалата', 'Гнездото', 'Хралупата', 'Тресавището', 'Кръговете', 'Заслонът'];
const POS = [[0, 8], [-5, 4], [3, 3], [7, 6], [-3, -2], [1, -4], [6, -3], [-1, -9]];
const EDGES = [[0,1,4],[0,2,7],[0,4,9],[1,2,3],[1,3,8],[2,3,4],[2,5,6],[3,4,5],[3,6,7],
               [4,5,3],[4,7,11],[5,6,4],[5,7,8],[6,7,5],[1,5,10],[2,6,9]];
const REQUIRED = [3, 5, 6];
const BUDGET = 28;
const START = 0, SHELTER = 7;

const edgeW = (a, b) => {
  const e = EDGES.find(x => (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a));
  return e ? e[2] : null;
};

let stage = null, nodeObjs = [], routeGroup = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.route) d.route = [START];
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Каквото знае Хагрид за тази нощ</h4>
            <p>„До изгрева на луната има <b>${BUDGET} минути</b>. Мини през <b>Гнездото</b>,
            <b>Тресавището</b> и <b>Кръговете</b> — само там расте това, което ти трябва —
            и влез в <b>Заслона</b>, преди да е станало късно.“</p>
            <p style="font-size:.93rem">Числата по пътеките са минути. Върви само по тях.</p>
          </div>
          <div class="knight-hud">
            <div class="kh-item"><span>изминати</span><b id="mn-time">0</b></div>
            <div class="kh-item"><span>остават</span><b id="mn-left">${BUDGET}</b></div>
          </div>
          <div class="req-list" id="mn-req"></div>
          <div class="web-path" id="mn-route"></div>
          <div class="near-list" id="mn-near"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-ghost btn-sm" id="mn-undo"><span>Стъпка назад</span></button>
            <button class="btn btn-ghost btn-sm" id="mn-clear"><span>Отначало</span></button>
          </div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Гората се разгръща…</div></div>
      </div>
    </div>`;

  $('#mn-undo').addEventListener('click', () => {
    const d = api.data;
    if (d.route.length > 1) { d.route.pop(); api.saveData(); api.sfx.click(); refresh(api); }
  });
  $('#mn-clear').addEventListener('click', () => { api.data.route = [START]; api.saveData(); api.sfx.click(); refresh(api); });

  window.__moonApi = api;
  renderHud(api);
  boot(api);
  api.onLeave = () => {
    if (stage) { stage.dispose(); stage = null; }
    nodeObjs = []; routeGroup = null; window.__moonApi = null;
  };
}

function total(route) {
  let t = 0;
  for (let i = 1; i < route.length; i++) t += edgeW(route[i - 1], route[i]) || 0;
  return t;
}

function renderHud(api) {
  const d = api.data;
  const t = total(d.route);
  const a = $('#mn-time'), b = $('#mn-left');
  if (a) a.textContent = t;
  if (b) { b.textContent = BUDGET - t; b.classList.toggle('over', t > BUDGET); }
  const req = $('#mn-req');
  if (req) req.innerHTML = REQUIRED.map(r =>
    `<span class="rq${d.route.includes(r) ? ' got' : ''}">${NODES[r]}</span>`).join('');
  const rt = $('#mn-route');
  if (rt) rt.innerHTML = d.route.map((n, i) =>
    `<span class="wp${i ? '' : ' start'}">${NODES[n]}</span>`).join('<i>→</i>');

  const last = d.route[d.route.length - 1];
  const near = $('#mn-near');
  if (near) {
    const opts = EDGES
      .filter(e => e[0] === last || e[1] === last)
      .map(e => ({ n: e[0] === last ? e[1] : e[0], w: e[2] }))
      .sort((a, b) => a.w - b.w);
    near.innerHTML = `<div class="near-title">пътеки от «${NODES[last]}»</div>` +
      opts.map(o => `<button class="near-btn wide" data-n="${o.n}">${NODES[o.n]}<i>${o.w}</i></button>`).join('');
    $$('.near-btn', near).forEach(b => b.addEventListener('click', () => step(window.__moonApi, +b.dataset.n)));
  }
}

function step(api, id) {
  if (api.solved) return;
  const d = api.data;
  const last = d.route[d.route.length - 1];
  if (id === last) return;
  const w = edgeW(last, id);
  if (w == null) { api.sfx.bad(); api.toast(`От «${NODES[last]}» няма пътека до «${NODES[id]}».`, ''); return; }
  d.route.push(id); api.saveData();
  api.sfx.click();
  refresh(api);

  if (id === SHELTER) {
    const t = total(d.route);
    const missing = REQUIRED.filter(r => !d.route.includes(r));
    if (missing.length) {
      api.sfx.bad();
      api.fail(`Стигна заслона, но без ${missing.map(m => NODES[m]).join(' и ')}. Излизаш обратно навън.`, 45000);
      d.route = [START]; api.saveData(); refresh(api);
    } else if (t > BUDGET) {
      api.sfx.roar();
      api.fx.shakeScreen(14, 600);
      api.fail(`Луната изгря на ${t}-ата минута — ${t - BUDGET} след срока. Нещо те гони обратно.`, 60000);
      d.route = [START]; api.saveData(); refresh(api);
    } else {
      api.sfx.unlock();
      api.fx.flash('rgba(230,220,180,.24)', 900);
      api.fx.sparksFrom($('#stage'), { count: 50, color: '#f0e0b0', spread: 280 });
      setTimeout(() => api.solve(`Вратата на заслона се затръшва на ${t}-ата минута. Отвън вие; отвътре, на масата, лежи руна.`), 900);
    }
  }
}

function refresh(api) {
  renderHud(api);
  paintRoute(api);
}

/* ---------- 3D ---------- */
const S = 1.35;
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...FOREST_STAGE, dist: 26, fov: 44, look: [0, 0.5, 0],
    theta: 0, phi: 0.62, minPolar: 0.16, maxPolar: 1.2,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL за картата, но маршрутът се строи и от списъка.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  plantForest(stage, { count: 60, inner: 18, outer: 34 });
  addFireflies(stage, { count: 50, radius: 18, color: 0xe0d0a0 });

  // пътеките с цените
  EDGES.forEach(([a, b, w]) => {
    const pa = new T.Vector3(POS[a][0] * S, 0.06, -POS[a][1] * S);
    const pb = new T.Vector3(POS[b][0] * S, 0.06, -POS[b][1] * S);
    const len = pa.distanceTo(pb);
    const m = new T.Mesh(new T.BoxGeometry(0.5, 0.06, len),
      new T.MeshStandardMaterial({ color: 0x3a3222, roughness: 1 }));
    m.position.copy(pa).lerp(pb, 0.5);
    m.lookAt(pb);
    m.receiveShadow = true;
    stage.add(m);

    const lbl = new T.Mesh(new T.PlaneGeometry(1.5, 1.5),
      new T.MeshBasicMaterial({ map: labelTexture(T, String(w), { color: '#e8d8a8', size: 128, font: 'bold 88px Cinzel, Georgia, serif' }), transparent: true }));
    lbl.rotation.x = -Math.PI / 2;
    lbl.position.copy(pa).lerp(pb, 0.5); lbl.position.y = 0.12;
    stage.add(lbl);
  });

  const picks = [];
  NODES.forEach((name, i) => {
    const g = new T.Group();
    const isReq = REQUIRED.includes(i);
    const isEnd = i === SHELTER;
    const col = isEnd ? 0xd8b45a : isReq ? 0x8fd0a0 : 0x9aa0a8;
    const disc = new T.Mesh(new T.CylinderGeometry(1.15, 1.3, 0.3, 14),
      new T.MeshStandardMaterial({ color: col, roughness: 0.7, metalness: 0.2,
        emissive: col, emissiveIntensity: 0.22 }));
    disc.position.y = 0.16; disc.receiveShadow = true;
    g.add(disc);
    if (isEnd) {
      const hut = new T.Mesh(new T.ConeGeometry(1.5, 2.0, 6),
        new T.MeshStandardMaterial({ color: 0x5a4326, roughness: 0.9 }));
      hut.position.y = 1.3; hut.castShadow = true;
      g.add(hut);
    }
    const lbl = new T.Mesh(new T.PlaneGeometry(4.4, 1.1),
      new T.MeshBasicMaterial({ map: nameTexture(T, name), transparent: true }));
    lbl.rotation.x = -Math.PI / 2;
    lbl.position.set(0, 0.34, 1.9);
    g.add(lbl);
    g.position.set(POS[i][0] * S, 0, -POS[i][1] * S);
    g.userData = { pick: true, node: i };
    g.traverse(c => { c.userData.pick = c.userData.pick || false; });
    stage.add(g);
    nodeObjs.push({ g, disc, i });
    picks.push(g);
  });

  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && !(n.userData && n.userData.node != null) && n.parent) n = n.parent;
    if (n && n.userData && n.userData.node != null) step(api, n.userData.node);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  routeGroup = new T.Group();
  stage.add(routeGroup);
  paintRoute(api);

  stage.onFrame((t) => {
    nodeObjs.forEach((n, k) => {
      const on = api.data.route.includes(n.i);
      n.disc.material.emissiveIntensity = on ? 0.5 + Math.sin(t * 2 + k) * 0.25 : 0.16;
      n.g.scale.setScalar(api.data.route[api.data.route.length - 1] === n.i ? 1.18 : 1);
    });
  });
}

function nameTexture(T, text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 128);
  g.font = '600 54px Cinzel, Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#f0e4c0';
  g.shadowColor = '#000'; g.shadowBlur = 12;
  g.fillText(text, 256, 66);
  return new T.CanvasTexture(c);
}

function paintRoute(api) {
  if (!stage || !routeGroup) return;
  const T = stage.THREE;
  while (routeGroup.children.length) {
    const c = routeGroup.children.pop();
    if (c.geometry) c.geometry.dispose();
    routeGroup.remove(c);
  }
  const r = api.data.route;
  for (let i = 1; i < r.length; i++) {
    const pa = new T.Vector3(POS[r[i - 1]][0] * S, 0.3, -POS[r[i - 1]][1] * S);
    const pb = new T.Vector3(POS[r[i]][0] * S, 0.3, -POS[r[i]][1] * S);
    const len = pa.distanceTo(pb);
    const m = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, len, 6),
      new T.MeshBasicMaterial({ color: 0xf0e0a0, transparent: true, opacity: 0.85 }));
    m.position.copy(pa).lerp(pb, 0.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), pb.clone().sub(pa).normalize());
    routeGroup.add(m);
  }
}
