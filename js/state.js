/* ============================================================
   state.js — целият прогрес живее в localStorage. Без сървър.
   ============================================================ */

const KEY = 'hogwarts_escape_v1';
export const TOTAL_MS = 60 * 60 * 1000;      // 60 минути
export const HINT_PENALTY_MS = 2 * 60 * 1000; // -2 мин за подсказка
export const WRONG_PENALTY_MS = 30 * 1000;    // -30 сек за груба грешка

const blank = () => ({
  version: 1,
  house: null,
  hatAnswers: [],
  started: false,
  finished: false,
  roomIndex: 0,
  solved: {},        // roomId -> true
  runes: {},         // roomId -> "А"
  roomData: {},      // roomId -> произволно състояние на загадката
  hintsOpened: {},   // roomId -> брой отворени подсказки
  elapsedMs: 0,
  penaltyMs: 0,
  mistakes: 0,
  sound: true,
  notes: '',
  lastSeen: Date.now(),
  finishedAt: null,
});

let data = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    return Object.assign(blank(), parsed);
  } catch (e) {
    console.warn('Повредено запазване, започваме отначало.', e);
    return blank();
  }
}

let saveTimer = null;
export function save() {
  data.lastSeen = Date.now();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { console.warn('Неуспешен запис в localStorage', e); }
  }, 120);
}
export function saveNow() {
  data.lastSeen = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
}

export const S = new Proxy({}, {
  get: (_, k) => data[k],
  set: (_, k, v) => { data[k] = v; save(); return true; },
});

export function reset() {
  data = blank();
  saveNow();
}

export function hasSave() {
  return data.started && !data.finished;
}

/* ---- помощни ---- */
export function isSolved(id) { return !!data.solved[id]; }

export function markSolved(id, rune) {
  data.solved[id] = true;
  if (rune) data.runes[id] = rune;
  save();
}

export function getRoomData(id, fallback = {}) {
  if (!data.roomData[id]) data.roomData[id] = structuredCloneSafe(fallback);
  return data.roomData[id];
}
export function setRoomData(id, obj) { data.roomData[id] = obj; save(); }

function structuredCloneSafe(o) {
  try { return structuredClone(o); } catch (e) { return JSON.parse(JSON.stringify(o)); }
}

export function addPenalty(ms) { data.penaltyMs += ms; save(); }
export function addMistake() { data.mistakes++; save(); }

export function remainingMs() {
  return Math.max(0, TOTAL_MS - data.elapsedMs - data.penaltyMs);
}
export function usedMs() {
  return data.elapsedMs + data.penaltyMs;   // може да надхвърли 60 мин. в допълнително време
}
export function collectedRunes() {
  return Object.values(data.runes);
}
