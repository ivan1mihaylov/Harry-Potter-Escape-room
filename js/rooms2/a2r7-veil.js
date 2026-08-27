/* ============================================================
   ВТОРА ЧАСТ · ЗАЛА VII — Воалът
   Арката от Отдела на мистериите. Шепне на шифър.
   ============================================================ */
import { head, $, $$, el, norm, shakeEl, answerBar, wireAnswer } from '../rooms/common.js';
import { createStage } from '../three-stage.js';

export const meta = {
  id: 'a2-veil',
  eyebrow: 'Зала VII',
  title: 'Воалът',
  sub: 'Каменна арка, а в нея — завеса, която се движи без вятър. Отвъд нея се чуват гласове. Един от тях е оставил дума, но я е скрил зад име.',
  rune: 'И',
  grain: 8,
  bg: 'off',
  tint: '#9f8cff',
  hints: [
    'Ключът е име на човек, който пропадна през тази арка пред очите на кръщелника си. Шест букви.',
    'Дискът е шифров кръг: върти вътрешния пръстен, докато буквата на ключа застане срещу <b>А</b> от външния. Тогава всяка буква от шифъра се чете отвън навътре.',
    'Ключът е <b>СИРИУС</b>, а скритата дума е <b>МЪЛЧАНИЕ</b>. Буква по буква: Я→М, Д→Ъ, Ь→Л, Б→Ч, У→А, А→Н, Щ→И, Н→Е.',
  ],
};

const AZ = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ';
const CIPHER = 'ЯДЬБУАЩН';
const KEY = 'СИРИУС';
const PLAIN = 'МЪЛЧАНИЕ';

let stage = null, disc = null, veilMesh = null, discShift = 0;

export function mount(root, api) {
  const d = api.data;
  if (d.keyed == null) d.keyed = false;
  if (d.shift == null) d.shift = 0;
  discShift = d.shift;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel stage-panel">
      <div class="stage-layout wide">
        <div class="stage-side">
          <div class="parchment">
            <h4>Шепотът, изписан върху камъка</h4>
            <div class="cipher-row">${[...CIPHER].map(c => `<span class="cp">${c}</span>`).join('')}</div>
            <p>„Името ми е ключът. Питай кръщелника ми.“</p>
            <p style="font-size:.93rem">Всяка буква от шепота е изместена с толкова, колкото струва
            съответната буква от ключа. Ключът се повтаря отначало, щом свърши.</p>
          </div>
          <div id="key-stage"></div>
          <div class="disc-ctl" id="disc-ctl">
            <button class="btn btn-ghost btn-sm" id="disc-l"><span>◀ завърти</span></button>
            <div class="disc-read">срещу <b>А</b> стои <b id="disc-letter">А</b><span id="disc-num">отместване 0</span></div>
            <button class="btn btn-ghost btn-sm" id="disc-r"><span>завърти ▶</span></button>
          </div>
          <div class="az-strip">${[...AZ].map((c, i) => `<span><b>${c}</b><i>${i}</i></span>`).join('')}</div>
        </div>
        <div class="stage-box tall" id="stage"><div class="stage-loading">Завесата се движи…</div></div>
      </div>
    </div>`;

  renderKeyStage(api);
  $('#disc-l').addEventListener('click', () => turn(api, -1));
  $('#disc-r').addEventListener('click', () => turn(api, 1));
  renderDiscRead();
  boot(api);
  api.onLeave = () => { if (stage) { stage.dispose(); stage = null; } disc = null; veilMesh = null; };
}

function renderKeyStage(api) {
  const host = $('#key-stage');
  if (!api.data.keyed) {
    host.innerHTML = `
      <div class="sub-step">
        <p class="panel-title">Първо — името</p>
        <p class="muted" style="font-size:.94rem;margin:-8px 0 10px">
          Кой падна през тази арка, докато кръщелникът му гледаше?</p>
        ${answerBar('veil-key', 'ИМЕТО', 'Изречи')}
      </div>`;
    wireAnswer(host, 'veil-key', (val, input) => {
      if (val === KEY) {
        api.data.keyed = true; api.saveData();
        api.sfx.chime();
        api.fx.sparksFrom(input, { count: 26, color: '#c9bcff', spread: 160 });
        api.toast('Завесата спира за миг. Ключът е приет.', 'magic');
        renderKeyStage(api);
      } else {
        api.sfx.bad(); shakeEl(input);
        api.fail('Гласовете отвъд млъкват. Не е това име.');
      }
    });
  } else {
    const keyRow = [...CIPHER].map((c, i) => {
      const k = KEY[i % KEY.length];
      return `<span class="kp"><b>${c}</b><i>${k}</i></span>`;
    }).join('');
    host.innerHTML = `
      <div class="sub-step">
        <p class="panel-title">Шифър срещу ключ</p>
        <div class="key-map">${keyRow}</div>
        <p class="muted" style="font-size:.9rem">Върти диска, докато срещу <b>А</b> застане
        буквата на ключа. После прочети буквата на шифъра — отвън навътре.</p>
        ${answerBar('veil-ans', 'ДУМАТА', 'Изречи')}
      </div>`;
    wireAnswer(host, 'veil-ans', (val, input) => {
      if (val === PLAIN) {
        api.sfx.unlock();
        input.disabled = true;
        api.fx.flash('rgba(160,140,255,.26)', 900);
        api.fx.sparksFrom(input, { count: 46, color: '#c9bcff', spread: 280 });
        if (veilMesh) veilMesh.userData.calm = true;
        api.solve('Завесата увисва неподвижно. Гласовете спират. В тишината пада руна и зърно пясък.');
      } else {
        api.sfx.bad(); shakeEl(input);
        api.fail('Шепотът се обърква и започва отначало.');
      }
    });
    if (api.solved) { const i = $('#veil-ans'); if (i) { i.value = PLAIN; i.disabled = true; } }
  }
}

function turn(api, dir) {
  discShift = (discShift + dir + AZ.length) % AZ.length;
  api.data.shift = discShift; api.saveData();
  api.sfx.click();
  renderDiscRead();
}

function renderDiscRead() {
  const l = $('#disc-letter'), n = $('#disc-num');
  if (l) l.textContent = AZ[discShift];
  if (n) n.textContent = 'отместване ' + discShift;
  if (disc) disc.target = -(discShift / AZ.length) * Math.PI * 2;
}

/* ---------- 3D ---------- */
async function boot(api) {
  const box = $('#stage');
  stage = await createStage(box, {
    dist: 17, fov: 44, look: [0, 3.2, 0], theta: 0, phi: 1.16,
    minPolar: 0.4, maxPolar: 1.5, ground: true, groundColor: 0x0d0b16,
  });
  if (!stage) { box.innerHTML = '<div class="stage-loading">Нужен е WebGL за арката, но шифърът вляво се решава и без нея.</div>'; return; }
  const ld = box.querySelector('.stage-loading'); if (ld) ld.remove();
  const T = stage.THREE;

  const stone = new T.MeshStandardMaterial({ color: 0x4a4458, roughness: 0.9, metalness: 0.1 });
  const step = new T.Mesh(new T.CylinderGeometry(7, 8, 0.7, 20), stone);
  step.position.y = -0.3; step.receiveShadow = true; stage.add(step);

  // арката
  const post = new T.BoxGeometry(1.1, 8, 1.1);
  const l = new T.Mesh(post, stone); l.position.set(-3.2, 4, 0); l.castShadow = true;
  const r = new T.Mesh(post, stone); r.position.set(3.2, 4, 0); r.castShadow = true;
  const top = new T.Mesh(new T.BoxGeometry(8, 1.2, 1.3), stone); top.position.set(0, 8.4, 0); top.castShadow = true;
  const cap = new T.Mesh(new T.BoxGeometry(9, 0.5, 1.6), stone); cap.position.set(0, 9.1, 0);
  stage.add(l, r, top, cap);

  // завесата
  const geo = new T.PlaneGeometry(5.9, 7.6, 24, 30);
  const mat = new T.MeshStandardMaterial({
    color: 0x241f38, roughness: 0.95, metalness: 0.05, side: T.DoubleSide,
    emissive: 0x1a1430, emissiveIntensity: 0.6, transparent: true, opacity: 0.94,
  });
  veilMesh = new T.Mesh(geo, mat);
  veilMesh.position.set(0, 4.0, 0);
  veilMesh.userData.base = Float32Array.from(geo.attributes.position.array);
  stage.add(veilMesh);

  // шепотът, изписан по камъка
  const txt = new T.Mesh(
    new T.PlaneGeometry(6.6, 1.1),
    new T.MeshBasicMaterial({ map: cipherTexture(T), transparent: true })
  );
  txt.position.set(0, 8.4, 0.72);
  stage.add(txt);

  // шифровият диск
  const holder = new T.Group();
  holder.position.set(0, 1.9, 6.0);
  const stand = new T.Mesh(new T.CylinderGeometry(0.25, 0.7, 2.2, 12), stone);
  stand.position.y = -1.6; holder.add(stand);

  const outer = new T.Mesh(
    new T.CircleGeometry(2.6, 64),
    new T.MeshBasicMaterial({ map: ringTexture(T, true), transparent: true })
  );
  const inner = new T.Mesh(
    new T.CircleGeometry(1.95, 64),
    new T.MeshBasicMaterial({ map: ringTexture(T, false), transparent: true })
  );
  inner.position.z = 0.02;
  holder.add(outer, inner);
  const rim = new T.Mesh(
    new T.TorusGeometry(2.62, 0.08, 8, 48),
    new T.MeshStandardMaterial({ color: 0xd9b45b, metalness: 0.9, roughness: 0.25 })
  );
  holder.add(rim);
  const needle = new T.Mesh(
    new T.ConeGeometry(0.16, 0.5, 4),
    new T.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xd9b45b, emissiveIntensity: 0.8 })
  );
  needle.position.set(0, 2.85, 0.05); needle.rotation.z = Math.PI;
  holder.add(needle);
  stage.add(holder);

  disc = { mesh: inner, cur: 0, target: 0 };
  renderDiscRead();
  disc.cur = disc.target; inner.rotation.z = disc.target;

  const pos = veilMesh.geometry.attributes.position;
  stage.onFrame((t) => {
    const base = veilMesh.userData.base;
    const calm = veilMesh.userData.calm ? 0.12 : 1;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      const w = Math.sin(t * 1.5 + y * 0.7 + x * 0.5) * 0.34
              + Math.sin(t * 0.9 - y * 1.1) * 0.22
              + Math.cos(t * 2.1 + x * 0.9) * 0.12;
      pos.setZ(i, w * calm * (0.35 + (4 - y) * 0.12));
    }
    pos.needsUpdate = true;
    veilMesh.geometry.computeVertexNormals();
    mat.emissiveIntensity = veilMesh.userData.calm ? 0.2 : 0.45 + Math.sin(t * 1.3) * 0.25;
    disc.cur += (disc.target - disc.cur) * 0.16;
    inner.rotation.z = disc.cur;
  });
}

/* ---------- текстури ---------- */
function cipherTexture(T) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 170;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 1024, 170);
  g.font = '600 96px Cinzel, Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#c9bcff';
  g.shadowColor = '#8f7bff'; g.shadowBlur = 26;
  g.fillText(CIPHER.split('').join(' '), 512, 92);
  return new T.CanvasTexture(c);
}

function ringTexture(T, isOuter) {
  const S = 700;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.clearRect(0, 0, S, S);
  g.fillStyle = isOuter ? 'rgba(24,20,34,.92)' : 'rgba(46,38,64,.96)';
  g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, 7); g.fill();
  g.strokeStyle = 'rgba(217,180,91,.55)'; g.lineWidth = 3;
  g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 4, 0, 7); g.stroke();

  const radius = isOuter ? S / 2 - 42 : S / 2 - 46;
  g.font = `600 ${isOuter ? 40 : 38}px Cinzel, Georgia, serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < AZ.length; i++) {
    const a = (i / AZ.length) * Math.PI * 2 - Math.PI / 2;
    g.save();
    g.translate(S / 2 + Math.cos(a) * radius, S / 2 + Math.sin(a) * radius);
    g.rotate(a + Math.PI / 2);
    g.fillStyle = isOuter ? '#f3e2b4' : '#c9bcff';
    g.fillText(AZ[i], 0, 0);
    g.restore();
  }
  if (!isOuter) {
    g.fillStyle = 'rgba(217,180,91,.35)';
    g.font = '600 30px Cinzel, Georgia, serif';
    g.fillText('шифър', S / 2, S / 2 + 10);
  }
  const tex = new T.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}
