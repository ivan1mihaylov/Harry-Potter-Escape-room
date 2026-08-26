/* ============================================================
   ЗАЛА IV — Забранената секция: заклинания и книжен шифър
   ============================================================ */
import { head, $, $$, el, shakeEl, shuffle, answerBar, wireAnswer, norm } from './common.js';
import { IMG, photo } from '../config.js';

export const meta = {
  id: 'library',
  eyebrow: 'Зала IV',
  title: 'Забранената секция',
  sub: 'Книгите тук хапят, крещят и лъжат. Една от тях обаче пази шифър — стига да я накараш да проговори.',
  rune: 'Х',
  bg: 'off',
  tint: '#b98a3a',
  hints: [
    'Свържи всяко заклинание с действието му. „Ридикулус“ е за богърт, „Обливиате“ трие спомени, „Петрификус Тоталус“ сковава тялото.',
    'Координатите се четат така: първото число е <b>редът</b>, второто е <b>думата</b> в този ред, третото е <b>буквата</b> в думата. Броенето започва от 1.',
    'Търсената дума е птица, която гори и се преражда — и е кръстница на един прочут Орден. Шест букви.',
  ],
};

const PAIRS = [
  ['Алохомора', 'отваря заключена врата или прозорец'],
  ['Люмос', 'запалва светлина на върха на пръчката'],
  ['Експелиармус', 'изтръгва пръчката от ръката на противника'],
  ['Уингардиум Левиоса', 'вдига предмет и го задържа във въздуха'],
  ['Ридикулус', 'превръща богърта в нещо смешно'],
  ['Експекто Патронум', 'призовава сребърен пазител срещу диментори'],
  ['Петрификус Тоталус', 'сковава цялото тяло като дъска'],
  ['Обливиате', 'изтрива спомен от съзнанието'],
];

const PASSAGE = [
  'Забранената секция пази книги които не желаят да бъдат четени',
  'Всяка страница помни пръстите на онзи който я е отгърнал',
  'Фенерът на пазача угасва щом мракът поиска тишина',
  'Крилата на нощната птица чертаят кръгове над кулата',
  'Истината се крие между редовете а не в самите тях',
  'Само смелият ще намери думата скрита в старата хроника',
  'Некромантите шептят имена които никой не бива да повтаря',
  'Свещта изгаря бързо когато книгата стои отворена цяла нощ',
];
const TARGET = 'ФЕНИКС';

/* координатите се изчисляват от самия текст — значи винаги са верни */
const COORDS = (() => {
  const used = new Set();
  const out = [];
  let start = 0;
  for (const ch of TARGET) {
    let found = null;
    search:
    for (let li = 0; li < PASSAGE.length; li++) {
      const L = (start + li) % PASSAGE.length;
      const words = PASSAGE[L].split(' ');
      for (let wi = 0; wi < words.length; wi++) {
        const w = words[wi].toUpperCase();
        const idx = w.indexOf(ch);
        if (idx >= 0 && !used.has(`${L}|${wi}|${idx}`)) {
          used.add(`${L}|${wi}|${idx}`);
          found = { l: L + 1, w: wi + 1, c: idx + 1 };
          start = (L + 3) % PASSAGE.length;
          break search;
        }
      }
    }
    out.push(found);
  }
  return out;
})();

export function mount(root, api) {
  const d = api.data;
  if (!d.matched) d.matched = [];
  if (d.opened == null) d.opened = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel lib-panel">
      ${photo(IMG.library, 0.12)}
      <p class="panel-title">Каталогът на мадам Пинс</p>
      <p class="center muted" style="max-width:660px;margin:-4px auto 16px;font-size:.95rem">
        Осемте заклинания са разпилени. Докосни заклинание, после действието му.
        Всяка правилна двойка запечатва по един ключ на бравата на шкафа.</p>
      <div class="match-grid">
        <div class="match-col" id="col-spell"></div>
        <div class="match-col" id="col-effect"></div>
      </div>
      <div class="match-progress"><div id="match-bar"></div></div>
      <div id="book-host"></div>
    </div>`;

  renderMatch(api);
  if (d.opened || api.solved) renderBook(api, api.solved);
}

let sel = null;

function renderMatch(api) {
  const d = api.data;
  const spells = shuffle(PAIRS.map((p, i) => ({ t: p[0], i })), 13);
  const effects = shuffle(PAIRS.map((p, i) => ({ t: p[1], i })), 29);
  const cs = $('#col-spell'), ce = $('#col-effect');
  cs.innerHTML = ''; ce.innerHTML = '';

  const make = (item, kind) => {
    const done = d.matched.includes(item.i);
    const b = el('button', `match-item ${kind}` + (done ? ' done' : ''), item.t);
    b.dataset.i = item.i;
    if (!done) b.addEventListener('click', () => pick(api, b, kind, item.i));
    return b;
  };
  spells.forEach(s => cs.appendChild(make(s, 'spell')));
  effects.forEach(e => ce.appendChild(make(e, 'effect')));
  bar(api);
}

function bar(api) {
  const b = $('#match-bar');
  if (b) b.style.width = (api.data.matched.length / PAIRS.length * 100) + '%';
}

function pick(api, node, kind, idx) {
  api.sfx.click();
  if (!sel) { sel = { kind, idx, node }; node.classList.add('sel'); return; }
  if (sel.kind === kind) { sel.node.classList.remove('sel'); sel = { kind, idx, node }; node.classList.add('sel'); return; }

  if (sel.idx === idx) {
    const d = api.data;
    d.matched.push(idx); api.saveData();
    [sel.node, node].forEach(n => { n.classList.remove('sel'); n.classList.add('done'); n.disabled = true; });
    api.fx.sparksFrom(node, { count: 14, color: '#ffe9a8', spread: 100 });
    api.sfx.chime();
    sel = null;
    bar(api);
    if (d.matched.length === PAIRS.length) {
      d.opened = true; api.saveData();
      api.sfx.unlock();
      api.fx.flash('rgba(217,180,91,.22)', 600);
      setTimeout(() => renderBook(api, false), 500);
    }
  } else {
    api.sfx.bad();
    shakeEl(node); shakeEl(sel.node);
    sel.node.classList.remove('sel');
    sel = null;
    api.toast('Книгата изсъсква. Тези двете не си принадлежат.', 'bad');
  }
}

/* ---------- книжният шифър ---------- */
function renderBook(api, already) {
  const host = $('#book-host');
  const lines = PASSAGE.map((l, i) => `<div class="pline"><span class="pnum">${i + 1}</span>${l}</div>`).join('');
  const coords = COORDS.map(c => `<span class="coord"><b>${c.l}</b>·<b>${c.w}</b>·<b>${c.c}</b></span>`).join('');

  host.innerHTML = `
    <div class="book-open">
      <div class="book-spread">
        <div class="book-page left">
          <h4>Хрониката на нощния пазач</h4>
          <div class="passage">${lines}</div>
          <p class="pnote">Без препинателни знаци. Броенето започва от единица.</p>
        </div>
        <div class="book-page right">
          <h4>Полето с координати</h4>
          <p class="pnote">ред · дума · буква</p>
          <div class="coords">${coords}</div>
          <p style="margin-top:1em">Шест координати — шест букви. Съберете ги в реда, в който стоят,
          и ще получите името, което Орденът носи.</p>
        </div>
      </div>
      ${answerBar('lib-ans', 'ДУМАТА', 'Изречи')}
    </div>`;

  api.sfx.page();
  wireAnswer(host, 'lib-ans', (val, input) => {
    if (val === TARGET) {
      api.sfx.unlock();
      api.fx.sparksFrom(input, { count: 40, color: '#ffb347', spread: 260 });
      api.fx.flash('rgba(255,150,60,.2)', 700);
      input.disabled = true;
      api.solve('Върху страницата пламва птица и изгаря сама себе си — а от пепелта остава руна.');
    } else {
      api.sfx.bad(); shakeEl(input);
      api.fail('Буквите не се събират в дума. Провери реда и думата.');
    }
  });
  if (already) { const i = $('#lib-ans'); if (i) { i.value = TARGET; i.disabled = true; } }
}
