/* ============================================================
   ШЕСТА ЧАСТ · МЯСТО I — Къщата на Гонт
   Пръстенът на Марволо, а в него — Възкресяващият камък.
   Камъкът вика три сенки. Две от тях лъжат за всичко.
   ============================================================ */
import { head, $, $$ } from '../rooms/common.js';
import { personalizeDOM } from '../state.js';
import { embers, revealPanel, curtain, wait } from './common6.js';

export const meta = {
  id: 'a6-gaunt',
  eyebrow: 'Място I',
  title: 'Къщата на Гонт',
  sub: 'Съборетина в Мраколес, върху чиято врата още виси прикована мъртва змия. Обръщаш камъка три пъти и стаята се напълва с хора, които ги няма.',
  rune: 'Х',
  bg: 'off',
  tint: '#6f8f6a',
  hints: [
    { text: 'Всяка сянка или казва <b>само истина</b>, или <b>само лъжа</b> — и двете ѝ изречения са от един и същи вид. Тръгни от Антиох: ако той казва истината, Игнотус лъже, а тогава изречението на Игнотус за Антиох и Кадмус трябва да е невярно.',
      done: d => !!d.sorted },
    { text: 'Игнотус твърди, че <b>точно двама</b> казват истината. Провери и двете възможности за него — само едната не си противоречи.',
      done: d => !!d.sorted },
    'Антиох лъже, а Кадмус и Игнотус казват истината. Значи пръстенът <b>не е в огнището</b> (Антиох лъже) и <b>не е в кутията</b> (Игнотус) — остава <b>дъската на прага</b>.',
  ],
};

/* ---- проверено с изчерпателно търсене: единствено решение ----
   истинност = (лъжа, истина, истина) · мястото = дъската на прага   */
const SHADES = [
  { name: 'Антиох', sub: 'първият брат — поиска непобедима пръчка',
    says: ['Игнотус лъже.', 'Пръстенът е в огнището.'] },
  { name: 'Кадмус', sub: 'вторият брат — поиска да върне мъртвите',
    says: ['Антиох лъже.', 'Пръстенът е под дъската на прага.'] },
  { name: 'Игнотус', sub: 'третият брат — поиска да го не намерят',
    says: ['Точно двама от нас казват истината.', 'Пръстенът не е в кутията на олтара.'] },
];
const TRUTH = [false, true, true];
const PLACES = ['огнището', 'дъската на прага', 'кутията на олтара'];
const PLACE = 1;

let bg = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.mark) d.mark = [null, null, null];   // 'т' истина · 'л' лъжа
  if (d.sorted == null) d.sorted = false;
  if (d.found == null) d.found = false;
  if (d.worn == null) d.worn = 0;
  api.saveData();

  root.innerHTML = `
    ${head(api)}

    <div class="panel a6-hut">
      <div class="a6-hutbg" id="hut-bg"></div>
      <div class="a6-hut-in">
        <p class="panel-title">Камъкът се обръща три пъти</p>
        <div class="shades" id="shades"></div>
        <p class="center muted stage-help">Всяка сянка казва <b>или само истина, или само лъжа</b>.
        Отсъди за всяка поотделно.</p>
        <div class="flex flex-center mt">
          <button class="btn btn-house btn-sm" id="sh-go"><span>Отсъди</span></button>
          <button class="btn btn-ghost btn-sm" id="sh-clear"><span>Изчисти</span></button>
        </div>
      </div>
    </div>

    <div class="panel" id="p-place" hidden>
      <p class="panel-title">Три места в една стая</p>
      <p class="muted">Сенките избледняват. Остава да вдигнеш ръка към онова, което казаха.</p>
      <div class="place-row" id="places"></div>
    </div>`;

  drawShades(api);
  $('#sh-go').addEventListener('click', () => judge(api));
  $('#sh-clear').addEventListener('click', () => {
    if (api.solved || api.data.sorted) return;
    api.data.mark = [null, null, null]; api.saveData(); api.sfx.click(); drawShades(api);
  });

  if (d.sorted || api.solved) openPlaces(api, true);
  bg = embers($('#hut-bg'), { count: 30, color: '150,190,140', speed: 0.7, size: 1.6 });
  api.onLeave = () => { if (bg) { bg.stop(); bg = null; } };
}

/* ---------- сенките ---------- */
function drawShades(api) {
  const d = api.data;
  const box = $('#shades'); if (!box) return;
  const done = d.sorted || api.solved;
  box.innerHTML = SHADES.map((s, i) => `
    <figure class="shade${done ? ' settled' : ''}${d.mark[i] ? ' marked' : ''}" style="--i:${i}">
      ${ghost(i)}
      <figcaption>
        <b>${s.name}</b><span>${s.sub}</span>
        <ul>${s.says.map(t => `<li>«${t}»</li>`).join('')}</ul>
        <div class="shade-pick">
          <button class="sp${d.mark[i] === 'т' ? ' on' : ''}" data-i="${i}" data-v="т">истина</button>
          <button class="sp${d.mark[i] === 'л' ? ' on' : ''}" data-i="${i}" data-v="л">лъжа</button>
        </div>
      </figcaption>
    </figure>`).join('');

  if (!done) $$('.sp', box).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i;
    api.data.mark[i] = api.data.mark[i] === b.dataset.v ? null : b.dataset.v;
    api.saveData(); api.sfx.tick(); drawShades(api);
  }));
}

function ghost(i) {
  const g = ['#a8d8b0', '#cfd6ff', '#e6d8b0'][i];
  return `<svg viewBox="0 0 120 190" class="ghost" aria-hidden="true">
    <defs>
      <linearGradient id="gg${i}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${g}" stop-opacity=".98"/>
        <stop offset=".5" stop-color="${g}" stop-opacity=".7"/>
        <stop offset=".82" stop-color="${g}" stop-opacity=".3"/>
        <stop offset="1" stop-color="${g}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path class="gbody" fill="url(#gg${i})" d="M60 14c16 0 27 13 27 30 0 11-4 17-4 25 0 12 14 22 14 44 0 26-12 46-12 60 0 8 4 12 4 12H31s4-4 4-12c0-14-12-34-12-60 0-22 14-32 14-44 0-8-4-14-4-25 0-17 11-30 27-30z"/>
    <ellipse class="geye" cx="50" cy="42" rx="5" ry="6.6" fill="#08121a"/>
    <ellipse class="geye" cx="70" cy="42" rx="5" ry="6.6" fill="#08121a"/>
    <path d="M50 60q10 8 20 0" stroke="#08121a" stroke-width="2.6" fill="none" opacity=".65"/>
  </svg>`;
}

function judge(api) {
  const d = api.data;
  if (api.solved || d.sorted) return;
  if (d.mark.some(m => !m)) { api.sfx.bad(); api.toast('Отсъди и трите сенки.', 'bad'); return; }
  const got = d.mark.map(m => m === 'т');
  if (got.some((v, i) => v !== TRUTH[i])) {
    api.sfx.bad(); api.fx.shakeScreen(7, 300);
    api.fail('Стаята потъмнява. Поне една от сенките е отсъдена наопаки.');
    return;
  }
  d.sorted = true; api.saveData();
  api.sfx.chime();
  api.fx.flash('rgba(150,220,160,.2)', 700);
  drawShades(api);
  openPlaces(api, false);
}

/* ---------- трите места ---------- */
function openPlaces(api, silent) {
  const p = $('#p-place'); if (!p) return;
  const box = $('#places');
  box.innerHTML = PLACES.map((t, i) => `
    <button class="place${api.solved && i === PLACE ? ' on' : ''}" data-i="${i}">
      ${placeArt(i)}<span>${t}</span></button>`).join('');
  if (!api.solved) $$('.place', box).forEach(b => b.addEventListener('click', () => pick(api, +b.dataset.i)));
  if (silent) { p.hidden = false; p.classList.add('a6-reveal', 'on'); } else revealPanel(p);
}

function placeArt(i) {
  const art = [
    '<path d="M6 34h36v6H6zM10 34c0-10 6-16 14-16s14 6 14 16" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M18 34c0-6 3-9 6-9s6 3 6 9" fill="#e08a3a" opacity=".8"/>',
    '<path d="M4 22h40v10H4z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M14 22v10M24 22v10M34 22v10" stroke="currentColor" stroke-width="1.6" opacity=".6"/><path d="M22 12l2 8h-4z" fill="currentColor" opacity=".6"/>',
    '<path d="M10 18h28v22H10z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M10 24h28" stroke="currentColor" stroke-width="1.6" opacity=".6"/><circle cx="24" cy="32" r="3" fill="currentColor" opacity=".7"/>',
  ][i];
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${art}</svg>`;
}

function pick(api, i) {
  if (api.solved) return;
  if (i !== PLACE) {
    api.sfx.bad(); api.fx.shakeScreen(6, 260);
    api.fail('Празно. Нещо в стаята се изсмива тихо.');
    return;
  }
  api.data.found = true; api.saveData();
  api.sfx.unlock();
  tempt(api);
}

/* ---------- изненадата: пръстенът пита ---------- */
function tempt(api) {
  curtain((layer, close) => {
    layer.innerHTML = `
      <div class="ring-scene">
        <svg viewBox="0 0 320 320" class="ring-svg" aria-hidden="true">
          <defs>
            <radialGradient id="rglow" cx=".5" cy=".5" r=".5">
              <stop offset="0" stop-color="#ffe9a8" stop-opacity=".55"/>
              <stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="160" cy="160" r="150" fill="url(#rglow)" class="ring-halo"/>
          <circle cx="160" cy="160" r="74" fill="none" stroke="#d9b45b" stroke-width="13"/>
          <circle cx="160" cy="160" r="74" fill="none" stroke="#7a5f22" stroke-width="4" opacity=".7"/>
          <rect x="132" y="60" width="56" height="56" rx="7" fill="#141018" stroke="#c9b07a" stroke-width="3"/>
          <path d="M160 72l22 34h-44z" fill="none" stroke="#e6d8b0" stroke-width="2.6"/>
          <circle cx="160" cy="96" r="9" fill="none" stroke="#e6d8b0" stroke-width="2.6"/>
          <path d="M160 72v48" stroke="#e6d8b0" stroke-width="2.6"/>
        </svg>
        <p class="ring-line">Пръстенът лежи в дланта ти и е топъл, {име}.</p>
        <p class="ring-sub">Камъкът вътре още се върти. Три обръщания и ще видиш когото поискаш —
        не сянка, а <b>него</b>. Толкова близо, че да чуеш дишането.</p>
        <div class="ring-choice">
          <button class="btn btn-ghost" id="ring-wear"><span>Сложи го на пръста си</span></button>
          <button class="btn btn-house" id="ring-break"><span>Строши го със зъба на базилиска</span></button>
        </div>
      </div>`;

    layer.querySelector('#ring-wear').addEventListener('click', () => {
      const sc = layer.querySelector('.ring-scene');
      sc.classList.add('cursed');
      api.sfx.bad();
      api.fx.shakeScreen(14, 900);
      api.fail('Ръката ти почернява до китката. Дъмбълдор загуби година живот за същата грешка.', 45000);
      layer.querySelector('.ring-line').innerHTML =
        'Пръстите ти почерняват, преди камъкът да е спрял да се върти.';
      layer.querySelector('.ring-sub').innerHTML =
        'Пуснал си го навреме — но не защото си бил по-силен. Защото <b>{име}</b> е имал късмет.';
      layer.querySelector('#ring-wear').remove();
      personalizeDOM(layer);
    });

    layer.querySelector('#ring-break').addEventListener('click', async () => {
      layer.querySelector('.ring-choice').remove();
      layer.querySelector('.ring-svg').classList.add('shatter');
      api.sfx.unlock();
      api.fx.shakeScreen(10, 600);
      layer.querySelector('.ring-line').innerHTML = 'Зъбът минава през камъка като през лед.';
      layer.querySelector('.ring-sub').innerHTML =
        'Отвътре излиза писък, който не е нито мъжки, нито женски, и се разнася нагоре през дупката в покрива.';
      await wait(1500);
      close();
      api.fx.celebrate(1.5);
      api.solve('Пръстенът е две половини и черна пепел. Върху дъската на прага, там където беше скрит, остава руна.');
    });
  }, { cls: 'ring-curtain' });
}
