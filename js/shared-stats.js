/* ============================================================
   shared-stats.js — общият дневник от Google Sheets.

   Google Visualization връща JSONP. Това е нарочно: обикновеният
   CSV адрес не дава CORS заглавие и браузърът би го блокирал.
   Таблицата трябва да е споделена като "Anyone with the link — Viewer".
   ============================================================ */

export const SHARED_SHEET = {
  id: '1I5x0vp-trc9D0f4hwgvmKe8DbZdFyMqowzLVYm5Du9A',
  gid: '0',
};

const GRADE_KEY = {
  'Изключителна': 'outstanding', 'Над очакванията': 'exceeds',
  'Приемлива': 'acceptable', 'Слаба': 'poor', 'Тролска': 'troll',
};
const HOUSE_KEY = {
  'Грифиндор': 'gryffindor', 'Рейвънклоу': 'ravenclaw',
  'Хафълпаф': 'hufflepuff', 'Слидерин': 'slytherin',
};

let cached = null;
let pending = null;

export function loadSharedRuns({ refresh = false } = {}) {
  if (!SHARED_SHEET.id) return Promise.resolve([]);
  if (!refresh && cached) return Promise.resolve(cached);
  if (!refresh && pending) return pending;

  pending = new Promise((resolve, reject) => {
    const callback = `hogwartsSheet_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => finish(new Error('Таблицата не отговори навреме.')), 12000);

    function finish(error, value) {
      clearTimeout(timer);
      delete window[callback];
      script.remove();
      pending = null;
      if (error) reject(error); else { cached = value; resolve(value); }
    }

    window[callback] = payload => {
      if (!payload || payload.status !== 'ok' || !payload.table) {
        finish(new Error('Таблицата не е публична или отговорът ѝ е невалиден.'));
        return;
      }
      try { finish(null, parseTable(payload.table)); }
      catch (e) { finish(e); }
    };
    script.onerror = () => finish(new Error('Google Sheets не може да бъде достигнат.'));
    const tqx = encodeURIComponent(`out:json;responseHandler:${callback}`);
    script.src = `https://docs.google.com/spreadsheets/d/${SHARED_SHEET.id}/gviz/tq?gid=${SHARED_SHEET.gid}&tqx=${tqx}&_=${Date.now()}`;
    document.head.appendChild(script);
  });
  return pending;
}

function parseTable(table) {
  const labels = (table.cols || []).map(c => clean(c.label));
  const col = name => labels.indexOf(clean(name));
  const idx = {
    stamp: col('Клеймо за време'), name: col('Име'), act: col('Част'),
    seconds: col('Секунди'), mistakes: col('Грешки'), hints: col('Подсказки'),
    grade: col('Оценка'), house: col('Дом'), date: col('Дата'),
  };
  for (const key of ['name', 'act', 'seconds', 'mistakes', 'hints', 'grade', 'house']) {
    if (idx[key] < 0) throw new Error(`Липсва колона „${key}“ в общата таблица.`);
  }

  return (table.rows || []).map((row, rowIndex) => {
    const get = key => cellValue(row.c && row.c[idx[key]]);
    const act = Number(get('act'));
    const seconds = Number(get('seconds'));
    if (!get('name') || !Number.isFinite(act) || !Number.isFinite(seconds)) return null;
    const date = get('date') || get('stamp');
    return {
      id: `sheet-${rowIndex}-${get('name')}-${act}-${seconds}-${date}`,
      name: String(get('name')).trim(), act, ms: seconds * 1000,
      mistakes: Number(get('mistakes')) || 0, hints: Number(get('hints')) || 0,
      gradeKey: GRADE_KEY[String(get('grade')).trim()] || '',
      house: HOUSE_KEY[String(get('house')).trim()] || null,
      at: parseDate(date), mine: false, shared: true,
    };
  }).filter(Boolean);
}

function cellValue(cell) {
  if (!cell) return '';
  return cell.v == null ? (cell.f || '') : cell.v;
}
function clean(value) { return String(value || '').trim().toLocaleLowerCase('bg'); }
function parseDate(value) {
  const s = String(value || '');
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3], +iso[4], +iso[5]).getTime();
  const bg = s.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
  if (bg) return new Date(+bg[3], +bg[2] - 1, +bg[1], +bg[4], +bg[5]).getTime();
  return Date.now();
}

export function mergeRuns(local, shared) {
  const mine = new Map();
  local.forEach(r => mine.set(signature(r), r));
  const out = [];
  shared.forEach(r => {
    const localRun = mine.get(signature(r));
    out.push(localRun ? { ...r, ...localRun, shared: true, mine: true } : r);
    if (localRun) mine.delete(signature(r));
  });
  out.push(...mine.values());
  return out;
}

function signature(r) {
  return [String(r.name || '').trim().toLocaleLowerCase('bg'), r.act,
    Math.round((r.ms || 0) / 1000), r.mistakes || 0, r.hints || 0].join('|');
}
