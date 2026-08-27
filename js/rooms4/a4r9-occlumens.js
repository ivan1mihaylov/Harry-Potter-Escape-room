/* ============================================================
   ЧЕТВЪРТА ЧАСТ · ЗАЛА IX — Оклуменс
   Най-горната килия. Дименторът не пита нищо. Просто идва
   и посяга — а ти или си затворен, или те няма.
   ============================================================ */
import { head, $, $$, el, shakeEl, norm } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { AZK_STAGE, addWalls, addFrost, addSlit, buildDementor } from './common4.js';

export const meta = {
  id: 'a4-occlumens',
  eyebrow: 'Зала IX · финал',
  title: 'Оклуменс',
  sub: 'Стълбата свършва в кръгла килия без решетка — защото не ѝ трябва. Студът идва отдолу и се изкачва по-бавно от теб, {име}, но не спира.',
  rune: null,
  grain: null,
  bg: 'dim',
  tint: '#cfd8e6',
  hints: [
    'Осемте руни са едно име на умение, не на заклинание. Осем букви: изкуството да <b>затвориш</b> ума си.',
    'Дименторът не чете мисли — той <b>усеща</b>. Даваш ли му нещо истинско, то се превръща в храна. Даваш ли му нещо чуждо или измислено, то се разпада в ръцете му.',
    'Думата е <b>ОКЛУМЕНС</b>. А на третото посягане верният ход не е да му дадеш нещо друго — а да не му дадеш <b>нищо</b>.',
  ],
};

const SPELL = 'ОКЛУМЕНС';

const PROBES = [
  {
    q: 'Първото посягане е плитко. Нещо в теб трепва и се готви да излезе на светло. Кое ще пуснеш пред него?',
    opts: [
      { t: 'Урок по история на магията, който си проспал целия.',
        ok: true, r: '' },
      { t: 'Първата вечер в Голямата зала, когато таванът беше звезди.',
        ok: false, r: 'Това е истинско. Студът го поема жадно и в теб остава дупка с формата на онази вечер.' },
      { t: 'Гласа на човека, който те е учил да не се предаваш.',
        ok: false, r: 'Не давай това. Точно това търси.' },
    ],
  },
  {
    q: 'Второто посягане е по-дълбоко и не се лъже от скука. Иска нещо със сол в него. Какво ще му подадеш?',
    opts: [
      { t: 'Кошмар, който си сънувал миналата седмица и вече не помниш добре.',
        ok: true, r: '' },
      { t: 'Деня, в който Забранената гора те пусна и еленът тръгна пред теб.',
        ok: false, r: 'Това е най-светлото, което имаш. Дименторът си отива нахранен, а ти — по-празен.' },
      { t: 'Тайната, която носиш под Фиделиус.',
        ok: false, r: 'Тя не може да бъде извадена от теб — но опитът да я подадеш сам едва не я счупи.' },
    ],
  },
  {
    q: 'Третото посягане не иска спомен. То иска <i>достъп</i> — да остане вътре и да си избере само. Какво правиш?',
    opts: [
      { t: 'Не му давам нищо. Затварям.',
        ok: true, r: '' },
      { t: 'Давам му най-безобидното, което ми е останало, за да си тръгне.',
        ok: false, r: 'Няма безобидно, когато вратата е отворена. То взима каквото види.' },
      { t: 'Опитвам да го изгоня със заклинание.',
        ok: false, r: 'Оклуменцията не гони. Тя просто не пуска. Пръчката ти издрънчава на пода.' },
    ],
  },
];

let stage = null, dementor = null, shield = null;

export function mount(root, api) {
  const d = api.data;
  const runes = api.allRunes();
  if (!d.slots) d.slots = Array(SPELL.length).fill(null);
  if (d.spelled == null) d.spelled = false;
  if (d.probe == null) d.probe = 0;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Онова, което ти остана</h4>
            <p>Осем зали, осем руни. Заедно те не са заклинание — те са <b>умение</b>.
            И то се учи само на едно място: там, където има какво да загубиш.</p>
          </div>
          <div class="sub-step">
            <p class="panel-title">Осемте руни</p>
            <div class="spell-slots" id="spell-slots"></div>
            <div class="rune-tray" id="rune-tray"></div>
            <div class="flex flex-center mt">
              <button class="btn btn-house" id="spell-check"><span>Назови умението</span></button>
              <button class="btn btn-ghost btn-sm" id="spell-clear"><span>Изчисти</span></button>
            </div>
          </div>
          <div id="probe-host"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Студът се изкачва…</div></div>
      </div>
    </div>`;

  renderSlots(api, runes); renderTray(api, runes);
  $('#spell-check').addEventListener('click', () => check(api, runes));
  $('#spell-clear').addEventListener('click', () => {
    if (api.data.spelled) return;
    api.data.slots = Array(SPELL.length).fill(null); api.saveData(); api.sfx.click();
    renderSlots(api, runes); renderTray(api, runes);
  });

  if (d.spelled || api.solved) renderProbe(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } dementor = null; shield = null; };
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
    api.fx.flash('rgba(200,220,255,.26)', 900);
    api.fx.sparksFrom($('#spell-slots'), { count: 50, color: '#cfe0ff', spread: 280 });
    $('#spell-check').disabled = true;
    if (shield) shield.userData.on = 0.4;
    setTimeout(() => renderProbe(api), 700);
  } else {
    api.sfx.bad(); shakeEl($('#spell-slots'));
    api.fail('Думата не се получава. Студът се качва с още едно стъпало.', 45000);
  }
}

/* ---------- трите посягания ---------- */
function renderProbe(api) {
  const host = $('#probe-host'); if (!host) return;
  const d = api.data;
  if (api.solved || d.probe >= PROBES.length) {
    host.innerHTML = `<div class="final-q occ-done">
      <p><b>Затворен си.</b> Дименторът стои още миг, после се отдръпва — не победен, а <i>незаинтересован</i>.
      Онова, което не може да усети, за него не съществува.</p></div>`;
    if (dementor) dementor.userData.retreat = 1;
    if (shield) shield.userData.on = 1;
    return;
  }
  const p = PROBES[d.probe];
  host.innerHTML = `
    <div class="final-q occ-probe">
      <div class="occ-step">посягане ${d.probe + 1} от ${PROBES.length}</div>
      <p><b>${p.q}</b></p>
      <div class="opt-list" id="opts"></div>
    </div>`;
  const list = $('#opts');
  p.opts.forEach(o => {
    const b = el('button', 'opt', o.t);
    b.addEventListener('click', () => {
      if (api.solved) return;
      if (o.ok) {
        b.classList.add('right');
        $$('.opt').forEach(x => x.disabled = true);
        api.sfx.chime();
        api.fx.sparksFrom(b, { count: 18, color: '#cfe0ff', spread: 120 });
        d.probe++; api.saveData();
        if (shield) shield.userData.on = 0.4 + d.probe * 0.2;
        if (d.probe >= PROBES.length) {
          api.sfx.victory();
          api.fx.flash('rgba(220,235,255,.4)', 1400);
          api.fx.celebrate(4);
          if (dementor) dementor.userData.retreat = 1;
          setTimeout(() => {
            renderProbe(api);
            api.solve('Умът ти се затваря като врата в дебела стена, {име}. От другата ѝ страна остава всичко, което са ти взели — и вече знаеш пътя до него.');
          }, 1500);
        } else {
          setTimeout(() => renderProbe(api), 800);
        }
      } else {
        b.classList.add('wrong');
        b.disabled = true;
        api.sfx.roar();
        api.fx.shakeScreen(13, 600);
        api.fx.flash('rgba(20,26,50,.4)', 700);
        api.fail(o.r, 45000);
      }
    });
    list.appendChild(b);
  });
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    ...AZK_STAGE, ground: true, groundColor: 0x11151c, dist: 15, fov: 45, look: [0, 2.2, 0],
    theta: 0, phi: 1.02, minPolar: 0.35, maxPolar: 1.4,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за килията, но умението се назовава и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  addWalls(stage, { w: 16, h: 10, d: 16, tint: 0x131720 });
  addFrost(stage, { count: 130, radius: 8, height: 10 });
  addSlit(stage, { x: 0, z: -5.6, w: 1.1, h: 12 });

  dementor = buildDementor(T, { scale: 1.9 });
  dementor.position.set(0, 0.4, -4.5);
  dementor.userData.retreat = api.solved ? 1 : 0;
  stage.add(dementor);

  shield = new T.Mesh(
    new T.SphereGeometry(3.1, 30, 22),
    new T.MeshBasicMaterial({
      color: 0xcfe0ff, transparent: true, opacity: 0,
      blending: T.AdditiveBlending, depthWrite: false, wireframe: true,
    })
  );
  shield.position.set(0, 2.2, 2.4);
  shield.userData.on = api.solved ? 1 : (api.data.spelled ? 0.4 + api.data.probe * 0.2 : 0);
  stage.add(shield);

  const glow = new T.PointLight(0xbfd8ff, 0, 22);
  glow.position.set(0, 3, 2.4);
  stage.add(glow);

  stage.onFrame((t, dt) => {
    if (dementor.userData.animate) dementor.userData.animate(t);
    const want = dementor.userData.retreat ? -9.5 : -4.5 + Math.sin(t * 0.5) * 0.7;
    dementor.position.z += (want - dementor.position.z) * 0.02;
    dementor.traverse(c => {
      if (c.material && c.material.opacity != null && c.material.transparent) {
        const target = dementor.userData.retreat ? 0.12 : 0.88;
        c.material.opacity += (target - c.material.opacity) * 0.02;
      }
    });
    const on = shield.userData.on || 0;
    shield.material.opacity += (on * (0.12 + Math.sin(t * 1.6) * 0.04) - shield.material.opacity) * 0.06;
    shield.rotation.y = t * 0.14;
    shield.rotation.x = Math.sin(t * 0.3) * 0.1;
    glow.intensity += (on * 2.2 - glow.intensity) * 0.05;
  });
}
