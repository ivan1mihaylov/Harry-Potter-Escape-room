/* ============================================================
   ЧЕТВЪРТА ЧАСТ · ЗАЛА VIII — Числата по стената
   Над решетката на последния етаж стои събиране без цифри.
   Всяка буква е цифра. Еднаквите букви са еднакви цифри.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { createStage, labelTexture } from '../three-stage.js';
import { AZK_STAGE, addWalls, addFrost, addSlit, stoneMat } from './common4.js';

export const meta = {
  id: 'a4-numbers',
  eyebrow: 'Зала VIII',
  title: 'Числата по стената',
  sub: 'Върху желязната решетка някой е изчукал събиране: ПАЗАЧ + ПАЗАЧ = СПОМЕН. Отдолу виси ключалка с пет колела.',
  rune: 'С',
  bg: 'off',
  tint: '#a8b8a0',
  hints: [
    { text: 'Всяка буква е една и съща цифра навсякъде. Различните букви са различни цифри. Първата буква на дума не може да е 0.',
      done: d => !!d.cracked },
    { text: 'Петцифрено число, удвоено, дава шестцифрено — значи <b>С = 1</b>, а <b>П</b> е поне 5. Последната цифра: Ч + Ч завършва на Н.',
      done: d => !!d.cracked },
    { text: 'Тръгни от П: 2·П дава СП, тоест 1 и П. Само една цифра върши работа — <b>П = 9</b>. Оттам А, З, Ч се подреждат едно по едно.',
      done: d => !!d.cracked },
  ],
};

const A = 'ПАЗАЧ', B = 'СПОМЕН';
const LETTERS = ['П', 'А', 'З', 'Ч', 'С', 'О', 'М', 'Е', 'Н'];
const ANSWER = { 'П': 9, 'А': 6, 'З': 7, 'Ч': 4, 'С': 1, 'О': 3, 'М': 5, 'Е': 2, 'Н': 8 };
const CODE = [9, 6, 7, 6, 4];   // ПАЗАЧ

let stage = null, wheels = [], API = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.map) { d.map = {}; LETTERS.forEach(l => d.map[l] = -1); }
  if (!d.dial) d.dial = [0, 0, 0, 0, 0];
  if (d.cracked == null) d.cracked = false;
  api.saveData();
  API = api;

  root.innerHTML = `
    ${head(api)}
    <div class="panel">
      <p class="panel-title">Събирането по решетката</p>
      <div class="crypt" id="crypt"></div>
      <div class="crypt-letters" id="crypt-letters"></div>
      <div class="nono-actions">
        <button class="btn btn-house btn-sm" id="crypt-check"><span>Провери сметката</span></button>
        <button class="btn btn-ghost btn-sm" id="crypt-clear"><span>Изчисти</span></button>
        <span class="nono-count" id="crypt-state"></span>
      </div>
      <p class="muted center nono-help">Различните букви са различни цифри. Водеща цифра не може да е 0.</p>
    </div>
    <div class="panel stage-panel" id="lock-panel" hidden>
      <div class="stage-layout wide">
        <div class="stage-side">
          <p class="panel-title">Ключалката</p>
          <p class="muted">Пет колела. Набери числото, което се крие зад <b>ПАЗАЧ</b>.</p>
          <div class="dial-row" id="dial-row"></div>
          <button class="btn btn-house" id="dial-go"><span>Дръпни лоста</span></button>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Колелата се завъртат…</div></div>
      </div>
    </div>`;

  drawCrypt(api);
  $('#crypt-check').addEventListener('click', () => checkCrypt(api));
  $('#crypt-clear').addEventListener('click', () => {
    if (api.solved || d.cracked) return;
    LETTERS.forEach(l => d.map[l] = -1);
    api.saveData(); api.sfx.click(); drawCrypt(api);
  });

  if (d.cracked) openLock(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } wheels = []; API = null; };
}

/* ---------- криптограмата ---------- */
function val(map, w) {
  let v = 0;
  for (const ch of w) { if (map[ch] < 0) return null; v = v * 10 + map[ch]; }
  return v;
}

function drawCrypt(api) {
  const d = api.data;
  const box = $('#crypt'); if (!box) return;
  const cell = (ch) => `<span class="cr-cell"><i>${ch}</i><b>${d.map[ch] >= 0 ? d.map[ch] : '·'}</b></span>`;
  const pad = (w, n) => '<span class="cr-cell blank"></span>'.repeat(n - w.length);
  const va = val(d.map, A), vb = val(d.map, B);
  box.innerHTML = `
    <div class="cr-row">${pad(A, 6)}${[...A].map(cell).join('')}</div>
    <div class="cr-row"><span class="cr-op">+</span>${pad(A, 6)}${[...A].map(cell).join('')}</div>
    <div class="cr-rule"></div>
    <div class="cr-row">${pad(B, 6)}${[...B].map(cell).join('')}</div>
    <div class="cr-sum">${va != null && vb != null
      ? `${va} + ${va} = <b class="${va * 2 === vb ? 'good' : 'bad'}">${va * 2}</b> · а ти пишеш <b>${vb}</b>`
      : 'попълни всички букви, за да видиш сметката'}</div>`;

  const ls = $('#crypt-letters');
  if (ls) {
    ls.innerHTML = LETTERS.map(l => {
      const v = d.map[l];
      const dup = v >= 0 && LETTERS.filter(x => d.map[x] === v).length > 1;
      return `<div class="cl-item${dup ? ' dup' : ''}">
        <b>${l}</b>
        <select class="cl-sel" data-l="${l}" ${d.cracked ? 'disabled' : ''}>
          <option value="-1">·</option>
          ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n =>
            `<option value="${n}"${v === n ? ' selected' : ''}>${n}</option>`).join('')}
        </select></div>`;
    }).join('');
    $$('.cl-sel', ls).forEach(s => s.addEventListener('change', () => {
      d.map[s.dataset.l] = +s.value;
      api.saveData(); api.sfx.tick(); drawCrypt(api);
    }));
  }

  const st = $('#crypt-state');
  if (st) st.innerHTML = d.cracked ? '<b>сметката излиза</b>'
    : `попълнени <b>${LETTERS.filter(l => d.map[l] >= 0).length}</b> от ${LETTERS.length}`;
}

function checkCrypt(api) {
  const d = api.data;
  if (d.cracked) return;
  if (LETTERS.some(l => d.map[l] < 0)) { api.sfx.bad(); api.toast('Има непопълнени букви.', 'bad'); return; }
  const used = LETTERS.map(l => d.map[l]);
  if (new Set(used).size !== used.length) { api.sfx.bad(); api.fail('Две различни букви са получили една и съща цифра.'); return; }
  if (d.map['П'] === 0 || d.map['С'] === 0) { api.sfx.bad(); api.fail('Водеща цифра не може да е нула.'); return; }
  const va = val(d.map, A), vb = val(d.map, B);
  if (va * 2 !== vb) { api.sfx.bad(); api.fail(`${va} + ${va} прави ${va * 2}, а не ${vb}.`); return; }
  d.cracked = true; api.saveData();
  api.sfx.chime();
  api.fx.flash('rgba(180,220,180,.2)', 700);
  drawCrypt(api);
  openLock(api);
}

/* ---------- ключалката ---------- */
function openLock(api) {
  const p = $('#lock-panel'); if (!p) return;
  p.hidden = false;
  drawDials(api);
  const go = $('#dial-go');
  if (go && !go.dataset.on) {
    go.dataset.on = '1';
    go.addEventListener('click', () => pull(api));
  }
  boot(api);
  p.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function drawDials(api) {
  const d = api.data;
  const row = $('#dial-row'); if (!row) return;
  row.innerHTML = d.dial.map((v, i) => `
    <div class="dl">
      <button class="dl-btn" data-i="${i}" data-s="1">▲</button>
      <div class="dl-num">${v}</div>
      <button class="dl-btn" data-i="${i}" data-s="-1">▼</button>
    </div>`).join('');
  $$('.dl-btn', row).forEach(b => b.addEventListener('click', () => {
    if (api.solved) return;
    const i = +b.dataset.i, s = +b.dataset.s;
    d.dial[i] = (d.dial[i] + s + 10) % 10;
    api.saveData(); api.sfx.tick();
    drawDials(api); spin();
  }));
}

function pull(api) {
  if (api.solved) return;
  const d = api.data;
  if (d.dial.every((v, i) => v === CODE[i])) {
    api.sfx.unlock();
    api.fx.celebrate(1.5);
    api.solve('Решетката се вдига с трясък. Върху най-горното стъпало, оставена като бележка, лежи руна.');
  } else {
    api.sfx.bad();
    api.fx.shakeScreen(10, 400);
    api.fail('Лостът не помръдва. Колелата не показват ПАЗАЧ.');
  }
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage'); if (!box || box.dataset.on) return;
  box.dataset.on = '1';
  stage = await createStage(box, {
    ...AZK_STAGE, ground: false, dist: 13, fov: 40, look: [0, 1.7, -1.2],
    theta: 0, phi: 1.2, minPolar: 0.75, maxPolar: 1.42,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Нужен е WebGL за ключалката — колелата вляво работят и без нея.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  addWalls(stage, { w: 16, h: 8, d: 12, tint: 0x151920, floor: true });
  addFrost(stage, { count: 40, radius: 6, height: 7 });
  addSlit(stage, { x: 2.8, z: -3.4, w: 0.5, h: 9 });

  const plate = new T.Mesh(new T.BoxGeometry(9.4, 3.0, 0.5), stoneMat(T, 0x3c4250));
  plate.position.set(0, 1.7, -3.2);
  stage.add(plate);

  // решетка отгоре
  for (let i = 0; i < 9; i++) {
    const bar = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 3.4, 8),
      new T.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8, metalness: 0.5 }));
    bar.position.set(-3.6 + i * 0.9, 5.0, -3.2);
    stage.add(bar);
  }

  const digitTex = [];
  for (let n = 0; n <= 9; n++) digitTex.push(labelTexture(T, String(n), { size: 256, color: '#f7ead0' }));

  for (let i = 0; i < 5; i++) {
    const g = new T.Group();
    const drum = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 1.1, 26),
      new T.MeshStandardMaterial({ color: 0x6a6152, roughness: 0.5, metalness: 0.55 }));
    drum.rotation.z = Math.PI / 2;
    g.add(drum);
    for (let n = 0; n <= 9; n++) {
      const a = (n / 10) * Math.PI * 2;
      const f = new T.Mesh(new T.PlaneGeometry(0.46, 0.46),
        new T.MeshBasicMaterial({ map: digitTex[n], transparent: true, depthWrite: false }));
      f.position.set(0, Math.cos(a) * 0.815, Math.sin(a) * 0.815);
      f.rotation.x = a - Math.PI / 2;
      g.add(f);
    }
    g.position.set(-3.6 + i * 1.8, 1.7, -2.7);
    g.userData = { pick: true, i };
    stage.add(g);
    wheels.push(g);
  }
  stage.setPickables(wheels);
  stage.onPick(o => {
    const i = o.userData && o.userData.i;
    if (i == null || api.solved) return;
    const d = api.data;
    d.dial[i] = (d.dial[i] + 1) % 10;
    api.saveData(); api.sfx.tick();
    drawDials(api); spin();
  });
  stage.onHover(o => { stage.dom.style.cursor = o && o.userData.i != null ? 'pointer' : 'grab'; });

  stage.onFrame(() => {
    wheels.forEach(w => {
      const t = w.userData.target || 0;
      w.rotation.x += (t - w.rotation.x) * 0.15;
    });
  });
  spin();
}

/* колелата се въртят до набраната цифра — по най-късия път */
function spin() {
  if (!stage || !wheels.length || !API) return;
  const STEP = (Math.PI * 2) / 10;
  API.data.dial.forEach((n, i) => {
    const w = wheels[i];
    if (!w) return;
    if (w.userData.digit == null) {
      w.userData.digit = n;
      w.userData.target = Math.PI / 2 - n * STEP;
      w.rotation.x = w.userData.target;
      return;
    }
    if (w.userData.digit === n) return;
    let d = ((n - w.userData.digit + 15) % 10) - 5;
    w.userData.target -= d * STEP;
    w.userData.digit = n;
  });
}
