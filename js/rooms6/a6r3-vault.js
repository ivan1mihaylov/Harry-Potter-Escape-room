/* ============================================================
   ШЕСТА ЧАСТ · МЯСТО III — Трезорът на Лестрейндж
   Джеминио и Фламгранте: всичко, което докоснеш, се удвоява
   и пари. Ключалката брои докосванията, не златото.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { canvasLayer, revealPanel, wait, rnd, sprite } from './common6.js';

export const meta = {
  id: 'a6-vault',
  eyebrow: 'Място III',
  title: 'Трезорът на Лестрейндж',
  sub: 'Дълбоко под «Гринготс», зад дракон и водопад. Един-единствен галеон лежи на плочата — а гоблинската ключалка чака да види точно деветдесет и един.',
  rune: 'Р',
  bg: 'off',
  tint: '#d8b45b',
  hints: [
    { text: 'Двете заклинания са само две действия: <b>×2</b> и <b>+1</b>. Тръгваш от 1 и трябва да стигнеш точно 91 — но ключалката брои и <b>колко пъти</b> си пипал.',
      done: d => !!d.cracked },
    { text: 'Смятай <b>наопаки</b>: от 91 назад. Щом числото е нечетно, преди него е било с едно по-малко; щом е четно — било е наполовина. Така пътят се намира сам.',
      done: d => !!d.cracked },
    'Десет докосвания: 1 → 2 → 4 → 5 → 10 → 11 → 22 → 44 → 45 → 90 → 91. Тоест ×2, ×2, +1, ×2, +1, ×2, ×2, +1, ×2, +1.',
  ],
};

/* проверено изчерпателно: 91 не се стига за по-малко от 10 докосвания */
const TARGET = 91;
const TOUCHES = 10;

let pile = null;

export function mount(root, api) {
  const d = api.data;
  if (d.n == null) { d.n = 1; d.hist = []; }
  if (d.cracked == null) d.cracked = false;
  if (d.cup == null) d.cup = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}

    <div class="panel">
      <p class="panel-title">Гравирано върху вратата на трезора</p>
      <blockquote class="doors-rule">«Каквото пипнеш, се раздвоява. Каквото пипнеш, гори.
      Ключалката се отваря на <b>${TARGET}</b> монети — и само ако си я пипнал точно
      <b>${TOUCHES}</b> пъти.»</blockquote>
    </div>

    <div class="panel vault-panel">
      <div class="vault-gold" id="vault-gold"></div>
      <div class="vault-in">
        <div class="vault-count">
          <span class="vc-n" id="vc-n">1</span>
          <span class="vc-of">от ${TARGET} монети</span>
          <span class="vc-t" id="vc-t">докосвания: 0 от ${TOUCHES}</span>
        </div>
        <div class="vault-tape" id="vault-tape"></div>
        <div class="flex flex-center mt vault-ops">
          <button class="btn btn-house" id="op-x2"><span>Джеминио · ×2</span></button>
          <button class="btn btn-house" id="op-p1"><span>Още една · +1</span></button>
          <button class="btn btn-ghost btn-sm" id="op-undo"><span>Върни</span></button>
          <button class="btn btn-ghost btn-sm" id="op-reset"><span>Отначало</span></button>
        </div>
        <p class="center muted stage-help">Прехвърлиш ли 91, ключалката не прощава — златото не се маха.</p>
      </div>
    </div>

    <div class="panel" id="p-cup" hidden>
      <p class="panel-title">Ключалката щраква</p>
      <p>Купчината застива. Между галеоните, на най-горния рафт, стои малка златна чаша
      с язовец, гравиран отстрани — и тя единствена не се е удвоила нито веднъж.</p>
      <div class="flex flex-center mt">
        <button class="btn btn-house" id="cup-take"><span>Свали чашата с меча</span></button>
      </div>
    </div>`;

  paint(api);
  $('#op-x2').addEventListener('click', () => op(api, '×2'));
  $('#op-p1').addEventListener('click', () => op(api, '+1'));
  $('#op-undo').addEventListener('click', () => {
    const d2 = api.data;
    if (api.solved || d2.cracked || !d2.hist.length) return;
    d2.hist.pop(); replay(d2); api.saveData(); api.sfx.click(); paint(api);
  });
  $('#op-reset').addEventListener('click', () => {
    const d2 = api.data;
    if (api.solved || d2.cracked) return;
    d2.hist = []; replay(d2); api.saveData(); api.sfx.click(); paint(api);
  });
  if (d.cracked || api.solved) openCup(api, true);

  pile = makePile($('#vault-gold'));
  pile.set(d.n);
  api.onLeave = () => { if (pile) { pile.stop(); pile = null; } };
}

function replay(d) {
  d.n = 1;
  d.hist.forEach(o => { d.n = o === '×2' ? d.n * 2 : d.n + 1; });
}

function op(api, kind) {
  const d = api.data;
  if (api.solved || d.cracked) return;
  const next = kind === '×2' ? d.n * 2 : d.n + 1;
  if (d.hist.length >= TOUCHES) {
    api.sfx.bad(); api.fx.shakeScreen(6, 250);
    api.fail(`Единадесето докосване. Ключалката брои до ${TOUCHES} и започва отначало.`);
    d.hist = []; replay(d); api.saveData(); paint(api); if (pile) pile.set(d.n);
    return;
  }
  d.hist.push(kind); d.n = next; api.saveData();
  api.sfx.tick();
  if (pile) pile.burst(kind === '×2');
  paint(api);
  if (pile) pile.set(d.n);

  if (d.n === TARGET && d.hist.length === TOUCHES) {
    d.cracked = true; api.saveData();
    api.sfx.unlock();
    api.fx.flash('rgba(240,205,110,.28)', 900);
    if (pile) pile.freeze();
    paint(api);
    openCup(api, false);
    return;
  }
  if (d.n > TARGET) {
    api.sfx.bad(); api.fx.shakeScreen(9, 400);
    api.fail(`${d.n} монети. Излишното злато не се маха — трезорът се прочиства и почва отначало.`, 40000);
    d.hist = []; replay(d); api.saveData();
    paint(api); if (pile) pile.set(d.n);
    return;
  }
  if (d.hist.length === TOUCHES && d.n !== TARGET) {
    api.sfx.bad();
    api.fail(`Десет докосвания и ${d.n} монети. Ключалката иска точно ${TARGET}.`);
    d.hist = []; replay(d); api.saveData();
    paint(api); if (pile) pile.set(d.n);
  }
}

function paint(api) {
  const d = api.data;
  const n = $('#vc-n'), t = $('#vc-t'), tape = $('#vault-tape');
  if (n) { n.textContent = d.n; n.classList.toggle('hot', d.n > TARGET * 0.7); }
  if (t) t.textContent = `докосвания: ${d.hist.length} от ${TOUCHES}`;
  if (tape) {
    let v = 1;
    tape.innerHTML = `<span class="vt-step">1</span>` + d.hist.map(o => {
      v = o === '×2' ? v * 2 : v + 1;
      return `<span class="vt-op">${o}</span><span class="vt-step">${v}</span>`;
    }).join('');
  }
  const done = d.cracked || api.solved;
  ['#op-x2', '#op-p1', '#op-undo', '#op-reset'].forEach(s => {
    const b = $(s); if (b) b.disabled = done;
  });
}

function openCup(api, silent) {
  const p = $('#p-cup'); if (!p) return;
  if (silent) { p.hidden = false; p.classList.add('a6-reveal', 'on'); } else revealPanel(p);
  const b = $('#cup-take'); if (!b) return;
  if (api.solved) { b.disabled = true; b.querySelector('span').textContent = 'Чашата е унищожена'; return; }
  b.addEventListener('click', async () => {
    b.disabled = true;
    api.data.cup = true; api.saveData();
    api.sfx.unlock();
    api.fx.shakeScreen(10, 700);
    api.fx.flash('rgba(120,220,160,.24)', 800);
    if (pile) pile.collapse();
    await wait(1100);
    api.fx.celebrate(1.5);
    api.solve('Чашата на Хафълпаф изсъсква и се разтваря отвътре навън. Цялото злато около нея угасва в един и същи миг — фалшиво до последната монета. Остава една истинска вещ: руна.');
  });
}

/* ---------- купчината злато ---------- */
/* Монетите са истински галеон (римски аурей от Wikimedia), а не рисувани
   елипси: въртят се, лежат под ъгъл и се нажежават заедно с купчината.   */
function makePile(host) {
  const COIN = sprite('assets/img/galleon.png');
  let coins = [], target = 1, frozen = false, heat = 0;

  const layer = canvasLayer(host, (g, t, W, H) => {
    if (!COIN.ready) return;
    const show = Math.min(coins.length, 220);
    const hot = frozen ? heat : Math.min(1, Math.max(0, target - 24) / 150);
    heat += (hot - heat) * 0.06;
    for (let i = 0; i < show; i++) {
      const c = coins[i];
      const k = Math.min(1, (layer.now() - c.t0) * 2.4);
      if (k <= 0) continue;
      const e = 1 - Math.pow(1 - k, 3);
      const x = (c.x0 + (c.x - c.x0) * e) * W;
      const y = (c.y0 + (c.y - c.y0) * e) * H + Math.sin(t * 1.1 + c.p) * 1.2;
      const r = 13 + c.s * 11;
      g.save();
      g.translate(x, y);
      g.rotate(c.rot + Math.sin(t * 0.4 + c.p) * 0.05);
      g.scale(1, 0.5 + c.tilt * 0.42);           /* лежат, не висят */
      g.globalAlpha = 0.5 + c.s * 0.5;
      g.drawImage(COIN.img, -r, -r, r * 2, r * 2);
      g.restore();
    }
    /* колкото повече злато, толкова по-нажежено — фламгранте */
    if (heat > 0.02) {
      g.globalCompositeOperation = 'overlay';
      g.fillStyle = `rgba(255,90,20,${(heat * 0.17).toFixed(3)})`;
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = 'source-over';
    }
  });

  /* златото се сипе по краищата и надолу — средата остава за четене */
  const seed = i => ({
    x0: 0.5, y0: 0.4,
    x: (rnd(i * 5.1) < 0.5 ? 0.03 + rnd(i * 3.7) * 0.28 : 0.69 + rnd(i * 3.7) * 0.28),
    y: 0.1 + rnd(i * 9.3) * 0.84,
    s: rnd(i * 2.7), p: rnd(i * 3.9) * 6, rot: rnd(i * 7.7) * 6,
    tilt: rnd(i * 4.3), t0: layer.now() + rnd(i * 1.7) * 0.3,
  });

  return {
    stop: layer.stop,
    set(n) {
      target = n;
      const want = Math.min(220, n);
      while (coins.length < want) coins.push(seed(coins.length));
      if (coins.length > want) coins.length = want;
    },
    burst(dbl) {
      host.classList.remove('gem'); void host.offsetWidth;
      host.classList.add(dbl ? 'gem' : 'plus');
      setTimeout(() => host.classList.remove('gem', 'plus'), 600);
    },
    freeze() { frozen = true; host.classList.add('frozen'); },
    collapse() { coins = []; host.classList.add('gone'); },
  };
}
