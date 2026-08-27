/* ============================================================
   ЗАЛА X — Огледалото Еиналеж: последната ключалка
   ============================================================ */
import { head, $, $$, el, shakeEl, norm } from './common.js';
import { IMG, photo } from '../config.js';

export const meta = {
  id: 'mirror',
  eyebrow: 'Зала X · финал',
  title: 'Огледалото Еиналеж',
  sub: 'В празна зала стои огледало с крака като лапи. Върху рамката му е издълбано изречение, което не се чете отляво надясно. Зад стъклото стои {име|ти} — и вратата навън.',
  rune: null,
  bg: 'dim',
  tint: '#e8d9a8',
  hints: [
    'Надписът върху рамката се чете в огледало: обърни го отзад напред и разделѝ думите наново.',
    'Деветте руни са букви на едно-единствено заклинание — най-простото, което всеки първокурсник учи, за да отваря заключено.',
    'Заклинанието е АЛОХОМОРА. А от огледалото камъкът излиза само при онзи, който иска да го намери, но не и да го използва.',
  ],
};

const SPELL = 'АЛОХОМОРА';
const INSCRIPTION = 'итотецр ъсан аже нп окаи тот ец иленм авз ак опзА';

export function mount(root, api) {
  const d = api.data;
  const runes = api.allRunes();                       // 9 събрани букви
  if (!d.slots) d.slots = Array(SPELL.length).fill(null);
  if (d.spelled == null) d.spelled = false;
  if (d.answered == null) d.answered = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel mirror-panel">
      ${photo(IMG.mirror, 0.10)}
      <div class="grid-2 tilt">
        <div>
          <div class="mirror-frame">
            <div class="mirror-glass">
              <div class="mirror-shine"></div>
              <div class="mirror-text" id="mirror-text">
                <p>Виждаш себе си — но по-стар, по-спокоен и от външната страна на портата.</p>
              </div>
            </div>
            <div class="mirror-inscription">${INSCRIPTION}</div>
          </div>
        </div>
        <div>
          <p class="panel-title">Деветте руни</p>
          <p class="muted" style="font-size:.94rem;margin:-6px 0 12px">
            Всяка зала ти даде по една буква. Подреди ги в заклинанието, което отваря заключеното —
            и го изречи пред стъклото.</p>
          <div class="spell-slots" id="spell-slots"></div>
          <div class="rune-tray" id="rune-tray"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-house" id="spell-check"><span>Изречи заклинанието</span></button>
            <button class="btn btn-ghost btn-sm" id="spell-clear"><span>Изчисти</span></button>
          </div>
          <div id="mirror-q"></div>
        </div>
      </div>
    </div>`;

  renderSlots(api, runes); renderTray(api, runes);
  $('#spell-check').addEventListener('click', () => check(api, runes));
  $('#spell-clear').addEventListener('click', () => { api.data.slots = Array(SPELL.length).fill(null); api.saveData(); api.sfx.click(); renderSlots(api, runes); renderTray(api, runes); });

  if (d.spelled || api.solved) askMirror(api, api.solved);
}

function renderSlots(api, runes) {
  const box = $('#spell-slots'); box.innerHTML = '';
  api.data.slots.forEach((t, i) => {
    const s = el('button', 'spell-slot' + (t != null ? ' filled' : ''), t != null ? runes[t] : '');
    s.addEventListener('click', () => {
      if (api.data.spelled) return;
      if (api.data.slots[i] != null) { api.data.slots[i] = null; api.saveData(); api.sfx.click(); renderSlots(api, runes); renderTray(api, runes); }
    });
    box.appendChild(s);
  });
}

function renderTray(api, runes) {
  const t = $('#rune-tray'); t.innerHTML = '';
  runes.forEach((ch, i) => {
    const used = api.data.slots.includes(i);
    const b = el('button', 'rune-tile' + (used ? ' used' : ''), ch);
    b.disabled = used;
    b.addEventListener('click', () => {
      if (api.data.spelled) return;
      const free = api.data.slots.indexOf(null);
      if (free < 0) return;
      api.data.slots[free] = i; api.saveData(); api.sfx.rune();
      renderSlots(api, runes); renderTray(api, runes);
    });
    t.appendChild(b);
  });
}

function check(api, runes) {
  const d = api.data;
  if (d.slots.includes(null)) { api.toast('Всичките девет руни трябва да са на мястото си.', ''); return; }
  const word = d.slots.map(i => runes[i]).join('');
  if (norm(word) === SPELL) {
    d.spelled = true; api.saveData();
    api.sfx.unlock();
    api.fx.flash('rgba(255,240,200,.3)', 900);
    api.fx.sparksFrom($('#spell-slots'), { count: 60, color: '#ffe9a8', spread: 320 });
    $('#spell-check').disabled = true;
    $('.mirror-frame').classList.add('awake');
    $('#mirror-text').innerHTML = `<p>Стъклото се раздвижва като вода. Отражението ти вдига ръка —
      но не към теб, а към нещо в джоба си.</p>`;
    setTimeout(() => askMirror(api, false), 900);
  } else {
    api.sfx.bad();
    shakeEl($('#spell-slots'));
    api.fail('Стъклото остава стъкло. Буквите не образуват заклинание.');
  }
}

const OPTIONS = [
  { t: 'Онзи, който копнее да живее вечно и да не умре никога.', ok: false, r: 'Тогава щеше да види само собственото си безсмъртие — и щеше да остане пред стъклото завинаги.' },
  { t: 'Онзи, който иска да <b>намери</b> камъка, но не и да го <b>използва</b>.', ok: true, r: '' },
  { t: 'Онзи, който вижда себе си като най-могъщия магьосник на света.', ok: false, r: 'Такъв човек вижда власт. Огледалото не дава власт — само я показва.' },
];

function askMirror(api, already) {
  const host = $('#mirror-q');
  host.innerHTML = `
    <div class="final-q mirror-q">
      <p><i>„Аз показвам не лицето ти, а копнежа на сърцето ти.“</i></p>
      <p>Дъмбълдор скри Философския камък в мен. <b>Кой може да го извади оттук?</b></p>
      <div class="opt-list" id="opts"></div>
    </div>`;
  const list = $('#opts');
  OPTIONS.forEach(o => {
    const b = el('button', 'opt', o.t);
    b.addEventListener('click', () => {
      if (api.solved) return;
      if (o.ok) {
        b.classList.add('right');
        api.sfx.victory();
        api.fx.flash('rgba(255,245,215,.35)', 1200);
        api.fx.celebrate(3);
        $$('.opt').forEach(x => x.disabled = true);
        $('.mirror-frame').classList.add('open');
        $('#mirror-text').innerHTML = `<p class="big-glow">Стъклото се разтваря. Отвъд него — нощен въздух,
          мокра трева и небе без таван.</p>`;
        setTimeout(() => api.solve('Печатът на Основателите се разпада. Ти си свободен.'), 1400);
      } else {
        b.classList.add('wrong');
        api.sfx.bad();
        api.fx.shakeScreen(10, 500);
        api.fail(o.r);
      }
    });
    list.appendChild(b);
  });
  if (already) {
    $$('.opt').forEach((x, i) => { x.disabled = true; if (OPTIONS[i].ok) x.classList.add('right'); });
    $('.mirror-frame').classList.add('awake', 'open');
  }
}
