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
    { text: 'Осемте руни са букви на заклинание, което не напада и не защитава — то просто <b>показва</b>. Осем букви.',
      done: d => !!d.spelled },
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
  /* Сребърният елен: гледа към +X.  Всяка част носи собствен материал,
     защото прозрачността им се вдига поотделно, докато се сглобява.   */
  const g = new T.Group();
  const mat = () => new T.MeshBasicMaterial({
    color: 0xdfe8ff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false,
  });
  const add = (m, x, y, z, rx = 0, ry = 0, rz = 0) => {
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m;
  };

  /* тяло */
  const body = new T.Mesh(new T.CapsuleGeometry(0.52, 1.75, 8, 16), mat());
  body.scale.set(1, 1, 0.86);
  add(body, 0, 1.92, 0, 0, 0, Math.PI / 2);
  const rump = new T.Mesh(new T.SphereGeometry(0.54, 12, 10), mat());
  rump.scale.set(0.95, 1.05, 0.86);
  add(rump, -1.0, 1.94, 0);
  const chest = new T.Mesh(new T.SphereGeometry(0.5, 12, 10), mat());
  chest.scale.set(1, 1.08, 0.9);
  add(chest, 0.98, 1.9, 0);

  /* крака на стави, с копита — еленът стъпва, не стои на пръчки */
  [[0.82, 0.32, 1], [0.8, -0.34, 1], [-0.86, 0.3, 0], [-0.88, -0.32, 0]]
    .forEach(([x, z, front], k) => {
      const leg = new T.Group();
      const up = new T.Mesh(new T.CylinderGeometry(0.13, 0.075, 1.0, 7), mat());
      up.position.y = -0.5; leg.add(up);
      const knee = new T.Group(); knee.position.y = -1.0;
      const lo = new T.Mesh(new T.CylinderGeometry(0.06, 0.038, 0.86, 6), mat());
      lo.position.y = -0.43; knee.add(lo);
      const hoof = new T.Mesh(new T.CylinderGeometry(0.05, 0.075, 0.16, 6), mat());
      hoof.position.y = -0.92; knee.add(hoof);
      leg.add(knee);
      leg.position.set(x, 1.86, z);
      leg.rotation.x = front ? 0.12 - (k % 2) * 0.24 : -0.2 + (k % 2) * 0.28;
      knee.rotation.x = front ? -0.18 : 0.34;
      g.add(leg);
    });

  /* врат и глава */
  const neck = new T.Mesh(new T.CylinderGeometry(0.2, 0.38, 1.35, 9), mat());
  add(neck, 1.32, 2.55, 0, 0, 0, -0.66);
  const skull = new T.Mesh(new T.SphereGeometry(0.24, 12, 10), mat());
  skull.scale.set(1.25, 0.95, 0.88);
  add(skull, 1.86, 3.16, 0);
  const muzzle = new T.Mesh(new T.CylinderGeometry(0.085, 0.16, 0.56, 8), mat());
  add(muzzle, 2.18, 3.0, 0, 0, 0, -Math.PI / 2 + 0.42);
  const chin = new T.Mesh(new T.SphereGeometry(0.09, 8, 6), mat());
  add(chin, 2.42, 2.88, 0);
  [-1, 1].forEach(sz => {
    const ear = new T.Mesh(new T.ConeGeometry(0.09, 0.3, 7), mat());
    add(ear, 1.7, 3.32, sz * 0.16, sz * 0.5, 0, 0.35);
  });

  /* рогата: извит ствол и четири зъбера от всяка страна */
  [1, -1].forEach(sz => {
    const beam = [
      [1.82, 3.5, sz * 0.12, 0.55, sz * 0.3, -0.3],
      [1.72, 3.98, sz * 0.36, 0.6, sz * 0.5, 0.18],
      [1.5, 4.4, sz * 0.62, 0.55, sz * 0.55, 0.55],
    ];
    beam.forEach(([x, y, z, len, rx, rz]) => {
      const seg = new T.Mesh(new T.CylinderGeometry(0.045, 0.065, len, 6), mat());
      add(seg, x, y, z, rx, 0, rz);
    });
    [[1.94, 3.78, 0.24, 0.5, -0.9], [1.78, 4.16, 0.5, 0.46, -0.6],
     [1.5, 4.5, 0.76, 0.4, -0.2], [1.24, 4.68, 0.9, 0.34, 0.2]]
      .forEach(([x, y, z, len, rz], k) => {
        const tine = new T.Mesh(new T.CylinderGeometry(0.022, 0.04, len, 5), mat());
        add(tine, x, y, sz * z, sz * (0.7 + k * 0.1), 0, rz);
      });
  });

  /* опашка */
  const tail = new T.Mesh(new T.ConeGeometry(0.15, 0.46, 7), mat());
  add(tail, -1.42, 2.14, 0, 0, 0, 1.05);

  g.scale.setScalar(1.15);
  return g;
}
