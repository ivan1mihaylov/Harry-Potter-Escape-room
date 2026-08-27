/* ============================================================
   acts.js — двете части на историята и оценяването
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
