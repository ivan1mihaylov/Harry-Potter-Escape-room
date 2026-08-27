/* ============================================================
   ПЕТА ЧАСТ · КАМЕРА IX — Пророчеството без край
   Осемте руни се събират в една дума. После остава само
   да решиш какво да правиш с бъдеще, което някой е написал.
   ============================================================ */
import { head, $, $$, el, shakeEl, norm } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { MYSTERY_STAGE, addChamber, addBlueFlames, addDust, buildOrb, addMysteryLight } from './common5.js';

export const meta = {
  id: 'a5-end',
  eyebrow: 'Камера IX · финал',
  title: 'Пророчеството без край',
  sub: 'В средата на празна кръгла зала виси една-единствена сфера. На етикета ѝ стои твоето име и днешната дата.',
  rune: null,
  bg: 'dim',
  tint: '#ffb27a',
  hints: [
    { text: 'Осемте руни са дума, която всеки първокурсник знае — и която прави едно и също с пергамент, със завеса и с бъдеще.',
      done: d => !!d.spelled },
    'Думата е <b>ИНСЕНДИО</b>. После сферата ще ти предложи три неща и само едно от тях е избор, а не подчинение.',
    'Да я изслушаш значи да ѝ се подчиниш. Да я оставиш значи някой друг да я изслуша вместо теб. Остава <b>да я изгориш</b>.',
  ],
};

const SPELL = 'ИНСЕНДИО';

const CHOICES = [
  { t: 'Изслушвам го докрай. Ако бъдещето е написано, поне да го знам.',
    ok: false,
    r: 'Първата дума влиза в теб и вече не излиза. Оттук нататък всяко твое решение ще се оглежда в нея — а това не е знание, а каишка.' },
  { t: 'Връщам го на рафта. Не е мое право да го унищожавам.',
    ok: false,
    r: 'Рафтът го приема с готовност. Някой ще го вземе след теб, ще го чуе и ще тръгне да го изпълнява. Ти не си решил нищо — само си отложил.' },
  { t: 'Изгарям го, без да го чуя.',
    ok: true, r: '' },
];

let stage = null, orb = null, fire = null;

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
            <h4>Етикетът под сферата</h4>
            <p>Няма пророк, няма дата на записване. Само твоето име — и празно място
            там, където би трябвало да пише кой го е чул.</p>
          </div>
          <div class="sub-step">
            <p class="panel-title">Осемте руни</p>
            <div class="spell-slots" id="spell-slots"></div>
            <div class="rune-tray" id="rune-tray"></div>
            <div class="flex flex-center mt">
              <button class="btn btn-house" id="spell-check"><span>Изречи думата</span></button>
              <button class="btn btn-ghost btn-sm" id="spell-clear"><span>Изчисти</span></button>
            </div>
          </div>
          <div id="choice-host"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Залата се изпразва…</div></div>
      </div>
    </div>`;

  renderSlots(api, runes); renderTray(api, runes);
  $('#spell-check').addEventListener('click', () => check(api, runes));
  $('#spell-clear').addEventListener('click', () => {
    if (api.data.spelled) return;
    api.data.slots = Array(SPELL.length).fill(null); api.saveData(); api.sfx.click();
    renderSlots(api, runes); renderTray(api, runes);
  });

  if (d.spelled || api.solved) askChoice(api, api.solved);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } orb = null; fire = null; };
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
    api.fx.flash('rgba(255,190,120,.26)', 900);
    api.fx.sparksFrom($('#spell-slots'), { count: 50, color: '#ffc98a', spread: 280 });
    $('#spell-check').disabled = true;
    if (orb) orb.userData.warm = true;
    setTimeout(() => askChoice(api, false), 800);
  } else {
    api.sfx.bad(); shakeEl($('#spell-slots'));
    api.fail('Върхът на пръчката остава студен. Не е тази дума.', 45000);
  }
}

function askChoice(api, already) {
  const host = $('#choice-host'); if (!host) return;
  host.innerHTML = `
    <div class="final-q">
      <p><i>Сферата се отваря в дланта ти. Вътре чака глас, който още не е проговорил.</i></p>
      <p><b>Какво правиш с бъдещето, което някой друг е написал за теб?</b></p>
      <div class="opt-list" id="opts"></div>
    </div>`;
  const list = $('#opts');
  CHOICES.forEach(c => {
    const b = el('button', 'opt', c.t);
    b.addEventListener('click', () => {
      if (api.solved) return;
      if (c.ok) {
        b.classList.add('right');
        $$('.opt').forEach(x => x.disabled = true);
        api.sfx.victory();
        api.fx.flash('rgba(255,170,90,.45)', 1500);
        api.fx.celebrate(4);
        if (orb) orb.userData.burn = true;
        setTimeout(() => api.solve('Стъклото се пука, гласът излиза и се превръща в топлина, без да каже нито дума. За пръв път пред теб няма начертан път.'), 1600);
      } else {
        b.classList.add('wrong');
        b.disabled = true;
        api.sfx.bad();
        api.fx.shakeScreen(11, 520);
        api.fail(c.r, 45000);
      }
    });
    list.appendChild(b);
  });
  if (already) {
    $$('.opt').forEach((x, i) => { x.disabled = true; if (CHOICES[i].ok) x.classList.add('right'); });
    if (orb) orb.userData.burn = true;
  }
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...MYSTERY_STAGE, ground: false, dist: 9, fov: 44, look: [0, 2, 0],
    theta: 0.2, phi: 1.05, minPolar: 0.35, maxPolar: 1.42,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за залата, но думата се изрича и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  addMysteryLight(stage);
  const T = stage.THREE;

  addChamber(stage, { r: 7.5, h: 7, seg: 20 });
  addBlueFlames(stage, { count: 10, r: 6.6, h: 4.4 });
  addDust(stage, { count: 90, radius: 6, height: 6 });

  /* поставката и сферата */
  const stand = new T.Mesh(new T.CylinderGeometry(0.34, 0.55, 1.8, 16),
    new T.MeshStandardMaterial({ color: 0x2a2340, roughness: 0.5, metalness: 0.45 }));
  stand.position.y = 0.9;
  stage.add(stand);

  orb = buildOrb(T, { r: 0.55, color: 0xc8b4ff });
  orb.position.y = 2.3;
  orb.userData.glass = orb.userData.glass;
  stage.add(orb);

  /* пламъкът, който ще я погълне */
  fire = new T.Group();
  const flames = [];
  for (let i = 0; i < 14; i++) {
    const f = new T.Mesh(new T.ConeGeometry(0.16, 0.7, 6),
      new T.MeshBasicMaterial({ color: i % 2 ? 0xffb347 : 0xff7a2a, transparent: true,
        opacity: 0, blending: T.AdditiveBlending, depthWrite: false }));
    const a = (i / 14) * Math.PI * 2;
    f.position.set(Math.sin(a) * 0.38, 2.3, Math.cos(a) * 0.38);
    fire.add(f);
    flames.push({ m: f, ph: i * 0.7 });
  }
  stage.add(fire);

  const glow = new T.PointLight(0xffc078, 0.4, 20);
  glow.position.set(0, 2.4, 0);
  stage.add(glow);

  stage.onFrame((t) => {
    if (!orb) return;
    const warm = orb.userData.warm, burn = orb.userData.burn;
    orb.rotation.y = t * 0.25;
    orb.position.y = 2.3 + Math.sin(t * 0.9) * 0.07;
    const g = orb.userData.glass.material;
    g.emissiveIntensity += ((burn ? 1.6 : warm ? 0.95 : 0.5) - g.emissiveIntensity) * 0.05;
    if (burn) {
      orb.scale.setScalar(Math.max(0.02, orb.scale.x - 0.004));
      g.opacity = Math.max(0, g.opacity - 0.004);
    }
    flames.forEach((o, i) => {
      const want = burn ? 0.75 : 0;
      o.m.material.opacity += (want - o.m.material.opacity) * 0.06;
      o.m.position.y = 2.3 + (burn ? Math.abs(Math.sin(t * 4 + o.ph)) * 0.7 : 0);
      o.m.scale.y = 1 + Math.sin(t * 6 + o.ph) * 0.3;
    });
    glow.intensity += ((burn ? 3.2 : warm ? 1.2 : 0.4) - glow.intensity) * 0.04;
  });
}
