/* ============================================================
   ВТОРА ЧАСТ · ЗАЛА II — Обсерваторията на времето
   Три пръстена, захванати един за друг. Никой не се движи сам.
   ============================================================ */
import { head, $, $$, el } from '../rooms/common.js';
import { createStage } from '../three-stage.js';

export const meta = {
  id: 'a2-orrery',
  eyebrow: 'Зала II',
  title: 'Обсерваторията на времето',
  sub: 'Механизъм от три пръстена, който Основателите са наричали „часовника на небето“. Зъбците му са наровени така, че нито един пръстен не се върти сам.',
  rune: 'И',
  grain: 1,
  bg: 'stars',
  tint: '#8fa8ff',
  hints: [
    'Всеки лост е надписан какво движи. Външният лост върти и трите пръстена; средният — средния и вътрешния; вътрешният — само вътрешния.',
    'Затова редът е един-единствен: първо нагласи <b>външния</b> пръстен и повече не го пипай, после средния, накрая вътрешния.',
    'Отговорите са: външен — <b>Марс</b>; среден — <b>Феликс Фелицис</b>; вътрешен — <b>Салазар</b>.',
  ],
};

const RINGS = [
  {
    id: 'a', r: 6.4, y: 0.2, tube: 0.16, color: 0xb98a3a,
    items: ['Меркурий', 'Венера', 'Земя', 'Марс', 'Юпитер', 'Сатурн',
            'Уран', 'Нептун', 'Луната', 'Слънцето', 'Сириус', 'Кометата'],
    answer: 'Марс',
  },
  {
    id: 'b', r: 4.3, y: 1.5, tube: 0.14, color: 0x8f7bff,
    items: ['Феликс Фелицис', 'Амортенция', 'Оборотна отвара', 'Веритасерум',
            'Смъртоносен сън', 'Костерасте', 'Приспивателна', 'Есенция от беладона'],
    answer: 'Феликс Фелицис',
  },
  {
    id: 'c', r: 2.4, y: 2.7, tube: 0.12, color: 0x2e9e6b,
    items: ['Годрик', 'Роуина', 'Хелга', 'Салазар', 'Мерлин', 'Игнотус'],
    answer: 'Салазар',
  },
];

/* зъбното зацепване: кой лост колко мести всеки пръстен */
const LEVERS = {
  a: { a: 1, b: 1, c: 1, label: 'Външен лост', moves: 'върти трите пръстена' },
  b: { a: 0, b: 1, c: 2, label: 'Среден лост', moves: 'върти средния и вътрешния (вътрешния — двойно)' },
  c: { a: 0, b: 0, c: 1, label: 'Вътрешен лост', moves: 'върти само вътрешния' },
};

let stage = null, ringObjs = {}, posRef = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.pos) d.pos = { a: 7, b: 5, c: 2 };   // начално положение
  posRef = d.pos;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Плочка до механизма</h4>
            <p>„Изравни трите имена срещу <b>златния зъб</b>. Тогава небето ще си спомни кой час е.“</p>
            <ul class="clue-list">
              <li><b>Външен пръстен:</b> кентаврите четат само едно небесно тяло, когато говорят за война.</li>
              <li><b>Среден пръстен:</b> течен късмет, златен на цвят — вари се шест месеца и е забранен на състезания.</li>
              <li><b>Вътрешен пръстен:</b> единственият от четиримата, който напусна замъка с гняв и остави чудовище зад себе си.</li>
            </ul>
          </div>
          <div class="levers" id="levers"></div>
          <div class="ring-readout" id="readout"></div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Механизмът се разгръща…</div></div>
      </div>
    </div>`;

  renderLevers(api);
  renderReadout(api);
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } ringObjs = {}; };
}

function renderLevers(api) {
  const box = $('#levers');
  box.innerHTML = '';
  Object.entries(LEVERS).forEach(([k, L]) => {
    const row = el('div', 'lever');
    row.innerHTML = `
      <div class="lever-info"><b>${L.label}</b><span>${L.moves}</span></div>
      <div class="lever-btns">
        <button class="lever-btn" data-k="${k}" data-d="-1">◀</button>
        <button class="lever-btn" data-k="${k}" data-d="1">▶</button>
      </div>`;
    box.appendChild(row);
  });
  $$('.lever-btn', box).forEach(b => b.addEventListener('click', () => pull(api, b.dataset.k, +b.dataset.d)));
}

function renderReadout(api) {
  const r = $('#readout');
  if (!r) return;
  r.innerHTML = RINGS.map(ring => {
    const name = ring.items[api.data.pos[ring.id]];
    const ok = name === ring.answer;
    return `<div class="ro-row ${ok ? 'ok' : ''}"><span class="ro-dot" style="background:#${ring.color.toString(16).padStart(6, '0')}"></span>${name}</div>`;
  }).join('');
}

function pull(api, lever, dir) {
  if (api.solved) return;
  const L = LEVERS[lever];
  const d = api.data;
  RINGS.forEach(ring => {
    const step = L[ring.id] * dir;
    if (!step) return;
    d.pos[ring.id] = ((d.pos[ring.id] + step) % ring.items.length + ring.items.length) % ring.items.length;
  });
  api.saveData();
  api.sfx.click();
  applyRotation();
  renderReadout(api);
  check(api);
}

function applyRotation() {
  if (!posRef) return;
  RINGS.forEach(ring => {
    const o = ringObjs[ring.id];
    if (o) o.target = -(2 * Math.PI / ring.items.length) * posRef[ring.id];
  });
}

function check(api) {
  const ok = RINGS.every(r => r.items[api.data.pos[r.id]] === r.answer);
  if (!ok) return;
  api.sfx.unlock();
  api.fx.flash('rgba(150,180,255,.26)', 800);
  api.fx.sparksFrom($('#stage'), { count: 55, color: '#cfe0ff', spread: 300 });
  Object.values(ringObjs).forEach(o => { o.glow = true; });
  $$('.lever-btn').forEach(b => b.disabled = true);
  setTimeout(() => api.solve('Трите имена застават в една линия. Механизмът въздъхва и пуска зърно пясък в дланта ти.'), 900);
}

async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    dist: 18, fov: 42, look: [0, 1.4, 0], theta: 0, phi: 1.02,
    minPolar: 0.25, maxPolar: 1.5, ground: true, groundColor: 0x100e18, groundTex: 'cobble-floor', groundRepeat: 16,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Този браузър не може да покаже 3D (нужен е WebGL), но лостовете вляво работят.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  // централна ос
  const axis = new T.Mesh(
    new T.CylinderGeometry(0.16, 0.22, 6.4, 16),
    new T.MeshStandardMaterial({ color: 0x6b5233, roughness: 0.5, metalness: 0.7 })
  );
  axis.position.y = 3.2; axis.castShadow = true;
  stage.add(axis);

  // златният зъб — неподвижният показалец отпред
  const marker = new T.Mesh(
    new T.ConeGeometry(0.42, 1.2, 4),
    new T.MeshStandardMaterial({ color: 0xffd98a, emissive: 0xd9b45b, emissiveIntensity: 0.7, metalness: 0.8, roughness: 0.25 })
  );
  marker.position.set(0, 0.2, 8.1);
  marker.rotation.x = -Math.PI / 2;
  stage.add(marker);
  const beam = new T.Mesh(
    new T.CylinderGeometry(0.03, 0.03, 7, 8),
    new T.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.28 })
  );
  beam.position.set(0, 3.4, 8.1);
  stage.add(beam);

  RINGS.forEach(ring => {
    const g = new T.Group();
    const torus = new T.Mesh(
      new T.TorusGeometry(ring.r, ring.tube, 12, 90),
      new T.MeshStandardMaterial({ color: ring.color, roughness: 0.35, metalness: 0.85 })
    );
    torus.rotation.x = Math.PI / 2;
    torus.castShadow = true;
    g.add(torus);

    // зъбци
    const teeth = ring.items.length * 3;
    const toothGeo = new T.BoxGeometry(0.14, 0.16, 0.4);
    const toothMat = new T.MeshStandardMaterial({ color: ring.color, roughness: 0.4, metalness: 0.8 });
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const m = new T.Mesh(toothGeo, toothMat);
      m.position.set(Math.sin(a) * (ring.r + 0.22), 0, Math.cos(a) * (ring.r + 0.22));
      m.rotation.y = a;
      g.add(m);
    }

    // плочките с имената
    ring.items.forEach((name, i) => {
      const a = (i / ring.items.length) * Math.PI * 2;
      const plate = new T.Mesh(
        new T.PlaneGeometry(2.0, 0.62),
        new T.MeshBasicMaterial({ map: plateTexture(T, name), transparent: true, side: T.DoubleSide })
      );
      plate.position.set(Math.sin(a) * (ring.r + 0.05), 0.52, Math.cos(a) * (ring.r + 0.05));
      plate.rotation.y = a;
      g.add(plate);
      const stud = new T.Mesh(
        new T.SphereGeometry(0.1, 10, 10),
        new T.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xd9b45b, emissiveIntensity: 0.35 })
      );
      stud.position.set(Math.sin(a) * ring.r, -0.24, Math.cos(a) * ring.r);
      g.add(stud);
    });

    g.position.y = ring.y;
    stage.add(g);
    ringObjs[ring.id] = { g, target: 0, cur: 0, glow: false, mat: torus.material };
  });

  posRef = api.data.pos;
  applyRotation();
  Object.values(ringObjs).forEach(o => { o.cur = o.target; o.g.rotation.y = o.target; });

  stage.onFrame((t) => {
    Object.values(ringObjs).forEach(o => {
      o.cur += (o.target - o.cur) * 0.14;
      o.g.rotation.y = o.cur;
      if (o.glow) {
        o.mat.emissive = o.mat.emissive || new T.Color();
        o.mat.emissive.setHex(0xffd98a);
        o.mat.emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.25;
      }
    });
    beam.material.opacity = 0.2 + Math.sin(t * 2) * 0.1;
  });

  if (api.solved) { Object.values(ringObjs).forEach(o => { o.glow = true; }); $$('.lever-btn').forEach(b => b.disabled = true); }
}

function plateTexture(T, text) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 160);
  g.fillStyle = 'rgba(12,10,18,.82)';
  roundRect(g, 6, 26, 500, 108, 16); g.fill();
  g.strokeStyle = 'rgba(217,180,91,.75)'; g.lineWidth = 3;
  roundRect(g, 6, 26, 500, 108, 16); g.stroke();
  let size = 58;
  g.font = `600 ${size}px Cinzel, Georgia, serif`;
  while (g.measureText(text).width > 460 && size > 22) {
    size -= 3;
    g.font = `600 ${size}px Cinzel, Georgia, serif`;
  }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#f3e2b4';
  g.shadowColor = 'rgba(255,220,150,.8)'; g.shadowBlur = 14;
  g.fillText(text, 256, 82);
  const tex = new T.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
