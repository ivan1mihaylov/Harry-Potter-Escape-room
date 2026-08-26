/* ============================================================
   game.js — оркестраторът на цялата ескейп стая
   ============================================================ */
import { S, save, saveNow, reset, hasSave, isSolved, markSolved, getRoomData, setRoomData,
         addMistake, remainingMs, usedMs, TOTAL_MS, WRONG_PENALTY_MS } from './state.js';
import { HOUSES, crestSVG } from './art.js';
import { sfx, unlockAudio, startAmbient, isEnabled, setEnabled } from './audio.js';
import * as FX from './fx.js';
import * as UI from './ui.js';
import { runSorting } from './sorting.js';
import { initBackground, setBgMode, setBgTint } from './three-bg.js';

import * as R1 from './rooms/r1-platform.js';
import * as R2 from './rooms/r2-greathall.js';
import * as R3 from './rooms/r3-potions.js';
import * as R4 from './rooms/r4-library.js';
import * as R5 from './rooms/r5-astronomy.js';
import * as R6 from './rooms/r6-dada.js';
import * as R7 from './rooms/r7-chamber.js';
import * as R8 from './rooms/r8-gringotts.js';
import * as R9 from './rooms/r9-diary.js';
import * as R10 from './rooms/r10-mirror.js';

const ROOMS = [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10];
const RUNE_ROOMS = ROOMS.filter(r => r.meta.rune);

const $ = (s) => document.querySelector(s);
let current = 0;
let currentApi = null;

/* ============================================================
   Начало
   ============================================================ */
function boot() {
  FX.initDust();
  initBackground().then(() => { setBgMode('dim'); });
  UI.paintHouse();
  UI.wireSoundButton();

  $('#btn-begin').addEventListener('click', () => { unlockAudio(); startAmbient(); newGame(); });
  $('#btn-howto').addEventListener('click', UI.howTo);
  $('#modal-close').addEventListener('click', UI.closeModal);
  $('#modal-back').addEventListener('click', e => { if (e.target.id === 'modal-back') UI.closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.closeModal(); });

  $('#btn-hint').addEventListener('click', () => { sfx.click(); UI.openHints(ROOMS[current]); });
  $('#btn-notes').addEventListener('click', () => { sfx.click(); UI.openNotes(); });
  $('#btn-menu').addEventListener('click', () => {
    sfx.click();
    UI.openMenu({ onReset: hardReset });
  });

  if (hasSave()) {
    const btn = $('#btn-continue');
    btn.hidden = false;
    const left = Math.round(remainingMs() / 60000);
    btn.querySelector('span').textContent = `Продължи (${left} мин остават)`;
    btn.addEventListener('click', () => { unlockAudio(); startAmbient(); resume(); });
    $('#btn-begin').querySelector('span').textContent = 'Започни отначало';
    $('#btn-begin').classList.remove('btn-primary');
    $('#btn-begin').classList.add('btn-ghost');
    btn.classList.add('btn-primary');
  }
  if (S.finished) {
    // играта е приключена — показваме резултата при желание
    const btn = $('#btn-continue');
    btn.hidden = false;
    btn.querySelector('span').textContent = 'Виж резултата си';
    btn.classList.add('btn-primary');
    btn.addEventListener('click', () => showEnd(true));
  }

  window.addEventListener('beforeunload', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
}

function newGame() {
  reset();
  UI.paintHouse();
  UI.showScreen('screen-sorting');
  setBgMode('dim');
  runSorting(() => {
    S.started = true;
    UI.paintHouse();
    setBgTint(HOUSES[S.house].color);
    UI.doorTransition('Печатът на Основателите се затваря зад теб').then(() => {
      startGame(0);
    });
    UI.showScreen('screen-game');
  });
}

function resume() {
  UI.paintHouse();
  if (S.house) setBgTint(HOUSES[S.house].color);
  UI.showScreen('screen-game');
  const first = ROOMS.findIndex(r => !isSolved(r.meta.id));
  startGame(first < 0 ? ROOMS.length - 1 : first);
}

function startGame(index) {
  UI.startTimer(onTimeout);
  mountRoom(index);
}

function hardReset() {
  reset();
  UI.stopTimer();
  location.reload();
}

/* ============================================================
   Зали
   ============================================================ */
function mountRoom(i) {
  if (currentApi && typeof currentApi.onLeave === 'function') {
    try { currentApi.onLeave(); } catch (e) {}
  }
  current = Math.max(0, Math.min(i, ROOMS.length - 1));
  S.roomIndex = current;
  const room = ROOMS[current];
  const root = $('#room-root');
  root.innerHTML = '';

  setBgMode(room.meta.bg || 'dim');
  if (room.meta.tint) setBgTint(room.meta.tint);

  const api = makeApi(room);
  currentApi = api;
  room.mount(root, api);

  UI.renderRail(ROOMS, current, jumpTo);
  UI.renderRunes(RUNE_ROOMS);
  UI.updateHintBadge(room);
  root.focus({ preventScroll: true });

  if (isSolved(room.meta.id)) showSolvedFooter(room, true);
}

function jumpTo(i) {
  if (i === current) return;
  mountRoom(i);
}

function makeApi(room) {
  const id = room.meta.id;
  const api = {
    meta: room.meta,
    data: getRoomData(id, {}),
    saveData() { setRoomData(id, this.data); },
    get solved() { return isSolved(id); },
    toast: FX.toast,
    sfx,
    fx: {
      sparks: FX.sparks,
      sparksFrom: FX.sparksFrom,
      shockwave: FX.shockwave,
      shockwaveFrom: FX.shockwaveFrom,
      flash: FX.flash,
      shakeScreen: FX.shakeScreen,
      celebrate: FX.celebrate,
      typewriter: FX.typewriter,
    },
    allRunes() { return RUNE_ROOMS.map(r => S.runes[r.meta.id]).filter(Boolean); },
    fail(msg, ms = WRONG_PENALTY_MS) {
      addMistake();
      UI.penalise(ms, `${msg} <b>−${Math.round(ms / 1000)} сек.</b>`);
      sfx.bad();
    },
    solve(msg) {
      if (isSolved(id)) return;
      markSolved(id, room.meta.rune);
      sfx.rune();
      FX.celebrate(1.4);
      UI.renderRail(ROOMS, current, jumpTo);
      UI.renderRunes(RUNE_ROOMS);
      showSolvedFooter(room, false, msg);
    },
    onLeave: null,
  };
  return api;
}

function showSolvedFooter(room, silent, msg) {
  const root = $('#room-root');
  const old = root.querySelector('.solved-footer');
  if (old) old.remove();

  const last = current >= ROOMS.length - 1;
  const box = document.createElement('div');
  box.className = 'solved-footer';
  box.innerHTML = `
    <div class="solved-banner">
      ${room.meta.rune ? `<div class="rune-award">${room.meta.rune}</div>` : '<div class="rune-award">★</div>'}
      <div style="text-align:left">
        <b>${silent ? 'Тази зала вече е решена.' : 'Загадката е решена!'}</b>
        <div class="muted" style="font-size:.94rem">${msg || (room.meta.rune ? 'Руната е в джоба ти.' : 'Пътят навън е отворен.')}</div>
      </div>
    </div>
    <div class="flex flex-center mt">
      ${current > 0 ? '<button class="btn btn-ghost btn-sm" id="go-prev"><span>Предишна зала</span></button>' : ''}
      <button class="btn btn-primary" id="go-next"><span>${last ? 'Излез от Хогуортс' : 'Продължи към следващата зала'}</span></button>
    </div>`;
  root.appendChild(box);
  if (!silent) box.scrollIntoView({ behavior: 'smooth', block: 'end' });

  const prev = box.querySelector('#go-prev');
  if (prev) prev.addEventListener('click', () => { sfx.click(); mountRoom(current - 1); });
  box.querySelector('#go-next').addEventListener('click', () => {
    if (last) { finishGame(); return; }
    const nextRoom = ROOMS[current + 1];
    UI.doorTransition(nextRoom.meta.title).then(() => {});
    setTimeout(() => mountRoom(current + 1), 900);
  });
}

/* ============================================================
   Край на времето и финал
   ============================================================ */
let timedOut = false;
function onTimeout() {
  if (timedOut) return;
  timedOut = true;
  sfx.roar();
  FX.flash('rgba(180,40,40,.35)', 1200);
  FX.shakeScreen(18, 900);
  UI.openModal(`
    <h2>Шестдесетте минути изтекоха</h2>
    <p>Печатът на Основателите се стяга. Портретите по стените са спрели да дишат.</p>
    <p class="muted">Можеш да продължиш — но вече <b>в допълнително време</b>, и то ще личи в оценката ти.
    Или да започнеш нощта отначало.</p>
    <div class="flex flex-center mt">
      <button class="btn btn-primary btn-sm" id="t-cont">Продължи в допълнително време</button>
      <button class="btn btn-ghost btn-sm" id="t-reset">Започни отначало</button>
    </div>`);
  $('#t-cont').addEventListener('click', () => { UI.closeModal(); });
  $('#t-reset').addEventListener('click', hardReset);
}

function finishGame() {
  S.finished = true;
  S.finishedAt = Date.now();
  saveNow();
  UI.stopTimer();
  sfx.victory();
  FX.celebrate(6);
  UI.doorTransition('Портата се отваря').then(() => showEnd(false));
}

function grade(ms, mistakes, hints) {
  const min = ms / 60000;
  if (min > 60) return { g: 'Тролска', d: 'Успя — но замъкът вече беше започнал да те смята за мебел.', c: '#e0625d' };
  if (min <= 32) return { g: 'Изключителна', d: 'Дъмбълдор би вдигнал вежда. Одобрително.', c: '#7fd6a1' };
  if (min <= 42) return { g: 'Над очакванията', d: 'Макгонагъл кимна. А тя не кима често.', c: '#d9b45b' };
  if (min <= 52) return { g: 'Приемлива', d: 'Мина. С малко пот и малко късмет.', c: '#e0b32a' };
  return { g: 'Слаба', d: 'Излезе в последната минута. Точно както се полага на герой.', c: '#e0a24a' };
}

function showEnd(already) {
  UI.showScreen('screen-end');
  setBgMode('candles');
  const ms = usedMs();
  const min = Math.floor(ms / 60000), sec = Math.floor(ms / 1000) % 60;
  const hints = Object.values(S.hintsOpened || {}).reduce((a, b) => a + b, 0);
  const g = grade(ms, S.mistakes, hints);
  const points = Math.max(0, 600 - S.mistakes * 12 - hints * 30 - Math.max(0, ms - TOTAL_MS) / 60000 * 20 | 0);
  const house = HOUSES[S.house] || { name: 'Хогуортс', motto: '' };

  $('#end-wrap').innerHTML = `
    <div class="end-badge">${crestSVG(S.house)}</div>
    <h1 class="end-title">Свободен си</h1>
    <p class="muted" style="max-width:620px;margin:0 auto 6px">
      Портата на Хогуортс се затваря зад теб с тихо щракане. Над Забранената гора вече изсветлява.
      Печатът на Основателите е разчупен — от теб.</p>
    <p class="tag">${house.name}</p>

    <div class="stat-grid">
      <div class="stat"><b>${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}</b><span>време</span></div>
      <div class="stat"><b>${S.mistakes}</b><span>грешки</span></div>
      <div class="stat"><b>${hints}</b><span>подсказки</span></div>
      <div class="stat"><b>${points}</b><span>точки за дома</span></div>
    </div>

    <div class="grade-card" style="--gc:${g.c}">
      <div class="grade-label">Оценка от изпитната комисия</div>
      <div class="grade-value">${g.g}</div>
      <p class="muted">${g.d}</p>
    </div>

    <div class="runes-final">
      ${RUNE_ROOMS.map(r => `<span class="rune-final">${S.runes[r.meta.id] || '·'}</span>`).join('')}
      <div class="muted" style="width:100%;margin-top:8px;font-size:.9rem">деветте руни, които те изведоха навън</div>
    </div>

    <div class="flex flex-center mt-lg">
      <button class="btn btn-primary" id="end-again"><span>Още веднъж, от начало</span></button>
      <button class="btn btn-ghost btn-sm" id="end-credits"><span>За тази стая</span></button>
    </div>
    <p class="tiny-note mt">Резултатът ти остава записан в този браузър.</p>`;

  $('#end-again').addEventListener('click', hardReset);
  $('#end-credits').addEventListener('click', UI.credits);
  if (!already) FX.celebrate(5);
}

/* Ако файлът е отворен с двойно щракане (file://), ES модулите не тръгват.
   Този надпис се показва само тогава — иначе го няма. */
if (location.protocol === 'file:') {
  document.addEventListener('DOMContentLoaded', () => {
    const w = document.querySelector('.intro-actions');
    if (w) w.insertAdjacentHTML('beforebegin',
      `<p style="color:#ffb9b6;border:1px solid rgba(224,98,93,.5);border-radius:12px;padding:14px;margin-bottom:18px">
        Страницата е отворена директно от диска. Браузърът блокира модулите при <code>file://</code>.
        Пусни малък локален сървър — например <code>python3 -m http.server 8000</code> — и отвори
        <code>http://localhost:8000</code>.</p>`);
  });
}

document.addEventListener('DOMContentLoaded', boot);
