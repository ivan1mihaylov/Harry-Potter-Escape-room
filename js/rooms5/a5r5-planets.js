/* ============================================================
   ПЕТА ЧАСТ · КАМЕРА V — Планетната зала
   Седем тела висят в тъмното. Редът, по който светват, е
   записан само в четири наблюдения на един мъртъв Неизказваем.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';
import { MYSTERY_STAGE, addDust, addMysteryLight } from './common5.js';

export const meta = {
  id: 'a5-planets',
  eyebrow: 'Камера V',
  title: 'Планетната зала',
  sub: 'Стаята няма под и няма таван. Седем тела се въртят в собствения си мрак и чакат да бъдат докоснати в правилния ред.',
  rune: 'Н',
  bg: 'off',
  tint: '#8fa8d8',
  hints: [
    'Не търси истинската слънчева система — тук редът е друг. Разчита се само от четирите наблюдения.',
    'Започни от най-стегнатото: «между Марс и Юпитер светват точно 5» при седем тела означава, че двамата са <b>на двата края</b>.',
    'Юпитер е първи, Марс — последен. Тогава «Марс веднага след Меркурий» слага Меркурий шести, а двойката Сатурн→Уран пада на четвърто и пето.',
  ],
};

const P = ['Меркурий', 'Венера', 'Земя', 'Марс', 'Юпитер', 'Сатурн', 'Уран'];
const COLORS = [0xb8a888, 0xe0c07a, 0x5a9fd8, 0xc86a4a, 0xd8a86a, 0xe0d0a0, 0x8fd8e0];
/* проверено с изчерпателно търсене: тези четири улики оставят
   точно една от 5040 подредби                                   */
const ORDER = [4, 2, 1, 5, 6, 0, 3];
const CLUES = [
  'Между <b>Марс</b> и <b>Юпитер</b> светват точно <b>5</b> планети.',
  '<b>Марс</b> светва веднага след <b>Меркурий</b>.',
  'Между <b>Уран</b> и <b>Земя</b> светват точно <b>2</b> планети.',
  '<b>Уран</b> светва веднага след <b>Сатурн</b>.',
];

let stage = null, orbs = [];

export function mount(root, api) {
  const d = api.data;
  if (!d.seq) d.seq = [];
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel">
      <p class="panel-title">Записките на Неизказваемия</p>
      <ol class="clue-list">${CLUES.map(c => `<li>${c}</li>`).join('')}</ol>
    </div>

    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="label-row">редът, в който ще ги докоснеш</div>
          <div class="seq-slots" id="seq-slots"></div>
          <div class="planet-pool" id="planet-pool"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-house btn-sm" id="pl-go"><span>Докосни ги</span></button>
            <button class="btn btn-ghost btn-sm" id="pl-clear"><span>Изчисти</span></button>
          </div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Телата изплуват…</div></div>
      </div>
      <p class="center muted stage-help">Избери планета отдолу или направо в сцената. Кликни заето място, за да го освободиш.</p>
    </div>`;

  draw(api);
  $('#pl-go').addEventListener('click', () => check(api));
  $('#pl-clear').addEventListener('click', () => {
    if (api.solved) return;
    api.data.seq = []; api.saveData(); api.sfx.click(); draw(api); sync();
  });

  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } orbs = []; };
}

function pick(api, i) {
  if (api.solved) return;
  const d = api.data;
  if (d.seq.includes(i)) { d.seq = d.seq.filter(x => x !== i); }
  else if (d.seq.length < P.length) { d.seq = [...d.seq, i]; }
  else return;
  api.saveData(); api.sfx.tick();
  draw(api); sync();
}

function check(api) {
  const d = api.data;
  if (d.seq.length !== P.length) { api.sfx.bad(); api.toast('Още не си подредил всички седем.', 'bad'); return; }
  if (d.seq.every((v, i) => v === ORDER[i])) {
    api.sfx.unlock();
    api.fx.flash('rgba(150,180,240,.22)', 800);
    api.fx.celebrate(1.5);
    if (stage) stage.__lit = true;
    setTimeout(() => api.solve('Седемте светват едно след друго и остават да греят. В средата, там където няма никакво тяло, виси руна.'), 700);
  } else {
    api.sfx.bad();
    api.fx.shakeScreen(9, 380);
    api.fail('Телата премигват веднъж и изгасват. Редът не е този.');
  }
}

function draw(api) {
  const d = api.data;
  const slots = $('#seq-slots');
  if (slots) {
    slots.innerHTML = Array.from({ length: P.length }, (_, i) => {
      const v = d.seq[i];
      return `<button class="seq-slot${v != null ? ' filled' : ''}" data-s="${i}">
        <b>${i + 1}</b><span>${v != null ? P[v] : '—'}</span></button>`;
    }).join('');
    $$('.seq-slot', slots).forEach(b => b.addEventListener('click', () => {
      const s = +b.dataset.s;
      const v = d.seq[s];
      if (v != null) pick(api, v);
    }));
  }
  const pool = $('#planet-pool');
  if (pool) {
    pool.innerHTML = P.map((n, i) => {
      const used = d.seq.includes(i);
      return `<button class="planet-btn${used ? ' used' : ''}" data-i="${i}"
        style="--pc:#${COLORS[i].toString(16).padStart(6, '0')}">
        <i></i>${n}</button>`;
    }).join('');
    $$('.planet-btn', pool).forEach(b => b.addEventListener('click', () => pick(api, +b.dataset.i)));
  }
}

/* ---------- 3D ---------- */
function sync() {
  if (!stage || !orbs.length) return;
  const seq = stage.__seq ? stage.__seq() : [];
  orbs.forEach((o, i) => {
    const at = seq.indexOf(i);
    o.userData.order = at;
    o.userData.glass.material.emissiveIntensity = at < 0 ? 0.15 : 0.9;
  });
}

async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...MYSTERY_STAGE, ground: false, dist: 13, fov: 46, look: [0, 0, 0],
    theta: 0.3, phi: 1.1, minPolar: 0.2, maxPolar: 1.5, fogNear: 20, fogFar: 60,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за залата — списъкът вляво работи и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  addMysteryLight(stage);
  stage.__seq = () => api.data.seq;
  const T = stage.THREE;

  const picks = [];
  P.forEach((name, i) => {
    const a = (i / P.length) * Math.PI * 2;
    const r = 4.2 + (i % 3) * 1.1;
    const g = new T.Group();
    const size = 0.42 + (i % 4) * 0.13;
    const glass = new T.Mesh(new T.SphereGeometry(size, 18, 14),
      new T.MeshStandardMaterial({ color: COLORS[i], roughness: 0.6, metalness: 0.15,
        emissive: COLORS[i], emissiveIntensity: 0.15 }));
    g.add(glass);
    if (i === 5) {   // пръстен на Сатурн
      const ringM = new T.Mesh(new T.RingGeometry(size * 1.5, size * 2.2, 32),
        new T.MeshBasicMaterial({ color: 0xe8d8b0, transparent: true, opacity: 0.45,
          side: T.DoubleSide }));
      ringM.rotation.x = Math.PI / 2.4;
      g.add(ringM);
    }
    const tex = labelTexture(T, name, { size: 256, color: '#dfe8ff', font: 'bold 44px Cinzel, Georgia, serif' });
    const tag = new T.Mesh(new T.PlaneGeometry(1.9, 1.9),
      new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    tag.position.y = size + 0.75;
    g.add(tag);
    g.userData = { pick: true, i, glass, tag, base: new T.Vector3(Math.sin(a) * r, (i % 3 - 1) * 1.7, Math.cos(a) * r), ph: i * 0.9 };
    g.position.copy(g.userData.base);
    stage.add(g);
    orbs.push(g);
    picks.push(g);
  });

  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && n.userData.i == null && n.parent) n = n.parent;
    if (n && n.userData.i != null) pick(api, n.userData.i);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  addDust(stage, { count: 140, radius: 10, height: 10 });

  stage.onFrame(t => {
    orbs.forEach(g => {
      g.position.y = g.userData.base.y + Math.sin(t * 0.5 + g.userData.ph) * 0.4;
      g.rotation.y = t * 0.18 + g.userData.ph;
      g.userData.tag.lookAt(stage.camera.position);
      if (stage.__lit) {
        const k = g.userData.order;
        g.userData.glass.material.emissiveIntensity =
          0.6 + Math.sin(t * 3 - (k >= 0 ? k : 0) * 0.6) * 0.4;
      }
    });
  });

  sync();
}
