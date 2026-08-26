/* ============================================================
   ЗАЛА V — Астрономическата кула: небето на рода Блек (3D)
   ============================================================ */
import { head, $, $$, el } from './common.js';
import { createSky } from '../three-sky.js';

export const meta = {
  id: 'astronomy',
  eyebrow: 'Зала V',
  title: 'Астрономическата кула',
  sub: 'Родът Блек кръщавал децата си на звезди. Тази нощ небето иска да си спомниш кое дете на коя звезда принадлежи — и в какъв ред.',
  rune: 'О',
  bg: 'stars',
  tint: '#8fa8ff',
  hints: [
    'Всички търсени имена са от рода Блек или от съзвездията: Сириус, Белатрикс, Драко, Регулус, Андромеда. Останалите звезди са примамки.',
    'Регулус остави бележка, подписана с инициалите Р.А.Б. Андромеда е майката на Нимфадора Тонкс и е изгорена от родословното дърво.',
    'Редът е точно този на загадките: Сириус → Белатрикс → Драко → Регулус → Андромеда.',
  ],
};

const STARS = [
  { id: 'sirius',    name: 'Сириус',    t: 0.35, p: 0.15, m: 1.8 },
  { id: 'bellatrix', name: 'Белатрикс', t: 1.25, p: 0.55, m: 1.3 },
  { id: 'draco',     name: 'Драко',     t: 2.45, p: 0.95, m: 1.2 },
  { id: 'regulus',   name: 'Регулус',   t: 3.55, p: -0.25, m: 1.4 },
  { id: 'andromeda', name: 'Андромеда', t: 4.75, p: 0.35, m: 1.1 },
  { id: 'cassiopeia',name: 'Касиопея',  t: 5.65, p: 0.85, m: 1.0 },
  { id: 'merope',    name: 'Меропа',    t: 0.95, p: -0.75, m: .9 },
  { id: 'alphard',   name: 'Алфард',    t: 2.05, p: -0.55, m: 1.0 },
  { id: 'arcturus',  name: 'Арктур',    t: 3.15, p: 0.75, m: 1.2 },
  { id: 'pollux',    name: 'Полукс',    t: 4.15, p: -0.65, m: 1.0 },
  { id: 'orion',     name: 'Орион',     t: 5.15, p: -0.35, m: 1.1 },
  { id: 'lyra',      name: 'Лира',      t: 1.75, p: 0.25, m: .9 },
];

const LINKS = [
  ['sirius', 'merope'], ['merope', 'bellatrix'], ['bellatrix', 'lyra'],
  ['lyra', 'draco'], ['draco', 'alphard'], ['alphard', 'arcturus'],
  ['arcturus', 'regulus'], ['regulus', 'pollux'], ['pollux', 'andromeda'],
  ['andromeda', 'orion'], ['orion', 'cassiopeia'], ['cassiopeia', 'sirius'],
];

const RIDDLES = [
  { id: 'sirius',    q: 'Куче, което не е куче. Кръстник, обявен за убиец, избягал от Азкабан.' },
  { id: 'bellatrix', q: 'Най-верният войник на Тъмния лорд. Уби собствения си братовчед в Отдела на мистериите.' },
  { id: 'draco',     q: 'Момче с платинена коса, което цял живот се опитваше да бъде страшно.' },
  { id: 'regulus',   q: 'Братът, който открадна медальона и подписа бележката си само с три инициала.' },
  { id: 'andromeda', q: 'Сестрата, изгорена от родословното дърво, защото се влюби в мъж от мъгълски род. Майка на Нимфадора.' },
];

let sky = null;

export function mount(root, api) {
  const d = api.data;
  if (!d.picked) d.picked = [];
  api.saveData();

  root.innerHTML = `
    ${head(api)}
    <div class="panel sky-panel">
      <div class="grid-2 tilt">
        <div>
          <p class="panel-title">Дневникът на професор Синистра</p>
          <div class="parchment">
            <p>„Небето над кулата се подчинява на имена. Докосни петте звезди <b>в реда на записките</b>.
            Сгрешиш ли — небето се завърта отначало.“</p>
            <ol class="riddle-list" id="riddles"></ol>
          </div>
          <div class="sky-status" id="sky-status"></div>
        </div>
        <div>
          <p class="panel-title">Небесната сфера</p>
          <div class="sky-box" id="sky-box"><div class="sky-loading">Небето се разгръща…</div></div>
          <p class="center muted" style="font-size:.85rem;margin-top:8px">
            Влачи, за да завъртиш небето. Колелцето на мишката приближава и отдалечава.</p>
        </div>
      </div>
    </div>`;

  renderRiddles(api);

  createSky($('#sky-box'), STARS, LINKS, (id, node) => pick(api, id, node)).then(s => {
    sky = s;
    const box = $('#sky-box');
    const ld = box.querySelector('.sky-loading'); if (ld) ld.remove();
    if (!s.is3D) api.toast('3D библиотеката не се зареди — небето е в равнинен вид, но загадката е същата.', '');
    // възстановяване на вече избраните
    api.data.picked.forEach((id, i) => {
      s.mark(id, i + 1);
      if (i) s.connect(api.data.picked[i - 1], id);
    });
    if (api.solved) RIDDLES.forEach((r, i) => { if (!api.data.picked.includes(r.id)) s.mark(r.id, i + 1); });
  });

  api.onLeave = () => { if (sky) { sky.dispose(); sky = null; } };
}

function renderRiddles(api) {
  const list = $('#riddles');
  list.innerHTML = '';
  RIDDLES.forEach((r, i) => {
    const done = api.data.picked[i] === r.id;
    const li = el('li', 'riddle-item' + (done ? ' done' : '') + (api.data.picked.length === i ? ' active' : ''),
      `<span class="ri-n">${i + 1}</span><span>${r.q}</span>${done ? `<b class="ri-ans">${STARS.find(s => s.id === r.id).name}</b>` : ''}`);
    list.appendChild(li);
  });
  const st = $('#sky-status');
  if (st) st.innerHTML = api.solved
    ? `<div class="solved-line">Небето е подредено.</div>`
    : `<div class="solved-line">Открити звезди: <b>${api.data.picked.length}</b> от 5</div>`;
}

function pick(api, id, node) {
  if (api.solved) return;
  const d = api.data;
  const step = d.picked.length;
  if (step >= RIDDLES.length) return;

  if (RIDDLES[step].id === id) {
    d.picked.push(id); api.saveData();
    api.sfx.chime();
    sky.mark(id, d.picked.length);
    if (d.picked.length > 1) sky.connect(d.picked[d.picked.length - 2], id);
    api.fx.sparksFrom(node, { count: 22, color: '#cfe0ff', spread: 140 });
    renderRiddles(api);
    if (d.picked.length === RIDDLES.length) {
      api.sfx.unlock();
      api.fx.flash('rgba(150,180,255,.24)', 800);
      setTimeout(() => api.solve('Петте звезди пламват в една линия и изгарят руна върху каменния под.'), 700);
    }
  } else {
    api.sfx.bad();
    api.fx.shakeScreen(9, 420);
    d.picked = []; api.saveData();
    sky.reset();
    renderRiddles(api);
    api.fail('Небето изтръпва и се завърта. Редът се нулира — започни отново от първата загадка.');
  }
}
