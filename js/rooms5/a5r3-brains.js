/* ============================================================
   ПЕТА ЧАСТ · КАМЕРА III — Резервоарът на мислите
   Мозъци в зелена течност. Всеки пуска пипало към своя спомен,
   но пипалата не понасят да се докосват.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { MYSTERY_STAGE, addDust, addBlueFlames, addMysteryLight } from './common5.js';

export const meta = {
  id: 'a5-brains',
  eyebrow: 'Камера III',
  title: 'Резервоарът на мислите',
  sub: 'Дванадесет неща плуват в кръг в зелената течност: шест мозъка и шест спомена. Всеки мозък иска своя спомен — но пипалата не бива да се пресичат.',
  rune: 'С',
  bg: 'off',
  tint: '#6bbf9a',
  hints: [
    'Мозък може да хване само спомен от <b>своя вид</b>. Видовете обаче са по два, така че сами по себе си не стигат.',
    'Второто правило е по-строгото: <b>никои две пипала не бива да се пресичат</b> в кръга. Значи всяко пипало или е изцяло вътре в друго, или изцяло вън от него.',
    'Започни от външното: свържи <b>0 → 7</b>. Тогава 1 и 2 остават затворени вътре и трябва да намерят своите там, а 9 и 11 — извън него.',
  ],
};

/* 12 позиции в кръг. Проверено: осем свързвания пасват по вид,
   но само едно от тях е без пресичане.                          */
const TYPES = ['страх', 'радост', 'вина'];
const TYPE_COLOR = [0x8fb4ff, 0xffd77a, 0xc79bff];
const BRAIN_POS = [0, 1, 2, 4, 9, 11];
const MEM_POS   = [3, 5, 6, 7, 8, 10];
const BRAIN_T   = [0, 2, 0, 1, 1, 2];
const MEM_T     = [1, 0, 2, 0, 2, 1];
const SOLUTION  = { 0: 7, 1: 6, 2: 5, 4: 3, 9: 10, 11: 8 };

const typeAt = (() => {
  const t = {};
  BRAIN_POS.forEach((p, i) => t[p] = BRAIN_T[i]);
  MEM_POS.forEach((p, i) => t[p] = MEM_T[i]);
  return t;
})();
const isBrain = p => BRAIN_POS.includes(p);

let stage = null, nodes = [], tentacles = [];

export function mount(root, api) {
  const d = api.data;
  if (!d.links) d.links = {};      // мозък → спомен
  if (d.sel == null) d.sel = null;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="brain-wrap">
            <svg class="brain-circle" id="brain-circle" viewBox="0 0 260 260" aria-label="Резервоарът"></svg>
          </div>
          <div class="brain-legend">
            ${TYPES.map((t, i) => `<span><i style="background:#${TYPE_COLOR[i].toString(16).padStart(6,'0')}"></i>${t}</span>`).join('')}
          </div>
          <div class="brain-info" id="brain-info"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-ghost btn-sm" id="br-clear"><span>Пусни всички</span></button>
          </div>
          <p class="muted center doors-help">Кликни мозък, после спомен от същия вид.
          Кликни готово пипало, за да го скъсаш.</p>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Течността се избистря…</div></div>
      </div>
    </div>`;

  draw(api);
  $('#br-clear').addEventListener('click', () => {
    if (api.solved) return;
    api.data.links = {}; api.data.sel = null; api.saveData();
    api.sfx.click(); draw(api); sync();
  });

  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } nodes = []; tentacles = []; };
}

/* пресичат ли се две хорди в кръг */
function crosses(a, b, c, d) {
  const [p, q] = a < b ? [a, b] : [b, a];
  const [r, s] = c < d ? [c, d] : [d, c];
  const rIn = r > p && r < q, sIn = s > p && s < q;
  return rIn !== sIn;
}

function tap(api, pos) {
  if (api.solved) return;
  const d = api.data;

  /* натиснато нещо, което вече е свързано → късаме пипалото */
  const asBrain = d.links[pos] != null;
  const asMem = Object.keys(d.links).find(k => d.links[k] === pos);
  if (asBrain || asMem) {
    if (asBrain) delete d.links[pos]; else delete d.links[asMem];
    d.sel = null; api.saveData(); api.sfx.click();
    draw(api); sync();
    return;
  }

  if (d.sel == null) {
    if (!isBrain(pos)) { api.sfx.bad(); api.toast('Пипалото тръгва от мозък, не от спомен.', 'bad'); return; }
    d.sel = pos; api.saveData(); api.sfx.tick(); draw(api);
    return;
  }

  if (d.sel === pos) { d.sel = null; api.saveData(); draw(api); return; }
  if (isBrain(pos)) { d.sel = pos; api.saveData(); api.sfx.tick(); draw(api); return; }

  if (typeAt[pos] !== typeAt[d.sel]) {
    api.sfx.bad();
    api.fail(`Мозъкът се дърпа — този спомен е «${TYPES[typeAt[pos]]}», а той търси «${TYPES[typeAt[d.sel]]}».`);
    d.sel = null; api.saveData(); draw(api);
    return;
  }

  d.links[d.sel] = pos;
  d.sel = null;
  api.saveData();
  api.sfx.tick();
  draw(api); sync();
  check(api);
}

function check(api) {
  const d = api.data;
  const pairs = Object.entries(d.links).map(([b, m]) => [+b, +m]);
  if (pairs.length !== BRAIN_POS.length) return;

  for (let i = 0; i < pairs.length; i++)
    for (let j = i + 1; j < pairs.length; j++)
      if (crosses(pairs[i][0], pairs[i][1], pairs[j][0], pairs[j][1])) {
        api.sfx.bad();
        api.fx.shakeScreen(10, 420);
        api.fail('Две пипала се допират и течността почернява. Мозъците пускат всичко.');
        d.links = {}; api.saveData();
        draw(api); sync();
        return;
      }

  api.sfx.unlock();
  api.fx.flash('rgba(120,220,170,.2)', 700);
  api.fx.celebrate(1.4);
  setTimeout(() => api.solve('Шестте мисли се прибират по местата си и течността светва зелено. На дъното на резервоара лежи руна.'), 650);
}

/* ---------- кръгът ---------- */
function draw(api) {
  const d = api.data;
  const svg = $('#brain-circle'); if (!svg) return;
  const C = 130, R = 100;
  const at = p => {
    const a = (p / 12) * Math.PI * 2 - Math.PI / 2;
    return [C + Math.cos(a) * R, C + Math.sin(a) * R];
  };
  const hex = i => '#' + TYPE_COLOR[i].toString(16).padStart(6, '0');

  const chords = Object.entries(d.links).map(([b, m]) => {
    const [x1, y1] = at(+b), [x2, y2] = at(+m);
    return `<path d="M${x1} ${y1} Q ${C} ${C} ${x2} ${y2}" fill="none"
      stroke="${hex(typeAt[+b])}" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>`;
  }).join('');

  const dots = Array.from({ length: 12 }, (_, p) => {
    const [x, y] = at(p);
    const brain = isBrain(p);
    const sel = d.sel === p;
    const used = d.links[p] != null || Object.values(d.links).includes(p);
    return `<g class="bc-node${sel ? ' sel' : ''}${used ? ' used' : ''}" data-p="${p}">
      ${brain
        ? `<circle cx="${x}" cy="${y}" r="13" fill="${hex(typeAt[p])}" opacity=".9"/>
           <circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#0b1a14" stroke-width="2"/>`
        : `<rect x="${x - 11}" y="${y - 11}" width="22" height="22" rx="4"
             fill="none" stroke="${hex(typeAt[p])}" stroke-width="3"/>`}
      <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10"
        fill="${brain ? '#0b1a14' : hex(typeAt[p])}" font-weight="700">${p}</text>
    </g>`;
  }).join('');

  svg.innerHTML = `<circle cx="${C}" cy="${C}" r="${R}" fill="none"
      stroke="rgba(140,220,190,.18)" stroke-width="1"/>${chords}${dots}`;

  $$('.bc-node', svg).forEach(g => g.addEventListener('click', () => tap(api, +g.dataset.p)));

  const info = $('#brain-info');
  if (info) info.innerHTML = api.solved
    ? '<b>Мислите се прибраха.</b>'
    : `свързани: <b>${Object.keys(d.links).length}</b> от ${BRAIN_POS.length}${
        d.sel != null ? ` · избран мозък <b>${d.sel}</b>` : ''}`;
}

/* ---------- 3D ---------- */
function sync() {
  if (!stage) return;
  const T = stage.THREE;
  tentacles.forEach(t => stage.pivot.remove(t));
  tentacles = [];
  const d = stage.__data;
  if (!d) return;
  const at = p => {
    const a = (p / 12) * Math.PI * 2 - Math.PI / 2;
    return new T.Vector3(Math.cos(a) * 4.2, 1.6, Math.sin(a) * 4.2);
  };
  Object.entries(d.links).forEach(([b, m]) => {
    const p1 = at(+b), p2 = at(+m);
    const mid = p1.clone().lerp(p2, 0.5).multiplyScalar(0.35);
    mid.y = 1.6;
    const curve = new T.QuadraticBezierCurve3(p1, mid, p2);
    const geo = new T.TubeGeometry(curve, 20, 0.055, 6, false);
    const col = TYPE_COLOR[typeAt[+b]];
    const mesh = new T.Mesh(geo, new T.MeshStandardMaterial({
      color: col, emissive: col, emissiveIntensity: 0.5, roughness: 0.4,
      transparent: true, opacity: 0.85 }));
    stage.add(mesh);
    tentacles.push(mesh);
  });
}

async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...MYSTERY_STAGE, ground: false, dist: 11, fov: 44, look: [0, 1.4, 0],
    theta: 0.3, phi: 0.85, minPolar: 0.25, maxPolar: 1.4,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за резервоара — кръгът вляво работи и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  addMysteryLight(stage);
  stage.__data = api.data;
  const T = stage.THREE;

  /* резервоарът */
  const tank = new T.Mesh(new T.CylinderGeometry(5.2, 5.2, 3.4, 40, 1, true),
    new T.MeshStandardMaterial({ color: 0x1d6b58, roughness: 0.1, metalness: 0.2,
      emissive: 0x0e3a2e, emissiveIntensity: 0.5,
      transparent: true, opacity: 0.3, side: T.DoubleSide }));
  tank.position.y = 1.7;
  stage.add(tank);
  const liquid = new T.Mesh(new T.CircleGeometry(5.15, 40),
    new T.MeshStandardMaterial({ color: 0x1e6b53, roughness: 0.15, metalness: 0.4,
      transparent: true, opacity: 0.55 }));
  liquid.rotation.x = -Math.PI / 2;
  liquid.position.y = 3.1;
  stage.add(liquid);
  const bottom = new T.Mesh(new T.CircleGeometry(5.2, 40),
    new T.MeshStandardMaterial({ color: 0x11453a, roughness: 0.6 }));
  bottom.rotation.x = -Math.PI / 2;
  stage.add(bottom);

  const picks = [];
  for (let p = 0; p < 12; p++) {
    const a = (p / 12) * Math.PI * 2 - Math.PI / 2;
    const col = TYPE_COLOR[typeAt[p]];
    const g = new T.Group();
    if (isBrain(p)) {
      const brain = new T.Mesh(new T.SphereGeometry(0.42, 14, 12),
        new T.MeshStandardMaterial({ color: col, roughness: 0.65, emissive: col,
          emissiveIntensity: 0.28 }));
      brain.scale.set(1, 0.82, 1.15);
      const lobe = new T.Mesh(new T.SphereGeometry(0.3, 12, 10),
        new T.MeshStandardMaterial({ color: col, roughness: 0.7 }));
      lobe.position.set(0, 0.18, -0.24);
      g.add(brain, lobe);
    } else {
      const mem = new T.Mesh(new T.BoxGeometry(0.55, 0.55, 0.55),
        new T.MeshStandardMaterial({ color: 0x0a1a16, roughness: 0.3, metalness: 0.4,
          emissive: col, emissiveIntensity: 0.35, transparent: true, opacity: 0.75 }));
      const edge = new T.Mesh(new T.BoxGeometry(0.62, 0.62, 0.62),
        new T.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: 0.7 }));
      g.add(mem, edge);
    }
    g.position.set(Math.cos(a) * 4.2, 1.6, Math.sin(a) * 4.2);
    g.userData = { pick: true, pos: p, ph: p * 0.7 };
    stage.add(g);
    nodes.push(g);
    picks.push(g);
  }

  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && n.userData.pos == null && n.parent) n = n.parent;
    if (n && n.userData.pos != null) tap(api, n.userData.pos);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  addBlueFlames(stage, { count: 8, r: 6.4, h: 4.4 });
  addDust(stage, { count: 60, radius: 5, height: 4 });

  stage.onFrame(t => {
    nodes.forEach(g => {
      g.position.y = 1.6 + Math.sin(t * 0.8 + g.userData.ph) * 0.14;
      g.rotation.y = t * 0.22 + g.userData.ph;
    });
  });

  sync();
}
