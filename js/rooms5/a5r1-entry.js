/* ============================================================
   ПЕТА ЧАСТ · КАМЕРА I — Входът на посетителите
   Червена телефонна кабина на Уайтхол. Шайбата се върти
   наистина: пет цифри, и решетката проговаря.
   ============================================================ */
import { head, $, $$, answerBar, wireAnswer } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';
import { MYSTERY_STAGE, addDust, rnd, addMysteryLight } from './common5.js';

export const meta = {
  id: 'a5-entry',
  eyebrow: 'Камера I',
  title: 'Входът на посетителите',
  sub: 'Червена кабина на Уайтхол, в която няма кого да позвъниш. Шайбата се върти, а медната решетка чака да чуе правилните пет цифри.',
  rune: 'И',
  bg: 'off',
  tint: '#8a7fc0',
  hints: [
    { text: 'Кабината не звъни на никого — тя <b>слиза</b>. Кодът е пет цифри и Артър Уизли го набира всеки ден.',
      done: d => !!d.word || d.dialed === CODE },
    { text: 'На стара телефонна шайба всяка цифра носи по три букви: 2=ABC, 3=DEF, 4=GHI, 5=JKL, 6=MNO, 7=PQRS, 8=TUV, 9=WXYZ.',
      done: d => !!d.word },
    'Кодът е <b>62442</b>. Прочетен като букви, той изписва думата, с която Министерството се представя.',
  ],
};

const CODE = '62442';
const KEYS = {
  2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL',
  6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ',
};
const LEVELS = [
  { n: 2, t: 'Отдел за магическо правораздаване' },
  { n: 4, t: 'Отдел за регулиране на магическите създания' },
  { n: 6, t: 'Отдел за магически транспорт' },
  { n: 9, t: 'Отдел на мистериите', ok: true },
];

let stage = null, dialGroup = null, spinToken = 0;

export function mount(root, api) {
  const d = api.data;
  if (!d.dialed) d.dialed = '';
  if (d.word == null) d.word = false;
  if (d.level == null) d.level = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Табелката до апарата</h4>
            <p>«Наберете кода на посетителя и назовете целта на посещението си.»</p>
          </div>
          <div class="dial-readout" id="dial-readout"></div>
          <div class="keypad" id="keypad"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-ghost btn-sm" id="dial-clear"><span>Изчисти</span></button>
          </div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Кабината се спуска…</div></div>
      </div>
      <p class="center muted stage-help">Върти шайбата в 3D или натискай цифрите вляво — все едно е.</p>
    </div>

    <div class="panel" id="word-panel" hidden>
      <p class="panel-title">Решетката изщраква</p>
      <p>Пет цифри, пет пъти по три букви. Апаратът чака да чуе не числото, а <b>думата</b>,
      която то изписва.</p>
      <div class="keymap" id="keymap"></div>
      ${answerBar('entry-word', 'думата', 'Изречи')}
    </div>

    <div class="panel" id="level-panel" hidden>
      <p class="panel-title">Асансьорът пита за етаж</p>
      <p>Женският глас изброява отделите. Ти търсиш онзи, чиито служители никога не казват
      с какво се занимават.</p>
      <div class="levels" id="levels"></div>
    </div>`;

  drawReadout(api);
  drawKeypad(api);
  $('#dial-clear').addEventListener('click', () => {
    if (api.solved || d.word) return;
    d.dialed = ''; api.saveData(); api.sfx.click(); drawReadout(api);
  });

  wireAnswer(root, 'entry-word', (v, input) => {
    if (api.solved || d.level) return;
    if (v === 'MAGIC' || v === 'МАГИК') {
      d.word = true; api.saveData();
      api.sfx.unlock();
      api.fx.sparksFrom($('#word-panel'), { count: 24, color: '#bfe2ff', spread: 150 });
      openLevels(api);
    } else {
      input.value = '';
      api.fail('Решетката мълчи. Не е тази дума.');
    }
  });

  if (d.dialed === CODE) openWord(api);
  if (d.word) openLevels(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } dialGroup = null; spinToken++; };
}

/* ---------- шайбата ---------- */
function press(api, n) {
  const d = api.data;
  if (api.solved || d.word) return;
  if (d.dialed.length >= CODE.length) return;
  d.dialed += String(n);
  api.saveData();
  api.sfx.tick();
  spinDial(n);
  drawReadout(api);

  if (d.dialed.length === CODE.length) {
    if (d.dialed === CODE) {
      api.sfx.chime();
      api.fx.flash('rgba(150,200,255,.2)', 600);
      setTimeout(() => openWord(api), 500);
    } else {
      api.fail('Решетката изхриптява и се изчиства.');
      d.dialed = ''; api.saveData();
      setTimeout(() => drawReadout(api), 400);
    }
  }
}

function drawReadout(api) {
  const box = $('#dial-readout'); if (!box) return;
  const d = api.data;
  box.innerHTML = Array.from({ length: CODE.length }, (_, i) => {
    const c = d.dialed[i];
    return `<span class="dr-slot${c ? ' on' : ''}">${c || '·'}</span>`;
  }).join('');
}

function drawKeypad(api) {
  const box = $('#keypad'); if (!box) return;
  box.innerHTML = [1,2,3,4,5,6,7,8,9,0].map(n => `
    <button class="kp-key" data-n="${n}">
      <b>${n}</b><i>${KEYS[n] || ''}</i>
    </button>`).join('');
  $$('.kp-key', box).forEach(b => b.addEventListener('click', () => press(api, +b.dataset.n)));
}

function openWord(api) {
  const p = $('#word-panel'); if (!p) return;
  p.hidden = false;
  const km = $('#keymap');
  if (km && !km.dataset.on) {
    km.dataset.on = '1';
    km.innerHTML = [...CODE].map(c => `
      <div class="km-col"><b>${c}</b><span>${(KEYS[c] || '').split('').join('<br>')}</span></div>`).join('');
  }
  p.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function openLevels(api) {
  const p = $('#level-panel'); if (!p) return;
  p.hidden = false;
  const box = $('#levels');
  if (box && !box.dataset.on) {
    box.dataset.on = '1';
    box.innerHTML = LEVELS.map((l, i) =>
      `<button class="level-btn" data-i="${i}"><b>Ниво ${l.n}</b><span>${l.t}</span></button>`).join('');
    $$('.level-btn', box).forEach(b => b.addEventListener('click', () => {
      if (api.solved) return;
      const l = LEVELS[+b.dataset.i];
      if (l.ok) {
        b.classList.add('right');
        api.data.level = true; api.saveData();
        api.sfx.unlock();
        api.fx.celebrate(1.4);
        setTimeout(() => api.solve('Асансьорът потъва още девет етажа и спира без звук. На пода на кабината лежи значка за посетител — а под нея руна.'), 700);
      } else {
        b.classList.add('wrong');
        api.fail('Асансьорът тръгва, спира на друг етаж и те връща обратно.');
      }
    }));
  }
  p.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ---------- 3D ---------- */
/* Анимацията никога не бива да блокира набирането — ако играчът
   натисне пак, старото завъртане просто се изоставя.            */
function spinDial(n) {
  if (!dialGroup) return;
  const token = ++spinToken;
  const turns = (n === 0 ? 10 : n) * 0.28;
  const from = dialGroup.rotation.z;
  const to = -turns * Math.PI * 2 / 10 * 3.2;
  const t0 = performance.now(), dur = 420;
  const step = () => {
    if (!dialGroup || token !== spinToken) return;
    const k = Math.min(1, (performance.now() - t0) / dur);
    const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    dialGroup.rotation.z = from + (to - from) * e;
    if (k < 1) requestAnimationFrame(step);
    else {
      const back = performance.now();
      const rewind = () => {
        if (!dialGroup || token !== spinToken) return;
        const kk = Math.min(1, (performance.now() - back) / 300);
        dialGroup.rotation.z = to * (1 - kk);   /* шайбата винаги се връща в покой */
        if (kk < 1) requestAnimationFrame(rewind);
      };
      rewind();
    }
  };
  step();
}

async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...MYSTERY_STAGE, ground: false, dist: 5.2, fov: 40, look: [0, 0.1, 0],
    theta: 0, phi: 1.32, minPolar: 0.8, maxPolar: 1.5,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за кабината — клавиатурата вляво работи и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  addMysteryLight(stage);
  const T = stage.THREE;

  /* червената кабина отзад */
  const red = new T.MeshStandardMaterial({ color: 0x7d1418, roughness: 0.55, metalness: 0.2 });
  const back = new T.Mesh(new T.BoxGeometry(5.2, 6, 0.3), red);
  back.position.set(0, 1, -1.6);
  stage.add(back);
  [-2.3, 2.3].forEach(x => {
    const post = new T.Mesh(new T.BoxGeometry(0.42, 6, 0.42), red);
    post.position.set(x, 1, -1.2);
    stage.add(post);
  });
  for (let i = 0; i < 9; i++) {
    const pane = new T.Mesh(new T.PlaneGeometry(1.3, 1.5),
      new T.MeshBasicMaterial({ color: 0x0d1b28, transparent: true, opacity: 0.5 }));
    pane.position.set(-1.5 + (i % 3) * 1.5, 3.2 - Math.floor(i / 3) * 1.7, -1.42);
    stage.add(pane);
  }

  /* самият апарат */
  const bodyMat = new T.MeshStandardMaterial({ color: 0x36303f, roughness: 0.4, metalness: 0.45,
    emissive: 0x18141f, emissiveIntensity: 0.5 });
  const bodyM = new T.Mesh(new T.BoxGeometry(2.4, 1.9, 0.5), bodyMat);
  bodyM.position.set(0, 0.1, -1.1);
  stage.add(bodyM);

  /* шайбата */
  dialGroup = new T.Group();
  const plate = new T.Mesh(new T.CylinderGeometry(0.82, 0.82, 0.1, 36),
    new T.MeshStandardMaterial({ color: 0x5c5170, roughness: 0.3, metalness: 0.6,
      emissive: 0x261f38, emissiveIntensity: 0.5 }));
  plate.rotation.x = Math.PI / 2;
  dialGroup.add(plate);
  const picks = [];
  for (let i = 0; i < 10; i++) {
    const digit = (i + 1) % 10;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const hole = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 0.16, 14),
      new T.MeshStandardMaterial({ color: 0x0a0812, roughness: 0.9 }));
    hole.rotation.x = Math.PI / 2;
    hole.position.set(Math.cos(a) * 0.56, Math.sin(a) * 0.56, 0.02);
    hole.userData = { pick: true, digit };
    dialGroup.add(hole);
    picks.push(hole);

    const num = new T.Mesh(new T.PlaneGeometry(0.22, 0.22),
      new T.MeshBasicMaterial({ map: labelTexture(T, String(digit), { size: 128, color: '#e8dcff' }),
        transparent: true, depthWrite: false }));
    num.position.set(Math.cos(a) * 0.73, Math.sin(a) * 0.73, 0.07);
    dialGroup.add(num);
  }
  dialGroup.position.set(0, 0.12, -0.8);
  stage.add(dialGroup);

  const ring = new T.Mesh(new T.TorusGeometry(0.86, 0.05, 8, 40),
    new T.MeshStandardMaterial({ color: 0x9a8fd0, roughness: 0.3, metalness: 0.8 }));
  ring.position.set(0, 0.12, -0.78);
  stage.add(ring);

  stage.setPickables(picks);
  stage.onPick(o => { if (o.userData && o.userData.digit != null) press(api, o.userData.digit); });
  stage.onHover(o => { stage.dom.style.cursor = o && o.userData.digit != null ? 'pointer' : 'grab'; });

  addDust(stage, { count: 60, radius: 4, height: 5 });
  const lamp = new T.PointLight(0xffd9a0, 1.4, 12);
  lamp.position.set(0, 3.4, 0.6);
  stage.add(lamp);
}
