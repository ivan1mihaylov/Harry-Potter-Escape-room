/* ============================================================
   state.js — целият прогрес живее в localStorage. Без сървър.
   Поддържа шест части (акта), всяка със собствен запис,
   плюс общ дневник с постигнатите резултати.
   ============================================================ */

const ACT_KEYS = {
  1: 'hogwarts_escape_v1',
  2: 'hogwarts_escape_act2_v1',
  3: 'hogwarts_escape_act3_v1',
  4: 'hogwarts_escape_act4_v1',
  5: 'hogwarts_escape_act5_v1',
  6: 'hogwarts_escape_act6_v1',
};
const RECORDS_KEY = 'hogwarts_records_v1';
const PROFILE_KEY = 'hogwarts_wizard_v1';
const HISTORY_KEY = 'hogwarts_history_v1';

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
  hintsOpened: {},   // roomId -> списък с индексите на отворените подсказки
  elapsedMs: 0,
  penaltyMs: 0,
  mistakes: 0,
  sound: true,
  notes: '',
  lastSeen: Date.now(),
  finishedAt: null,
});

/* ------------------------------------------------------------
   Режим «оглед»: част, отворена през катинара, за да се разгледа.
   Записът ѝ живее само в паметта — нищо не се пише в localStorage
   и нищо не влиза в дневника с резултатите.
   ------------------------------------------------------------ */
let preview = false;
export function isPreview() { return preview; }

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
export function useAct(a, opts = {}) {
  const wantPreview = !!opts.preview;
  if (a === act && wantPreview === preview) return;
  /* прибираме само истински започнат запис: празният акт няма какво да остави,
     а огледът не пише изобщо                                                   */
  if (!preview && data.started) saveNow();
  act = a;
  preview = wantPreview;
  data = preview ? blank(a) : load(a);
}
export function currentAct() { return act; }

let saveTimer = null;
export function save() {
  data.lastSeen = Date.now();
  if (preview) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 120);
}
export function saveNow() {
  data.lastSeen = Date.now();
  if (preview) return;
  try { localStorage.setItem(keyFor(act), JSON.stringify(data)); }
  catch (e) { console.warn('Неуспешен запис в localStorage', e); }
}

export const S = new Proxy({}, {
  get: (_, k) => (k === 'house' ? (playerHouse() || data.house) : data[k]),
  set: (_, k, v) => {
    data[k] = v;
    if (k === 'house' && v && !preview) writeProfile({ house: v });
    save();
    return true;
  },
});

export function reset(a = act) {
  if (a === act) { data = blank(a); saveNow(); }
  else if (!preview) { try { localStorage.removeItem(keyFor(a)); } catch (e) {} }
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
  for (const a of [1, 2, 3, 4, 5]) {
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
  if (preview) return recordFor(a);   /* огледът не оставя следа */
  const all = readRecords();
  const slot = all['act' + a] || {};
  slot.last = rec;
  if (!slot.best || rec.ms < slot.best.ms) slot.best = rec;
  slot.runs = (slot.runs || 0) + 1;
  all['act' + a] = slot;
  try { localStorage.setItem(RECORDS_KEY, JSON.stringify(all)); } catch (e) {}
  addRun({
    name: playerName() || 'Незнаен магьосник',
    act: a, ms: rec.ms, mistakes: rec.mistakes, hints: rec.hints,
    gradeKey: rec.gradeKey, house: rec.house, points: rec.points,
    at: rec.at, mine: true,
  });
  return slot;
}
export function recordFor(a) { return readRecords()['act' + a] || null; }

/* ============================================================
   Дневник на всички изиграни части — по един ред на завършване.
   Тук лежат и чуждите резултати, внесени с код за споделяне.
   ============================================================ */
export const HISTORY_MAX = 400;

export function readHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch (e) { return []; }
}

function writeHistory(list) {
  const trimmed = list.slice(-HISTORY_MAX);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed)); } catch (e) {}
  return trimmed;
}

/* стабилен отпечатък: същият пробег не влиза два пъти */
export function runId(r) {
  const key = [r.name || '', r.act, r.ms, r.mistakes, r.hints, Math.round((r.at || 0) / 1000)].join('|');
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

export function addRun(entry) {
  const list = readHistory();
  const r = { ...entry, id: runId(entry) };
  if (list.some(x => x.id === r.id)) return list;
  list.push(r);
  return writeHistory(list);
}

/* внасяне на чужди резултати — връща колко са добавени и колко са били вече тук */
export function importRuns(entries) {
  const list = readHistory();
  const seen = new Set(list.map(x => x.id));
  let added = 0, dup = 0;
  entries.forEach(e => {
    const r = { ...e, id: runId(e) };
    if (seen.has(r.id)) { dup++; return; }
    seen.add(r.id);
    list.push(r);
    added++;
  });
  if (added) writeHistory(list);
  return { added, dup };
}

export function clearHistory() { try { localStorage.removeItem(HISTORY_KEY); } catch (e) {} }

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
/* Подсказките се пазят като списък с индекси, за да може играч, който вече
   е минал първата стъпка, да отвори направо подсказката за втората.
   Старите записи са само число („първите n“) и се вдигат наум.        */
export function openedHints(id) {
  const v = (data.hintsOpened || {})[id];
  if (Array.isArray(v)) return v.slice();
  const n = +v || 0;
  return Array.from({ length: n }, (_, i) => i);
}

export function markHintOpened(id, i) {
  const list = openedHints(id);
  if (!list.includes(i)) list.push(i);
  data.hintsOpened = { ...data.hintsOpened, [id]: list };
  save();
  return list;
}

export function hintsUsed() {
  return Object.values(data.hintsOpened || {})
    .reduce((a, v) => a + (Array.isArray(v) ? v.length : (+v || 0)), 0);
}
