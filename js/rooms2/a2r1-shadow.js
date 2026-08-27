/* ============================================================
   ВТОРА ЧАСТ · ЗАЛА I — Залата на сенките
   Каменни отломки, увиснали в нищото. Подредба има само
   от една-единствена гледна точка.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage } from '../three-stage.js';

export const meta = {
  id: 'a2-shadow',
  eyebrow: 'Зала I',
  title: 'Залата на сенките',
  sub: 'Под подземията има помещение без под и без таван. В него висят стотина отломки от нещо счупено — и те се подреждат само ако застанеш там, където трябва.',
  rune: 'С',
  grain: 4,
  bg: 'off',
  tint: '#9f8cff',
  hints: [
    'Влачи, за да обикаляш залата. Камъкът не ти казва число — казва ти само дали е студено, топло или нажежено. Движи се натам, накъдето става по-топло, и не бързай.',
    'Първата подредба се вижда отгоре и отдясно. Втората е почти отсреща и по-ниско. Третата иска да <b>слезеш под отломките</b> и да гледаш нагоре.',
    'Ако си заседнал: първата гледна точка е около 40° надясно и високо; втората — завърти още около 180° и свали погледа; третата е отдолу-отпред, почти под самите камъни.',
  ],
};

/* --------- очертанията, които отломките изписват --------- */
const GLYPHS = [
  { // пясъчен часовник
    name: 'пясъчен часовник',
    segs: [[-2.2, 2.4, 2.2, 2.4], [-2.2, -2.4, 2.2, -2.4], [-2.2, 2.4, 2.2, -2.4], [2.2, 2.4, -2.2, -2.4]],
    dir: [0.62, 0.55, 0.56], tol: 0.20, n: 46,
  },
  { // руната „С“ с прекъсване
    name: 'счупена руна',
    segs: [[1.8, 2.0, -0.6, 2.4], [-0.6, 2.4, -2.0, 0.9], [-2.0, 0.9, -0.7, -0.2],
           [-0.7, -0.2, 1.4, -0.9], [1.4, -0.9, 1.9, -2.2], [1.9, -2.2, -0.9, -2.5]],
    dir: [-0.70, 0.16, -0.69], tol: 0.125, n: 52,
  },
  { // окото на печата — вижда се само отдолу
    name: 'окото на печата',
    segs: [[-2.6, 0, -1.3, 1.5], [-1.3, 1.5, 1.3, 1.5], [1.3, 1.5, 2.6, 0],
           [2.6, 0, 1.3, -1.5], [1.3, -1.5, -1.3, -1.5], [-1.3, -1.5, -2.6, 0],
           [-0.9, 0, -0.45, 0.75], [-0.45, 0.75, 0.45, 0.75], [0.45, 0.75, 0.9, 0],
           [0.9, 0, 0.45, -0.75], [0.45, -0.75, -0.45, -0.75], [-0.45, -0.75, -0.9, 0]],
    dir: [0.18, -0.60, 0.78], tol: 0.105, n: 58,
  },
];

/* грубата скала — точен процент вече не се показва */
const HEAT = [
  { at: 0.00, t: 'мъртво студено', c: '#4a4358' },
  { at: 0.42, t: 'студено', c: '#5f6f9a' },
  { at: 0.62, t: 'хладно', c: '#8f7bff' },
  { at: 0.78, t: 'топло', c: '#d9b45b' },
  { at: 0.90, t: 'горещо', c: '#e0a24a' },
  { at: 0.965, t: 'нажежено', c: '#7fd6a1' },
];

let stage = null;

export function mount(root, api) {
  const d = api.data;
  if (d.done == null) d.done = 0;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout">
        <div class="stage-side">
          <div class="parchment">
            <h4>Изсечено в стената</h4>
            <p>„Счупеното не се поправя с ръце. Поправя се с <b>гледна точка</b>.“</p>
            <p style="font-size:.94rem">Обиколи залата, докато отломките спрат да са отломки.
            Камъкът сам ще ти каже колко си близо.</p>
          </div>
          <div class="resonance">
            <div class="res-label">Отзвук</div>
            <div class="res-bar"><div id="res-fill"></div></div>
            <div class="res-pct" id="res-pct">мъртво студено</div>
          </div>
          <div class="stage-goals" id="goals"></div>
        </div>
        <div class="stage-box" id="stage"><div class="stage-loading">Отломките се събуждат…</div></div>
      </div>
      <p class="center muted stage-help">Влачи с мишката (или с пръст), за да обикаляш. Колелцето приближава.</p>
    </div>`;

  renderGoals(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } };
}

function renderGoals(api) {
  const g = $('#goals');
  g.innerHTML = GLYPHS.map((gl, i) => `
    <div class="goal ${api.data.done > i ? 'done' : api.data.done === i ? 'active' : ''}">
      <span class="goal-n">${i + 1}</span>
      <span>${api.data.done > i ? gl.name : 'непозната фигура'}</span>
    </div>`).join('');
}

async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    dist: 17, fov: 46, look: [0, 0, 0], ground: false, fogNear: 30, fogFar: 80,
    theta: 2.4, phi: 1.15, minPolar: 0.12, maxPolar: 2.6,
  });
  if (!stage) {
    box.innerHTML = '<div class="stage-loading">Този браузър не може да покаже 3D. Загадката иска WebGL.</div>';
    return;
  }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  const groups = GLYPHS.map((gl, gi) => buildGlyph(T, gl, gi));
  groups.forEach(g => stage.add(g.group));

  // вече решените се показват подредени и притъмнени
  groups.forEach((g, i) => { if (api.data.done > i) g.setSolved(); });

  let current = api.data.done;
  let holdT = 0;

  stage.onFrame((t, dt) => {
    groups.forEach((g, i) => g.tick(t, i === current));
    if (current >= GLYPHS.length) return;

    const gl = GLYPHS[current];
    const dir = new T.Vector3(...gl.dir).normalize();
    const cam = stage.camera.position.clone().normalize();
    const ang = cam.angleTo(dir);
    const close = Math.max(0, 1 - ang / (Math.PI * 0.55));
    const heat = Math.pow(close, 2.1);
    let step = 0;
    for (let i = 0; i < HEAT.length; i++) if (heat >= HEAT[i].at) step = i;
    const h = HEAT[step];

    const fill = $('#res-fill'), lab = $('#res-pct');
    if (fill) {
      fill.style.width = ((step + 1) / HEAT.length * 100) + '%';
      fill.style.background = h.c;
      lab.textContent = h.t;
      lab.classList.toggle('hot', step >= HEAT.length - 1);
    }
    groups[current].setFocus(Math.pow(close, 3));

    if (ang < gl.tol) {
      holdT += dt;
      if (holdT > 0.75) { lockIn(api, groups, current); current++; holdT = 0; }
    } else holdT = 0;
  });
}

function lockIn(api, groups, i) {
  const d = api.data;
  if (d.done > i) return;
  d.done = i + 1; api.saveData();
  groups[i].setSolved();
  api.sfx.unlock();
  api.fx.flash('rgba(160,140,255,.22)', 700);
  api.fx.sparksFrom($('#stage'), { count: 40, color: '#c9bcff', spread: 260 });
  renderGoals(api);
  if (d.done >= GLYPHS.length) {
    setTimeout(() => api.solve('Двете фигури увисват неподвижно. Между тях пада зърно пясък и една руна.'), 800);
  } else {
    api.toast(`Отломките се подредиха в <b>${GLYPHS[i].name}</b>. Остава още една фигура — но тя се вижда от другаде.`, 'magic');
  }
}

/* ---------- строене на една фигура от отломки ---------- */
function buildGlyph(T, gl, gi) {
  const group = new T.Group();
  const dir = new T.Vector3(...gl.dir).normalize();
  // ортонормиран базис около посоката на гледане
  const up = Math.abs(dir.y) > 0.9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 1, 0);
  const u = new T.Vector3().crossVectors(up, dir).normalize();
  const v = new T.Vector3().crossVectors(dir, u).normalize();

  const pts = samplePoints(gl.segs, gl.n, gi * 977);
  const geo = new T.IcosahedronGeometry(0.3, 0);
  const shards = [];

  pts.forEach((p, i) => {
    const depth = (rnd(i + gi * 31) - 0.5) * 13;
    const pos = new T.Vector3()
      .addScaledVector(u, p[0]).addScaledVector(v, p[1]).addScaledVector(dir, depth);
    const mat = new T.MeshStandardMaterial({
      color: 0x6f6a86, roughness: 0.72, metalness: 0.25,
      emissive: 0x2a2440, emissiveIntensity: 0.4,
    });
    const m = new T.Mesh(geo, mat);
    m.position.copy(pos);
    m.scale.setScalar(0.55 + rnd(i * 7 + gi) * 0.85);
    m.rotation.set(rnd(i) * 6, rnd(i + 3) * 6, rnd(i + 5) * 6);
    group.add(m);
    shards.push({ m, mat, ph: rnd(i + 11) * 6.28, sp: 0.4 + rnd(i + 13) * 0.7, base: pos.clone() });
  });

  let focus = 0, solved = false;
  return {
    group,
    setFocus: (f) => { focus = f; },
    setSolved: () => {
      solved = true;
      shards.forEach(s => {
        s.mat.emissive.setHex(0x8f7bff);
        s.mat.emissiveIntensity = 0.75;
        s.mat.color.setHex(0xbfb4e8);
        s.m.position.copy(s.base);
      });
    },
    tick: (t, isCurrent) => {
      shards.forEach((s, i) => {
        if (solved) { s.m.rotation.y += 0.0016; return; }
        const wob = isCurrent ? 0.16 * (1 - focus) : 0.3;
        s.m.position.copy(s.base);
        s.m.position.x += Math.sin(t * s.sp + s.ph) * wob;
        s.m.position.y += Math.cos(t * s.sp * 0.8 + s.ph) * wob;
        s.m.rotation.x += 0.002 * (1 - focus * 0.8);
        s.m.rotation.z += 0.0015 * (1 - focus * 0.8);
        s.mat.emissiveIntensity = isCurrent ? 0.35 + focus * 1.3 : 0.18;
        if (isCurrent) s.mat.emissive.setHex(focus > 0.75 ? 0x9f8cff : 0x2a2440);
      });
    },
  };
}

function samplePoints(segs, n, seed) {
  const lens = segs.map(s => Math.hypot(s[2] - s[0], s[3] - s[1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const out = [];
  segs.forEach((s, si) => {
    const k = Math.max(2, Math.round(n * lens[si] / total));
    for (let i = 0; i < k; i++) {
      const f = k === 1 ? 0.5 : i / (k - 1);
      const jx = (rnd(seed + si * 17 + i) - 0.5) * 0.22;
      const jy = (rnd(seed + si * 29 + i) - 0.5) * 0.22;
      out.push([s[0] + (s[2] - s[0]) * f + jx, s[1] + (s[3] - s[1]) * f + jy]);
    }
  });
  return out;
}

/* детерминиран „шум“, за да е еднакво при всяко зареждане */
function rnd(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
