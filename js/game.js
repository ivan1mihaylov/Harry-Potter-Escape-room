/* ============================================================
   game.js — оркестраторът на четирите части
   ============================================================ */
import {
  S, save, saveNow, reset, useAct, currentAct, hasSaveFor, peek,
  isSolved, markSolved, getRoomData, setRoomData, addMistake,
  remainingMs, usedMs, hintsUsed, readRecords, writeRecord, recordFor,
  isActUnlocked, TOTAL_MS, WRONG_PENALTY_MS, OUTSTANDING_MS,
  playerName, playerHouse, hasName, clearProfile, writeProfile, clearHistory,
  personalize, personalizeDOM,
} from './state.js';
import { ACTS, grade, housePoints, fmtTime } from './acts.js';
import { HOUSES, crestSVG } from './art.js';
import { sfx, unlockAudio, startAmbient } from './audio.js';
import * as FX from './fx.js';
import * as UI from './ui.js';
import { runSorting, nameFormHTML, wireNameForm } from './sorting.js';
import { renderStats, importFromHash, copy } from './stats.js';
import { encodeRun, shareLink } from './share.js';
import { sendRun, flushOutbox, isConfigured, clearOutbox } from './collect.js';
import { initBackground, setBgMode, setBgTint } from './three-bg.js';
import { webglAvailable } from './three-stage.js';

const $ = (s) => document.querySelector(s);

let ROOMS = [];
let RUNE_ROOMS = [];
let current = 0;
let currentApi = null;
let act = 1;

/* ============================================================
   Начало
   ============================================================ */
function boot() {
  FX.initDust();
  initBackground().then(() => setBgMode('dim'));
  UI.paintHouse();
  UI.wireSoundButton();

  $('#btn-howto').addEventListener('click', UI.howTo);
  $('#btn-stats').addEventListener('click', goStats);
  $('#stats-home').addEventListener('click', goHome);
  $('#btn-wipe').addEventListener('click', wipeAll);
  $('#modal-close').addEventListener('click', UI.closeModal);
  $('#modal-back').addEventListener('click', e => { if (e.target.id === 'modal-back') UI.closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') UI.closeModal(); });

  $('#btn-hint').addEventListener('click', () => { sfx.click(); UI.openHints(ROOMS[current]); });
  $('#btn-notes').addEventListener('click', () => { sfx.click(); UI.openNotes(grainsBlock()); });
  $('#btn-menu').addEventListener('click', () => {
    sfx.click();
    UI.openMenu({ onReset: () => { reset(act); location.reload(); }, onHome: goHome });
  });

  renderActs();
  flushOutbox();
  const brought = importFromHash();
  if (brought) setTimeout(() => {
    FX.toast(`Внесен${brought > 1 ? 'и са ' + brought + ' резултата' : ' е един резултат'} от връзката.`, 'good', 5000);
    goStats();
  }, 900);
  window.addEventListener('beforeunload', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });
}

/* ---------- началните карти на частите ---------- */
function renderActs() {
  renderWizard();
  const box = $('#acts');
  box.innerHTML = '';
  [1, 2, 3, 4].forEach(n => box.appendChild(actCard(n)));
}

/* името и домът стоят над картите, щом веднъж са определени */
function renderWizard() {
  const box = $('#wizard-badge');
  if (!box) return;
  const name = playerName();
  const house = playerHouse();
  if (!name && !house) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  const h = HOUSES[house];
  box.innerHTML = `
    ${h ? `<span class="wb-crest">${crestSVG(house)}</span>` : ''}
    <span class="wb-text">
      ${name ? `<b>${name}</b>` : ''}
      ${h ? `<i>${h.name}</i>` : ''}
    </span>`;
}

function actCard(n) {
  const A = ACTS[n];
  const rec = recordFor(n);
  const unlocked = isActUnlocked(n);
  const save = peek(n);
  const inProgress = hasSaveFor(n);
  const card = document.createElement('article');
  card.className = 'act-card' + (unlocked ? '' : ' locked');

  const last = rec && rec.last;
  const best = rec && rec.best;

  const resultBlock = last ? `
    <div class="ac-result">
      <div class="ac-result-title">последен резултат</div>
      <div class="ac-stats">
        <span><b>${fmtTime(last.ms)}</b>време</span>
        <span><b>${last.mistakes}</b>грешки</span>
        <span><b>${last.hints}</b>подсказки</span>
      </div>
      <div class="ac-grade" style="--gc:${last.color}">${last.grade}</div>
      ${best && best.ms !== last.ms
        ? `<div class="ac-best">най-добро: <b>${fmtTime(best.ms)}</b> · ${best.grade}</div>` : ''}
    </div>` : '';

  if (!unlocked) {
    const prev = ACTS[n - 1];
    const b = recordFor(n - 1) && recordFor(n - 1).best;
    card.innerHTML = `
      <div class="ac-lock">${lockSVG()}</div>
      <div class="ac-num">Част ${A.numeral}</div>
      <h3 class="ac-title">${A.title}</h3>
      <p class="ac-tag">${A.tagline}</p>
      <div class="ac-req">
        <div class="ac-req-title">заключено</div>
        <p>Отваря се само за онзи, който е минал <b>${ORD[n - 1]} част
        с оценка «Изключителна»</b> — цялата, за <b>под ${fmtTime(OUTSTANDING_MS)}</b>.</p>
        ${b ? `<div class="ac-progress">
                 <div class="ac-pb"><i style="width:${Math.min(100, Math.round(OUTSTANDING_MS / b.ms * 100))}%"></i></div>
                 <span>най-доброто ти време: <b>${fmtTime(b.ms)}</b> — трябват ти още
                 <b>${fmtTime(Math.max(0, b.ms - OUTSTANDING_MS))}</b> по-малко</span>
               </div>`
             : `<div class="ac-progress"><span>още не си завършвал «${prev.title}»</span></div>`}
      </div>
      ${resultBlock}`;
    return card;
  }

  card.innerHTML = `
    <div class="ac-num">Част ${A.numeral}</div>
    <h3 class="ac-title">${A.title}</h3>
    <p class="ac-tag">${A.tagline}</p>
    ${resultBlock}
    ${inProgress ? `<div class="ac-inprog">започната игра · остават ${fmtTime(Math.max(0, TOTAL_MS - save.elapsedMs - save.penaltyMs))}</div>` : ''}
    <div class="ac-actions"></div>`;

  const actions = card.querySelector('.ac-actions');
  if (inProgress) {
    const c = mkBtn('Продължи', 'btn-primary', () => startAct(n, false));
    actions.appendChild(c);
    actions.appendChild(mkBtn('Отначало', 'btn-ghost btn-sm', () => confirmRestart(n)));
  } else {
    actions.appendChild(mkBtn(rec ? 'Изиграй отново' : 'Започни', 'btn-primary', () => startAct(n, true)));
  }
  return card;
}

function mkBtn(text, cls, fn) {
  const b = document.createElement('button');
  b.className = 'btn ' + cls;
  b.innerHTML = `<span>${text}</span>`;
  b.addEventListener('click', () => { unlockAudio(); startAmbient(); fn(); });
  return b;
}

function confirmRestart(n) {
  UI.openModal(`<h2>Да започнем ли отначало?</h2>
    <p>Текущата игра в <b>Част ${ACTS[n].numeral}</b> ще изчезне — часовникът, руните и решените зали.
    Записаните резултати остават.</p>
    <div class="flex flex-center mt">
      <button class="btn btn-primary btn-sm" id="rs-yes">Да, отначало</button>
      <button class="btn btn-ghost btn-sm" id="rs-no">Не</button>
    </div>`);
  $('#rs-yes').addEventListener('click', () => { UI.closeModal(); reset(n); startAct(n, true); });
  $('#rs-no').addEventListener('click', UI.closeModal);
}

function wipeAll() {
  UI.openModal(`<h2>Да изтрия ли всичко?</h2>
    <p>И четирите части, статистиката, бележките — а също <b>името и домът ти</b> —
    ще изчезнат като спомен под <em>Обливиате</em>.</p>
    <div class="flex flex-center mt">
      <button class="btn btn-primary btn-sm" id="w-yes" style="background:linear-gradient(180deg,#c4382f,#7d1f1a);border-color:#e0625d;color:#fff">Изтрий всичко</button>
      <button class="btn btn-ghost btn-sm" id="w-no">Върни ме</button>
    </div>`);
  $('#w-yes').addEventListener('click', () => {
    ['hogwarts_escape_v1', 'hogwarts_escape_act2_v1', 'hogwarts_escape_act3_v1',
     'hogwarts_escape_act4_v1', 'hogwarts_records_v1']
      .forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
    clearProfile();
    clearHistory();
    clearOutbox();
    location.reload();
  });
  $('#w-no').addEventListener('click', UI.closeModal);
}

/* ============================================================
   Пускане на част
   ============================================================ */
async function startAct(n, fresh) {
  act = n;
  useAct(n);
  if (fresh) reset(n);
  UI.setAct(ACTS[n]);

  const mods = await ACTS[n].load();
  ROOMS = mods;
  RUNE_ROOMS = ROOMS.filter(r => r.meta.rune);

  if (n >= 2 && !webglAvailable()) {
    UI.openModal(`<h2>Тази част иска 3D</h2>
      <p>Почти всяка загадка тук е триизмерна, а браузърът ти не дава WebGL.
      Пробвай друг браузър или включи хардуерното ускорение — иначе ще виждаш само бутоните.</p>
      <div class="flex flex-center mt"><button class="btn btn-ghost btn-sm" id="wg-ok">Разбрах, продължавам</button></div>`);
    $('#wg-ok').addEventListener('click', UI.closeModal);
  }

  /* домът се пази в профила; ако липсва, Първа част минава през шапката */
  const needSorting = !playerHouse();

  const go = () => {
    if (fresh || !S.started) { showPrologue(n, needSorting); return; }
    if (needSorting) { goSorting(n); return; }
    enterAct(n);
  };

  /* заварен напредък без име — питаме, преди да продължим */
  if (!needSorting && !hasName()) { askNameGate(go); return; }
  go();
}

/* ============================================================
   Как се казваш — за играчите, които са започнали, преди
   шапката да пита за име.
   ============================================================ */
function askNameGate(next) {
  UI.openModal(`
    <h2>Шапката се обажда отново</h2>
    <p>„Сортирах те навремето, но така и не ти записах името. А оттук нататък
    ще се обръщам към теб — затова ми го кажи сега.“</p>
    <div id="gate-name"></div>`);
  const host = $('#gate-name');
  host.innerHTML = nameFormHTML();
  wireNameForm(host, (name) => {
    writeProfile({ name });
    UI.closeModal();
    UI.paintHouse();
    next();
  });
}

function goSorting(n) {
  UI.showScreen('screen-sorting');
  setBgMode('dim');
  runSorting(() => { S.started = true; UI.paintHouse(); enterAct(n); });
}

function showPrologue(n, needSorting) {
  const A = ACTS[n];
  UI.showScreen('screen-story');
  $('#story-numeral').textContent = A.numeral;
  $('#story-title').textContent = A.title;
  $('#story-body').innerHTML = personalize({ 1: PROLOGUE_1, 2: PROLOGUE_2, 3: PROLOGUE_3, 4: PROLOGUE_4 }[n]);
  $('#story-go').querySelector('span').textContent =
    { 1: 'Отвори портата', 2: 'Слез надолу', 3: 'Влез между дърветата', 4: 'Слез в лодката' }[n];
  const go = $('#story-go');
  go.replaceWith(go.cloneNode(true));
  $('#story-go').addEventListener('click', () => {
    S.started = true;
    if (needSorting) goSorting(n); else enterAct(n);
  });
}

function enterAct(n) {
  UI.paintHouse();
  if (S.house) setBgTint(HOUSES[S.house].color);
  UI.showScreen('screen-game');
  UI.doorTransition(ACTS[n].sealLine).then(() => {});
  setTimeout(() => {
    UI.startTimer(onTimeout);
    const first = ROOMS.findIndex(r => !isSolved(r.meta.id));
    mountRoom(first < 0 ? ROOMS.length - 1 : first);
  }, 900);
}

function goStats() {
  sfx.click();
  renderStats();
  UI.showScreen('screen-stats');
  setBgMode('dim');
}

function goHome() {
  UI.closeModal();
  UI.stopTimer();
  if (currentApi && currentApi.onLeave) { try { currentApi.onLeave(); } catch (e) {} }
  saveNow();
  renderActs();
  UI.showScreen('screen-intro');
  setBgMode('dim');
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
  personalizeDOM(root);

  UI.renderRail(ROOMS, current, jumpTo);
  UI.renderRunes(RUNE_ROOMS);
  UI.renderGrains(ROOMS, act === 2);
  UI.updateHintBadge(room);
  root.focus({ preventScroll: true });

  if (isSolved(room.meta.id)) showSolvedFooter(room, true);
}

function jumpTo(i) { if (i !== current) mountRoom(i); }

function makeApi(room) {
  const id = room.meta.id;
  return {
    meta: room.meta,
    act,
    data: getRoomData(id, {}),
    saveData() { setRoomData(id, this.data); },
    get solved() { return isSolved(id); },
    toast: FX.toast,
    sfx,
    fx: {
      sparks: FX.sparks, sparksFrom: FX.sparksFrom,
      shockwave: FX.shockwave, shockwaveFrom: FX.shockwaveFrom,
      flash: FX.flash, shakeScreen: FX.shakeScreen,
      celebrate: FX.celebrate, typewriter: FX.typewriter,
    },
    allRunes() { return RUNE_ROOMS.map(r => S.runes[r.meta.id]).filter(Boolean); },
    allGrains() {
      const out = {};
      ROOMS.forEach(r => { if (S.grains[r.meta.id] != null) out[r.meta.title] = S.grains[r.meta.id]; });
      return out;
    },
    fail(msg, ms = WRONG_PENALTY_MS) {
      addMistake();
      UI.penalise(ms, `${msg} <b>−${Math.round(ms / 1000)} сек.</b>`);
      sfx.bad();
    },
    solve(msg) {
      if (isSolved(id)) return;
      markSolved(id, room.meta.rune, room.meta.grain);
      sfx.rune();
      FX.celebrate(1.4);
      UI.renderRail(ROOMS, current, jumpTo);
      UI.renderRunes(RUNE_ROOMS);
      UI.renderGrains(ROOMS, act === 2);
      showSolvedFooter(room, false, msg);
    },
    onLeave: null,
  };
}

function showSolvedFooter(room, silent, msg) {
  const root = $('#room-root');
  const old = root.querySelector('.solved-footer');
  if (old) old.remove();

  const last = current >= ROOMS.length - 1;
  const box = document.createElement('div');
  box.className = 'solved-footer';
  const award = room.meta.rune || '★';
  box.innerHTML = `
    <div class="solved-banner">
      <div class="rune-award">${award}</div>
      ${room.meta.grain != null ? `<div class="grain-award">${room.meta.grain}</div>` : ''}
      <div style="text-align:left">
        <b>${silent ? 'Тази зала вече е решена.' : 'Загадката е решена!'}</b>
        <div class="muted" style="font-size:.94rem">${msg || (room.meta.rune ? 'Руната е в джоба ти.' : 'Пътят напред е отворен.')}</div>
      </div>
    </div>
    <div class="flex flex-center mt">
      ${current > 0 ? '<button class="btn btn-ghost btn-sm" id="go-prev"><span>Предишна зала</span></button>' : ''}
      <button class="btn btn-primary" id="go-next"><span>${last
        ? { 1: 'Излез от Хогуортс', 2: 'Затвори шева', 3: 'Тръгни след елена', 4: 'Излез през портата' }[act]
        : 'Продължи към следващата зала'}</span></button>
    </div>`;
  root.appendChild(box);
  personalizeDOM(box);
  if (!silent) box.scrollIntoView({ behavior: 'smooth', block: 'end' });

  const prev = box.querySelector('#go-prev');
  if (prev) prev.addEventListener('click', () => { sfx.click(); mountRoom(current - 1); });
  box.querySelector('#go-next').addEventListener('click', () => {
    if (last) { finishAct(); return; }
    UI.doorTransition(ROOMS[current + 1].meta.title).then(() => {});
    setTimeout(() => mountRoom(current + 1), 900);
  });
}

/* ============================================================
   Край
   ============================================================ */
let sendState = 'off';
const SEND_TEXT = {
  sending: 'Изпращане към дневника на замъка…',
  sent: 'Резултатът е изпратен в дневника на замъка.',
  queued: 'Мрежата я нямаше — резултатът ще тръгне сам при следващо отваряне.',
};
function paintSendState() {
  const el = $('#sc-sent');
  if (!el) return;
  el.hidden = sendState === 'off';
  el.className = 'sc-sent ' + sendState;
  el.textContent = SEND_TEXT[sendState] || '';
}

const TIMEOUT_LINE = {
  1: 'Печатът на Основателите се стяга.',
  2: 'Пясъкът тече все по-бързо.',
  3: 'Дърветата се приближават с една крачка.',
  4: 'Студът е стигнал до последното стъпало.',
};
const DOOR_LINE = {
  1: 'Портата се отваря', 2: 'Пясъкът спира',
  3: 'Дърветата се разстъпват', 4: 'Морето се отдръпва',
};
let timedOut = false;
function onTimeout() {
  if (timedOut) return;
  timedOut = true;
  sfx.roar();
  FX.flash('rgba(180,40,40,.35)', 1200);
  FX.shakeScreen(18, 900);
  UI.openModal(`
    <h2>Шестдесетте минути изтекоха</h2>
    <p>${TIMEOUT_LINE[act] || TIMEOUT_LINE[1]}
    Портретите по стените са спрели да дишат.</p>
    <p class="muted">Можеш да продължиш — но вече <b>в допълнително време</b>, и то ще личи в оценката ти.</p>
    <div class="flex flex-center mt">
      <button class="btn btn-primary btn-sm" id="t-cont">Продължи в допълнително време</button>
      <button class="btn btn-ghost btn-sm" id="t-reset">Започни отначало</button>
    </div>`);
  $('#t-cont').addEventListener('click', UI.closeModal);
  $('#t-reset').addEventListener('click', () => { reset(act); location.reload(); });
}

function finishAct() {
  S.finished = true;
  S.finishedAt = Date.now();
  const ms = usedMs();
  const g = grade(ms);
  const rec = {
    ms, mistakes: S.mistakes, hints: hintsUsed(),
    grade: g.label, gradeKey: g.key, color: g.color,
    outstanding: g.key === 'outstanding',
    house: S.house, at: Date.now(),
    points: housePoints(ms, S.mistakes, hintsUsed()),
  };
  writeRecord(act, rec);
  sendState = isConfigured() ? 'sending' : 'off';
  sendRun({
    id: `${act}-${rec.at}`, name: playerName() || 'Незнаен магьосник', act,
    ms: rec.ms, mistakes: rec.mistakes, hints: rec.hints,
    gradeKey: rec.gradeKey, house: S.house, at: rec.at,
  }).then(state => { sendState = state; paintSendState(); });
  saveNow();
  UI.stopTimer();
  sfx.victory();
  FX.celebrate(6);
  UI.doorTransition(DOOR_LINE[act] || DOOR_LINE[1]).then(() => showEnd(rec, g));
}

function showEnd(rec, g) {
  UI.showScreen('screen-end');
  setBgMode('candles');
  const A = ACTS[act];
  const house = HOUSES[S.house] || { name: 'Хогуортс' };
  const justUnlocked = act < 4 && rec.outstanding;
  const shareCode = encodeRun({
    name: playerName() || 'Незнаен магьосник', act,
    ms: rec.ms, mistakes: rec.mistakes, hints: rec.hints,
    house: S.house, gradeKey: rec.gradeKey, at: rec.at,
  });

  $('#end-wrap').innerHTML = personalize(`
    <div class="end-badge">${crestSVG(S.house)}</div>
    <p class="tag">Част ${A.numeral}</p>
    <h1 class="end-title">${A.endTitle}</h1>
    <p class="muted" style="max-width:640px;margin:0 auto 10px">${A.endText}</p>
    <p class="tag">${playerName() ? playerName() + ' · ' : ''}${house.name}</p>

    <div class="stat-grid">
      <div class="stat"><b>${fmtTime(rec.ms)}</b><span>време</span></div>
      <div class="stat"><b>${rec.mistakes}</b><span>грешки</span></div>
      <div class="stat"><b>${rec.hints}</b><span>подсказки</span></div>
      <div class="stat"><b>${rec.points}</b><span>точки за дома</span></div>
    </div>

    <div class="grade-card" style="--gc:${g.color}">
      <div class="grade-label">Оценка за {име|теб} от изпитната комисия</div>
      <div class="grade-value">${g.label}</div>
      <p class="muted">${g.note}</p>
    </div>

    ${act < 4 ? unlockBlock(rec) : `
      <div class="epilogue">
        <p>Крепостта остава зад теб — сива, търпелива и напълно безразлична. Дименторите вече
        не те усещат. За тях си празно място, което върви по вода.</p>
        <p><b>Всичко, което си бил, е още в теб. Само че сега вратата е от твоята страна.</b></p>
      </div>`}

    <div class="runes-final">
      ${RUNE_ROOMS.map(r => `<span class="rune-final">${S.runes[r.meta.id] || '·'}</span>`).join('')}
      <div class="muted" style="width:100%;margin-top:8px;font-size:.9rem">руните, които те изведоха</div>
    </div>

    <div class="share-card">
      <div class="sc-title">Кодът на този пробег</div>
      <p class="muted">${isConfigured()
        ? 'Резултатът тръгва сам към дневника на замъка. Кодът отдолу е резервният път — ако мрежата е капризна, прати него.'
        : 'Играта няма сървър — резултатът пътува като код. Прати го на този, който събира статистиката, и той ще го добави при своите.'}</p>
      <div class="sc-sent" id="sc-sent" hidden></div>
      <div class="sc-code" id="sc-code">${shareCode}</div>
      <div class="flex flex-center mt">
        <button class="btn btn-ghost btn-sm" id="sc-copy"><span>Копирай кода</span></button>
        <button class="btn btn-ghost btn-sm" id="sc-link"><span>Копирай връзка</span></button>
        <button class="btn btn-ghost btn-sm" id="sc-stats"><span>Виж статистиката</span></button>
      </div>
    </div>

    <div class="flex flex-center mt-lg">
      <button class="btn btn-primary" id="end-home"><span>Към началото</span></button>
      <button class="btn btn-ghost btn-sm" id="end-again"><span>Изиграй частта отново</span></button>
    </div>`);

  $('#end-home').addEventListener('click', goHome);
  $('#end-again').addEventListener('click', () => { reset(act); startAct(act, true); });
  paintSendState();
  $('#sc-stats').addEventListener('click', goStats);
  $('#sc-copy').addEventListener('click', async () => {
    sfx.click();
    const ok = await copy(shareCode);
    FX.toast(ok ? 'Кодът е в клипборда.' : 'Браузърът не позволи копиране — маркирай кода на ръка.',
             ok ? 'good' : 'bad');
  });
  $('#sc-link').addEventListener('click', async () => {
    sfx.click();
    const ok = await copy(shareLink(shareCode));
    FX.toast(ok ? 'Връзката е в клипборда — който я отвори, внася резултата си сам.'
                : 'Браузърът не позволи копиране.', ok ? 'good' : 'bad');
  });
  if (justUnlocked) setTimeout(() => FX.celebrate(4), 600);
}

const ORD = { 1: 'Първа', 2: 'Втора', 3: 'Трета', 4: 'Четвърта' };
const UNLOCK_LINE = {
  1: 'Печатът обаче не беше ключалка, а <b>шев</b>. И ти току-що го разпра.',
  2: 'Замъкът те забрави. Гората обаче помни всичко — и я чака да ѝ обясниш кой си.',
  3: 'Патронусът светна над гората като фар. И нещо в Северно море го видя.',
};

function unlockBlock(rec) {
  const nextAct = ACTS[act + 1];
  if (!nextAct) return '';
  const ordinal = ORD[act + 1];
  if (rec.outstanding) {
    return `<div class="unlock-card open">
      <div class="uc-icon">${keySVG()}</div>
      <div class="uc-title">${ordinal} част е отключена</div>
      <p>Мина за <b>${fmtTime(rec.ms)}</b> — под ${fmtTime(OUTSTANDING_MS)}.
      ${UNLOCK_LINE[act] || ''}</p>
      <p class="muted">«${nextAct.title}» те чака на началния екран.</p>
    </div>`;
  }
  const need = Math.max(0, rec.ms - OUTSTANDING_MS);
  return `<div class="unlock-card">
    <div class="uc-icon">${lockSVG()}</div>
    <div class="uc-title">${ordinal} част остава заключена</div>
    <p>За да се отвори «${nextAct.title}», трябва оценка <b>«Изключителна»</b> —
    цялата тази част за <b>под ${fmtTime(OUTSTANDING_MS)}</b>.</p>
    <p class="muted">Този път ти трябваха <b>${fmtTime(rec.ms)}</b> — с <b>${fmtTime(need)}</b> повече от нужното.
    Подсказките и грешките ядат време: всяка подсказка е 2 минути.</p>
  </div>`;
}

/* събраните зърна пясък — винаги достъпни през бележника, и на телефон */
function grainsBlock() {
  if (act !== 2) return '';
  const rows = ROOMS.filter(r => r.meta.grain != null)
    .map(r => ({ title: r.meta.title, d: S.grains[r.meta.id] }))
    .filter(x => x.d != null);
  if (!rows.length) return '';
  return `<div class="notes-grains">
    <div class="ng-title">зърна пясък · ${rows.length} събрани</div>
    <p class="ng-hint">Пясъкът не издава цифрите си тук. Обръщат се едно по едно в
    <b>Хроноворота</b> — и се разместват след всяко надникване. Записвай ги по-долу, докато ги помниш.</p>
    ${rows.map(x => `<div class="ng-row"><b>◆</b><span>${x.title}</span></div>`).join('')}
  </div>`;
}

/* ---------- дребна графика ---------- */
function lockSVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;
}
function keySVG() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="8" cy="8" r="4"/><path d="M11 11l8 8M16 16l2-2M19 19l2-2"/></svg>`;
}

/* ---------- пролози ---------- */
const PROLOGUE_1 = `
  <p class="drop">Часовникът удари полунощ, а ти още си в замъка.</p>
  <p>Вратите се затвориха със звук, който не издава дърво, а магия. По стените плъзна сребрист печат —
  <em>Обвързващото заклинание на Основателите</em>. То се задейства веднъж на сто години и пуска навън
  само онзи, който премине през десет зали и възстанови <strong>Ключовото Слово</strong>.</p>
  <p>Във всяка зала те чака по една руна. Девет руни. Едно заклинание. Ако до изгрев не го изречеш пред
  Огледалото Еиналеж — Хогуортс ще те задържи като още един портрет по стените си.</p>
  <p class="whisper">„Помощ винаги ще бъде дадена в Хогуортс на онези, които я поискат.“</p>`;

const PROLOGUE_2 = `
  <p class="drop">Излезе на разсъмване, {име}. Само че зората не идва.</p>
  <p>Слънцето стои на един и същи пръст над Забранената гора вече час. Птиците повтарят едни и същи
  три ноти. А когато се обърнеш към замъка, той е с една кула повече, отколкото беше преди малко.</p>
  <p>Печатът на Основателите не е бил ключалка. Бил е <em>шев</em>. Под подземията, в помещение без
  врата, се е въртял хроноворот, стар колкото самия Хогуортс — и той е държал часовете един след друг.
  Ти го счупи, когато излезе.</p>
  <p>Сега замъкът се сгъва навътре, зала по зала. Имаш още шестдесет минути, преди примката да се
  затвори завинаги. Трябва да слезеш обратно — под всичко — и да прековеш печата с най-старото
  заклинание за скриване, което Основателите са знаели.</p>
  <p class="whisper">„Онова, което е скрито добре, не се пази от ключалка. Пази се от човек.“</p>`;

const PROLOGUE_3 = `
  <p class="drop">Излизаш от замъка на разсъмване и Хогуортс вече не знае кой си, {име}.</p>
  <p>Точно това поиска. Фиделиус държи: тайната е в теб, заключена като камък в юмрук, и никой
  жив не може да я извади. Остава само да се прибереш — а единственият път минава през
  <em>Забранената гора</em>.</p>
  <p>На третата крачка между дърветата разбираш грешката си, {име}. Гората е <strong>по-стара от
  Основателите</strong> и не признава тяхната магия. За нея човек, който носи неизречима тайна,
  не е човек, а <em>празно място</em> — а гората поглъща празните места.</p>
  <p>Пътеката зад теб я няма. Кентаврите вече са прочели в небето, че между дърветата върви
  Пазител на тайната. Акромантулите го подушиха. Тесталите го видяха първи.</p>
  <p>За да те пусне, гората иска доказателство, че в теб е останало нещо твое. Не тайна — а
  <strong>спомен</strong>, толкова светъл, че да добие форма.</p>
  <p class="whisper">„Гората не мрази никого. Просто не забравя нищо.“</p>`;

const PROLOGUE_4 = `
  <p class="drop">Сребърният елен свети над Забранената гора цели седем секунди, {име}.</p>
  <p>Достатъчно. Патронусът не е сигнален огън, но се вижда като такъв — и на седемстотин мили
  на север нещо вдига качулка от водата и тръгва натам, откъдето е дошла светлината.</p>
  <p>Стигат до теб на третата нощ. Не могат да вземат тайната — <em>Фиделиус</em> държи, тайната
  е в теб като камък в юмрук и никой не може да разтвори пръстите. Затова взимат всичко около нея.
  Кой те е учил. Кой те е чакал. Как миришеше кухнята в Хогуортс сутрин.</p>
  <p>Когато свършват, не си празен — просто <strong>по-малък</strong>. И знаеш къде отива взетото,
  защото всички го знаят: <em>Азкабан</em>, крепостта в Северно море, където отнетите спомени се
  държат в стъкленици, докато престанат да значат нещо.</p>
  <p>Отиваш сам, {име}. Никой не те задържа — Азкабан не пази хората навън. Пази ги вътре. За да излезеш
  обратно, ще трябва да научиш единственото, което дименторите не понасят: как да <strong>затвориш
  ума си</strong>.</p>
  <p class="whisper">„Празният ум не е защитен ум. Защитеният ум е онзи, който сам решава какво да покаже.“</p>`;

document.addEventListener('DOMContentLoaded', boot);
