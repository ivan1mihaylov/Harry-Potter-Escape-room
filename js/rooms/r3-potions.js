/* ============================================================
   ЗАЛА III — Подземието на отварите: седемте шишенца на Снейп
   ============================================================ */
import { head, $, $$, el, shakeEl, mountQuiz } from './common.js';
import { bottleSVG } from '../art.js';

export const meta = {
  id: 'potions',
  eyebrow: 'Зала III',
  title: 'Подземието на отварите',
  sub: 'Черен огън пред теб, лилав — зад теб. На масата седем шишенца, а логиката е единственият ти чадър срещу отровата.',
  rune: 'А',
  bg: 'off',
  tint: '#7bd4a6',
  hints: [
    'Първо трите въпроса на Снейп от първия урок по отвари. Асфодел и пелин дават най-силната приспивателна отвара; безоарът се вади от стомаха на коза; аконит и клобук на монах са едно и също растение.',
    'Започни от правилото „отровата винаги е точно вляво от виното от коприва“. Значи в шишенце №1 не може да има вино.',
    'Второто отляво (№2) и второто отдясно (№6) са едно и също питие. Ако и двете бяха отрова, нямаше да останат достатъчно отрови за останалите правила — значи и двете са вино от коприва. Оттам: №1 и №5 са отрова.',
    'Краищата са различни и никой от тях не води напред, а джуджето (№3) и великанът (№6) не са отрова. Подредбата е: отрова, вино, НАПРЕД, отрова, отрова, вино, НАЗАД.',
  ],
};

/* истинското съдържание: P=отрова, W=вино, F=напред, B=назад */
const TRUTH = ['P', 'W', 'F', 'P', 'P', 'W', 'B'];
const HEIGHTS = [8, 11, 4, 10, 7, 15, 12];         // см — джуджето е №3, великанът е №6
const TINTS = ['#6c8f5a', '#8f6c9a', '#5a8f9a', '#9a7a5a', '#8f5a5a', '#5a6c9a', '#9a8f5a'];

const LABELS = { '': '—', P: 'Отрова', W: 'Вино', F: 'Напред', B: 'Назад' };
const CYCLE = ['', 'P', 'W', 'F', 'B'];

export function mount(root, api) {
  const d = api.data;
  if (!d.marks) d.marks = ['', '', '', '', '', '', ''];
  if (d.verified == null) d.verified = false;
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel potion-panel">
      <div class="black-fire"></div>
      <div id="snape-quiz"></div>
      <div class="grid-2 tilt" id="bottles-stage" hidden>
        <div>
          <p class="panel-title">Свитъкът до шишенцата</p>
          <div class="parchment riddle">
            <p><i>„Опасност пред теб, спасение — назад,<br>
            две от нас ще ти помогнат, ако ги откриеш млад.<br>
            Едно от седемте ще те пусне да минеш,<br>
            друго ще те върне там, откъдето си тръгнал.<br>
            Две от нас крият само вино от коприва,<br>
            три са убийци, чакащи в редицата мълчаливо.“</i></p>
            <ul class="clue-list">
              <li>Колкото и хитро да се крие отровата, винаги ще намериш такава <b>непосредствено вляво</b> от виното от коприва.</li>
              <li><b>Различни</b> са тези по двата края, но ако искаш да продължиш напред — <b>нито един от тях</b> не ти е приятел.</li>
              <li>Всички са с различна големина; нито <b>джуджето</b>, нито <b>великанът</b> крият смърт в утробите си.</li>
              <li><b>Второто отляво</b> и <b>второто отдясно</b> са близнаци на вкус, макар на вид различни.</li>
            </ul>
            <p style="font-size:.9rem">Цветът на стъклото не издава нищо. Само височината и мястото говорят.</p>
          </div>
        </div>
        <div>
          <p class="panel-title">Масата със седемте шишенца</p>
          <p class="muted center" style="font-size:.9rem;margin:-4px 0 12px">
            Докосвай шишенце, за да сменяш етикета му: <b>—</b> → Отрова → Вино → Напред → Назад.</p>
          <div class="bottles" id="bottles"></div>
          <div class="center mt">
            <button class="btn btn-house" id="verify"><span>Провери разсъждението</span></button>
          </div>
          <div id="drink-host"></div>
        </div>
      </div>
    </div>`;

  mountQuiz($('#snape-quiz'), {
    api, key: 'quiz',
    title: 'Първият урок на професор Снейп',
    intro: 'Портретът на Снейп над казана няма да те пусне до масата, докато не отговориш. Три въпроса — същите като преди трийсет години.',
    doneText: 'Портретът се дръпва настрани с презрение. Масата е твоя.',
    questions: [
      { q: '„Какво ще получа, ако добавя стрит корен от асфодел към запарка от пелин?“',
        opts: [
          { t: 'Смъртоносен сън.', ok: true },
          { t: 'Многоликова отвара.', ok: false, r: 'Не. Тя иска съвсем други съставки — и месец чакане.' },
          { t: 'Феликс Фелицис.', ok: false, r: 'Течният късмет се вари шест месеца и не от тези две неща.' },
        ] },
      { q: '„Къде ще потърсиш, ако ти кажа да ми намериш безоар?“',
        opts: [
          { t: 'В стомаха на коза.', ok: true },
          { t: 'В склада на билкарството.', ok: false, r: 'Безоарът не расте. Изважда се.' },
          { t: 'В Забранената гора, под корените на дъб.', ok: false, r: 'Това не е гъба.' },
        ] },
      { q: '„Каква е разликата между аконит и клобук на монах?“',
        opts: [
          { t: 'Никаква — това е едно и също растение.', ok: true },
          { t: 'Едното е отровно, другото — лечебно.', ok: false, r: 'И двете имена сочат едно растение.' },
          { t: 'Едното расте в Англия, другото — в Албания.', ok: false, r: 'Въпросът беше по-прост, отколкото изглежда.' },
        ] },
    ],
    onDone: () => { const st = $('#bottles-stage'); if (st) st.hidden = false; },
  });

  renderBottles(api);
  $('#verify').addEventListener('click', () => verify(api));
  if (api.data.verified || api.solved) showDrink(api, api.solved);
}

function renderBottles(api) {
  const box = $('#bottles');
  box.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const m = api.data.marks[i];
    const b = el('div', 'bottle mark-' + (m || 'none'));
    b.innerHTML = `
      <div class="bottle-glass" style="height:${Math.round(58 + (HEIGHTS[i] / 15) * 96)}px">${bottleSVG(i, HEIGHTS[i] / 15, TINTS[i])}</div>
      <div class="bottle-h">${HEIGHTS[i]} см</div>
      <div class="bottle-tag">${LABELS[m]}</div>
      <div class="bottle-no">${i + 1}</div>`;
    b.addEventListener('click', () => {
      if (api.data.verified) { drink(api, i, b); return; }
      const cur = CYCLE.indexOf(api.data.marks[i]);
      api.data.marks[i] = CYCLE[(cur + 1) % CYCLE.length];
      api.saveData(); api.sfx.click();
      renderBottles(api);
    });
    box.appendChild(b);
  }
  if (api.data.verified) box.classList.add('ready');
}

function verify(api) {
  const m = api.data.marks;
  if (m.some(x => !x)) { api.toast('Всяко шишенце трябва да получи етикет.', ''); return; }
  const count = t => m.filter(x => x === t).length;
  if (count('P') !== 3 || count('W') !== 2 || count('F') !== 1 || count('B') !== 1) {
    api.sfx.bad(); shakeEl($('#bottles'));
    api.fail('Свитъкът казва ясно: три отрови, две вина, едно напред, едно назад.');
    return;
  }
  if (m.join('') !== TRUTH.join('')) {
    api.sfx.bad();
    api.fx.shakeScreen(8, 420);
    $$('.bottle').forEach(shakeEl);
    api.fail('Черният огън изсъсква. Поне едно от разсъжденията ти е грешно.');
    return;
  }
  api.data.verified = true; api.saveData();
  api.sfx.unlock();
  api.fx.flash('rgba(120,220,170,.22)', 600);
  api.toast('Логиката ти издържа. Сега — най-трудното: да я изпиеш.', 'ok');
  $('#verify').disabled = true;
  renderBottles(api);
  showDrink(api, false);
}

function showDrink(api, already) {
  const host = $('#drink-host');
  host.innerHTML = `<div class="drink-note">
    <p class="center">Разсъждението е заключено. Сега <b>изпий</b> шишенцето, което води напред,
    като докоснеш него, и <b>само него</b>.</p></div>`;
  $('#verify').disabled = true;
  if (already) host.innerHTML = `<div class="drink-note"><p class="center">Черният огън се е разтворил пред теб отдавна.</p></div>`;
}

function drink(api, i, node) {
  if (api.solved) return;
  if (TRUTH[i] === 'F') {
    api.sfx.spell();
    node.classList.add('drunk');
    api.fx.sparksFrom(node, { count: 40, color: '#8ef0c0', spread: 240 });
    api.fx.flash('rgba(140,255,200,.25)', 700);
    $('.black-fire').classList.add('parting');
    setTimeout(() => api.solve('Ледът пропълзява по вените ти — и черният огън се разтваря като завеса.'), 900);
  } else if (TRUTH[i] === 'B') {
    api.sfx.whoosh();
    api.fx.shakeScreen(10, 500);
    api.fail('Лилавият огън те дръпва назад. Загуби време, но не и живота си.');
  } else {
    api.sfx.bad();
    api.fx.flash('rgba(150,60,180,.3)', 700);
    api.fx.shakeScreen(14, 600);
    api.fail(TRUTH[i] === 'P'
      ? 'Отрова. Безоарът в джоба ти спасява живота ти, но не и минутите.'
      : 'Вино от коприва. Топло, безполезно и скъпо струващо.');
  }
}
