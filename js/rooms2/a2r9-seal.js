/* ============================================================
   ВТОРА ЧАСТ · ЗАЛА IX — Прековаването на печата
   ============================================================ */
import { head, $, $$, el, shakeEl, norm } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';

export const meta = {
  id: 'a2-seal',
  eyebrow: 'Зала IX · финал',
  title: 'Прековаването на печата',
  sub: 'Кръгла зала под всичко останало. В пода — печатът на Основателите, счупен на четири. Пясъкът над теб още тече надолу, {име}.',
  rune: null,
  grain: null,
  bg: 'dim',
  tint: '#e8d9a8',
  hints: [
    'Плочите са зъбчати: всяка, която завъртиш, повлича и <b>следващата по посока на часовниковата стрелка</b>. Затова не се опитвай да ги оправяш поединично.',
    'Осемте руни са букви на заклинанието за скриване — най-мощното, което Основателите са знаели. Осем букви.',
    'Заклинанието е <b>ФИДЕЛИУС</b>. А то иска Пазител на тайната — жив човек, който да я носи в себе си.',
  ],
};

const SPELL = 'ФИДЕЛИУС';
const FOUNDERS = ['Годрик', 'Роуина', 'Хелга', 'Салазар'];
const COLORS = [0xc4382f, 0x3f6fd8, 0xe0b32a, 0x2e9e6b];
const INITIAL = [1, 2, 3, 2];   // подредба, която е решима със зъбното зацепване

let stage = null, plates = [];

export function mount(root, api) {
  const d = api.data;
  const runes = api.allRunes();
  if (!d.rot) d.rot = [...INITIAL];
  if (!d.slots) d.slots = Array(SPELL.length).fill(null);
  if (d.sealed == null) d.sealed = false;
  if (d.spelled == null) d.spelled = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Първо — печатът</h4>
            <p>Четирите плочи трябва да обърнат <b>зъбците си към средата</b>. Но плочите са
            наровени: всяка повлича съседната си по посока на часовниковата стрелка.</p>
          </div>
          <div class="plate-row" id="plate-row"></div>
          <div id="spell-host"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Печатът се разгръща…</div></div>
      </div>
    </div>`;

  renderPlates(api);
  if (d.sealed || api.solved) showSpell(api, runes);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } plates = []; };
}

function renderPlates(api) {
  const box = $('#plate-row');
  box.innerHTML = FOUNDERS.map((f, i) => `
    <button class="plate-btn ${api.data.rot[i] === 0 ? 'ok' : ''}" data-i="${i}"
            style="--pc:#${COLORS[i].toString(16).padStart(6, '0')}">
      <span class="pb-name">${f}</span>
      <span class="pb-arrow" style="transform:rotate(${api.data.rot[i] * 90}deg)">▲</span>
    </button>`).join('');
  $$('.plate-btn', box).forEach(b => b.addEventListener('click', () => turnPlate(api, +b.dataset.i)));
  if (api.data.sealed) $$('.plate-btn', box).forEach(b => b.disabled = true);
}

function turnPlate(api, i) {
  const d = api.data;
  if (d.sealed) return;
  d.rot[i] = (d.rot[i] + 1) % 4;
  const j = (i + 1) % 4;
  d.rot[j] = (d.rot[j] + 1) % 4;
  api.saveData();
  api.sfx.click();
  renderPlates(api);
  syncPlates(api);
  if (d.rot.every(r => r === 0)) {
    d.sealed = true; api.saveData();
    api.sfx.unlock();
    api.fx.flash('rgba(255,225,150,.28)', 800);
    api.fx.sparksFrom($('#stage'), { count: 55, color: '#ffe9a8', spread: 300 });
    renderPlates(api);
    api.toast('Четирите зъбци щракват един в друг. Печатът е цял — но още мълчи.', 'magic');
    setTimeout(() => showSpell(api, api.allRunes()), 700);
  }
}

function syncPlates(api) {
  plates.forEach((p, i) => { p.target = -api.data.rot[i] * Math.PI / 2; });
}

/* ---------- заклинанието ---------- */
function showSpell(api, runes) {
  const host = $('#spell-host');
  host.innerHTML = `
    <div class="sub-step">
      <p class="panel-title">Второ — заклинанието</p>
      <p class="muted" style="font-size:.94rem;margin:-6px 0 12px">
        Осемте руни са букви на заклинанието, с което се крие тайна вътре в жив човек.</p>
      <div class="spell-slots" id="spell-slots"></div>
      <div class="rune-tray" id="rune-tray"></div>
      <div class="flex flex-center mt">
        <button class="btn btn-house" id="spell-check"><span>Изречи заклинанието</span></button>
        <button class="btn btn-ghost btn-sm" id="spell-clear"><span>Изчисти</span></button>
      </div>
      <div id="keeper-host"></div>
    </div>`;
  renderSlots(api, runes); renderTray(api, runes);
  $('#spell-check').addEventListener('click', () => checkSpell(api, runes));
  $('#spell-clear').addEventListener('click', () => {
    api.data.slots = Array(SPELL.length).fill(null); api.saveData(); api.sfx.click();
    renderSlots(api, runes); renderTray(api, runes);
  });
  if (api.data.spelled || api.solved) askKeeper(api, api.solved);
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

function checkSpell(api, runes) {
  const d = api.data;
  if (d.slots.includes(null)) { api.toast('Всичките осем руни трябва да са на местата си.', ''); return; }
  const word = d.slots.map(i => runes[i]).join('');
  if (norm(word) === SPELL) {
    d.spelled = true; api.saveData();
    api.sfx.unlock();
    api.fx.flash('rgba(255,240,200,.3)', 900);
    api.fx.sparksFrom($('#spell-slots'), { count: 60, color: '#ffe9a8', spread: 320 });
    $('#spell-check').disabled = true;
    setTimeout(() => askKeeper(api, false), 800);
  } else {
    api.sfx.bad(); shakeEl($('#spell-slots'));
    api.fail('Печатът поглъща буквите и ги връща разбъркани. Не е това заклинание.');
  }
}

/* ---------- Пазителят на тайната ---------- */
const OPTS = [
  { t: 'Замъкът ще пази сам себе си — той е по-стар от всички ни.', ok: false,
    r: 'Камъкът не помни. Заклинанието иска нещо, което може да забрави — и въпреки това да не издаде.' },
  { t: '<b>Аз.</b> Ще я нося и няма да я изрека.', ok: true, r: '' },
  { t: 'Никой. Тайна без пазител не може да бъде издадена.', ok: false,
    r: 'Тайна без пазител не е скрита. Тя просто не съществува — а замъкът съществува.' },
];

function askKeeper(api, already) {
  const host = $('#keeper-host');
  host.innerHTML = `
    <div class="final-q mirror-q">
      <p><i>Печатът светва и задава единствения си въпрос:</i></p>
      <p><b>„Фиделиус иска Пазител на тайната. Кой ще бъде той?“</b></p>
      <div class="opt-list" id="opts"></div>
    </div>`;
  const list = $('#opts');
  OPTS.forEach(o => {
    const b = el('button', 'opt', o.t);
    b.addEventListener('click', () => {
      if (api.solved) return;
      if (o.ok) {
        b.classList.add('right');
        $$('.opt').forEach(x => x.disabled = true);
        api.sfx.victory();
        api.fx.flash('rgba(255,245,215,.4)', 1400);
        api.fx.celebrate(4);
        plates.forEach(p => { p.sealed = true; });
        setTimeout(() => api.solve('Печатът приема името ти и веднага го забравя. Пясъкът спира.'), 1500);
      } else {
        b.classList.add('wrong');
        api.sfx.bad();
        api.fx.shakeScreen(12, 550);
        api.fail(o.r);
      }
    });
    list.appendChild(b);
  });
  if (already) $$('.opt').forEach((x, i) => { x.disabled = true; if (OPTS[i].ok) x.classList.add('right'); });
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    dist: 16, fov: 44, look: [0, 0.6, 0], theta: 0.2, phi: 0.66,
    minPolar: 0.18, maxPolar: 1.36, ground: true, groundColor: 0x100d14,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL за печата, но плочите вляво се въртят и без него.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  const gold = new T.MeshStandardMaterial({ color: 0xd9b45b, metalness: 0.9, roughness: 0.28 });
  const core = new T.Mesh(new T.CylinderGeometry(2.1, 2.1, 0.4, 40), gold);
  core.position.y = 0.2; core.castShadow = true; core.receiveShadow = true;
  stage.add(core);
  const coreGlow = new T.Mesh(
    new T.CircleGeometry(1.85, 40),
    new T.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.35 })
  );
  coreGlow.rotation.x = -Math.PI / 2; coreGlow.position.y = 0.41;
  stage.add(coreGlow);

  FOUNDERS.forEach((f, i) => {
    const a = (i / 4) * Math.PI * 2;
    const g = new T.Group();
    const plate = new T.Mesh(
      new T.CylinderGeometry(1.7, 1.7, 0.36, 6),
      new T.MeshStandardMaterial({ color: COLORS[i], metalness: 0.55, roughness: 0.42,
        emissive: COLORS[i], emissiveIntensity: 0.18 })
    );
    plate.castShadow = true; plate.receiveShadow = true;
    g.add(plate);
    // зъбецът, който трябва да сочи към средата
    const tooth = new T.Mesh(new T.ConeGeometry(0.42, 1.1, 4), gold);
    tooth.position.set(0, 0.1, -1.6);
    tooth.rotation.x = -Math.PI / 2;
    g.add(tooth);
    const lbl = new T.Mesh(
      new T.PlaneGeometry(1.9, 0.6),
      new T.MeshBasicMaterial({ map: labelTexture(T, f, { size: 256, color: '#fff4d0', font: '600 54px Cinzel, Georgia, serif' }), transparent: true })
    );
    lbl.rotation.x = -Math.PI / 2; lbl.position.set(0, 0.2, 0.55);
    g.add(lbl);

    const holder = new T.Group();
    holder.position.set(Math.sin(a) * 4.0, 0.2, Math.cos(a) * 4.0);
    holder.rotation.y = a;         // плочата гледа към центъра при завъртане 0
    holder.add(g);
    stage.add(holder);
    plates.push({ g, target: -api.data.rot[i] * Math.PI / 2, cur: -api.data.rot[i] * Math.PI / 2, sealed: false, plate });
  });
  plates.forEach(p => { p.g.rotation.y = p.cur; });

  // пясък, който вали отгоре
  const n = 260;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 18;
    pos[i * 3 + 1] = Math.random() * 16;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
  }
  const sandGeo = new T.BufferGeometry();
  sandGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const sand = new T.Points(sandGeo, new T.PointsMaterial({
    color: 0xe8c98a, size: 0.09, transparent: true, opacity: 0.6, depthWrite: false,
  }));
  stage.add(sand);

  stage.onFrame((t, dt) => {
    plates.forEach(p => {
      p.cur += (p.target - p.cur) * 0.14;
      p.g.rotation.y = p.cur;
      if (p.sealed) p.plate.material.emissiveIntensity = 0.35 + Math.sin(t * 3) * 0.25;
    });
    coreGlow.material.opacity = 0.25 + Math.sin(t * 2) * 0.15;
    const arr = sandGeo.attributes.position.array;
    const falling = !api.solved;
    for (let i = 0; i < n; i++) {
      if (falling) arr[i * 3 + 1] -= dt * (1.2 + (i % 7) * 0.25);
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 16;
    }
    sandGeo.attributes.position.needsUpdate = true;
  });
}
