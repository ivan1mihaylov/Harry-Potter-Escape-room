/* ============================================================
   ЗАЛА IX — Нужната стая: дневникът на Т. М. Ридъл
   ============================================================ */
import { head, $, $$, el, shakeEl, norm, answerBar, wireAnswer } from './common.js';

export const meta = {
  id: 'diary',
  eyebrow: 'Зала IX',
  title: 'Нужната стая',
  sub: 'Между хилядите изгубени вещи лежи една тетрадка с продупчена корица. Мастилото в нея още е мокро — и още отговаря.',
  rune: 'А',
  bg: 'dim',
  tint: '#7a5fd0',
  hints: [
    'Буквите на „TOM MARVOLO RIDDLE“ се пренареждат в изречение на английски от четири думи: 1 + 2 + 4 + 9 букви.',
    'Изречението започва с „I AM…“. Следват два неща: титла от четири букви и име от девет.',
    'Отговорът е I AM LORD VOLDEMORT. А дневникът беше унищожен с зъб от базилиск — думата, която дневникът иска, е БАЗИЛИСК.',
  ],
};

const SOURCE = 'TOMMARVOLORIDDLE';           // 16 букви
const ANSWER = 'IAMLORDVOLDEMORT';           // 16 букви
const GROUPS = [1, 2, 4, 9];                 // I / AM / LORD / VOLDEMORT

export function mount(root, api) {
  const d = api.data;
  if (!d.slots) d.slots = Array(16).fill(null);   // [индекс на плочка]
  if (d.named == null) d.named = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel diary-panel">
      <div class="grid-2 tilt">
        <div>
          <div class="diary" id="diary">
            <div class="diary-hole"></div>
            <div class="diary-page">
              <p class="ink" id="ink-1"></p>
              <p class="ink" id="ink-2"></p>
              <p class="ink" id="ink-3"></p>
            </div>
          </div>
        </div>
        <div>
          <p class="panel-title">Пренареди буквите</p>
          <p class="muted" style="font-size:.93rem;margin:-6px 0 12px">
            Дневникът е написан на английски, защото авторът му мразеше собственото си име.
            Подреди <b>всички</b> букви от „TOM MARVOLO RIDDLE“ в изречението, което той измисли за себе си.</p>
          <div class="ana-slots" id="ana-slots"></div>
          <div class="ana-tray" id="ana-tray"></div>
          <div class="flex flex-center mt">
            <button class="btn btn-house" id="ana-check"><span>Покажи името</span></button>
            <button class="btn btn-ghost btn-sm" id="ana-clear"><span>Изчисти</span></button>
          </div>
          <div id="final-q"></div>
        </div>
      </div>
    </div>`;

  writeInk(api);
  renderSlots(api); renderTray(api);
  $('#ana-check').addEventListener('click', () => check(api));
  $('#ana-clear').addEventListener('click', () => { api.data.slots = Array(16).fill(null); api.saveData(); api.sfx.click(); renderSlots(api); renderTray(api); });

  if (d.named || api.solved) askFinal(api, api.solved);
}

function writeInk(api) {
  const l1 = 'Здравей. Казвам се Том Ридъл. Как попадна в моя дневник?';
  const l2 = 'Мастилото ми поглъща имена. Дай ми моето — не онова, което ми дадоха, а онова, което си избрах.';
  const l3 = 'Буквите са същите. Само редът е различен.';
  api.fx.typewriter($('#ink-1'), l1, {
    speed: 26, onDone: () => api.fx.typewriter($('#ink-2'), l2, {
      speed: 22, onDone: () => api.fx.typewriter($('#ink-3'), l3, { speed: 30 }),
    }),
  });
  api.sfx.page();
}

function renderSlots(api) {
  const box = $('#ana-slots'); box.innerHTML = '';
  let k = 0;
  GROUPS.forEach((len, gi) => {
    const g = el('div', 'ana-group');
    for (let i = 0; i < len; i++) {
      const idx = k++;
      const t = api.data.slots[idx];
      const s = el('button', 'ana-slot' + (t != null ? ' filled' : ''), t != null ? SOURCE[t] : '');
      s.addEventListener('click', () => {
        if (api.data.named) return;
        if (api.data.slots[idx] != null) {
          api.data.slots[idx] = null; api.saveData(); api.sfx.click();
          renderSlots(api); renderTray(api);
        }
      });
      g.appendChild(s);
    }
    box.appendChild(g);
    if (gi < GROUPS.length - 1) box.appendChild(el('div', 'ana-space'));
  });
}

function renderTray(api) {
  const tray = $('#ana-tray'); tray.innerHTML = '';
  [...SOURCE].forEach((ch, i) => {
    const used = api.data.slots.includes(i);
    const b = el('button', 'ana-tile' + (used ? ' used' : ''), ch);
    b.disabled = used;
    b.addEventListener('click', () => {
      if (api.data.named) return;
      const free = api.data.slots.indexOf(null);
      if (free < 0) { api.toast('Всички места са пълни.', ''); return; }
      api.data.slots[free] = i; api.saveData(); api.sfx.click();
      renderSlots(api); renderTray(api);
    });
    tray.appendChild(b);
  });
}

function check(api) {
  const d = api.data;
  if (d.slots.includes(null)) { api.toast('Използвай всичките шестнайсет букви.', ''); return; }
  const word = d.slots.map(i => SOURCE[i]).join('');
  if (word === ANSWER) {
    d.named = true; api.saveData();
    api.sfx.unlock();
    $('#diary').classList.add('burning');
    api.fx.flash('rgba(120,60,200,.24)', 800);
    api.fx.sparksFrom($('#ana-slots'), { count: 46, color: '#b98aff', spread: 280 });
    $('#ana-check').disabled = true;
    api.toast('Мастилото изкипява. Дневникът разбра, че си го разгадал.', 'magic');
    setTimeout(() => askFinal(api, false), 900);
  } else {
    api.sfx.bad();
    shakeEl($('#ana-slots'));
    api.fail('Мастилото поглъща буквите и ги изплюва обратно. Не е това изречение.');
  }
}

function askFinal(api, already) {
  const host = $('#final-q');
  host.innerHTML = `
    <div class="final-q">
      <p class="ink-red">„Много добре. А сега ми кажи как ще ме убиеш, щом дори Тъмният лорд не можа да ме опази.
      Едно чудовище ми проби корицата. Как се казва то?“</p>
      ${answerBar('diary-ans', 'ИМЕТО', 'Отговори')}
    </div>`;
  wireAnswer(host, 'diary-ans', (val, input) => {
    if (val === 'БАЗИЛИСК' || val === 'ВАСИЛИСК') {
      api.sfx.unlock();
      input.disabled = true;
      api.fx.sparksFrom(input, { count: 40, color: '#7fe0a8', spread: 250 });
      $('#diary').classList.add('dead');
      api.solve('Мастилото изтича на черни струи и страниците се сгърчват. Между тях остава последната руна.');
    } else {
      api.sfx.bad(); shakeEl(input);
      api.fail('Дневникът се киска. Не е това.');
    }
  });
  if (already) { const i = $('#diary-ans'); if (i) { i.value = 'БАЗИЛИСК'; i.disabled = true; } $('#diary').classList.add('dead'); }
}
