/* ============================================================
   acts.js — четирите части на историята и оценяването
   ============================================================ */
import { OUTSTANDING_MS } from './state.js';

export const ACTS = {
  1: {
    id: 1,
    numeral: 'I',
    title: 'Ключалката на Хогуортс',
    tagline: 'десет зали · девет руни · шестдесет минути',
    spell: 'АЛОХОМОРА',
    sealLine: 'Печатът на Основателите се затваря зад теб',
    endTitle: 'Свободен си',
    endText: `Портата на Хогуортс се затваря зад теб с тихо щракане. Над Забранената гора
              вече изсветлява. Печатът на Основателите е разчупен — от теб.`,
    load: () => Promise.all([
      import('./rooms/r1-platform.js'),
      import('./rooms/r2-greathall.js'),
      import('./rooms/r3-potions.js'),
      import('./rooms/r4-library.js'),
      import('./rooms/r5-astronomy.js'),
      import('./rooms/r6-dada.js'),
      import('./rooms/r7-chamber.js'),
      import('./rooms/r8-gringotts.js'),
      import('./rooms/r9-diary.js'),
      import('./rooms/r10-mirror.js'),
    ]),
  },
  2: {
    id: 2,
    numeral: 'II',
    title: 'Пясъкът на Основателите',
    tagline: 'девет зали · осем руни · шестдесет минути · без милост',
    spell: 'ФИДЕЛИУС',
    sealLine: 'Замъкът се сгъва навътре',
    endTitle: 'Шевът държи',
    endText: `Пясъкът спира. Часовете се подреждат един след друг, както им е редът, и
              слънцето най-после се откъсва от върховете на Забранената гора. Хогуортс те
              забравя в същия миг — точно както поиска заклинанието.`,
    load: () => Promise.all([
      import('./rooms2/a2r1-shadow.js'),
      import('./rooms2/a2r2-orrery.js'),
      import('./rooms2/a2r3-cube.js'),
      import('./rooms2/a2r4-knight.js'),
      import('./rooms2/a2r5-hidden.js'),
      import('./rooms2/a2r6-labyrinth.js'),
      import('./rooms2/a2r7-veil.js'),
      import('./rooms2/a2r8-turner.js'),
      import('./rooms2/a2r9-seal.js'),
    ]),
  },
  3: {
    id: 3,
    numeral: 'III',
    title: 'Гората помни',
    tagline: 'девет поляни · осем руни · шестдесет минути · гората не прощава',
    spell: 'ПАТРОНУС',
    sealLine: 'Дърветата се затварят зад теб',
    endTitle: 'Гората те пусна',
    endText: `Сребърният елен тръгва пред теб и дърветата се разстъпват сами. Зад гърба ти
              Забранената гора се затваря — не враждебно, а както се затваря книга, която
              вече е прочетена докрай.`,
    load: () => Promise.all([
      import('./rooms3/a3r1-edge.js'),
      import('./rooms3/a3r2-centaurs.js'),
      import('./rooms3/a3r3-web.js'),
      import('./rooms3/a3r4-thestrals.js'),
      import('./rooms3/a3r5-moonbeam.js'),
      import('./rooms3/a3r6-stones.js'),
      import('./rooms3/a3r7-moon.js'),
      import('./rooms3/a3r8-heart.js'),
      import('./rooms3/a3r9-patronus.js'),
    ]),
  },
  4: {
    id: 4,
    numeral: 'IV',
    title: 'Крепостта на забравата',
    tagline: 'девет зали · осем руни · шестдесет минути · нищо топло',
    spell: 'ОКЛУМЕНС',
    sealLine: 'Морето се затваря зад лодката',
    endTitle: 'Затворен си — и свободен',
    endText: `Излизаш през портата на Азкабан по същия път, по който влезе, само че този път
              никой не те изпраща. Умът ти е заключен отвътре и ключът е у теб. Над Северно
              море изгрява нещо, което много прилича на сутрин.`,
    load: () => Promise.all([
      import('./rooms4/a4r1-tide.js'),
      import('./rooms4/a4r2-patrol.js'),
      import('./rooms4/a4r3-wall.js'),
      import('./rooms4/a4r4-shards.js'),
      import('./rooms4/a4r5-scales.js'),
      import('./rooms4/a4r6-list.js'),
      import('./rooms4/a4r7-boat.js'),
      import('./rooms4/a4r8-numbers.js'),
      import('./rooms4/a4r9-occlumens.js'),
    ]),
  },
};


/* ---------- оценяване по скалата на СОВА ---------- */
export function grade(ms) {
  const min = ms / 60000;
  if (min > 60) return { key: 'troll', label: 'Тролска', note: 'Успя — но замъкът вече беше започнал да те смята за мебел.', color: '#e0625d' };
  if (ms <= OUTSTANDING_MS) return { key: 'outstanding', label: 'Изключителна', note: 'Дъмбълдор би вдигнал вежда. Одобрително.', color: '#7fd6a1' };
  if (min <= 42) return { key: 'exceeds', label: 'Над очакванията', note: 'Макгонагъл кимна. А тя не кима често.', color: '#d9b45b' };
  if (min <= 52) return { key: 'acceptable', label: 'Приемлива', note: 'Мина. С малко пот и малко късмет.', color: '#e0b32a' };
  return { key: 'poor', label: 'Слаба', note: 'Излезе в последната минута. Точно както се полага на герой.', color: '#e0a24a' };
}

export function housePoints(ms, mistakes, hints) {
  const over = Math.max(0, ms - 60 * 60 * 1000) / 60000;
  return Math.max(0, Math.round(600 - mistakes * 12 - hints * 30 - over * 20));
}

export function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
