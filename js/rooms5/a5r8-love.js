/* ============================================================
   ПЕТА ЧАСТ · КАМЕРА VIII — Залата на любовта
   Единствената врата в Отдела, която е винаги заключена.
   Няма ключалка — има деветгласен хор и едно число.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';
import { MYSTERY_STAGE, addDust, addMysteryLight } from './common5.js';

export const meta = {
  id: 'a5-love',
  eyebrow: 'Камера VIII',
  title: 'Залата на любовта',
  sub: 'Врата без ключалка и без дръжка. Зад нея нещо тупти по-силно от всичко в този отдел. Пред нея девет кристала пеят, всеки на своя височина.',
  rune: 'О',
  bg: 'off',
  tint: '#e08fa8',
  hints: [
    'Вратата не иска сила, а <b>точен сбор</b>. Запей само с част от кристалите — сборът на техните числа трябва да е точно резонансът.',
    'Не се мъчи с всичките девет: подходящите са <b>малко</b> на брой. Започни от най-едрите числа и виж кои изобщо се събират под резонанса.',
    'Има само един такъв набор и той е от <b>три</b> гласа: <b>3 + 20 + 23 = 46</b>.',
  ],
};

/* проверено с изчерпателно търсене: 46 се получава от точно едно
   подмножество на тези девет числа                                */
const VOICES = [24, 3, 20, 36, 35, 12, 23, 27, 17];
const RESONANCE = 46;
const NAMES = ['първият', 'вторият', 'третият', 'четвъртият', 'петият',
               'шестият', 'седмият', 'осмият', 'деветият'];

let stage = null, crystals = [], door = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.on) d.on = [];
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel">
      <p class="panel-title">Изсечено в камъка над вратата</p>
      <blockquote class="doors-rule">«Тази стая се отваря само на онзи, който донесе точно
      толкова, колкото трябва. Нито глас по-малко, нито глас повече.»</blockquote>
      <div class="resonance">резонанс на вратата · <b>${RESONANCE}</b></div>
    </div>

    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="voices" id="voices"></div>
          <div class="voice-sum" id="voice-sum"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-house btn-sm" id="lv-go"><span>Запей</span></button>
            <button class="btn btn-ghost btn-sm" id="lv-clear"><span>Замълчи</span></button>
          </div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Кристалите се събуждат…</div></div>
      </div>
      <p class="center muted stage-help">Кликни кристал, за да го включиш в хора.</p>
    </div>`;

  draw(api);
  $('#lv-go').addEventListener('click', () => check(api));
  $('#lv-clear').addEventListener('click', () => {
    if (api.solved) return;
    api.data.on = []; api.saveData(); api.sfx.click(); draw(api); sync();
  });

  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } crystals = []; door = null; };
}

const sumOf = on => on.reduce((a, i) => a + VOICES[i], 0);

function toggle(api, i) {
  if (api.solved) return;
  const d = api.data;
  d.on = d.on.includes(i) ? d.on.filter(x => x !== i) : [...d.on, i];
  api.saveData(); api.sfx.tick();
  draw(api); sync();
}

function check(api) {
  const d = api.data;
  const s = sumOf(d.on);
  if (!d.on.length) { api.sfx.bad(); api.toast('Никой не пее.', 'bad'); return; }
  if (s !== RESONANCE) {
    api.sfx.bad();
    api.fx.shakeScreen(8, 350);
    api.fail(`Хорът звучи на ${s}, а вратата иска ${RESONANCE}.`);
    return;
  }
  api.sfx.unlock();
  api.fx.flash('rgba(240,160,190,.26)', 900);
  api.fx.celebrate(1.6);
  if (door) door.userData.open = true;
  setTimeout(() => api.solve('Вратата се открехва на един пръст и оттам излиза светлина, топла като длан. Не влизаш. На прага, оставена сякаш нарочно, лежи руна.'), 800);
}

function draw(api) {
  const d = api.data;
  const box = $('#voices'); if (!box) return;
  box.innerHTML = VOICES.map((v, i) => `
    <button class="voice${d.on.includes(i) ? ' on' : ''}" data-i="${i}">
      <b>${v}</b><span>${NAMES[i]}</span></button>`).join('');
  $$('.voice', box).forEach(b => b.addEventListener('click', () => toggle(api, +b.dataset.i)));

  const s = sumOf(d.on);
  const el = $('#voice-sum');
  if (el) el.innerHTML = api.solved
    ? '<b>Вратата се открехна.</b>'
    : `сборът пее <b class="${s === RESONANCE ? 'good' : s > RESONANCE ? 'over' : ''}">${s}</b> от ${RESONANCE}
       · гласове: <b>${d.on.length}</b>`;
}

/* ---------- 3D ---------- */
function sync() {
  if (!stage || !crystals.length) return;
  const on = stage.__on ? stage.__on() : [];
  crystals.forEach((c, i) => { c.userData.lit = on.includes(i); });
}

async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...MYSTERY_STAGE, ground: true, groundColor: 0x14101f, dist: 11, fov: 44,
    look: [0, 1.6, 0], theta: 0, phi: 1.14, minPolar: 0.4, maxPolar: 1.42,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за залата — гласовете вляво работят и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  addMysteryLight(stage);
  stage.__on = () => api.data.on;
  const T = stage.THREE;

  /* вратата без ключалка */
  door = new T.Group();
  const leaf = new T.Mesh(new T.BoxGeometry(2.6, 4.4, 0.22),
    new T.MeshStandardMaterial({ color: 0x5a3f52, roughness: 0.5, metalness: 0.3,
      emissive: 0x2c1a28, emissiveIntensity: 0.5 }));
  leaf.position.y = 2.2;
  const frame = new T.Mesh(new T.BoxGeometry(3.1, 4.9, 0.14),
    new T.MeshStandardMaterial({ color: 0x8a6478, roughness: 0.5, metalness: 0.45,
      emissive: 0x3a2434, emissiveIntensity: 0.55 }));
  frame.position.set(0, 2.35, -0.08);
  const glow = new T.Mesh(new T.PlaneGeometry(2.5, 4.3),
    new T.MeshBasicMaterial({ color: 0xffc8d8, transparent: true, opacity: 0,
      blending: T.AdditiveBlending, depthWrite: false }));
  glow.position.set(0, 2.2, 0.14);
  door.add(frame, leaf, glow);
  door.position.set(0, 0, -3.4);
  door.userData.glow = glow;
  door.userData.leaf = leaf;
  stage.add(door);

  /* деветте кристала в дъга */
  const picks = [];
  VOICES.forEach((v, i) => {
    const h = 0.7 + (v / 40) * 1.6;
    const g = new T.Group();
    const body = new T.Mesh(new T.ConeGeometry(0.24, h, 6),
      new T.MeshStandardMaterial({ color: 0xd8b4d0, roughness: 0.15, metalness: 0.2,
        transparent: true, opacity: 0.72, emissive: 0xe08fa8, emissiveIntensity: 0.12 }));
    body.position.y = h / 2;
    const tex = labelTexture(T, String(v), { size: 128, color: '#ffe4ee' });
    const tag = new T.Mesh(new T.PlaneGeometry(0.34, 0.34),
      new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    tag.position.y = h + 0.32;
    g.add(body, tag);
    g.position.set(-2.88 + i * 0.72, 0, 0.6);   /* прав ред — камерата гледа челно */
    g.userData = { pick: true, i, body, tag, lit: false, ph: i * 0.8 };
    stage.add(g);
    crystals.push(g);
    picks.push(g);
  });

  stage.setPickables(picks);
  stage.onPick(o => {
    let n = o;
    while (n && n.userData.i == null && n.parent) n = n.parent;
    if (n && n.userData.i != null) toggle(api, n.userData.i);
  });
  stage.onHover(o => { stage.dom.style.cursor = o ? 'pointer' : 'grab'; });

  addDust(stage, { count: 80, radius: 6, height: 6 });
  const warm = new T.PointLight(0xffb0c8, 0.7, 18);
  warm.position.set(0, 3, -2);
  stage.add(warm);

  stage.onFrame(t => {
    crystals.forEach(g => {
      const want = g.userData.lit ? 0.95 : 0.12;
      const m = g.userData.body.material;
      m.emissiveIntensity += (want - m.emissiveIntensity) * 0.1;
      g.position.y = g.userData.lit ? Math.abs(Math.sin(t * 3 + g.userData.ph)) * 0.14 : 0;
      g.userData.tag.lookAt(stage.camera.position);
    });
    if (door) {
      const open = door.userData.open;
      door.userData.glow.material.opacity += ((open ? 0.55 : 0) - door.userData.glow.material.opacity) * 0.05;
      door.userData.leaf.rotation.y += ((open ? -0.28 : 0) - door.userData.leaf.rotation.y) * 0.04;
      warm.intensity = 0.7 + (open ? 1.6 : 0) + Math.sin(t * 1.4) * 0.15;
    }
  });

  sync();
}
