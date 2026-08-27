/* ============================================================
   ЧЕТВЪРТА ЧАСТ · ЗАЛА VII — Лодката
   Между кулата и склада има тесен проток. Шест взети спомена
   чакат да бъдат пренесени — а лодката е за теб и още два.
   ============================================================ */
import { head, $, $$, answerBar, wireAnswer } from '../rooms/common.js';
import { createStage } from '../three-stage.js';
import { AZK_STAGE, addSea, addFrost, stoneMat } from './common4.js';

export const meta = {
  id: 'a4-boat',
  eyebrow: 'Зала VII',
  title: 'Лодката',
  sub: 'Шест спомена в шест стъкленици. Лодката носи теб и най-много два. И някои спомени не бива да остават сами един с друг.',
  rune: 'Н',
  bg: 'off',
  tint: '#7fa8c8',
  hints: [
    { text: 'Забранените двойки важат само за брега, <b>на който те няма</b>. Докато си там, никой никого не изяжда.',
      done: d => !!d.ferried },
    { text: '«Страхът от тъмното» не понася три от останалите, «Последното сбогом» — още две. Значи тези двамата трябва да пътуват заедно или да стоят при теб.',
      done: d => !!d.ferried },
    { text: 'Седем курса стигат: <b>Страхът + Сбогото</b> отсреща → връщаш <b>Страха</b> → пренасяш <b>Едно име + Нощта</b> → връщаш се <b>сам</b> → пренасяш <b>Обичта + Морето</b> → връщаш <b>Сбогото</b> → пренасяш <b>Страха + Сбогото</b>.',
      done: d => !!d.ferried },
  ],
};

const MEM = [
  { l: 'С', t: 'Страхът от тъмното', c: 0x4a5a7a },
  { l: 'П', t: 'Последното сбогом', c: 0x6a4a6a },
  { l: 'О', t: 'Обичта', c: 0xd88a6a },
  { l: 'М', t: 'Морето през лятото', c: 0x5ab0c0 },
  { l: 'Е', t: 'Едно име, извикано от двора', c: 0xd8c07a },
  { l: 'Н', t: 'Нощта, в която спря дъждът', c: 0x7ad0a0 },
];
const FORBIDDEN = [[0, 1], [0, 4], [0, 5], [1, 2], [1, 3]];

let stage = null, orbs = [], boatMesh = null;

export function mount(root, api) {
  const d = api.data;
  if (d.right == null) { d.right = 0; d.boat = 0; d.load = []; d.trips = 0; }
  if (d.ferried == null) d.ferried = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel">
      <p class="panel-title">Кои не бива да остават сами</p>
      <ul class="pair-list">${FORBIDDEN.map(([a, b]) =>
        `<li><b>${MEM[a].t}</b> <i>и</i> <b>${MEM[b].t}</b></li>`).join('')}</ul>
      <p class="muted center">Останат ли двама такива на бряг, <b>на който те няма</b>, единият изяжда другия и всичко започва отначало.</p>
    </div>
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="banks">
            <div class="bank" id="bank-left"><h5>тук</h5><div class="bank-items" id="bl"></div></div>
            <div class="bank boat-bank"><h5>в лодката <span id="boat-cap"></span></h5><div class="bank-items" id="bb"></div></div>
            <div class="bank" id="bank-right"><h5>отсреща</h5><div class="bank-items" id="br"></div></div>
          </div>
          <button class="btn btn-house" id="boat-go"><span>Отплавай</span></button>
          <div class="boat-info" id="boat-info"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Протокът се отваря…</div></div>
      </div>
      <p class="center muted stage-help">Кликни стъкленица, за да я качиш или свалиш. Лодката тръгва само с теб на кормилото.</p>
    </div>
    <div class="panel" id="boat-final" hidden>
      <p class="panel-title">Шестте на един рафт</p>
      <div class="mem-shelf" id="mem-shelf"></div>
      <p>Подредени в реда, в който са били отнети, шестте стъкленици казват една дума. Не е име и не е заклинание — а онова, което дименторите взимат и никога не могат да задържат.</p>
      ${answerBar('boat-in', 'думата', 'Изречи')}
    </div>`;

  draw(api); boot(api);
  $('#boat-go').addEventListener('click', () => sail(api));

  wireAnswer(root, 'boat-in', (v, input) => {
    if (api.solved) return;
    if (v === 'СПОМЕН') {
      api.sfx.unlock();
      api.fx.celebrate(1.4);
      api.solve('СПОМЕН. Шестте стъкленици светват едновременно и между тях остава да виси една руна.');
    } else {
      input.value = '';
      api.fail('Не. Прочети само първите букви, отгоре надолу.');
    }
  });

  if (d.ferried) openFinal(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } orbs = []; boatMesh = null; };
}

/* ---------- механика ---------- */
const onRight = (d, i) => !!(d.right >> i & 1);

function toggle(api, i) {
  const d = api.data;
  if (api.solved || d.ferried) return;
  const inBoat = d.load.includes(i);
  if (inBoat) { d.load = d.load.filter(x => x !== i); }
  else {
    if (onRight(d, i) !== (d.boat === 1)) { api.sfx.bad(); api.toast('Тази стъкленица е на другия бряг.', 'bad'); return; }
    if (d.load.length >= 2) { api.sfx.bad(); api.toast('Лодката носи най-много два спомена.', 'bad'); return; }
    d.load.push(i);
  }
  api.saveData(); api.sfx.tick(); draw(api); sync(api);
}

function sail(api) {
  const d = api.data;
  if (api.solved || d.ferried) return;
  // товарът минава на другия бряг
  d.load.forEach(i => { d.right ^= (1 << i); });
  d.boat = 1 - d.boat;
  d.load = [];
  d.trips++;
  api.sfx.whoosh();

  // брегът без теб
  const aloneMask = d.boat === 1 ? (~d.right & 63) : d.right;
  const clash = FORBIDDEN.find(([a, b]) => (aloneMask >> a & 1) && (aloneMask >> b & 1));
  if (clash) {
    api.saveData();
    api.sfx.roar();
    api.fx.shakeScreen(15, 700);
    api.fx.flash('rgba(40,20,60,.4)', 800);
    d.right = 0; d.boat = 0; d.load = []; d.trips = 0;
    api.saveData();
    api.fail(`«${MEM[clash[0]].t}» остана сам с «${MEM[clash[1]].t}». Когато се обръщаш, стъклениците са една. Започваш отначало.`, 45000);
    draw(api); sync(api);
    return;
  }
  api.saveData();
  draw(api); sync(api);

  if (d.right === 63 && d.boat === 1) {
    d.ferried = true; api.saveData();
    api.sfx.chime();
    api.fx.celebrate(1.2);
    setTimeout(() => openFinal(api), 500);
  }
}

/* ---------- рисуване ---------- */
function draw(api) {
  const d = api.data;
  const bl = $('#bl'), br = $('#br'), bb = $('#bb');
  if (!bl) return;
  const chip = (i) => `<button class="mem-chip" data-i="${i}" style="--mc:#${MEM[i].c.toString(16).padStart(6, '0')}">
    <b>${MEM[i].l}</b><span>${MEM[i].t}</span></button>`;
  const left = [], right = [], boatL = [];
  MEM.forEach((_, i) => {
    if (d.load.includes(i)) boatL.push(i);
    else if (onRight(d, i)) right.push(i);
    else left.push(i);
  });
  bl.innerHTML = left.map(chip).join('') || '<i class="bank-empty">празно</i>';
  br.innerHTML = right.map(chip).join('') || '<i class="bank-empty">празно</i>';
  bb.innerHTML = boatL.map(chip).join('') || '<i class="bank-empty">празно</i>';

  $$('.mem-chip').forEach(b => b.addEventListener('click', () => toggle(api, +b.dataset.i)));

  const bankL = $('#bank-left'), bankR = $('#bank-right');
  if (bankL) bankL.classList.toggle('here', d.boat === 0);
  if (bankR) bankR.classList.toggle('here', d.boat === 1);
  const cap = $('#boat-cap');
  if (cap) cap.textContent = `${d.load.length}/2`;
  const info = $('#boat-info');
  if (info) info.innerHTML = d.ferried
    ? '<b>И шестте са отсреща.</b>'
    : `курсове: <b>${d.trips}</b> · ти си <b>${d.boat === 0 ? 'тук' : 'отсреща'}</b>`;
  const go = $('#boat-go');
  if (go) go.disabled = !!d.ferried;
}

function openFinal(api) {
  const box = $('#boat-final'); if (!box) return;
  box.hidden = false;
  const shelf = $('#mem-shelf');
  if (shelf && !shelf.dataset.on) {
    shelf.dataset.on = '1';
    shelf.innerHTML = MEM.map((m, i) =>
      `<div class="ms-row" style="--mc:#${m.c.toString(16).padStart(6, '0')};--dl:${i * 160}ms">
         <b>${m.l}</b><span>${m.t}</span></div>`).join('');
  }
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...AZK_STAGE, ground: false, dist: 22, fov: 44, look: [0, 1.6, 0],
    theta: 0, phi: 0.88, minPolar: 0.28, maxPolar: 1.34,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за протока — бреговете вляво работят и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  addSea(stage, { radius: 34, y: -0.2, color: 0x0d2136 });
  addFrost(stage, { count: 60, radius: 14, height: 9 });

  const rock = stoneMat(T, 0x2c323c);
  const mkBank = (x) => {
    const g = new T.Group();
    const slab = new T.Mesh(new T.BoxGeometry(6, 1.2, 8), rock);
    slab.position.set(x, 0.4, 0);
    slab.receiveShadow = true;
    g.add(slab);
    for (let i = 0; i < 6; i++) {
      const b = new T.Mesh(new T.BoxGeometry(1.2, 0.5, 1.2), rock);
      b.position.set(x + (Math.sin(i * 2.3) * 2), 1.15, -3 + i * 1.2);
      g.add(b);
    }
    stage.add(g);
    return g;
  };
  mkBank(-7.5);
  mkBank(7.5);

  boatMesh = new T.Group();
  const hull = new T.Mesh(new T.CapsuleGeometry(0.7, 2.4, 6, 12),
    new T.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 0.9 }));
  hull.rotation.z = Math.PI / 2;
  hull.scale.set(1, 1, 0.6);
  hull.position.y = 0.35;
  const mast = new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 2.4, 8),
    new T.MeshStandardMaterial({ color: 0x2a2018, roughness: 1 }));
  mast.position.set(0, 1.5, 0);
  const lamp = new T.Mesh(new T.SphereGeometry(0.16, 12, 10),
    new T.MeshBasicMaterial({ color: 0xbfe0ff }));
  lamp.position.set(0, 2.6, 0);
  boatMesh.add(hull, mast, lamp);
  boatMesh.position.set(-4.2, 0, 0);
  stage.add(boatMesh);

  MEM.forEach((m, i) => {
    const g = new T.Group();
    const glass = new T.Mesh(new T.CylinderGeometry(0.2, 0.24, 0.55, 12),
      new T.MeshStandardMaterial({ color: m.c, roughness: 0.15, metalness: 0.15,
        transparent: true, opacity: 0.7, emissive: m.c, emissiveIntensity: 0.75 }));
    glass.position.y = 0.3;
    const halo = new T.Mesh(new T.SphereGeometry(0.5, 12, 10),
      new T.MeshBasicMaterial({ color: m.c, transparent: true, opacity: 0.14 }));
    halo.position.y = 0.3;
    g.add(glass, halo);
    g.userData = { pick: true, i };
    stage.add(g);
    orbs.push(g);
  });
  stage.setPickables(orbs);
  stage.onPick(o => { const i = o.userData && o.userData.i; if (i != null) toggle(api, i); });
  stage.onHover(o => { stage.dom.style.cursor = o && o.userData.i != null ? 'pointer' : 'grab'; });

  stage.onFrame((t) => {
    orbs.forEach((g, i) => {
      if (g.userData.to) g.position.lerp(g.userData.to, 0.12);
      g.position.y = (g.userData.to ? g.userData.to.y : 0) + Math.sin(t * 1.4 + i) * 0.09;
      g.rotation.y = t * 0.4 + i;
    });
    if (boatMesh && boatMesh.userData.to) {
      boatMesh.position.lerp(boatMesh.userData.to, 0.07);
      boatMesh.rotation.z = Math.sin(t * 1.1) * 0.035;
    }
  });

  sync(api);
}

function sync(api) {
  if (!stage || !orbs.length) return;
  const T = stage.THREE;
  const d = api.data;
  if (boatMesh) boatMesh.userData.to = new T.Vector3(d.boat === 0 ? -4.2 : 4.2, 0, 0);
  const left = [], right = [], inBoat = [];
  MEM.forEach((_, i) => {
    if (d.load.includes(i)) inBoat.push(i);
    else if (onRight(d, i)) right.push(i);
    else left.push(i);
  });
  left.forEach((i, k) => orbs[i].userData.to = new T.Vector3(-8.4 + (k % 2) * 1.7, 1.5, -2.4 + Math.floor(k / 2) * 1.7));
  right.forEach((i, k) => orbs[i].userData.to = new T.Vector3(6.7 + (k % 2) * 1.7, 1.5, -2.4 + Math.floor(k / 2) * 1.7));
  inBoat.forEach((i, k) => {
    const bx = d.boat === 0 ? -4.2 : 4.2;
    orbs[i].userData.to = new T.Vector3(bx, 1.0, -0.6 + k * 1.2);
  });
}
