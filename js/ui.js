/* ============================================================
   ui.js — обвивката: HUD, часовник, лента, подсказки, преходи
   ============================================================ */
import { S, save, saveNow, remainingMs, TOTAL_MS, HINT_PENALTY_MS, addPenalty, isSolved } from './state.js';
import { crestSVG, HOUSES } from './art.js';
import { sfx, setEnabled, isEnabled, startAmbient } from './audio.js';
import { toast, shakeScreen, flash } from './fx.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function showScreen(id) {
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ---------------- частта ---------------- */
let ACT = null;
export function setAct(a) {
  ACT = a;
  const b = $('#act-badge');
  if (b) { b.textContent = a.numeral; b.title = a.title; }
  document.body.dataset.act = a.id;
}

/* ---------------- зърна пясък ---------------- */
export function renderGrains(rooms, show) {
  const tray = $('#grains-tray');
  if (!tray) return;
  tray.hidden = !show;
  if (!show) return;
  const withGrain = rooms.filter(r => r.meta.grain != null);
  tray.innerHTML = withGrain.map(r => {
    const got = S.grains[r.meta.id] != null;
    return `<span class="grain-slot${got ? ' filled' : ''}"
      title="${got ? r.meta.title + ' — зърното е у теб; цифрата се чете в Хроноворота' : 'още неоткрито зърно'}">${got ? '◆' : '·'}</span>`;
  }).join('');
}

/* ---------------- герб и дом ---------------- */
export function paintHouse() {
  const h = S.house;
  document.body.dataset.house = h || 'none';
  const info = HOUSES[h];
  const c = $('#hud-crest'); if (c) c.innerHTML = crestSVG(h);
  const ic = $('#intro-crest'); if (ic) ic.innerHTML = crestSVG(h);
  const n = $('#hud-house-name'); if (n) n.textContent = info ? info.name : 'Хогуортс';
}

/* ---------------- часовник ---------------- */
const RING = 2 * Math.PI * 52;
let timerId = null, lastTs = 0, onTimeout = null;

export function startTimer(cb) {
  onTimeout = cb;
  lastTs = performance.now();
  clearInterval(timerId);
  timerId = setInterval(tick, 250);
  tick();
}
export function stopTimer() { clearInterval(timerId); timerId = null; }

function tick() {
  const now = performance.now();
  const dt = Math.min(now - lastTs, 1500);
  lastTs = now;
  if (!S.finished) { S.elapsedMs = S.elapsedMs + dt; }
  renderTimer();
  if (remainingMs() <= 0 && !S.finished && onTimeout) { onTimeout(); }
}

let lastSecond = -1;
export function renderTimer() {
  const rem = remainingMs();
  const totalSec = Math.ceil(rem / 1000);
  const m = Math.floor(totalSec / 60), s = totalSec % 60;
  const el = $('#timer-value');
  if (el) el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const ring = $('#ring-fg');
  if (ring) {
    ring.style.strokeDasharray = RING;
    ring.style.strokeDashoffset = RING * (1 - rem / TOTAL_MS);
  }
  const box = $('#timer');
  if (box) {
    box.classList.toggle('warn', rem < 15 * 60 * 1000 && rem >= 5 * 60 * 1000);
    box.classList.toggle('danger', rem < 5 * 60 * 1000);
  }
  if (totalSec <= 10 && totalSec !== lastSecond && totalSec > 0) { sfx.heart(); }
  lastSecond = totalSec;
}

export function penalise(ms, why) {
  addPenalty(ms);
  renderTimer();
  const box = $('#timer');
  if (box) { box.classList.add('tick-flash'); setTimeout(() => box.classList.remove('tick-flash'), 500); }
  if (why) toast(why, 'bad');
}

/* ---------------- руни ---------------- */
export function renderRunes(rooms) {
  const tray = $('#runes-tray'); if (!tray) return;
  tray.innerHTML = '';
  rooms.forEach(r => {
    const d = document.createElement('div');
    d.className = 'rune-slot' + (S.runes[r.meta.id] ? ' filled' : '');
    d.textContent = S.runes[r.meta.id] || '·';
    d.title = S.runes[r.meta.id] ? `Руна от «${r.meta.title}»` : 'Още неоткрита руна';
    tray.appendChild(d);
  });
}

/* ---------------- лента с напредък ---------------- */
export function renderRail(rooms, current, onJump) {
  const rail = $('#progress-rail'); if (!rail) return;
  rail.innerHTML = '';
  rooms.forEach((r, i) => {
    if (i) { const l = document.createElement('i'); l.className = 'rail-link' + (isSolved(rooms[i - 1].meta.id) ? ' done' : ''); rail.appendChild(l); }
    const n = document.createElement('button');
    n.className = 'rail-node' + (isSolved(r.meta.id) ? ' done' : '') + (i === current ? ' current' : '');
    n.textContent = i + 1;
    n.title = isSolved(r.meta.id) || i <= current ? r.meta.title : 'Заключена зала';
    if (isSolved(r.meta.id) || i < current) {
      n.style.cursor = 'pointer';
      n.addEventListener('click', () => { sfx.click(); onJump(i); });
    }
    rail.appendChild(n);
  });
  const ch = $('#hud-chapter');
  if (ch) ch.textContent = `Зала ${current + 1} / ${rooms.length}`;
}

/* ---------------- модал ---------------- */
export function openModal(html) {
  $('#modal-body').innerHTML = html;
  $('#modal-back').classList.add('open');
  sfx.page();
}
export function closeModal() { $('#modal-back').classList.remove('open'); }

/* ---------------- подсказки ---------------- */
export function openHints(room) {
  const id = room.meta.id;
  const opened = S.hintsOpened[id] || 0;
  const hints = room.meta.hints || [];
  const rows = hints.map((h, i) => i < opened
    ? `<div class="hint-item"><b>Подсказка ${i + 1}.</b> ${h}</div>`
    : `<div class="hint-item hint-locked">Подсказка ${i + 1} — още не е разкрита</div>`).join('');

  const canMore = opened < hints.length;
  openModal(`
    <h2>Помощ от портретите</h2>
    <p class="muted">Всяка подсказка струва <b>2 минути</b> от оставащото време. Портретите са бъбриви, но не безплатни.</p>
    ${rows || '<p class="muted">Тази зала не се нуждае от подсказки.</p>'}
    <div class="flex flex-center mt">
      ${canMore ? `<button class="btn btn-house btn-sm" id="hint-more">Разкрий подсказка ${opened + 1} (–2:00)</button>` : ''}
      <button class="btn btn-ghost btn-sm" id="hint-close">Затвори</button>
    </div>`);

  const more = $('#hint-more');
  if (more) more.addEventListener('click', () => {
    const h = { ...S.hintsOpened }; h[id] = (h[id] || 0) + 1; S.hintsOpened = h;
    penalise(HINT_PENALTY_MS);
    sfx.chime();
    flash('rgba(217,180,91,.18)', 300);
    openHints(room);
    updateHintBadge(room);
  });
  const cl = $('#hint-close'); if (cl) cl.addEventListener('click', closeModal);
}

export function updateHintBadge(room) {
  const el = $('#hint-count'); if (!el || !room) return;
  const total = (room.meta.hints || []).length;
  const used = S.hintsOpened[room.meta.id] || 0;
  el.textContent = Math.max(0, total - used);
  el.style.opacity = total - used ? 1 : .35;
}

/* ---------------- бележник ---------------- */
export function openNotes(extra = '') {
  openModal(`
    <h2>Бележник на ученика</h2>
    ${extra}
    <p class="muted">Записките се пазят в браузъра ти. Ползвай ги за кодове, букви и хрумвания.</p>
    <textarea id="notes-area" style="width:100%;min-height:230px;background:rgba(0,0,0,.4);
      border:1px solid rgba(217,180,91,.3);border-radius:10px;color:var(--parch);padding:14px;
      font-family:var(--font-body);font-size:1.02rem;line-height:1.6;resize:vertical"
      placeholder="Тук е тихо като в Забранената секция...">${(S.notes || '').replace(/</g, '&lt;')}</textarea>
    <div class="flex flex-center mt"><button class="btn btn-ghost btn-sm" id="notes-close">Готово</button></div>`);
  const ta = $('#notes-area');
  ta.addEventListener('input', () => { S.notes = ta.value; });
  $('#notes-close').addEventListener('click', () => { saveNow(); closeModal(); });
}

/* ---------------- меню ---------------- */
export function openMenu({ onReset, onHome }) {
  openModal(`
    <h2>Меню на замъка</h2>
    <div class="flex" style="flex-direction:column;gap:10px;margin-top:14px">
      <button class="btn btn-ghost btn-sm" id="m-home">Към началния екран</button>
      <button class="btn btn-ghost btn-sm" id="m-howto">Как се играе</button>
      <button class="btn btn-ghost btn-sm" id="m-credits">За тази стая</button>
      <button class="btn btn-ghost btn-sm" id="m-reset" style="border-color:rgba(224,98,93,.5);color:#ffb9b6">Изтрий тази част и започни отначало</button>
    </div>
    <p class="muted mt" style="font-size:.85rem">Играта се записва автоматично. Можеш да затвориш раздела и да се върнеш по-късно.</p>`);
  $('#m-home').addEventListener('click', onHome);
  $('#m-howto').addEventListener('click', howTo);
  $('#m-credits').addEventListener('click', credits);
  $('#m-reset').addEventListener('click', () => {
    openModal(`<h2>Сигурен ли си?</h2><p>Целият напредък, руните и часовникът ще изчезнат като спомен под заклинанието <em>Обливиате</em>.</p>
      <div class="flex flex-center mt"><button class="btn btn-primary btn-sm" id="r-yes">Да, изтрий</button>
      <button class="btn btn-ghost btn-sm" id="r-no">Не, върни ме</button></div>`);
    $('#r-yes').addEventListener('click', onReset);
    $('#r-no').addEventListener('click', closeModal);
  });
}

export function howTo() {
  openModal(`
    <h2>Как се играе</h2>
    <ul style="padding-left:1.2em;line-height:1.75">
      <li><b>Две части.</b> Първа част са десет зали. Втора се отключва само с оценка «Изключителна» в Първа — и е доста по-тежка, с триизмерни загадки.</li>
      <li><b>Всяка решена зала дава руна.</b> Накрая руните се пренареждат в едно заклинание.</li>
      <li><b>Шестдесет минути.</b> Часовникът тече само докато играеш и се пази между посещенията.</li>
      <li><b>Подсказки.</b> Бутонът с крушката дава по една подсказка срещу 2 минути.</li>
      <li><b>Грешките болят.</b> Някои погрешни действия отнемат по 30 секунди.</li>
      <li><b>Бележникът</b> (иконата с листа) пази записките ти — ще ти трябва.</li>
      <li><b>Зърната пясък</b> (само във Втора част) са цифри — ще ти потрябват накрая.</li>
    </ul>
    <p class="muted">Съвет: почти всяка загадка има връзка със света на Хари Потър. Ако си спомниш книгата — печелиш минути.</p>
    <div class="flex flex-center mt"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('modal-back').classList.remove('open')">Разбрах</button></div>`);
}

export function credits() {
  openModal(`
    <h2>За тази стая</h2>
    <p>Фен-проект, вдъхновен от света на Хари Потър на Дж. К. Роулинг. Направен изцяло като статичен уебсайт:
    без сървър и без база данни — прогресът живее в <code>localStorage</code> на твоя браузър.</p>
    <p class="muted">3D сцените са с three.js, звуците са синтезирани в реално време с WebAudio, гербовете и предметите са рисувани със SVG.
    Част от фоновите снимки идват от Wikimedia Commons.</p>
    <div class="flex flex-center mt"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('modal-back').classList.remove('open')">Затвори</button></div>`);
}

/* ---------------- преход между зали ---------------- */
export function doorTransition(title, mid) {
  return new Promise(resolve => {
    const t = $('#room-transition');
    $('#transition-title').textContent = title;
    t.classList.remove('run'); void t.offsetWidth; t.classList.add('run');
    sfx.door();
    setTimeout(() => { mid && mid(); }, 900);
    setTimeout(() => { t.classList.remove('run'); resolve(); }, 2150);
  });
}

/* ---------------- звук ---------------- */
export function wireSoundButton() {
  const b = $('#btn-sound');
  const paint = () => b.classList.toggle('off', !isEnabled());
  paint();
  b.addEventListener('click', () => {
    setEnabled(!isEnabled());
    paint();
    if (isEnabled()) { sfx.chime(); startAmbient(); }
  });
}

export { $, $$ };
