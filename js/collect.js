/* ============================================================
   collect.js — резултатите идват при теб сами, без бекенд.

   Как: една Google Форма приема POST направо от браузъра на
   играча и налива всичко в прикачената Google Sheet. Няма
   сървър за поддържане, няма база данни за плащане.

   За да заработи, попълни FORM по-долу. Най-лесно става от
   екрана «Статистика» → «Автоматично събиране»: залепваш
   предварително попълнената връзка на формата и играта ти
   дава готовия блок за тук.
   ============================================================ */

/* ---------- НАСТРОЙКА ---------- */
export const FORM = {
  /* адресът за изпращане; свършва на /formResponse */
  url: '',
  /* кое entry.* поле кое е */
  fields: {
    name: '', act: '', seconds: '', mistakes: '', hints: '', grade: '', house: '', date: '',
  },
};

/* ---------- вътрешности ---------- */
const OUTBOX_KEY = 'hogwarts_outbox_v1';
const LOCAL_KEY = 'hogwarts_collect_v1';   // за проба, преди да запишеш горното

const GRADE_LABEL = {
  outstanding: 'Изключителна', exceeds: 'Над очакванията',
  acceptable: 'Приемлива', poor: 'Слаба', troll: 'Тролска',
};
const HOUSE_LABEL = {
  gryffindor: 'Грифиндор', ravenclaw: 'Рейвънклоу',
  hufflepuff: 'Хафълпаф', slytherin: 'Слидерин',
};

/* локалната настройка бие вградената — удобно за проба */
export function activeForm() {
  try {
    const local = JSON.parse(localStorage.getItem(LOCAL_KEY));
    if (local && local.url && local.fields && local.fields.name) return local;
  } catch (e) {}
  return FORM;
}
export function isConfigured() {
  const f = activeForm();
  return !!(f.url && f.fields && f.fields.name);
}
export function saveLocalForm(cfg) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(cfg)); } catch (e) {}
}
export function clearLocalForm() {
  try { localStorage.removeItem(LOCAL_KEY); } catch (e) {}
}

/* ---------- разчитане на предварително попълнената връзка ----------
   Google дава връзка вида
     https://docs.google.com/forms/d/e/ИД/viewform?usp=pp_url&entry.123=1&entry.456=2…
   Играчът е написал 1…8 в осемте въпроса, по реда отдолу — така
   всяко entry.* се разпознава по стойността си, без ръчно ровене. */
const ORDER = ['name', 'act', 'seconds', 'mistakes', 'hints', 'grade', 'house', 'date'];

export function parsePrefilled(link) {
  const raw = (link || '').trim();
  if (!raw) return { error: 'Празно поле.' };
  let u;
  try { u = new URL(raw); } catch (e) { return { error: 'Това не прилича на връзка.' }; }
  if (!/docs\.google\.com$/.test(u.hostname) || !/\/forms\//.test(u.pathname)) {
    return { error: 'Връзката не е към Google Форма.' };
  }
  const url = u.origin + u.pathname.replace(/\/(viewform|edit).*$/, '') + '/formResponse';

  const fields = {};
  u.searchParams.forEach((value, key) => {
    if (!/^entry\./.test(key)) return;
    const n = parseInt(value, 10);
    if (n >= 1 && n <= ORDER.length) fields[ORDER[n - 1]] = key;
  });

  const missing = ORDER.filter(k => !fields[k]);
  if (missing.length === ORDER.length) {
    return { error: 'Във връзката няма попълнени въпроси. Напиши 1, 2, 3 … 8 в осемте полета.' };
  }
  if (missing.length) {
    return { error: `Липсват полета за: ${missing.join(', ')}. Провери дали си написал 1…8 във всичките осем въпроса.` };
  }
  return { cfg: { url, fields } };
}

/* готовият блок за js/collect.js */
export function configSnippet(cfg) {
  const f = cfg.fields;
  return `export const FORM = {
  url: '${cfg.url}',
  fields: {
    name: '${f.name}', act: '${f.act}', seconds: '${f.seconds}',
    mistakes: '${f.mistakes}', hints: '${f.hints}', grade: '${f.grade}',
    house: '${f.house}', date: '${f.date}',
  },
};`;
}

/* ---------- опашка: нищо не се губи, ако мрежата я няма ---------- */
function readOutbox() {
  try {
    const raw = JSON.parse(localStorage.getItem(OUTBOX_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch (e) { return []; }
}
function writeOutbox(list) {
  try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(list.slice(-50))); } catch (e) {}
}
export function outboxSize() { return readOutbox().length; }

/* ---------- самото изпращане ---------- */
function bodyFor(run, f) {
  const p = new URLSearchParams();
  p.set(f.name, run.name || '');
  p.set(f.act, String(run.act));
  p.set(f.seconds, String(Math.round(run.ms / 1000)));
  p.set(f.mistakes, String(run.mistakes | 0));
  p.set(f.hints, String(run.hints | 0));
  p.set(f.grade, GRADE_LABEL[run.gradeKey] || '');
  p.set(f.house, HOUSE_LABEL[run.house] || '');
  p.set(f.date, new Date(run.at || Date.now()).toISOString().slice(0, 16).replace('T', ' '));
  return p;
}

/* Google не връща CORS заглавия, затова пращаме „на сляпо“:
   заявката тръгва и се записва, но отговорът не се чете. */
async function post(run, cfg) {
  await fetch(cfg.url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyFor(run, cfg.fields).toString(),
  });
}

/* изпраща пробега; при неуспех го оставя в опашката за после */
export async function sendRun(run) {
  if (!isConfigured()) return 'off';
  const cfg = activeForm();
  try {
    await post(run, cfg);
    return 'sent';
  } catch (e) {
    const list = readOutbox();
    if (!list.some(r => r.id === run.id)) { list.push(run); writeOutbox(list); }
    return 'queued';
  }
}

/* при всяко отваряне пробваме каквото е останало в опашката */
export async function flushOutbox() {
  if (!isConfigured()) return 0;
  const list = readOutbox();
  if (!list.length) return 0;
  const cfg = activeForm();
  const left = [];
  let done = 0;
  for (const run of list) {
    try { await post(run, cfg); done++; }
    catch (e) { left.push(run); }
  }
  writeOutbox(left);
  return done;
}

export function clearOutbox() { try { localStorage.removeItem(OUTBOX_KEY); } catch (e) {} }
