/* ============================================================
   ПЕТА ЧАСТ · КАМЕРА IV — Часовата зала
   Три пръстена със зъбци 4, 5 и 7. Ключът движи и трите
   наведнъж. Кога и трите ще застанат на нулата?
   ============================================================ */
import { head, $, $$, answerBar, wireAnswer } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';
import { MYSTERY_STAGE, addBlueFlames, addDust, addMysteryLight } from './common5.js';

export const meta = {
  id: 'a5-time',
  eyebrow: 'Камера IV',
  title: 'Часовата зала',
  sub: 'Под стъкления похлупак колибри се излюпва и умира в кръг. Три пръстена го държат в този кръг — и се движат само заедно.',
  rune: 'Е',
  bg: 'off',
  tint: '#c8a86a',
  hints: [
    'Един завой на ключа мести <b>и трите</b> пръстена с едно деление напред. Търсиш броя завои, след който и трите сочат нула.',
    'Пясъчният има 4 деления и стои на 3 — значи му трябват 1, 5, 9, 13… завоя. Направи същия списък за другите два и намери първото общо число.',
    'Условията са: n ≡ 1 (mod 4), n ≡ 4 (mod 5) и n ≡ 1 (mod 7). Първото такова число е <b>29</b>.',
  ],
};

/* проверено: в цикъл от 140 завоя има точно едно решение — 29 */
const RINGS = [
  { name: 'пясъчният', period: 4, start: 3, color: 0xd8c07a },
  { name: 'сребърният', period: 5, start: 1, color: 0xc8d4e0 },
  { name: 'медният',   period: 7, start: 6, color: 0xc98a5a },
];
const ANSWER = 29;

let stage = null, ringMeshes = [], bird = null;

export function mount(root, api) {
  const d = api.data;
  if (d.turns == null) d.turns = 0;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Гравирано по похлупака</h4>
            <p>«Един завой мести и трите. Спре ли времето, и трите сочат нула — и колибрито
            остава на едно място.»</p>
          </div>
          <div class="rings-read" id="rings-read"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-ghost btn-sm" id="tr-one"><span>Един завой</span></button>
            <button class="btn btn-ghost btn-sm" id="tr-reset"><span>Върни в начало</span></button>
          </div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Пръстените се събуждат…</div></div>
      </div>
      <p class="center muted stage-help">Пробвай със завои — или пресметни направо колко трябват.</p>
    </div>

    <div class="panel">
      <p class="panel-title">Колко завоя</p>
      <p class="muted">Механизмът приема числото направо. Ако е вярно, пръстените се завъртат сами.</p>
      ${answerBar('time-n', 'брой завои', 'Завърти')}
    </div>`;

  drawRings(api);
  $('#tr-one').addEventListener('click', () => {
    if (api.solved) return;
    api.data.turns++; api.saveData(); api.sfx.tick();
    drawRings(api); sync(); testDone(api, false);
  });
  $('#tr-reset').addEventListener('click', () => {
    if (api.solved) return;
    api.data.turns = 0; api.saveData(); api.sfx.click();
    drawRings(api); sync();
  });

  wireAnswer(root, 'time-n', (v, input) => {
    if (api.solved) return;
    const n = parseInt(v, 10);
    if (!(n >= 0)) { input.value = ''; api.fail('Механизмът иска число.'); return; }
    api.data.turns = n; api.saveData();
    drawRings(api); sync();
    if (!testDone(api, true)) {
      input.value = '';
      api.fail(`След ${n} завоя пръстените сочат ${RINGS.map(r => (r.start + n) % r.period).join(' · ')}.`);
    }
  });

  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } ringMeshes = []; bird = null; };
}

const readingAt = (r, turns) => (r.start + turns) % r.period;

function testDone(api, loud) {
  const n = api.data.turns;
  const done = RINGS.every(r => readingAt(r, n) === 0);
  if (!done) return false;
  api.sfx.unlock();
  api.fx.flash('rgba(230,200,140,.24)', 800);
  api.fx.celebrate(1.5);
  if (bird) bird.userData.frozen = true;
  setTimeout(() => api.solve('Колибрито застива с разперени криле — нито излюпено, нито мъртво. Под похлупака, върху пясъка, лежи руна.'), 700);
  return true;
}

function drawRings(api) {
  const box = $('#rings-read'); if (!box) return;
  const n = api.data.turns;
  box.innerHTML = `
    <div class="rr-turns">завои: <b>${n}</b></div>
    ${RINGS.map(r => {
      const v = readingAt(r, n);
      return `<div class="rr-row${v === 0 ? ' zero' : ''}">
        <span class="rr-name">${r.name}</span>
        <span class="rr-dots">${Array.from({ length: r.period }, (_, i) =>
          `<i class="${i === v ? 'on' : ''}${i === 0 ? ' mark' : ''}"></i>`).join('')}</span>
        <b class="rr-val">${v}</b>
      </div>`;
    }).join('')}`;
}

/* ---------- 3D ---------- */
function sync() {
  if (!stage || !ringMeshes.length) return;
  const n = stage.__turns != null ? stage.__turns() : 0;
  /* въртим натрупано, за да не подскача пръстенът назад при всяко превъртане;
     ъгълът пак спира с деление (start+n) mod period срещу показалеца */
  ringMeshes.forEach((m, i) => {
    const r = RINGS[i];
    m.userData.target = -((r.start + n) / r.period) * Math.PI * 2;
  });
}

async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...MYSTERY_STAGE, ground: false, dist: 9.5, fov: 44, look: [0, 2, 0],
    theta: 0.2, phi: 1.0, minPolar: 0.3, maxPolar: 1.4,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за пръстените — таблото вляво работи и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  addMysteryLight(stage);
  stage.__turns = () => api.data.turns;
  const T = stage.THREE;

  /* стъкленият похлупак */
  const jar = new T.Mesh(new T.CylinderGeometry(2.5, 2.5, 4.6, 32, 1, true),
    new T.MeshStandardMaterial({ color: 0xbfd8ff, roughness: 0.05, metalness: 0.1,
      transparent: true, opacity: 0.14, side: T.DoubleSide }));
  jar.position.y = 2.4;
  stage.add(jar);
  const cap = new T.Mesh(new T.SphereGeometry(2.5, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    jar.material);
  cap.position.y = 4.7;
  stage.add(cap);
  const base = new T.Mesh(new T.CylinderGeometry(2.9, 3.1, 0.4, 32),
    new T.MeshStandardMaterial({ color: 0x584a78, roughness: 0.4, metalness: 0.5,
      emissive: 0x241c48, emissiveIntensity: 0.5 }));
  base.position.y = 0.2;
  stage.add(base);

  /* трите пръстена */
  RINGS.forEach((r, i) => {
    const g = new T.Group();
    const radius = 1.4 + i * 0.55;
    const band = new T.Mesh(new T.TorusGeometry(radius, 0.07, 8, 48),
      new T.MeshStandardMaterial({ color: r.color, roughness: 0.25, metalness: 0.85,
        emissive: r.color, emissiveIntensity: 0.16 }));
    band.rotation.x = Math.PI / 2;
    g.add(band);
    for (let k = 0; k < r.period; k++) {
      const a = (k / r.period) * Math.PI * 2;
      const tex = labelTexture(T, String(k), { size: 128, color: '#f4ead0' });
      const tag = new T.Mesh(new T.PlaneGeometry(0.42, 0.42),
        new T.MeshBasicMaterial({ map: tex, transparent: true }));
      tag.position.set(Math.sin(a) * radius, 0.16, Math.cos(a) * radius);
      tag.rotation.x = -Math.PI / 2;
      tag.rotation.z = -a;
      g.add(tag);
      if (k === 0) {
        const notch = new T.Mesh(new T.BoxGeometry(0.1, 0.28, 0.1),
          new T.MeshStandardMaterial({ color: 0xffe6a8, emissive: 0xffc040,
            emissiveIntensity: 0.7 }));
        notch.position.set(Math.sin(a) * radius, 0.2, Math.cos(a) * radius);
        g.add(notch);
      }
    }
    g.position.y = 0.5 + i * 0.05;
    g.userData.target = 0;
    stage.add(g);
    ringMeshes.push(g);
  });

  /* показалецът, срещу който се чете */
  const pointer = new T.Mesh(new T.ConeGeometry(0.14, 0.42, 6),
    new T.MeshStandardMaterial({ color: 0xffd88a, emissive: 0xff9c30, emissiveIntensity: 0.6 }));
  pointer.rotation.x = Math.PI;
  pointer.position.set(0, 0.95, 3.05);
  stage.add(pointer);

  /* колибрито */
  bird = new T.Group();
  const bodyB = new T.Mesh(new T.SphereGeometry(0.16, 12, 10),
    new T.MeshStandardMaterial({ color: 0x4fd6a8, emissive: 0x1c6b52, emissiveIntensity: 0.5 }));
  bodyB.scale.set(1, 0.8, 1.5);
  const beak = new T.Mesh(new T.ConeGeometry(0.03, 0.22, 6),
    new T.MeshStandardMaterial({ color: 0x2a2438 }));
  beak.rotation.x = Math.PI / 2;
  beak.position.z = 0.3;
  const wings = [];
  [-1, 1].forEach(s => {
    const w = new T.Mesh(new T.PlaneGeometry(0.42, 0.14),
      new T.MeshStandardMaterial({ color: 0x7ff0c8, transparent: true, opacity: 0.6,
        side: T.DoubleSide }));
    w.position.set(s * 0.2, 0.04, 0);
    bird.add(w);
    wings.push(w);
  });
  bird.add(bodyB, beak);
  bird.position.set(0, 2.9, 0);
  stage.add(bird);

  addBlueFlames(stage, { count: 8, r: 5.4, h: 4.2 });
  addDust(stage, { count: 50, radius: 4, height: 5 });

  stage.onFrame(t => {
    ringMeshes.forEach(g => {
      const tg = g.userData.target || 0;
      let cur = g.rotation.y;
      g.rotation.y = cur + (tg - cur) * 0.12;
    });
    if (bird) {
      const frozen = bird.userData.frozen;
      wings.forEach((w, i) => { w.rotation.z = frozen ? (i ? 0.5 : -0.5) : Math.sin(t * 22) * 0.9 * (i ? 1 : -1); });
      bird.position.y = 2.9 + (frozen ? 0 : Math.sin(t * 1.6) * 0.35);
      bird.rotation.y = frozen ? 0 : t * 0.5;
    }
  });

  sync();
}
