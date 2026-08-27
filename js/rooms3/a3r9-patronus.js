/* ============================================================
   ТРЕТА ЧАСТ · ПОЛЯНА IX — Патронусът
   Гората иска доказателство, че в теб е останало нещо твое.
   ============================================================ */
import { head, $, $$, el, shakeEl, norm } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { plantForest, addFireflies, addMist, addMoonshaft, FOREST_STAGE } from './common3.js';

export const meta = {
  id: 'a3-patronus',
  eyebrow: 'Поляна IX · финал',
  title: 'Патронусът',
  sub: 'Дърветата се затварят в кръг и оставят една-единствена празнина — колкото да мине светлина. Гората чака да ѝ покажеш, {име}, че вътре в теб още свети нещо.',
  rune: null,
  grain: null,
  bg: 'dim',
  tint: '#dfe8ff',
  hints: [
    'Осемте руни са букви на заклинание, което не напада и не защитава — то просто <b>показва</b>. Осем букви.',
    'Патронусът не се храни със сила, а със спомен. Не всеки светъл спомен обаче става — трябва такъв, който още е <b>твой</b>, а не такъв, който си дал на някого.',
    'Заклинанието е <b>ПАТРОНУС</b>. А верният спомен е онзи, който никой друг не помни — защото само той е останал изцяло твой.',
  ],
};

const SPELL = 'ПАТРОНУС';

const MEMORIES = [
  { t: 'Вечерта, когато Голямата зала пя, а ти пееше най-силно от всички.',
    ok: false, r: 'Този спомен е и на стотина други. Гората иска нещо, което е останало само твое.' },
  { t: 'Мигът, в който Разпределителната шапка каза дома ти на глас и цялата зала го чу.',
    ok: false, r: 'Този го помни целият замък. А замъкът вече те забрави — значи и споменът си отиде с него.' },
  { t: 'Онази нощ, когато никой не те гледаше, а ти реши да не се предадеш.',
    ok: true, r: '' },
];

let stage = null, stag = null;

export function mount(root, api) {
  const d = api.data;
  const runes = api.allRunes();
  if (!d.slots) d.slots = Array(SPELL.length).fill(null);
  if (d.spelled == null) d.spelled = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Гората пита за последно</h4>
            <p>„Дадох ти осем неща. Върни ми ги като <b>една дума</b> — и после ми покажи
            спомена, който още е твой.“</p>
          </div>
          <div class="sub-step">
            <p class="panel-title">Осемте руни</p>
            <div class="spell-slots" id="spell-slots"></div>
            <div class="rune-tray" id="rune-tray"></div>
            <div class="flex flex-center mt">
              <button class="btn btn-house" id="spell-check"><span>Изречи заклинанието</span></button>
              <button class="btn btn-ghost btn-sm" id="spell-clear"><span>Изчисти</span></button>
            </div>
          </div>
          <div id="memory-host"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Дърветата се затварят…</div></div>
      </div>
    </div>`;

  renderSlots(api, runes); renderTray(api, runes);
  $('#spell-check').addEventListener('click', () => check(api, runes));
  $('#spell-clear').addEventListener('click', () => {
    api.data.slots = Array(SPELL.length).fill(null); api.saveData(); api.sfx.click();
    renderSlots(api, runes); renderTray(api, runes);
  });

  if (d.spelled || api.solved) askMemory(api, api.solved);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } stag = null; };
}

function renderSlots(api, runes) {
  const box = $('#spell-slots'); if (!box) return;
  box.innerHTML = '';
  api.data.slots.forEach((t, i) => {
    const s = el('button', 'spell-slot' + (t != null ? ' filled' : ''), t != null ? runes[t] : '');
    s.addEventListener('click', () => {
      if (api.data.spelled) return;
      if (api.data.slots[i] != null) {
        api.data.slots[i] = null; api.saveData(); api.sfx.click();
        renderSlots(api, runes); renderTray(api, runes);
      }
    });
    box.appendChild(s);
  });
}

function renderTray(api, runes) {
  const t = $('#rune-tray'); if (!t) return;
  t.innerHTML = '';
  runes.forEach((ch, i) => {
    const used = api.data.slots.includes(i);
    const b = el('button', 'rune-tile' + (used ? ' used' : ''), ch);
    b.disabled = used;
    b.addEventListener('click', () => {
      if (api.data.spelled) return;
      const free = api.data.slots.indexOf(null);
      if (free < 0) return;
      api.data.slots[free] = i; api.saveData(); api.sfx.rune();
      renderSlots(api, runes); renderTray(api, runes);
    });
    t.appendChild(b);
  });
}

function check(api, runes) {
  const d = api.data;
  if (d.slots.includes(null)) { api.toast('Всичките осем руни трябва да са на местата си.', ''); return; }
  const word = d.slots.map(i => runes[i]).join('');
  if (norm(word) === SPELL) {
    d.spelled = true; api.saveData();
    api.sfx.unlock();
    api.fx.flash('rgba(220,235,255,.28)', 900);
    api.fx.sparksFrom($('#spell-slots'), { count: 55, color: '#dfe8ff', spread: 300 });
    $('#spell-check').disabled = true;
    if (stag) stag.userData.stage = 1;
    setTimeout(() => askMemory(api, false), 800);
  } else {
    api.sfx.bad(); shakeEl($('#spell-slots'));
    api.fail('Върхът на пръчката пуска само дим. Не е тази дума.', 45000);
  }
}

function askMemory(api, already) {
  const host = $('#memory-host');
  host.innerHTML = `
    <div class="final-q mirror-q">
      <p><i>Пръчката тежи в ръката ти. Остава най-простото и най-трудното:</i></p>
      <p><b>„Кой спомен ще дадеш на светлината?“</b></p>
      <div class="opt-list" id="opts"></div>
    </div>`;
  const list = $('#opts');
  MEMORIES.forEach(m => {
    const b = el('button', 'opt', m.t);
    b.addEventListener('click', () => {
      if (api.solved) return;
      if (m.ok) {
        b.classList.add('right');
        $$('.opt').forEach(x => x.disabled = true);
        api.sfx.victory();
        api.fx.flash('rgba(230,240,255,.42)', 1500);
        api.fx.celebrate(4);
        if (stag) stag.userData.stage = 2;
        setTimeout(() => api.solve('От върха на пръчката излиза сребро. То се събира, изправя се на четири крака и вдига глава с рога като клони. Гората най-после знае как се казваш, {име}.'), 1600);
      } else {
        b.classList.add('wrong');
        api.sfx.bad();
        api.fx.shakeScreen(11, 520);
        api.fail(m.r, 45000);
      }
    });
    list.appendChild(b);
  });
  if (already) {
    $$('.opt').forEach((x, i) => { x.disabled = true; if (MEMORIES[i].ok) x.classList.add('right'); });
    if (stag) stag.userData.stage = 2;
  }
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...FOREST_STAGE, dist: 23, fov: 44, look: [0, 2.6, 0],
    theta: 0, phi: 1.06, minPolar: 0.34, maxPolar: 1.42, fogNear: 22, fogFar: 70,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL за поляната, но заклинанието се изрича и без него.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  plantForest(stage, { count: 52, inner: 15, outer: 30 });
  addMist(stage, { count: 12 });
  addFireflies(stage, { count: 70, color: 0xcfe0ff });
  addMoonshaft(stage, { r: 4.5, h: 26, color: 0xdfe8ff });

  stag = buildStag(T);
  stag.position.set(0, 0, -1.5);
  stag.userData = { stage: api.solved ? 2 : (api.data.spelled ? 1 : 0) };
  stage.add(stag);

  const glow = new T.PointLight(0xcfe0ff, 0, 26);
  glow.position.set(0, 3.5, 0);
  stage.add(glow);

  stage.onFrame((t, dt) => {
    const s = stag.userData.stage;
    const want = s === 2 ? 1 : s === 1 ? 0.32 : 0;
    stag.traverse(c => {
      if (c.material && c.material.opacity != null) {
        c.material.opacity += (want * (0.55 + Math.sin(t * 2) * 0.12) - c.material.opacity) * 0.05;
      }
    });
    glow.intensity += (want * 2.4 - glow.intensity) * 0.05;
    stag.rotation.y = Math.sin(t * 0.25) * 0.22;
    stag.position.y = Math.sin(t * 0.9) * 0.07;
    if (s === 2) stag.position.z = -1.5 + Math.sin(t * 0.4) * 0.6;
  });
}

function buildStag(T) {
  const g = new T.Group();
  const mat = () => new T.MeshBasicMaterial({
    color: 0xdfe8ff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false,
  });
  const body = new T.Mesh(new T.CapsuleGeometry(0.62, 1.7, 6, 12), mat());
  body.rotation.z = Math.PI / 2; body.position.y = 1.85;
  const neck = new T.Mesh(new T.CylinderGeometry(0.24, 0.36, 1.3, 8), mat());
  neck.position.set(1.05, 2.5, 0); neck.rotation.z = -0.75;
  const head = new T.Mesh(new T.CapsuleGeometry(0.24, 0.62, 5, 10), mat());
  head.position.set(1.75, 2.95, 0); head.rotation.z = -1.15;
  g.add(body, neck, head);

  [[-0.6, 0.38], [-0.6, -0.38], [0.6, 0.34], [0.6, -0.34]].forEach(([z, x]) => {
    const leg = new T.Mesh(new T.CylinderGeometry(0.1, 0.07, 1.85, 6), mat());
    leg.position.set(z, 0.92, x);
    g.add(leg);
  });

  // рога като клони
  [1, -1].forEach(side => {
    const base = new T.Mesh(new T.CylinderGeometry(0.06, 0.09, 1.1, 5), mat());
    base.position.set(1.72, 3.6, side * 0.18);
    base.rotation.set(side * 0.35, 0, -0.25);
    g.add(base);
    for (let k = 0; k < 3; k++) {
      const tine = new T.Mesh(new T.CylinderGeometry(0.035, 0.05, 0.75 - k * 0.12, 5), mat());
      tine.position.set(1.62 + k * 0.18, 3.95 + k * 0.32, side * (0.3 + k * 0.12));
      tine.rotation.set(side * 0.8, 0, -0.9 + k * 0.25);
      g.add(tine);
    }
  });

  const tail = new T.Mesh(new T.ConeGeometry(0.16, 0.5, 6), mat());
  tail.position.set(-1.05, 2.15, 0); tail.rotation.z = 1.2;
  g.add(tail);

  g.scale.setScalar(1.15);
  return g;
}
