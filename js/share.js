/* ============================================================
   share.js — резултатът, свит до един код
   -----------------------------------------------------------
   Играта е статична: няма сървър, който да събира резултати.
   Затова всяко завършване се пакетира в кратък код, който
   играчът може да ти прати с каквото си иска. Ти го поставяш
   в екрана със статистиката и той се превръща обратно в ред.
   ============================================================ */

const HOUSES_ORDER = ['gryffindor', 'ravenclaw', 'hufflepuff', 'slytherin'];
const GRADES_ORDER = ['outstanding', 'exceeds', 'acceptable', 'poor', 'troll'];
const PREFIX = 'HOG1';

/* ---------- base64url върху UTF-8 ---------- */
function toB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromB64(b64) {
  const pad = b64.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '='.repeat((4 - pad.length % 4) % 4));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/* ---------- дребна контролна сума срещу сбъркан препис ---------- */
function sum(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36).slice(0, 4);
}

/* ---------- кодиране ---------- */
export function encodeRun(r) {
  const body = [
    (r.name || '').replace(/[|]/g, ' '),
    r.act,
    Math.round(r.ms),
    r.mistakes | 0,
    r.hints | 0,
    Math.max(0, HOUSES_ORDER.indexOf(r.house)),
    Math.max(0, GRADES_ORDER.indexOf(r.gradeKey)),
    Math.round((r.at || Date.now()) / 1000),
  ].join('|');
  return PREFIX + '.' + toB64(body) + '.' + sum(body);
}

/* ---------- разкодиране; никога не хвърля ---------- */
export function decodeRun(code) {
  const raw = (code || '').toString().trim().replace(/\s+/g, '');
  if (!raw) return null;
  const parts = raw.split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) return null;
  let body;
  try { body = fromB64(parts[1]); } catch (e) { return null; }
  if (sum(body) !== parts[2]) return null;

  const f = body.split('|');
  if (f.length !== 8) return null;
  const [name, act, ms, mistakes, hints, houseIdx, gradeIdx, ts] = f;
  const a = +act, m = +ms;
  if (!(a >= 1 && a <= 4) || !(m >= 0) || !isFinite(m)) return null;

  return {
    name: (name || 'Незнаен магьосник').slice(0, 24),
    act: a,
    ms: m,
    mistakes: Math.max(0, +mistakes || 0),
    hints: Math.max(0, +hints || 0),
    house: HOUSES_ORDER[+houseIdx] || null,
    gradeKey: GRADES_ORDER[+gradeIdx] || 'poor',
    at: (+ts || 0) * 1000,
    mine: false,
  };
}

/* от поставен текст изваждаме всички кодове, които намерим */
export function decodeMany(text) {
  const found = (text || '').match(/HOG1\.[A-Za-z0-9_-]+\.[a-z0-9]{1,4}/g) || [];
  const out = [];
  found.forEach(c => { const r = decodeRun(c); if (r) out.push(r); });
  return { runs: out, seen: found.length };
}

/* връзка, която сама отваря статистиката с внесен резултат */
export function shareLink(code) {
  const base = location.origin + location.pathname;
  return `${base}#r=${code}`;
}
