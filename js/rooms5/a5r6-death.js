/* ============================================================
   ПЕТА ЧАСТ · КАМЕРА VI — Залата на смъртта
   Каменен амфитеатър и арка с воал. Гласовете отзад играят
   на камъчета и не са губили от много време насам.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { MYSTERY_STAGE, addDust, addBlueFlames, addMysteryLight } from './common5.js';

export const meta = {
  id: 'a5-death',
  eyebrow: 'Камера VI',
  title: 'Залата на смъртта',
  sub: 'Каменните стъпала слизат към арка с воал, който се движи без вятър. На най-долното стъпало има три купчинки камъчета — и някой отзад чака да започнеш.',
  rune: 'Д',
  bg: 'off',
  tint: '#9a8fc0',
  hints: [
    'Взимаш колкото искаш камъчета, но само от <b>една</b> купчинка. Печели онзи, който вземе <b>последното</b> камъче — значи целта ти е гласовете да останат без ход.',
    'Гледай купчинките в двоичен вид и ги сравнявай стълб по стълб. Ако във всеки стълб броят на нечетните е чётен, си в губеща позиция.',
    'От 5 · 4 · 7 има три печеливши хода: остави <b>3</b> · 4 · 7, или 5 · <b>2</b> · 7, или 5 · 4 · <b>1</b>. После просто възстановявай равновесието след всеки техен ход.',
  ],
};

const START = [5, 4, 7];      // проверено: XOR = 6 ≠ 0, значи започващият печели
const NAMES = ['лявата', 'средната', 'дясната'];

let stage = null, stoneMeshes = [], veil = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.piles) { d.piles = [...START]; d.turn = 'you'; d.log = []; d.lost = 0; }
  if (d.take == null) d.take = 0;
  if (d.pile == null) d.pile = null;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel">
      <p class="panel-title">Правилото, изсечено на стъпалото</p>
      <p>«На всеки ход се взимат камъчета — колкото поиска ръката, но само от <b>една</b>
      купчинка и поне едно. Който вземе <b>последното</b> камъче от масата, печели.
      Ти започваш.»</p>
    </div>

    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="piles" id="piles"></div>
          <div class="nim-ctl" id="nim-ctl"></div>
          <div class="nim-log" id="nim-log"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-ghost btn-sm" id="nim-reset"><span>Нова игра</span></button>
          </div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Воалът се полюшва…</div></div>
      </div>
      <p class="center muted stage-help">Кликни купчинка, после колко камъчета взимаш.</p>
    </div>`;

  draw(api);
  $('#nim-reset').addEventListener('click', () => {
    if (api.solved) return;
    api.data.piles = [...START]; api.data.turn = 'you';
    api.data.log = []; api.data.pile = null;
    api.saveData(); api.sfx.click(); draw(api); sync();
  });

  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } stoneMeshes = []; veil = null; };
}

const total = p => p.reduce((a, b) => a + b, 0);
const xor = p => p.reduce((a, b) => a ^ b, 0);

/* оптималният противник: изравнява XOR до нула, ако може */
function voicesMove(piles) {
  const x = xor(piles);
  if (x !== 0) {
    for (let i = 0; i < piles.length; i++) {
      const t = piles[i] ^ x;
      if (t < piles[i]) return { i, take: piles[i] - t };
    }
  }
  const i = piles.findIndex(v => v > 0);
  return { i, take: 1 };
}

function takeFrom(api, i, n) {
  const d = api.data;
  if (api.solved || d.turn !== 'you') return;
  if (!(n >= 1 && n <= d.piles[i])) return;

  d.piles[i] -= n;
  d.log = [...d.log, `ти взе <b>${n}</b> от ${NAMES[i]}`];
  d.pile = null;
  api.sfx.tick();

  if (total(d.piles) === 0) {
    d.turn = 'done'; api.saveData(); draw(api); sync();
    api.sfx.unlock();
    api.fx.flash('rgba(180,160,255,.24)', 800);
    api.fx.celebrate(1.5);
    if (veil) veil.userData.calm = true;
    setTimeout(() => api.solve('Гласовете зад воала млъкват — не обидено, а изненадано. На най-долното стъпало остава едно камъче, което не е камъче, а руна.'), 700);
    return;
  }

  d.turn = 'them'; api.saveData(); draw(api); sync();

  setTimeout(() => {
    const mv = voicesMove(d.piles);
    d.piles[mv.i] -= mv.take;
    d.log = [...d.log, `гласовете взеха <b>${mv.take}</b> от ${NAMES[mv.i]}`];
    api.sfx.hiss();
    if (total(d.piles) === 0) {
      d.turn = 'lost'; d.lost++;
      api.saveData(); draw(api); sync();
      api.fx.shakeScreen(12, 500);
      api.fail('Гласовете взимат последното камъче и се засмиват. Купчинките се подреждат отново.', 45000);
      setTimeout(() => {
        d.piles = [...START]; d.turn = 'you'; d.log = []; api.saveData(); draw(api); sync();
      }, 1600);
      return;
    }
    d.turn = 'you'; api.saveData(); draw(api); sync();
  }, 850);
}

function draw(api) {
  const d = api.data;
  const box = $('#piles'); if (!box) return;
  box.innerHTML = d.piles.map((n, i) => `
    <button class="pile${d.pile === i ? ' sel' : ''}${n === 0 ? ' empty' : ''}" data-i="${i}"
      ${d.turn !== 'you' || n === 0 ? 'disabled' : ''}>
      <span class="pile-stones">${Array.from({ length: n }, () => '<i></i>').join('')}</span>
      <b>${n}</b><em>${NAMES[i]}</em>
    </button>`).join('');
  $$('.pile', box).forEach(b => b.addEventListener('click', () => {
    d.pile = +b.dataset.i; api.saveData(); api.sfx.tick(); draw(api);
  }));

  const ctl = $('#nim-ctl');
  if (ctl) {
    if (d.turn === 'you' && d.pile != null && d.piles[d.pile] > 0) {
      ctl.innerHTML = `<div class="label-row">взимаш от ${NAMES[d.pile]}</div>
        <div class="take-row">${Array.from({ length: d.piles[d.pile] }, (_, k) =>
          `<button class="take-btn" data-n="${k + 1}">${k + 1}</button>`).join('')}</div>`;
      $$('.take-btn', ctl).forEach(b =>
        b.addEventListener('click', () => takeFrom(api, d.pile, +b.dataset.n)));
    } else {
      ctl.innerHTML = `<div class="nim-turn ${d.turn}">${
        d.turn === 'you' ? 'твой ред — избери купчинка'
        : d.turn === 'them' ? 'гласовете мислят…'
        : d.turn === 'lost' ? 'изгуби този рунд'
        : 'масата е празна'}</div>`;
    }
  }

  const log = $('#nim-log');
  if (log) log.innerHTML = d.log.slice(-6).map(l => `<div class="nl-row">${l}</div>`).join('')
    + (d.lost ? `<div class="nl-lost">изгубени рундове: <b>${d.lost}</b></div>` : '');
}

/* ---------- 3D ---------- */
function sync() {
  if (!stage || !stoneMeshes.length) return;
  const piles = stage.__piles ? stage.__piles() : START;
  stoneMeshes.forEach((row, i) => row.forEach((m, k) => { m.visible = k < piles[i]; }));
}

async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...MYSTERY_STAGE, ground: false, dist: 12, fov: 46, look: [0, -0.5, 0],
    theta: 0, phi: 1.18, minPolar: 0.4, maxPolar: 1.45,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за залата — купчинките вляво работят и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  addMysteryLight(stage);
  stage.__piles = () => api.data.piles;
  const T = stage.THREE;

  /* амфитеатърът */
  const stoneMat = new T.MeshStandardMaterial({ color: 0x3b3358, roughness: 0.8, metalness: 0.12,
    emissive: 0x171232, emissiveIntensity: 0.5 });
  for (let i = 0; i < 6; i++) {
    const r0 = 5 + i * 1.6;
    const step = new T.Mesh(new T.CylinderGeometry(r0, r0, 0.5, 40, 1, true), stoneMat);
    step.position.y = -0.25 - i * 0.5;
    stage.add(step);
    const lip = new T.Mesh(new T.RingGeometry(r0 - 1.6, r0, 40), stoneMat);
    lip.rotation.x = -Math.PI / 2;
    lip.position.y = -i * 0.5;
    stage.add(lip);
  }
  const pit = new T.Mesh(new T.CircleGeometry(5, 40),
    new T.MeshStandardMaterial({ color: 0x241d42, roughness: 0.65 }));
  pit.rotation.x = -Math.PI / 2;
  pit.position.y = -3.05;
  stage.add(pit);

  /* арката с воала */
  const archMat = new T.MeshStandardMaterial({ color: 0x6f5fa8, roughness: 0.55, metalness: 0.4,
    emissive: 0x2c2158, emissiveIntensity: 0.6 });
  [-1.4, 1.4].forEach(x => {
    const post = new T.Mesh(new T.BoxGeometry(0.5, 4.4, 0.5), archMat);
    post.position.set(x, -0.85, 0);
    stage.add(post);
  });
  const lintel = new T.Mesh(new T.BoxGeometry(3.8, 0.5, 0.6), archMat);
  lintel.position.set(0, 1.6, 0);
  stage.add(lintel);

  veil = new T.Mesh(new T.PlaneGeometry(2.6, 4, 12, 16),
    new T.MeshStandardMaterial({ color: 0x2a2450, roughness: 1, side: T.DoubleSide,
      emissive: 0x3a2f78, emissiveIntensity: 1.1, transparent: true, opacity: 0.96 }));
  veil.position.set(0, -0.7, 0);
  stage.add(veil);
  const vBase = Float32Array.from(veil.geometry.attributes.position.array);

  /* трите купчинки на долното стъпало */
  const pebble = new T.MeshStandardMaterial({ color: 0xd8d2ee, roughness: 0.5, metalness: 0.25,
    emissive: 0x4a4470, emissiveIntensity: 0.4 });
  START.forEach((n, i) => {
    const row = [];
    for (let k = 0; k < n; k++) {
      const m = new T.Mesh(new T.DodecahedronGeometry(0.17, 0), pebble);
      const a = (k / Math.max(1, n)) * Math.PI * 2;
      m.position.set(-2.4 + i * 2.4 + Math.sin(a) * 0.3, -2.9 + Math.floor(k / 4) * 0.2, 2.6 + Math.cos(a) * 0.3);
      m.rotation.set(k, k * 1.7, k * 0.3);
      stage.add(m);
      row.push(m);
    }
    stoneMeshes.push(row);
  });

  addBlueFlames(stage, { count: 10, r: 9.5, h: 3 });
  addDust(stage, { count: 80, radius: 8, height: 7 });

  stage.onFrame(t => {
    if (!veil) return;
    const arr = veil.geometry.attributes.position.array;
    const calm = veil.userData.calm ? 0.25 : 1;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 2] = Math.sin(vBase[i + 1] * 2.2 + t * 1.4) * 0.22 * calm
                 + Math.cos(vBase[i] * 1.8 - t * 0.9) * 0.14 * calm;
    }
    veil.geometry.attributes.position.needsUpdate = true;
    veil.geometry.computeVertexNormals();
  });

  sync();
}
