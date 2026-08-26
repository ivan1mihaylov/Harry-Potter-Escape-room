/* ============================================================
   common.js — общи парчета за всички зали
   ============================================================ */
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

export function head(api) {
  return `<div class="room-head">
    <div class="room-eyebrow">${api.meta.eyebrow}</div>
    <h2 class="room-title">${api.meta.title}</h2>
    <p class="room-sub">${api.meta.sub}</p>
  </div>`;
}

/* поле за отговор с бутон */
export function answerBar(id, placeholder, label = 'Изречи') {
  return `<div class="answer-bar">
    <input class="rune-input" id="${id}" autocomplete="off" autocapitalize="characters"
           spellcheck="false" placeholder="${placeholder}">
    <button class="btn btn-house" id="${id}-go"><span>${label}</span></button>
  </div>`;
}

export function wireAnswer(root, id, check) {
  const input = $('#' + id, root);
  const go = $('#' + id + '-go', root);
  if (!input || !go) return;
  const fire = () => check(norm(input.value), input);
  go.addEventListener('click', fire);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') fire(); });
}

/* нормализация: махаме интервали/пунктуация, вдигаме до главни */
export function norm(s) {
  return (s || '').toString().trim().toUpperCase()
    .replace(/[\s\-_.,!?'"`]/g, '')
    .replace(/Ё/g, 'Е');
}

export function shakeEl(e) {
  if (!e) return;
  e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake');
  setTimeout(() => e.classList.remove('shake'), 600);
}

export function shuffle(arr, seed = 7) {
  // детерминистично разбъркване, за да е еднакво при презареждане
  const a = [...arr];
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fmt(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
