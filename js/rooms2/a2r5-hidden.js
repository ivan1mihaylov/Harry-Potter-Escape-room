/* ============================================================
   ВТОРА ЧАСТ · ЗАЛА V — Стаята на скритите неща
   Хиляда години изгубени вещи. Пет от тях са ти нужни.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage } from '../three-stage.js';

export const meta = {
  id: 'a2-hidden',
  eyebrow: 'Зала V',
  title: 'Стаята на скритите неща',
  sub: 'Стаята се е отваряла за всеки, който е искал да скрие нещо — хиляда години подред. Купчината помни всичко. Тя просто не бърза да го показва.',
  rune: 'Д',
  grain: 3,
  bg: 'off',
  tint: '#d9a05b',
  hints: [
    'Обиколи купчината — почти всеки от петте предмета се вижда само от една посока. Колелцето на мишката приближава.',
    'Диадемата е тънък обръч с камък. Шкафът е висок и тесен. Метлата има дръжка и метличка. Яйцето е златно и гладко. Часовникът е стъклен и счупен.',
    'Ако не намираш нещо: диадемата е ниско вдясно, шкафът стърчи отзад, метлата лежи наклонена отпред-вляво, яйцето е почти на върха, а часовникът е паднал най-отдолу вляво.',
  ],
};

const FINDS = [
  { id: 'diadem', name: 'Диадемата на Ровена',
    riddle: 'Вещта, която Ровена изгуби заради собствената си дъщеря — и която Тъмният лорд превърна в част от себе си.' },
  { id: 'cabinet', name: 'Изчезващият шкаф',
    riddle: 'Има си близнак в „Боргин и Бъркс“. Едно момче го поправя цяла година, за да пусне вътре смъртта.' },
  { id: 'broom', name: 'Светкавицата',
    riddle: 'Коледен подарък без картичка. Макгонагъл го взе за проверка, а Хари не спа цяла седмица.' },
  { id: 'egg', name: 'Златното яйце',
    riddle: 'Пищи, ако го отвориш на въздух. Пее, ако го отвориш под вода.' },
  { id: 'glass', name: 'Счупеният пясъчен часовник',
    riddle: 'Не е изгубено — оставено е. Основателите го счупиха, за да задържат часовете на място.' },
];

let stage = null, objs = {};

export function mount(root, api) {
  const d = api.data;
  if (!d.found) d.found = [];
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Списък, надраскан набързо</h4>
            <div id="riddle-now"></div>
          </div>
          <div class="find-list" id="find-list"></div>
          <p class="muted" style="font-size:.86rem">Търси по <b>формата</b>, не по цвета. Купчината лъже с цветове.</p>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Купчината се разгръща…</div></div>
      </div>
    </div>`;

  renderList(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } objs = {}; };
}

function renderList(api) {
  const d = api.data;
  const next = FINDS.find(f => !d.found.includes(f.id));
  const r = $('#riddle-now');
  if (r) r.innerHTML = next
    ? `<p><b>Търси сега:</b></p><p style="font-size:1.02rem">„${next.riddle}“</p>`
    : `<p>Петте вещи са в ръцете ти. Купчината се затвори.</p>`;
  const l = $('#find-list');
  if (l) l.innerHTML = FINDS.map(f => `
    <div class="find ${d.found.includes(f.id) ? 'done' : f === next ? 'active' : ''}">
      <span class="find-dot"></span>
      <span>${d.found.includes(f.id) ? f.name : '· · ·'}</span>
    </div>`).join('');
}

function pick(api, id) {
  if (api.solved) return;
  const d = api.data;
  const next = FINDS.find(f => !d.found.includes(f.id));
  if (!next) return;
  if (id === next.id) {
    d.found.push(id); api.saveData();
    api.sfx.chime();
    const o = objs[id];
    if (o) o.found = true;
    api.fx.sparksFrom($('#stage'), { count: 22, color: '#ffd98a', spread: 150 });
    api.toast(`Намери: <b>${next.name}</b>.`, 'ok');
    renderList(api);
    if (d.found.length === FINDS.length) {
      api.sfx.unlock();
      api.fx.flash('rgba(230,180,90,.24)', 800);
      setTimeout(() => api.solve('Купчината се слята обратно и оставя в дланта ти руна и зърно пясък.'), 800);
    }
  } else if (FINDS.some(f => f.id === id)) {
    api.sfx.bad();
    api.toast('Това е една от петте вещи — но не тази, която търсиш сега. Редът има значение.', 'bad');
  } else {
    api.sfx.bad();
    api.fail('Просто боклук от хиляда години. Ровиш се напразно.', 15000);
  }
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    dist: 21, fov: 44, look: [0, 2.6, 0], theta: 0.5, phi: 1.02,
    minPolar: 0.22, maxPolar: 1.46, ground: true, groundColor: 0x120f14, groundTex: 'cobble-floor', groundRepeat: 16,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL, за да се покаже купчината.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  const picks = [];
  JUNK_MATS = [0x4a4438, 0x3c3a44, 0x55483a, 0x3a4a44, 0x4e3f4a, 0x2f3a48, 0x5a5040]
    .map(c => new T.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0.08 }));

  /* Купчината вече не е от голи призми: всяка вещ е сглобена от няколко
     части и прилича на нещо. Между тях стоят и примамки — втора метла,
     втора диадема, второ яйце — за да има какво да се търси наистина.  */
  const JUNK = [junkChair, junkBooks, junkBottle, junkCandle, junkCauldron,
                junkCrate, junkFrame, junkJar, junkStool, junkScroll,
                decoyBroom, decoyTiara, decoyEgg, decoyCabinet];

  const targets = {
    diadem: { pos: [4.6, 1.3, 2.4], build: buildDiadem },
    cabinet: { pos: [-2.2, 2.6, -5.4], build: buildCabinet },
    broom: { pos: [-4.9, 1.0, 3.6], build: buildBroom },
    egg: { pos: [0.7, 5.9, -0.4], build: buildEgg },
    glass: { pos: [-5.6, 0.7, -1.4], build: buildGlass },
  };
  const clear = Object.values(targets).map(t => t.pos);
  const tooClose = (x, y, z) => clear.some(c =>
    Math.hypot(c[0] - x, (c[1] - y) * 0.65, c[2] - z) < 2.4);

  for (let i = 0; i < 92; i++) {
    const make = JUNK[Math.floor(rnd(i * 3) * JUNK.length)];
    const a = rnd(i * 11) * Math.PI * 2;
    const rad = Math.pow(rnd(i * 13 + 2), 0.55) * 7.2;
    const hMax = Math.max(0.4, 6.4 * (1 - rad / 7.6));
    const px = Math.sin(a) * rad, py = rnd(i * 17 + 3) * hMax + 0.3, pz = Math.cos(a) * rad;
    if (tooClose(px, py, pz)) continue;   // около петте вещи оставяме въздух
    const g = make(T, i);
    g.position.set(px, py, pz);
    g.rotation.set((rnd(i * 19) - 0.5) * 1.6, rnd(i * 23) * 6, (rnd(i * 29) - 0.5) * 1.6);
    g.scale.setScalar(0.62 + rnd(i * 31) * 0.5);
    g.traverse(c => { c.castShadow = true; c.receiveShadow = true; });
    g.userData = { pick: true, id: 'junk' };
    stage.add(g);
    picks.push(g);
  }

  Object.entries(targets).forEach(([id, t]) => {
    const g = t.build(T);
    g.position.set(...t.pos);
    g.userData = { pick: true, id };
    g.traverse(c => { c.userData.pick = c.userData.pick || false; c.castShadow = true; });
    stage.add(g);
    picks.push(g);
    objs[id] = { group: g, found: api.data.found.includes(id) };
  });

  stage.setPickables(picks);
  stage.onPick((obj) => {
    let n = obj;
    while (n && !(n.userData && n.userData.id) && n.parent) n = n.parent;
    if (n && n.userData && n.userData.id) pick(api, n.userData.id);
  });
  stage.onHover((obj) => { stage.dom.style.cursor = obj ? 'pointer' : 'grab'; });

  stage.onFrame((t) => {
    Object.values(objs).forEach((o, i) => {
      if (!o.found) return;
      o.group.rotation.y += 0.006;
      o.group.position.y += Math.sin(t * 2 + i) * 0.004;
    });
  });
}


/* ============================================================
   Купчината: всяка вещ е сглобена от няколко части, за да прилича
   на нещо. Между тях има и примамки, много близки до търсеното.
   ============================================================ */
let JUNK_MATS = [];
const jm = i => JUNK_MATS[Math.floor(rnd(i * 5.7) * JUNK_MATS.length)] || JUNK_MATS[0];
const wood = (T, c = 0x5a4530) => new T.MeshStandardMaterial({ color: c, roughness: 0.9 });
const metal = (T, c = 0x6a6a72) => new T.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.6 });
const glassy = (T, c = 0x7aa8b8) => new T.MeshStandardMaterial({ color: c, roughness: 0.2,
  metalness: 0.1, transparent: true, opacity: 0.55 });

function part(T, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new T.Mesh(geo, mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  return m;
}

function junkChair(T, i) {
  const g = new T.Group(); const w = wood(T, 0x4d3a26);
  g.add(part(T, new T.BoxGeometry(1.1, 0.12, 1.1), w, 0, 0, 0));
  [[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]].forEach(([x, z]) =>
    g.add(part(T, new T.BoxGeometry(0.11, 0.9, 0.11), w, x, -0.5, z)));
  g.add(part(T, new T.BoxGeometry(1.1, 0.9, 0.1), w, 0, 0.5, -0.5));
  g.add(part(T, new T.BoxGeometry(0.9, 0.1, 0.1), w, 0, 0.72, -0.44));
  return g;
}
function junkBooks(T, i) {
  const g = new T.Group();
  for (let k = 0; k < 3 + Math.floor(rnd(i) * 3); k++) {
    const c = [0x6a2a2a, 0x2a4a6a, 0x4a5a2a, 0x5a3a5a][k % 4];
    g.add(part(T, new T.BoxGeometry(0.95 - k * 0.05, 0.16, 0.7),
      new T.MeshStandardMaterial({ color: c, roughness: 0.92 }),
      (rnd(i + k) - 0.5) * 0.14, k * 0.17, (rnd(i + k * 3) - 0.5) * 0.12, 0, rnd(i + k * 7) * 0.4));
  }
  return g;
}
function junkBottle(T, i) {
  const g = new T.Group(); const gl = glassy(T, [0x6a8f5a, 0x8a6a4a, 0x5a6a8f][i % 3]);
  g.add(part(T, new T.CylinderGeometry(0.3, 0.34, 0.75, 12), gl, 0, 0, 0));
  g.add(part(T, new T.CylinderGeometry(0.11, 0.22, 0.4, 10), gl, 0, 0.56, 0));
  g.add(part(T, new T.CylinderGeometry(0.12, 0.12, 0.12, 8), wood(T, 0x8a6a3a), 0, 0.8, 0));
  return g;
}
function junkCandle(T, i) {
  const g = new T.Group(); const br = metal(T, 0x8a7038);
  g.add(part(T, new T.CylinderGeometry(0.34, 0.42, 0.1, 14), br, 0, 0, 0));
  g.add(part(T, new T.CylinderGeometry(0.07, 0.09, 0.7, 10), br, 0, 0.4, 0));
  g.add(part(T, new T.CylinderGeometry(0.2, 0.18, 0.06, 12), br, 0, 0.76, 0));
  g.add(part(T, new T.CylinderGeometry(0.1, 0.11, 0.5, 10),
    new T.MeshStandardMaterial({ color: 0xe6dcc0, roughness: 0.85 }), 0, 1.04, 0));
  return g;
}
function junkCauldron(T, i) {
  const g = new T.Group(); const m = metal(T, 0x3a3a40);
  g.add(part(T, new T.SphereGeometry(0.55, 14, 10, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.58), m, 0, 0, 0));
  g.add(part(T, new T.TorusGeometry(0.52, 0.06, 8, 20), m, 0, 0.2, 0, Math.PI / 2));
  [0, 2.1, 4.2].forEach(a =>
    g.add(part(T, new T.CylinderGeometry(0.05, 0.05, 0.3, 6), m,
      Math.sin(a) * 0.34, -0.44, Math.cos(a) * 0.34)));
  return g;
}
function junkCrate(T, i) {
  const g = new T.Group(); const w = wood(T, 0x63492c);
  g.add(part(T, new T.BoxGeometry(1.1, 0.85, 0.9), w));
  g.add(part(T, new T.BoxGeometry(1.16, 0.07, 0.96), wood(T, 0x3a2a18), 0, 0.28, 0));
  g.add(part(T, new T.BoxGeometry(1.16, 0.07, 0.96), wood(T, 0x3a2a18), 0, -0.28, 0));
  return g;
}
function junkFrame(T, i) {
  const g = new T.Group(); const w = wood(T, 0x7a5a2a);
  const W = 1.1, H = 0.85, t = 0.09;
  g.add(part(T, new T.BoxGeometry(W, t, 0.08), w, 0, H / 2, 0));
  g.add(part(T, new T.BoxGeometry(W, t, 0.08), w, 0, -H / 2, 0));
  g.add(part(T, new T.BoxGeometry(t, H, 0.08), w, -W / 2, 0, 0));
  g.add(part(T, new T.BoxGeometry(t, H, 0.08), w, W / 2, 0, 0));
  g.add(part(T, new T.BoxGeometry(W - t, H - t, 0.02),
    new T.MeshStandardMaterial({ color: 0x1a1a22, roughness: 1 })));
  return g;
}
function junkJar(T, i) {
  const g = new T.Group(); const gl = glassy(T, 0x9ab0a8);
  g.add(part(T, new T.CylinderGeometry(0.32, 0.32, 0.6, 14), gl));
  g.add(part(T, new T.CylinderGeometry(0.34, 0.34, 0.09, 14), metal(T, 0x7a7a68), 0, 0.34, 0));
  return g;
}
function junkStool(T, i) {
  const g = new T.Group(); const w = wood(T, 0x55402a);
  g.add(part(T, new T.CylinderGeometry(0.46, 0.46, 0.11, 14), w));
  [0, 2.1, 4.2].forEach(a =>
    g.add(part(T, new T.CylinderGeometry(0.07, 0.05, 0.75, 7), w,
      Math.sin(a) * 0.3, -0.42, Math.cos(a) * 0.3, 0.12, 0, 0.12)));
  return g;
}
function junkScroll(T, i) {
  const g = new T.Group();
  const pm = new T.MeshStandardMaterial({ color: 0xc9b88a, roughness: 0.95 });
  g.add(part(T, new T.CylinderGeometry(0.13, 0.13, 1.0, 12), pm, 0, 0, 0, 0, 0, Math.PI / 2));
  g.add(part(T, new T.CylinderGeometry(0.06, 0.06, 1.16, 8), wood(T, 0x6a4a28), 0, 0, 0, 0, 0, Math.PI / 2));
  return g;
}

/* --- примамките: приличат на търсеното, но не са то --- */
function decoyBroom(T, i) {
  const g = new T.Group(); const w = wood(T, 0x4a3a24);
  g.add(part(T, new T.CylinderGeometry(0.07, 0.08, 2.6, 8), w, 0, 0, 0, 0, 0, Math.PI / 2));
  g.add(part(T, new T.ConeGeometry(0.3, 1.0, 9),
    new T.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 1 }), 1.6, 0, 0, 0, 0, -Math.PI / 2));
  return g;
}
function decoyTiara(T, i) {
  const g = new T.Group(); const m = metal(T, 0x9a8a5a);
  g.add(part(T, new T.TorusGeometry(0.5, 0.045, 8, 26, Math.PI * 1.2), m, 0, 0, 0, Math.PI / 2));
  g.add(part(T, new T.ConeGeometry(0.07, 0.22, 6), m, 0, 0.5, 0));
  return g;
}
function decoyEgg(T, i) {
  const g = new T.Group();
  const e = part(T, new T.SphereGeometry(0.42, 14, 11),
    new T.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.7, metalness: 0.2 }));
  e.scale.set(1, 1.32, 1);
  g.add(e);
  return g;
}
function decoyCabinet(T, i) {
  const g = new T.Group(); const w = wood(T, 0x46331f);
  g.add(part(T, new T.BoxGeometry(0.9, 2.0, 0.7), w));
  g.add(part(T, new T.BoxGeometry(1.02, 0.16, 0.8), w, 0, 1.06, 0));
  g.add(part(T, new T.BoxGeometry(0.38, 1.6, 0.05),
    new T.MeshStandardMaterial({ color: 0x2e2114, roughness: 0.9 }), -0.2, -0.05, 0.36));
  return g;
}

/* ---------- предметите ---------- */
function buildDiadem(T) {
  const g = new T.Group();
  const mat = new T.MeshStandardMaterial({ color: 0xd8dce4, roughness: 0.22, metalness: 0.95 });
  const band = new T.Mesh(new T.TorusGeometry(0.85, 0.07, 10, 40, Math.PI * 1.35), mat);
  band.rotation.x = Math.PI / 2; band.rotation.z = 0.4;
  const gem = new T.Mesh(new T.OctahedronGeometry(0.26, 0),
    new T.MeshStandardMaterial({ color: 0x3f6fd8, roughness: 0.1, metalness: 0.4, emissive: 0x1a2f66, emissiveIntensity: 0.7 }));
  gem.position.set(0, 0.22, 0.85);
  const w1 = new T.Mesh(new T.ConeGeometry(0.08, 0.4, 6), mat); w1.position.set(-0.4, 0.16, 0.72);
  const w2 = new T.Mesh(new T.ConeGeometry(0.08, 0.4, 6), mat); w2.position.set(0.4, 0.16, 0.72);
  g.add(band, gem, w1, w2);
  g.rotation.z = 0.25;
  return g;
}

function buildCabinet(T) {
  const g = new T.Group();
  const wood = new T.MeshStandardMaterial({ color: 0x4a3324, roughness: 0.7, metalness: 0.1 });
  const body = new T.Mesh(new T.BoxGeometry(1.5, 4.2, 1.1), wood);
  const top = new T.Mesh(new T.BoxGeometry(1.75, 0.3, 1.3), wood); top.position.y = 2.2;
  const door = new T.Mesh(new T.BoxGeometry(0.66, 3.4, 0.08),
    new T.MeshStandardMaterial({ color: 0x33231a, roughness: 0.6 }));
  door.position.set(-0.36, 0.1, 0.57);
  const door2 = door.clone(); door2.position.x = 0.36;
  const knob = new T.Mesh(new T.SphereGeometry(0.09, 8, 8),
    new T.MeshStandardMaterial({ color: 0xd9b45b, metalness: 0.9, roughness: 0.25 }));
  knob.position.set(0.03, 0.1, 0.64);
  g.add(body, top, door, door2, knob);
  g.rotation.z = 0.09;
  return g;
}

function buildBroom(T) {
  const g = new T.Group();
  const handle = new T.Mesh(new T.CylinderGeometry(0.09, 0.11, 4.2, 10),
    new T.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.5, metalness: 0.15 }));
  handle.rotation.z = Math.PI / 2;
  const brush = new T.Mesh(new T.ConeGeometry(0.42, 1.5, 12),
    new T.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.95 }));
  brush.rotation.z = -Math.PI / 2; brush.position.x = -2.6;
  const band = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.3, 10),
    new T.MeshStandardMaterial({ color: 0xd9b45b, metalness: 0.85, roughness: 0.3 }));
  band.rotation.z = Math.PI / 2; band.position.x = -1.9;
  g.add(handle, brush, band);
  g.rotation.y = 0.5; g.rotation.z = 0.16;
  return g;
}

function buildEgg(T) {
  const g = new T.Group();
  const mat = new T.MeshStandardMaterial({ color: 0xe8c65a, roughness: 0.18, metalness: 0.95, emissive: 0x6a4c10, emissiveIntensity: 0.35 });
  const egg = new T.Mesh(new T.SphereGeometry(0.72, 20, 16), mat);
  egg.scale.set(1, 1.35, 1);
  for (let i = 0; i < 8; i++) {
    const rib = new T.Mesh(new T.TorusGeometry(0.72, 0.035, 6, 24, Math.PI), mat);
    rib.rotation.y = (i / 8) * Math.PI;
    rib.rotation.x = Math.PI / 2;
    rib.scale.set(1, 1.35, 1);
    g.add(rib);
  }
  const stand = new T.Mesh(new T.CylinderGeometry(0.5, 0.62, 0.24, 12),
    new T.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.8, roughness: 0.4 }));
  stand.position.y = -1.05;
  g.add(egg, stand);
  return g;
}

function buildGlass(T) {
  const g = new T.Group();
  const glass = new T.MeshStandardMaterial({
    color: 0xbfe0ea, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.55,
  });
  const wood = new T.MeshStandardMaterial({ color: 0x7a5a2a, roughness: 0.55, metalness: 0.4 });
  const top = new T.Mesh(new T.ConeGeometry(0.6, 0.85, 14), glass); top.position.y = 0.55;
  const bot = new T.Mesh(new T.ConeGeometry(0.6, 0.85, 14), glass); bot.position.y = -0.55; bot.rotation.x = Math.PI;
  const capT = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.16, 14), wood); capT.position.y = 1.02;
  const capB = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.16, 14), wood); capB.position.y = -1.02;
  const sand = new T.Mesh(new T.ConeGeometry(0.5, 0.5, 12),
    new T.MeshStandardMaterial({ color: 0xe0c07a, roughness: 0.9 }));
  sand.position.y = -0.72; sand.rotation.x = Math.PI;
  const crack = new T.Mesh(new T.BoxGeometry(0.06, 0.9, 0.06),
    new T.MeshBasicMaterial({ color: 0x1b1620 }));
  crack.position.set(0.42, 0.35, 0.28); crack.rotation.z = 0.5;
  g.add(top, bot, capT, capB, sand, crack);
  g.rotation.z = 1.15;
  return g;
}

function rnd(i) {
  const x = Math.sin(i * 91.7 + 47.3) * 43758.5453;
  return x - Math.floor(x);
}
