/* ============================================================
   ЧЕТВЪРТА ЧАСТ · ЗАЛА III — Оклумантичната стена
   Върху варосаната стена някой е чертал с нокът числа по
   краищата на квадрат десет на десет. Числата са картина.
   ============================================================ */
import { head, $, $$, answerBar, wireAnswer, norm } from '../rooms/common.js';

export const meta = {
  id: 'a4-wall',
  eyebrow: 'Зала III',
  title: 'Оклумантичната стена',
  sub: 'Празна килия. По варта отстрани — колонки числа, драскани с нокът. Затворникът е рисувал единственото, което дименторите не са могли да му вземат.',
  rune: 'Л',
  bg: 'off',
  tint: '#cfd8e6',
  hints: [
    { text: 'Числата отляво на всеки ред казват колко <b>последователни</b> запълнени квадратчета има в него и в какъв ред. «1 1» значи: едно запълнено, поне една празнина, още едно запълнено.',
      done: d => !!d.picture },
    { text: 'Започни с редовете и колоните, в които числата почти запълват десетте квадратчета — там позициите са принудени. Колона 4 и колона 7 имат по <b>7</b> наведнъж.',
      done: d => !!d.picture },
    { text: 'Отбелязвай със <b>×</b> квадратчетата, за които си сигурен, че са празни — те стесняват всичко останало. Второто кликване слага ×, третото изчиства.',
      done: d => !!d.picture },
  ],
};

const SIZE = 10;
const ROWS = [[1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [2, 2], [4], [6], [1, 1], [2], [2]];
const COLS = [[1], [1, 1], [1, 1, 1], [7], [2, 2], [2, 2], [7], [1, 1, 1], [1, 1], [1]];
const GRID = [
  [0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
  [0, 1, 0, 1, 0, 0, 1, 0, 1, 0],
  [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
];

export function mount(root, api) {
  const d = api.data;
  if (!d.cells) d.cells = Array.from({ length: SIZE }, () => Array(SIZE).fill(0)); // 0 празно, 1 запълнено, 2 ×
  if (d.picture == null) d.picture = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel">
      <p class="panel-title">Числата по варта</p>
      <div class="nono-wrap">
        <div class="nono" id="nono"></div>
      </div>
      <div class="nono-actions">
        <button class="btn btn-ghost btn-sm" id="nono-check"><span>Отдръпни се и виж</span></button>
        <button class="btn btn-ghost btn-sm" id="nono-clear"><span>Изтрий всичко</span></button>
        <span class="nono-count" id="nono-count"></span>
      </div>
      <p class="muted center nono-help">Кликни веднъж — запълваш. Втори път — слагаш <b>×</b> (сигурно празно). Трети — изчистваш.</p>
    </div>
    <div class="panel" id="nono-reveal" hidden>
      <p class="panel-title">Стената проговаря</p>
      <div class="nono-picture" id="nono-picture"></div>
      <p>Формата излиза от варта сама, щом отстъпиш две крачки назад. Затворникът е рисувал едно и също нещо десет хиляди пъти — животното, което е трябвало да го пази.</p>
      <p class="muted">Какво е нарисувано на стената? Една дума.</p>
      ${answerBar('nono-in', 'животното', 'Изречи')}
    </div>`;

  draw(api);
  $('#nono-check').addEventListener('click', () => check(api));
  $('#nono-clear').addEventListener('click', () => {
    if (api.solved) return;
    d.cells = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    api.saveData(); draw(api); api.sfx.click();
  });

  wireAnswer(root, 'nono-in', (v, input) => {
    if (api.solved) return;
    if (v === 'ЕЛЕН' || v === 'ПАТРОНУС' || v === 'СРЕБЪРЕНЕЛЕН' || v === 'ЕЛЕНЪТ') {
      api.sfx.unlock();
      api.fx.celebrate(1.4);
      api.solve('Елен. Същият, който те изведе от гората. Под последния ред драскотини е издълбана руна.');
    } else {
      input.value = '';
      api.fail('Не. Погледни пак формата — рогата са горе, тялото долу.');
    }
  });

  if (d.picture) showPicture(api);
}

function draw(api) {
  const d = api.data;
  const box = $('#nono'); if (!box) return;
  const maxR = Math.max(...ROWS.map(r => r.length));
  const maxC = Math.max(...COLS.map(c => c.length));
  box.style.setProperty('--rc', maxR);
  box.style.setProperty('--cc', maxC);
  box.style.gridTemplateColumns = `repeat(${maxR}, var(--nc)) repeat(${SIZE}, var(--nc))`;

  let html = '';
  // горните редове с числата на колоните
  for (let k = 0; k < maxC; k++) {
    for (let i = 0; i < maxR; i++) html += '<div class="nn-pad"></div>';
    for (let c = 0; c < SIZE; c++) {
      const list = COLS[c];
      const v = list[list.length - maxC + k];
      html += `<div class="nn-clue col${c === 4 || c === 9 ? ' sep' : ''}">${v == null ? '' : v}</div>`;
    }
  }
  for (let r = 0; r < SIZE; r++) {
    const list = ROWS[r];
    for (let i = 0; i < maxR; i++) {
      const v = list[list.length - maxR + i];
      html += `<div class="nn-clue row${r === 4 || r === 9 ? ' sep' : ''}">${v == null ? '' : v}</div>`;
    }
    for (let c = 0; c < SIZE; c++) {
      const s = d.cells[r][c];
      html += `<div class="nn-cell${s === 1 ? ' on' : s === 2 ? ' off' : ''}${(c === 4 || c === 9) ? ' vsep' : ''}${(r === 4 || r === 9) ? ' hsep' : ''}"
        data-r="${r}" data-c="${c}">${s === 2 ? '×' : ''}</div>`;
    }
  }
  box.innerHTML = html;

  $$('.nn-cell', box).forEach(cell => {
    cell.addEventListener('click', () => {
      if (api.solved || d.picture) return;
      const r = +cell.dataset.r, c = +cell.dataset.c;
      d.cells[r][c] = (d.cells[r][c] + 1) % 3;
      api.saveData();
      api.sfx.tick();
      draw(api);
    });
    cell.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (api.solved || d.picture) return;
      const r = +cell.dataset.r, c = +cell.dataset.c;
      d.cells[r][c] = d.cells[r][c] === 2 ? 0 : 2;
      api.saveData(); draw(api);
    });
  });

  const filled = d.cells.flat().filter(v => v === 1).length;
  const need = GRID.flat().filter(v => v === 1).length;
  const cnt = $('#nono-count');
  if (cnt) cnt.innerHTML = `запълнени <b>${filled}</b> · трябват <b>${need}</b>`;
}

function check(api) {
  const d = api.data;
  if (d.picture) return;
  let ok = true;
  for (let r = 0; r < SIZE && ok; r++)
    for (let c = 0; c < SIZE; c++)
      if ((d.cells[r][c] === 1 ? 1 : 0) !== GRID[r][c]) { ok = false; break; }
  if (!ok) {
    api.sfx.bad();
    api.fail('Още не се вижда нищо. Числата не се връзват.');
    return;
  }
  d.picture = true; api.saveData();
  api.sfx.chime();
  api.fx.flash('rgba(190,220,255,.25)', 800);
  showPicture(api);
}

function showPicture(api) {
  const box = $('#nono-reveal'); if (!box) return;
  box.hidden = false;
  const pic = $('#nono-picture');
  if (pic && !pic.dataset.on) {
    pic.dataset.on = '1';
    pic.innerHTML = GRID.map((row, r) => row.map((v, c) =>
      `<i class="np${v ? ' on' : ''}" style="--dl:${(r + c) * 26}ms"></i>`).join('')).join('');
  }
  const g = $('#nono');
  if (g) g.classList.add('done');
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
