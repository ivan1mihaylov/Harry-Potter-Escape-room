/* ============================================================
   sorting.js — Разпределителната шапка
   ============================================================ */
import { S, save } from './state.js';
import { hatSVG, HOUSES, crestSVG } from './art.js';
import { sfx } from './audio.js';
import { typewriter, sparksFrom, flash, celebrate } from './fx.js';

const $ = (s) => document.querySelector(s);

const QUESTIONS = [
  {
    q: 'Полунощ е. В коридора пред теб има четири врати. Коя отваряш първа?',
    a: [
      ['Онази, зад която някой вика за помощ.', 'gryffindor'],
      ['Онази, която е заключена с ключалка, каквато не съм виждал.', 'ravenclaw'],
      ['Онази, зад която ми обещаха предимство пред останалите.', 'slytherin'],
      ['Онази, зад която ме чакат хората, с които дойдох.', 'hufflepuff'],
    ],
  },
  {
    q: 'От какво те е най-страх?',
    a: [
      ['Да съм безсилен точно когато трябва да действам.', 'gryffindor'],
      ['Да не разбера нещо важно, което е било пред очите ми.', 'ravenclaw'],
      ['Да бъда забравен, все едно никога не съм съществувал.', 'slytherin'],
      ['Да предам човек, който ми се е доверил.', 'hufflepuff'],
    ],
  },
  {
    q: 'Намираш чужда магическа пръчка в тревата. Какво правиш с нея?',
    a: [
      ['Използвам я още същата нощ, за да защитя някого.', 'gryffindor'],
      ['Изпробвам я — пръчката казва много за човека, който я е носил.', 'ravenclaw'],
      ['Задържам я. Никога не се знае кога ще потрябва втора.', 'slytherin'],
      ['Търся собственика ѝ, колкото и време да ми отнеме.', 'hufflepuff'],
    ],
  },
  {
    q: 'Кои три думи би искал да останат след теб?',
    a: [
      ['Той не отстъпи.', 'gryffindor'],
      ['Той разбра.', 'ravenclaw'],
      ['Той успя.', 'slytherin'],
      ['Той остана.', 'hufflepuff'],
    ],
  },
  {
    q: 'Един предмет ще те придружава до края. Кой избираш?',
    a: [
      ['Меч, който се появява само в ръката на достойния.', 'gryffindor'],
      ['Диадема, която прояснява всяка мисъл.', 'ravenclaw'],
      ['Медальон със змия, който шепне съвети.', 'slytherin'],
      ['Чаша, която никога не се изпразва и стига за всички.', 'hufflepuff'],
    ],
  },
  {
    q: 'И последно: кое качество прави един магьосник наистина голям?',
    a: [
      ['Смелостта да направи първата крачка.', 'gryffindor'],
      ['Умът, който вижда една стъпка напред.', 'ravenclaw'],
      ['Амбицията, която не приема „невъзможно“.', 'slytherin'],
      ['Верността, която не се пречупва.', 'hufflepuff'],
    ],
  },
];

const LINES = [
  'Хм… интересно. Много интересно.',
  'Виждам ъгълчета от теб, които ти още не си виждал.',
  'Не бързай. Отговаряй с онова, което ти хрумва първо.',
  'Аха. Това вече го чух веднъж, преди петдесет години.',
  'Труден си. Обичам трудните.',
  'Почти стигнахме. Още едно…',
];

export function runSorting(onDone) {
  $('#sorting-hat').innerHTML = hatSVG();
  const speech = $('.typed');
  const answers = $('#hat-answers');
  const prog = $('#hat-progress');
  prog.innerHTML = QUESTIONS.map(() => '<i></i>').join('');

  const scores = { gryffindor: 0, slytherin: 0, ravenclaw: 0, hufflepuff: 0 };
  let i = 0;

  const ask = () => {
    if (i >= QUESTIONS.length) return finish();
    const q = QUESTIONS[i];
    answers.innerHTML = '';
    answers.style.pointerEvents = 'none';
    $('#sorting-hat').classList.add('talking');
    sfx.page();
    const intro = i === 0 ? 'Аха — още един. Сложи ме на главата си и не мисли много силно.\n\n' : LINES[i % LINES.length] + '\n\n';
    typewriter(speech, intro + q.q, {
      speed: 22,
      onDone: () => {
        $('#sorting-hat').classList.remove('talking');
        answers.style.pointerEvents = 'auto';
        q.a.forEach(([text, house], k) => {
          const b = document.createElement('button');
          b.className = 'hat-answer';
          b.textContent = text;
          b.style.animation = `hintIn .45s ${k * 0.07}s both`;
          b.addEventListener('click', () => {
            scores[house] += 3;
            // лек бонус на съседните отговори, за да не е чиста аритметика
            scores[q.a[(k + 1) % 4][1]] += 0;
            b.classList.add('chosen');
            sfx.chime();
            sparksFrom(b, { count: 14, color: '#ffe9a8' });
            prog.children[i].classList.add('done');
            answers.style.pointerEvents = 'none';
            i++;
            setTimeout(ask, 520);
          });
          answers.appendChild(b);
        });
      },
    });
  };

  const finish = () => {
    const house = Object.keys(scores).sort((a, b) => scores[b] - scores[a] || a.localeCompare(b))[0];
    S.house = house;
    S.hatAnswers = [];
    save();
    answers.innerHTML = '';
    answers.style.pointerEvents = 'auto';
    prog.innerHTML = '';
    document.body.dataset.house = house;
    $('#sorting-hat').classList.add('talking');
    typewriter(speech, `Няма никакво съмнение. По-добре да си в… ${HOUSES[house].name.toUpperCase()}!`, {
      speed: 46,
      onDone: () => {
        $('#sorting-hat').classList.remove('talking');
        sfx.victory();
        flash('var(--house-glow)', 800);
        celebrate(2.4);
        const card = document.createElement('div');
        card.className = 'house-reveal';
        card.innerHTML = `
          <div class="hr-crest">${crestSVG(house)}</div>
          <h3>${HOUSES[house].name}</h3>
          <p>${HOUSES[house].motto}</p>
          <button class="btn btn-primary" id="hat-go"><span>Влез в замъка</span></button>`;
        answers.appendChild(card);
        document.getElementById('hat-go').addEventListener('click', () => { sfx.door(); onDone(house); });
      },
    });
  };

  ask();
}
