/* ============================================================
   stats.js — статистиката: кой коя част е минал, за колко
   време, с колко грешки и подсказки.

   Общите данни идват от Google Sheets, а локалният дневник
   остава резервен вариант при липса на мрежа.
   ============================================================ */
import { readHistory, importRuns } from './state.js';
import { ACTS, fmtTime } from './acts.js';
import { HOUSES } from './art.js';
import { sfx } from './audio.js';
import { decodeMany } from './share.js';
import { loadSharedRuns, mergeRuns } from './shared-stats.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const GRADE_LABEL = {
  outstanding: 'Изключителна', exceeds: 'Над очакванията',
  acceptable: 'Приемлива', poor: 'Слаба', troll: 'Тролска',
};
const GRADE_COLOR = {
  outstanding: '#7fd6a1', exceeds: '#d9b45b', acceptable: '#e0b32a',
  poor: '#e0a24a', troll: '#e0625d',
};

let filterAct = 0;      // 0 = всички части
let filterMine = false;
let currentRuns = [];

export function renderStats() {
  const host = $('#stats-wrap');
  if (!host) return;
  const all = readHistory();
  currentRuns = all;

  host.innerHTML = `
    <div class="stats-head">
      <p class="tag">Дневник на замъка</p>
      <h1 class="stats-title">Статистика</h1>
      <p class="muted stats-lead">Общият дневник на всички играчи — коя част, за колко
      време, с колко грешки и подсказки.</p>
      <p class="muted stats-sync" id="stats-sync">Свързване с дневника на замъка…</p>
    </div>
    ${all.length ? '' : `<div class="stats-empty" id="stats-empty">
      <p>Още няма записан пробег.</p>
      <p class="muted">Завърши една част и тя ще се появи тук.</p>
    </div>`}
    <div id="stats-summary"></div>
    <div id="stats-acts"></div>
    <div id="stats-board"></div>
    <div id="stats-runs"></div>`;

  drawSummary(all);
  drawActs(all);
  drawBoard(all);
  drawRuns(all);

  loadSharedRuns({ refresh: true }).then(shared => {
    currentRuns = mergeRuns(readHistory(), shared);
    const sync = $('#stats-sync');
    if (sync) sync.innerHTML = `Общият дневник е синхронизиран · <b>${shared.length}</b> ${shared.length === 1 ? 'пробег' : 'пробега'}`;
    redraw(currentRuns);
  }).catch(() => {
    const sync = $('#stats-sync');
    if (sync) sync.textContent = 'Общият дневник не е достъпен. Показани са записите от този браузър.';
  });
}

function redraw(all) {
  const empty = $('#stats-empty');
  if (empty) empty.hidden = all.length > 0;
  drawSummary(all); drawActs(all); drawBoard(all); drawRuns(all);
}

/* ---------------- обобщение ---------------- */
function drawSummary(all) {
  const box = $('#stats-summary'); if (!box) return;
  const players = new Set(all.map(r => r.name)).size;
  const totalMs = all.reduce((a, r) => a + r.ms, 0);
  const best = all.slice().sort((a, b) => a.ms - b.ms)[0];
  const outstanding = all.filter(r => r.gradeKey === 'outstanding').length;

  box.innerHTML = `
    <div class="stat-grid">
      <div class="stat"><b>${all.length}</b><span>завършени части</span></div>
      <div class="stat"><b>${players}</b><span>${players === 1 ? 'играч' : 'играчи'}</span></div>
      <div class="stat"><b>${fmtLong(totalMs)}</b><span>общо изиграно</span></div>
      <div class="stat"><b>${outstanding}</b><span>с «Изключителна»</span></div>
    </div>
    ${best ? `<p class="stats-best">Най-бързо: <b>${esc(best.name)}</b> — Част ${ACTS[best.act].numeral}
      за <b>${fmtTime(best.ms)}</b></p>` : ''}`;
}

/* ---------------- по части ---------------- */
function drawActs(all) {
  const box = $('#stats-acts'); if (!box) return;
  if (!all.length) { box.innerHTML = ''; return; }

  const rows = [1, 2, 3, 4, 5].map(a => {
    const runs = all.filter(r => r.act === a);
    if (!runs.length) {
      return `<tr class="sa-none"><th>Част ${ACTS[a].numeral}</th>
        <td colspan="6">никой не я е минавал</td></tr>`;
    }
    const best = runs.slice().sort((x, y) => x.ms - y.ms)[0];
    const avg = runs.reduce((s, r) => s + r.ms, 0) / runs.length;
    const mist = runs.reduce((s, r) => s + r.mistakes, 0);
    const hints = runs.reduce((s, r) => s + r.hints, 0);
    return `<tr>
      <th>Част ${ACTS[a].numeral}<i>${esc(ACTS[a].title)}</i></th>
      <td><b>${runs.length}</b></td>
      <td><b>${new Set(runs.map(r => r.name)).size}</b></td>
      <td><b>${fmtTime(best.ms)}</b><i>${esc(best.name)}</i></td>
      <td>${fmtTime(avg)}</td>
      <td>${(mist / runs.length).toFixed(1)}</td>
      <td>${(hints / runs.length).toFixed(1)}</td>
    </tr>`;
  }).join('');

  box.innerHTML = `
    <section class="stats-card">
      <h2>По части</h2>
      <div class="stats-scroll">
        <table class="stats-table by-act">
          <thead><tr>
            <th></th><th>пробези</th><th>играчи</th><th>най-добро</th>
            <th>средно</th><th>грешки<i>средно</i></th><th>подсказки<i>средно</i></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>`;
}

/* ---------------- класация ---------------- */
function drawBoard(all) {
  const box = $('#stats-board'); if (!box) return;
  if (!all.length) { box.innerHTML = ''; return; }

  const acts = [1, 2, 3, 4, 5].filter(a => all.some(r => r.act === a));
  box.innerHTML = `
    <section class="stats-card">
      <h2>Класация</h2>
      <p class="muted">По най-доброто време на всеки играч.</p>
      <div class="board-grid">
        ${acts.map(a => {
          const byName = new Map();
          all.filter(r => r.act === a).forEach(r => {
            const cur = byName.get(r.name);
            if (!cur || r.ms < cur.ms) byName.set(r.name, r);
          });
          const list = [...byName.values()].sort((x, y) => x.ms - y.ms);
          return `<div class="board">
            <h3>Част ${ACTS[a].numeral}</h3>
            <ol class="board-list">
              ${list.map((r, i) => `<li>
                <span class="bl-rank">${i + 1}</span>
                <span class="bl-name">${esc(r.name)}${r.mine ? '<i>ти</i>' : ''}</span>
                <span class="bl-time">${fmtTime(r.ms)}</span>
                <span class="bl-grade" style="--gc:${GRADE_COLOR[r.gradeKey] || '#888'}"
                      title="${GRADE_LABEL[r.gradeKey] || ''}"></span>
              </li>`).join('')}
            </ol>
          </div>`;
        }).join('')}
      </div>
    </section>`;
}

/* ---------------- всички пробези ---------------- */
function drawRuns(all) {
  const box = $('#stats-runs'); if (!box) return;
  if (!all.length) { box.innerHTML = ''; return; }

  let list = all.slice().sort((a, b) => (b.at || 0) - (a.at || 0));
  if (filterAct) list = list.filter(r => r.act === filterAct);
  if (filterMine) list = list.filter(r => r.mine);

  box.innerHTML = `
    <section class="stats-card">
      <h2>Всички пробези <span class="muted">· ${list.length}</span></h2>
      <div class="stats-filters">
        <div class="sf-group" id="sf-act">
          ${[0, 1, 2, 3, 4, 5].map(a => `<button class="sf-btn${filterAct === a ? ' on' : ''}" data-a="${a}">${
            a ? 'Част ' + ACTS[a].numeral : 'Всички'}</button>`).join('')}
        </div>
        <button class="sf-btn${filterMine ? ' on' : ''}" id="sf-mine">само моите</button>
      </div>
      <div class="stats-scroll">
        <table class="stats-table runs">
          <thead><tr>
            <th>кога</th><th>кой</th><th>част</th><th>време</th>
            <th>грешки</th><th>подсказки</th><th>оценка</th>
          </tr></thead>
          <tbody>${list.map(r => `<tr class="${r.mine ? 'mine' : ''}">
            <td class="r-date">${fmtDate(r.at)}</td>
            <td class="r-name">${esc(r.name)}${r.house && HOUSES[r.house]
              ? `<i style="--hc:${HOUSES[r.house].color}">${HOUSES[r.house].name}</i>` : ''}</td>
            <td>${ACTS[r.act].numeral}</td>
            <td><b>${fmtTime(r.ms)}</b></td>
            <td>${r.mistakes}</td>
            <td>${r.hints}</td>
            <td><span class="r-grade" style="--gc:${GRADE_COLOR[r.gradeKey] || '#888'}">${
              GRADE_LABEL[r.gradeKey] || '—'}</span></td>
          </tr>`).join('') || '<tr><td colspan="7" class="muted">няма такива пробези</td></tr>'}</tbody>
        </table>
      </div>
    </section>`;

  $$('#sf-act .sf-btn').forEach(b => b.addEventListener('click', () => {
    filterAct = +b.dataset.a; sfx.click(); drawRuns(currentRuns);
  }));
  const mine = $('#sf-mine');
  if (mine) mine.addEventListener('click', () => {
    filterMine = !filterMine; sfx.click(); drawRuns(currentRuns);
  });
}

/* ---------------- помощни ---------------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function fmtDate(ms) {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}` +
         ` <i>${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</i>`;
}
function fmtLong(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return h ? `${h} ч ${m} м` : `${m} м`;
}

/* връзка вида …#r=КОД внася резултата сама */
export function importFromHash() {
  const m = (location.hash || '').match(/[#&]r=([A-Za-z0-9_.-]+)/);
  if (!m) return 0;
  const { runs } = decodeMany(decodeURIComponent(m[1]));
  history.replaceState(null, '', location.pathname + location.search);
  if (!runs.length) return 0;
  const { added } = importRuns(runs);
  return added;
}
