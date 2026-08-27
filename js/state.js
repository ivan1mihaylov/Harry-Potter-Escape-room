/* ============================================================
   state.js — целият прогрес живее в localStorage. Без сървър.
   Поддържа четири части (акта), всяка със собствен запис,
   плюс общ дневник с постигнатите резултати.
   ============================================================ */

const ACT_KEYS = {
  1: 'hogwarts_escape_v1',
  2: 'hogwarts_escape_act2_v1',
  3: 'hogwarts_escape_act3_v1',
  4: 'hogwarts_escape_act4_v1',
};
const RECORDS_KEY = 'hogwarts_records_v1';
const PROFILE_KEY = 'hogwarts_wizard_v1';

export const TOTAL_MS = 60 * 60 * 1000;       // 60 минути на част
export const HINT_PENALTY_MS = 2 * 60 * 1000; // -2 мин за подсказка
export const WRONG_PENALTY_MS = 30 * 1000;    // -30 сек за груба грешка

/* прагът за отличие — и ключът към Втора част */
export const OUTSTANDING_MS = 32 * 60 * 1000;

const blank = (act = 1) => ({
  version: 2,
  act,
  house: null,
  started: false,
  finished: false,
  roomIndex: 0,
  solved: {},        // roomId -> true
  runes: {},         // roomId -> "А"
  grains: {},        // roomId -> цифра (само Втора част)
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

let act = 1;
let data = load(1);

function keyFor(a) { return ACT_KEYS[a] || ACT_KEYS[1]; }

function load(a) {
  try {
    const raw = localStorage.getItem(keyFor(a));
    if (!raw) return blank(a);
    const parsed = JSON.parse(raw);
    return Object.assign(blank(a), parsed, { act: a });
  } catch (e) {
    console.warn('Повреден запис, започваме отначало.', e);
    return blank(a);
  }
}

/* превключване между частите */
export function useAct(a) {
  if (a === act) return;
  saveNow();
  act = a;
  data = load(a);
}
export function currentAct() { return act; }

let saveTimer = null;
export function save() {
  data.lastSeen = Date.now();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 120);
}
export function saveNow() {
  data.lastSeen = Date.now();
  try { localStorage.setItem(keyFor(act), JSON.stringify(data)); }
  catch (e) { console.warn('Неуспешен запис в localStorage', e); }
}

export const S = new Proxy({}, {
  get: (_, k) => (k === 'house' ? (playerHouse() || data.house) : data[k]),
  set: (_, k, v) => {
    data[k] = v;
    if (k === 'house' && v) writeProfile({ house: v });
    save();
    return true;
  },
});

export function reset(a = act) {
  if (a === act) { data = blank(a); saveNow(); }
  else { try { localStorage.removeItem(keyFor(a)); } catch (e) {} }
}

/* ---- надничане в другата част, без да я зареждаме ---- */
export function peek(a) {
  try {
    const raw = localStorage.getItem(keyFor(a));
    return raw ? Object.assign(blank(a), JSON.parse(raw)) : null;
  } catch (e) { return null; }
}
export function hasSaveFor(a) {
  const d = a === act ? data : peek(a);
  return !!(d && d.started && !d.finished);
}
export function hasSave() { return hasSaveFor(act); }

/* ============================================================
   Профилът на магьосника — име и дом. Определят се веднъж, в
   началото на Първа част, и живеят извън записите на частите:
   нито «Започни отначало», нито смяната на част ги пипа.
   Изтриват се само с «Изтрий всичко».
   ============================================================ */
let profile = null;

export function readProfile() {
  if (profile) return profile;
  try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; }
  catch (e) { profile = {}; }
  return profile;
}
export function writeProfile(patch) {
  profile = Object.assign(readProfile(), patch);
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}
  return profile;
}
export function clearProfile() {
  profile = {};
  try { localStorage.removeItem(PROFILE_KEY); } catch (e) {}
}

export function playerName() { return (readProfile().name || '').trim(); }
export function playerHouse() { return readProfile().house || null; }
export function hasName() { return !!playerName(); }

/* какво приемаме за име: 2–24 знака — само букви, интервал,
   тире, апостроф и точка. Всичко друго отпада, за да не влезе
   разметка в текстовете, които после се сглобяват с innerHTML. */
export function cleanName(raw) {
  const n = (raw || '').toString()
    .replace(/[^\p{L}\s'’.-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 24);
  return /\p{L}{2}/u.test(n) ? n : '';
}

/* «{име}» в текстовете се заменя с въведеното име.
   «{име|друго}» дава резервна дума, ако име още няма;
   самото «{име}» без резерва просто отпада заедно със запетайката си. */
const NAME_TOKEN = /\{име(?:\|([^}]*))?\}/g;
export function personalize(text) {
  if (!text) return text;
  const n = playerName();
  if (n) return text.replace(NAME_TOKEN, n);
  return text
    .replace(/\s*,\s*\{име\}(?=[.!?,;:])/g, '')
    .replace(/\{име\},\s*/g, '')
    .replace(/\s*\{име\}/g, '')
    .replace(NAME_TOKEN, (_, alt) => alt || '');
}

/* същото, но върху вече построено DOM дърво — само в текстовите възли */
export function personalizeDOM(root) {
  if (!root) return root;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (walker.nextNode()) {
    if (walker.currentNode.nodeValue.includes('{име}')) hits.push(walker.currentNode);
  }
  hits.forEach(n => { n.nodeValue = personalize(n.nodeValue); });
  return root;
}

/* стари записи: домът е живял вътре в частта — вдигаме го в профила */
(function adoptOldHouse() {
  const p = readProfile();
  if (p.house) return;
  for (const a of [1, 2, 3, 4]) {
    const d = peek(a);
    if (d && d.house) { writeProfile({ house: d.house }); return; }
  }
})();

/* ---- дневник с резултатите ---- */
export function readRecords() {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY)) || {}; }
  catch (e) { return {}; }
}
export function writeRecord(a, rec) {
  const all = readRecords();
  const slot = all['act' + a] || {};
  slot.last = rec;
  if (!slot.best || rec.ms < slot.best.ms) slot.best = rec;
  slot.runs = (slot.runs || 0) + 1;
  all['act' + a] = slot;
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(all)); } catch (e) {}
  return slot;
}
export function recordFor(a) { return readRecords()['act' + a] || null; }

/* всяка следваща част се отключва само с отличие в предишната */
export function isActUnlocked(a) {
  if (a === 1) return true;
  const r = recordFor(a - 1);
  return !!(r && r.best && r.best.outstanding);
}

/* ---- помощни ---- */
export function isSolved(id) { return !!data.solved[id]; }

export function markSolved(id, rune, grain) {
  data.solved[id] = true;
  if (rune) data.runes[id] = rune;
  if (grain != null) data.grains[id] = grain;
  save();
}

export function getRoomData(id, fallback = {}) {
  if (!data.roomData[id]) data.roomData[id] = clone(fallback);
  return data.roomData[id];
}
export function setRoomData(id, obj) { data.roomData[id] = obj; save(); }

function clone(o) {
  try { return structuredClone(o); } catch (e) { return JSON.parse(JSON.stringify(o)); }
}

export function addPenalty(ms) { data.penaltyMs += ms; save(); }
export function addMistake() { data.mistakes++; save(); }

export function remainingMs() { return Math.max(0, TOTAL_MS - data.elapsedMs - data.penaltyMs); }
export function usedMs() { return data.elapsedMs + data.penaltyMs; }
export function hintsUsed() { return Object.values(data.hintsOpened || {}).reduce((a, b) => a + b, 0); }
