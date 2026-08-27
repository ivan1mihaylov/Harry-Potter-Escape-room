/* ============================================================
   ЧЕТВЪРТА ЧАСТ · ЗАЛА VI — Списъкът
   Регистърът на четвъртия етаж. Четири килии, четирима
   затворници и осем реда, писани от човек, който е бързал.
   ============================================================ */
import { head, $, $$, answerBar, wireAnswer } from '../rooms/common.js';

export const meta = {
  id: 'a4-list',
  eyebrow: 'Зала VI',
  title: 'Списъкът',
  sub: 'Регистърът е разграфен, но празен. Отстрани, на отделен лист, писарят е нахвърлял осем бележки — и е избягал, преди да ги препише. Днес ги чете {име|друг}.',
  rune: 'Е',
  bg: 'off',
  tint: '#c8b48f',
  hints: [
    { text: 'Започни с двете сигурни бележки: сухото цвете е в килия 3, «името на майка му» — в килия 1. Всичко останало виси на тях.',
      done: d => !!d.filled },
    { text: '«В една килия» значи, че двете неща са в един и същ стълб. «През една килия» значи, че между тях стои точно един стълб — тоест разстоянието е <b>две</b>. «През две» значи разстояние <b>три</b>.',
      done: d => !!d.filled },
    { text: 'Травърс е в килия 1. Оттам нататък бележка 6 («първата целувка е вляво от Долохов») подрежда Роули и Долохов, а Селуин остава последен.',
      done: d => !!d.filled },
  ],
};

const CATS = [
  { key: 'name', label: 'затворник', vals: ['Долохов', 'Роули', 'Селуин', 'Травърс'] },
  { key: 'took', label: 'какво му е отнето', vals: ['първата целувка', 'името на майка му', 'вкуса на хляб', 'гласа на брат му'] },
  { key: 'year', label: 'откога е тук', vals: ['1979', '1981', '1996', '1998'] },
  { key: 'obj', label: 'какво държи', vals: ['счупен гребен', 'сухо цвете', 'дървена лъжица', 'парче огледало'] },
];

/* верният регистър: [килия1, килия2, килия3, килия4] → индекс в vals */
const SOLUTION = {
  name: [3, 1, 0, 2],
  took: [1, 0, 2, 3],
  year: [1, 0, 3, 2],
  obj: [2, 0, 1, 3],
};

const NOTES = [
  '<b>Сухото цвете</b> е в килия <b>3</b>.',
  '«<b>Името на майка му</b>» е взето от онзи в килия <b>1</b>.',
  '<b>Селуин</b> и «<b>гласа на брат му</b>» са в една и съща килия.',
  '<b>Роули</b> е онзи, който е тук от <b>1979</b>.',
  '<b>Селуин</b> и <b>1981</b> са през <b>две</b> килии една от друга.',
  '«<b>Първата целувка</b>» е взета от килия <b>някъде вляво</b> от тази на <b>Долохов</b>.',
  '<b>1996</b> и <b>парчето огледало</b> са в една и съща килия.',
  '«<b>Гласа на брат му</b>» и <b>счупеният гребен</b> са през <b>една</b> килия един от друг.',
];

export function mount(root, api) {
  const d = api.data;
  if (!d.pick) { d.pick = {}; CATS.forEach(c => d.pick[c.key] = [-1, -1, -1, -1]); }
  if (d.filled == null) d.filled = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel">
      <p class="panel-title">Бележките на писаря</p>
      <ol class="notes-list">${NOTES.map(n => `<li>${n}</li>`).join('')}</ol>
    </div>
    <div class="panel">
      <p class="panel-title">Регистърът</p>
      <div class="register" id="register"></div>
      <div class="nono-actions">
        <button class="btn btn-house btn-sm" id="reg-check"><span>Подпиши регистъра</span></button>
        <button class="btn btn-ghost btn-sm" id="reg-clear"><span>Изтрий</span></button>
        <span class="nono-count" id="reg-state"></span>
      </div>
    </div>
    <div class="panel" id="reg-final" hidden>
      <p class="panel-title">Последният ред</p>
      <p>Под таблицата има още един ред, разграфен за отговор. Пазачът на етажа пита само едно, и то без да вдига очи:</p>
      <blockquote class="memory-count">«Днес е <b>1998</b>. Онзи, на когото взехме <b>гласа на брат му</b> — от колко години лежи тук?»</blockquote>
      ${answerBar('reg-in', 'брой години', 'Отговори')}
    </div>`;

  draw(api);
  $('#reg-check').addEventListener('click', () => check(api));
  $('#reg-clear').addEventListener('click', () => {
    if (api.solved || d.filled) return;
    CATS.forEach(c => d.pick[c.key] = [-1, -1, -1, -1]);
    api.saveData(); api.sfx.click(); draw(api);
  });

  wireAnswer(root, 'reg-in', (v, input) => {
    if (api.solved) return;
    if (v === '2' || v === 'ДВЕ' || v === '2ГОДИНИ' || v === 'ДВЕГОДИНИ') {
      api.sfx.unlock();
      api.fx.celebrate(1.3);
      api.solve('Две години. Пазачът кимва, подпечатва реда и оставя между страниците една руна.');
    } else {
      input.value = '';
      api.fail('Не. Виж в своя регистър коя година стои при «гласа на брат му».');
    }
  });

  if (d.filled) openFinal(api);
}

function draw(api) {
  const d = api.data;
  const box = $('#register'); if (!box) return;
  box.innerHTML = [0, 1, 2, 3].map(i => `
    <div class="reg-cell">
      <div class="rc-head">килия ${i + 1}</div>
      ${CATS.map(c => {
        const cur = d.pick[c.key][i];
        const dup = cur >= 0 && d.pick[c.key].filter(v => v === cur).length > 1;
        return `<label class="rc-field${dup ? ' dup' : ''}">
          <span>${c.label}</span>
          <select class="rg-sel" data-k="${c.key}" data-i="${i}" ${d.filled ? 'disabled' : ''}>
            <option value="-1">—</option>
            ${c.vals.map((v, k) => `<option value="${k}"${cur === k ? ' selected' : ''}>${v}</option>`).join('')}
          </select></label>`;
      }).join('')}
    </div>`).join('');

  $$('.rg-sel', box).forEach(s => s.addEventListener('change', () => {
    d.pick[s.dataset.k][+s.dataset.i] = +s.value;
    api.saveData(); api.sfx.tick(); draw(api);
  }));

  const st = $('#reg-state');
  if (st) {
    const total = CATS.reduce((a, c) => a + d.pick[c.key].filter(v => v >= 0).length, 0);
    st.innerHTML = d.filled ? '<b>подписан</b>' : `попълнени <b>${total}</b> от 16`;
  }
}

function check(api) {
  const d = api.data;
  if (d.filled) return;
  for (const c of CATS) {
    const row = d.pick[c.key];
    if (row.some(v => v < 0)) { api.sfx.bad(); api.toast('Има празни полета.', 'bad'); return; }
    if (new Set(row).size !== 4) { api.sfx.bad(); api.fail('Един и същ запис стои на две места. Писарят никога не би допуснал това.'); return; }
  }
  const ok = CATS.every(c => d.pick[c.key].every((v, i) => v === SOLUTION[c.key][i]));
  if (!ok) { api.sfx.bad(); api.fail('Редът не се връзва с бележките.'); return; }
  d.filled = true; api.saveData();
  api.sfx.chime();
  api.fx.flash('rgba(220,200,150,.2)', 700);
  draw(api); openFinal(api);
}

function openFinal(api) {
  const b = $('#reg-final'); if (!b) return;
  b.hidden = false;
  b.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
