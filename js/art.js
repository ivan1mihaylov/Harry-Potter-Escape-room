/* ============================================================
   art.js — рисуваната ръчно SVG графика (гербове, шапка, предмети)
   Всичко е вградено, за да няма счупени картинки.
   ============================================================ */

export const HOUSES = {
  gryffindor: { name: 'Грифиндор', animal: 'Лъв', color: '#c4382f', color2: '#f0c04a', motto: 'Смелост, дързост, воля' },
  slytherin:  { name: 'Слидерин',  animal: 'Змия', color: '#2e9e6b', color2: '#c9cdd0', motto: 'Амбиция, хитрост, находчивост' },
  ravenclaw:  { name: 'Рейвънклоу', animal: 'Орел', color: '#3f6fd8', color2: '#b98a3a', motto: 'Ум, знание, остроумие' },
  hufflepuff: { name: 'Хафълпаф',  animal: 'Язовец', color: '#e0b32a', color2: '#2b2b2b', motto: 'Труд, вярност, търпение' },
};

const SHIELD = (fill, inner) => `
  <defs>
    <linearGradient id="g${inner.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${fill.a}"/><stop offset="1" stop-color="${fill.b}"/>
    </linearGradient>
    <filter id="f${inner.id}"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity=".55"/></filter>
  </defs>
  <path d="M50 4 92 16v42c0 30-20 48-42 58C28 106 8 88 8 58V16L50 4Z"
        fill="url(#g${inner.id})" stroke="#e7d29a" stroke-width="2.5" filter="url(#f${inner.id})"/>
  <path d="M50 11 86 21v36c0 26-17 42-36 51C31 99 14 83 14 57V21L50 11Z"
        fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1"/>
  ${inner.svg}`;

const LION = `
  <g transform="translate(50,58)">
    <path d="M0.0 -34.0 L5.3 -24.9 L13.8 -31.1 L15.0 -20.6 L25.3 -22.8 L22.1 -12.8 L32.3 -10.5 L25.4 -2.7 L33.8 3.6 L24.3 7.9 L29.4 17.0 L19.0 17.1 L20.0 27.5 L10.4 23.3 L7.1 33.3 L0.0 25.5 L-7.1 33.3 L-10.4 23.3 L-20.0 27.5 L-19.0 17.1 L-29.4 17.0 L-24.3 7.9 L-33.8 3.6 L-25.4 -2.7 L-32.3 -10.5 L-22.1 -12.8 L-25.3 -22.8 L-15.0 -20.6 L-13.8 -31.1 L-5.3 -24.9 Z" fill="#c98d2c" stroke="#5b3a12" stroke-width="1.4" stroke-linejoin="round"/>
    <circle cx="0" cy="0" r="20" fill="#f6e2a8" stroke="#5b3a12" stroke-width="1.4"/>
    <circle cx="-15" cy="-14" r="6.5" fill="#e8c878" stroke="#5b3a12" stroke-width="1.2"/>
    <circle cx="15" cy="-14" r="6.5" fill="#e8c878" stroke="#5b3a12" stroke-width="1.2"/>
    <circle cx="-7.5" cy="-4" r="2.6" fill="#3a2408"/>
    <circle cx="7.5" cy="-4" r="2.6" fill="#3a2408"/>
    <ellipse cx="-5" cy="9" rx="7" ry="5.5" fill="#fff5da"/>
    <ellipse cx="5" cy="9" rx="7" ry="5.5" fill="#fff5da"/>
    <path d="M-4 4h8l-4 4.5-4-4.5Z" fill="#8e3b2a"/>
    <path d="M0 8.5v3.5M0 12c-2.6 2.6-6 2-7.5 0M0 12c2.6 2.6 6 2 7.5 0"
          fill="none" stroke="#5b3a12" stroke-width="1.4" stroke-linecap="round"/>
  </g>`;

const SNAKE = `
  <g transform="translate(50,60)">
    <path d="M-2 32C24 26 28 8 8 1c-20-7-18-23 2-28" fill="none" stroke="#e4f6ec"
          stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-2 32C24 26 28 8 8 1c-20-7-18-23 2-28" fill="none" stroke="#9fd4b8"
          stroke-width="4" stroke-linecap="round" stroke-dasharray="2 7"/>
    <path d="M-4 32c-8 1-14 5-16 10 7 1 13-2 17-6" fill="#e4f6ec"/>
    <path d="M6-30c9-4 20-1 24 6 3 6 0 12-7 14-8 2-17-1-20-7-2-5 0-11 3-13Z" fill="#e4f6ec"/>
    <circle cx="22" cy="-25" r="2.4" fill="#0f7a4f"/>
    <path d="M31-20c5 1 9 3 12 6M43-14l-5 1M43-14l-3 4" fill="none" stroke="#c4382f"
          stroke-width="2" stroke-linecap="round"/>
  </g>`;

const EAGLE = `
  <g transform="translate(50,58)">
    <path d="M-4-30c-3-3-9-3-12 1 4 0 6 2 7 5-10 2-19 9-23 19 6-4 12-6 18-6-8 6-13 15-14 26 7-8 15-13 23-15-4 9-5 19-2 29 5-9 11-15 18-18v13h6V11c7 3 13 9 18 18 3-10 2-20-2-29 8 2 16 7 23 15-1-11-6-20-14-26 6 0 12 2 18 6-4-10-13-17-23-19 1-3 3-5 7-5-3-4-9-4-12-1"
          fill="#dfe7f7" stroke="#1c2f60" stroke-width="1.5" stroke-linejoin="round"/>
    <circle cx="-4.5" cy="-24" r="2" fill="#1c2f60"/>
    <circle cx="4.5" cy="-24" r="2" fill="#1c2f60"/>
    <path d="M0-22l5 6h-10l5-6Z" fill="#b98a3a"/>
  </g>`;

const BADGER = `
  <g transform="translate(50,58)">
    <path d="M0-28c17 0 29 13 29 29 0 14-13 24-29 24s-29-10-29-24c0-16 12-29 29-29Z"
          fill="#f7f4ed" stroke="#1b1b1b" stroke-width="2"/>
    <path d="M-24-14c-4-7-3-14 2-17 4-2 9 1 11 6M24-14c4-7 3-14-2-17-4-2-9 1-11 6"
          fill="#f7f4ed" stroke="#1b1b1b" stroke-width="2"/>
    <path d="M-14-24c-5 10-6 30-3 44 4 2 8 3 12 3l-2-47c-2 0-5 0-7 0Z" fill="#1b1b1b"/>
    <path d="M14-24c5 10 6 30 3 44-4 2-8 3-12 3l2-47c2 0 5 0 7 0Z" fill="#1b1b1b"/>
    <circle cx="-11" cy="-4" r="3" fill="#f7f4ed"/>
    <circle cx="11" cy="-4" r="3" fill="#f7f4ed"/>
    <ellipse cx="0" cy="15" rx="5.5" ry="4" fill="#1b1b1b"/>
    <path d="M0 19v5M0 24c-3 3-7 2-9 0M0 24c3 3 7 2 9 0" fill="none" stroke="#1b1b1b"
          stroke-width="1.8" stroke-linecap="round"/>
  </g>`;

const HOGWARTS_CREST = `
  <g>
    <path d="M50 4 92 16v42c0 30-20 48-42 58C28 106 8 88 8 58V16L50 4Z" fill="#151122" stroke="#d9b45b" stroke-width="2.5"/>
    <path d="M50 6v110" stroke="#d9b45b" stroke-width="1" opacity=".55"/>
    <path d="M9 46h82" stroke="#d9b45b" stroke-width="1" opacity=".55"/>
    <g transform="translate(11,9.1) scale(.36)">${LION}</g>
    <g transform="translate(53,9.1) scale(.36)">${SNAKE}</g>
    <g transform="translate(11,53.1) scale(.36)">${EAGLE}</g>
    <g transform="translate(53,53.1) scale(.36)">${BADGER}</g>
    <text x="50" y="118" text-anchor="middle" font-family="Cinzel, serif" font-size="7" fill="#d9b45b" letter-spacing="1">HOGWARTS</text>
  </g>`;

const ANIMALS = { gryffindor: LION, slytherin: SNAKE, ravenclaw: EAGLE, hufflepuff: BADGER };
const FILLS = {
  gryffindor: { a: '#8e2019', b: '#4a0d0a' },
  slytherin:  { a: '#0f7a4f', b: '#04331f' },
  ravenclaw:  { a: '#2a4fa8', b: '#0d1c46' },
  hufflepuff: { a: '#c99416', b: '#5f4406' },
};

let _uid = 0;
export function crestSVG(house) {
  const u = 'c' + (++_uid);
  if (!house || !ANIMALS[house]) {
    return `<svg viewBox="0 0 100 122" xmlns="http://www.w3.org/2000/svg">${HOGWARTS_CREST}</svg>`;
  }
  const inner = { id: u, svg: ANIMALS[house] };
  return `<svg viewBox="0 0 100 122" xmlns="http://www.w3.org/2000/svg">${SHIELD(FILLS[house], inner)}</svg>`;
}

export function hatSVG() {
  return `<svg viewBox="0 0 240 210" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hatg" x1="0" y1="0" x2="0.4" y2="1">
        <stop offset="0" stop-color="#7a6242"/><stop offset=".5" stop-color="#4e3d27"/><stop offset="1" stop-color="#2c2214"/>
      </linearGradient>
      <filter id="hats"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity=".6"/></filter>
    </defs>
    <g filter="url(#hats)">
      <path d="M120 196c-52 0-84-8-84-16s16-13 30-15c10-10 22-14 54-14s44 4 54 14c14 2 30 7 30 15s-32 16-84 16Z" fill="#3b2e1d" stroke="#241b0f" stroke-width="2"/>
      <path d="M74 152C82 118 92 74 108 40c9-19 20-28 27-24 8 4 6 20 0 36-9 24-6 40 4 52 9 11 12 24 6 34-8 13-40 20-71 14Z" fill="url(#hatg)" stroke="#241b0f" stroke-width="2.5"/>
      <path d="M76 150c22-6 44-4 64 4" fill="none" stroke="#241b0f" stroke-width="2" opacity=".6"/>
      <path d="M96 108c14-6 30-6 42 2" fill="none" stroke="#241b0f" stroke-width="2" opacity=".45"/>
      <path d="M105 86c10-4 20-4 28 0" fill="none" stroke="#241b0f" stroke-width="1.6" opacity=".4"/>
      <!-- очи и уста от гънки -->
      <path class="hat-eye" d="M92 132c5-5 11-5 16 0" fill="none" stroke="#16100a" stroke-width="3.4" stroke-linecap="round"/>
      <path class="hat-eye" d="M124 130c5-5 11-5 16 0" fill="none" stroke="#16100a" stroke-width="3.4" stroke-linecap="round"/>
      <path class="hat-mouth" d="M96 158c14 12 34 10 46-2" fill="#170f08" stroke="#16100a" stroke-width="2.5" stroke-linecap="round"/>
    </g>
  </svg>`;
}

/* ---------- шишенца за отварите ---------- */
export function bottleSVG(i, size, tint) {
  const u = 'b' + (++_uid);
  const h = 58 + size * 62;          // височина на стъклото
  const w = 26 + size * 24;          // ширина
  const half = w / 2;
  const shoulder = h * 0.26;
  const yTop = 138 - h;
  const liq = h * 0.72;              // колко е пълно
  return `<svg viewBox="0 0 90 140" class="bottle-svg" preserveAspectRatio="xMidYMax meet">
    <defs>
      <linearGradient id="g${u}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#7fa8b8" stop-opacity=".38"/>
        <stop offset=".16" stop-color="#e6f5fb" stop-opacity=".46"/>
        <stop offset=".36" stop-color="#ffffff" stop-opacity=".30"/>
        <stop offset=".68" stop-color="#5d8697" stop-opacity=".26"/>
        <stop offset="1" stop-color="#22333c" stop-opacity=".48"/>
      </linearGradient>
      <linearGradient id="l${u}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${tint}" stop-opacity=".95"/>
        <stop offset=".3" stop-color="${tint}" stop-opacity=".7"/>
        <stop offset=".62" stop-color="${tint}" stop-opacity="1"/>
        <stop offset="1" stop-color="#000" stop-opacity=".45"/>
      </linearGradient>
      <linearGradient id="c${u}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5a4526"/><stop offset=".35" stop-color="#a8823f"/>
        <stop offset=".7" stop-color="#7a5c2c"/><stop offset="1" stop-color="#42311a"/>
      </linearGradient>
      <clipPath id="k${u}">
        <path d="M${45 - 5} ${yTop} h10 l${half - 5} ${shoulder} v${h - shoulder - half * 0.55}
                 a${half} ${half * 0.62} 0 0 1 -${w} 0 v-${h - shoulder - half * 0.55} Z"/>
      </clipPath>
    </defs>

    <!-- сянка на масата -->
    <ellipse cx="45" cy="137" rx="${half * 1.25}" ry="3.4" fill="#000" opacity=".45"/>

    <!-- течността (изрязана по формата на стъклото) -->
    <g clip-path="url(#k${u})">
      <rect x="${45 - half}" y="${138 - liq}" width="${w}" height="${liq}" fill="url(#l${u})"/>
      <ellipse cx="45" cy="${138 - liq}" rx="${half}" ry="${half * 0.30}" fill="${tint}" opacity=".95"/>
      <ellipse cx="45" cy="${138 - liq}" rx="${half * 0.72}" ry="${half * 0.20}" fill="#fff" opacity=".18"/>
      <ellipse cx="${45 - half * 0.42}" cy="${138 - liq * 0.45}" rx="${half * 0.14}" ry="${liq * 0.3}"
               fill="#fff" opacity=".22"/>
    </g>

    <!-- стъклото -->
    <path d="M${45 - 5} ${yTop} h10 l${half - 5} ${shoulder} v${h - shoulder - half * 0.55}
             a${half} ${half * 0.62} 0 0 1 -${w} 0 v-${h - shoulder - half * 0.55} Z"
          fill="url(#g${u})" stroke="#eaf7fd" stroke-opacity=".6" stroke-width="1.2"/>
    <path d="M${45 - half * 0.55} ${yTop + shoulder + 3} v${(h - shoulder) * 0.62}"
          stroke="#ffffff" stroke-opacity=".5" stroke-width="2.4" stroke-linecap="round" fill="none"/>
    <path d="M${45 + half * 0.62} ${yTop + shoulder + 8} v${(h - shoulder) * 0.4}"
          stroke="#ffffff" stroke-opacity=".18" stroke-width="1.2" stroke-linecap="round" fill="none"/>

    <!-- гърло и тапа -->
    <rect x="${45 - 5.6}" y="${yTop - 1}" width="11.2" height="5" rx="1.6" fill="#0e1519" opacity=".5"/>
    <rect x="${45 - 5}" y="${yTop - 13}" width="10" height="13" rx="2" fill="url(#c${u})" stroke="#2e2211" stroke-width=".8"/>
    <path d="M${45 - 3.4} ${yTop - 11.5} v10" stroke="#d9b877" stroke-opacity=".45" stroke-width="1.2"/>
    <ellipse cx="45" cy="${yTop - 13}" rx="5" ry="1.7" fill="#c39a52"/>
  </svg>`;
}

/* ---------- скъпоценни камъни ---------- */
export function gemSVG(color, glyph = '') {
  const u = 'g' + (++_uid);
  return `<svg viewBox="0 0 60 60">
    <defs>
      <linearGradient id="a${u}" x1=".2" y1="0" x2=".8" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
        <stop offset=".45" stop-color="${color}"/>
        <stop offset="1" stop-color="#000" stop-opacity=".55"/>
      </linearGradient>
      <linearGradient id="b${u}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${color}"/>
        <stop offset="1" stop-color="#000" stop-opacity=".7"/>
      </linearGradient>
      <radialGradient id="s${u}" cx="34%" cy="26%">
        <stop offset="0" stop-color="#fff" stop-opacity=".9"/>
        <stop offset=".5" stop-color="#fff" stop-opacity=".12"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="30" cy="55" rx="15" ry="3" fill="#000" opacity=".4"/>
    <!-- корона -->
    <path d="M30 5 12 19h36L30 5Z" fill="url(#a${u})"/>
    <path d="M12 19h36l-6 8H18l-6-8Z" fill="${color}" opacity=".92"/>
    <path d="M30 5 20 27M30 5l10 22M12 19l6 8M48 19l-6 8" stroke="#fff" stroke-opacity=".35" stroke-width=".9" fill="none"/>
    <!-- павилион -->
    <path d="M18 27h24l-12 26-12-26Z" fill="url(#b${u})"/>
    <path d="M24 27 30 53M36 27 30 53M18 27l12 26M42 27 30 53" stroke="#fff" stroke-opacity=".22" stroke-width=".8" fill="none"/>
    <!-- блясъци -->
    <ellipse cx="30" cy="20" rx="17" ry="12" fill="url(#s${u})"/>
    <path d="M22 13l5 4-5 4-5-4 5-4Z" fill="#fff" opacity=".5"/>
    <path d="M30 5 12 19h36L30 5Zm-18 14h36l-6 8H18l-6-8Zm6 8h24l-12 26-12-26Z"
          fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/>
  </svg>`;
}

/* ---------- пясъчен часовник ---------- */
export function hourglassSVG(color, fill = 0.5) {
  const u = 'h' + (++_uid);
  const topH = 40 * fill;
  const botH = 34 * (1 - fill) + 6;
  return `<svg viewBox="0 0 70 110">
    <defs>
      <linearGradient id="w${u}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#3d2b13"/><stop offset=".3" stop-color="#8a6a2a"/>
        <stop offset=".62" stop-color="#c39a52"/><stop offset="1" stop-color="#3d2b13"/>
      </linearGradient>
      <linearGradient id="g${u}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#0b1116" stop-opacity=".5"/>
        <stop offset=".2" stop-color="#cfe8f2" stop-opacity=".28"/>
        <stop offset=".42" stop-color="#fff" stop-opacity=".14"/>
        <stop offset="1" stop-color="#0b1116" stop-opacity=".5"/>
      </linearGradient>
      <linearGradient id="s${u}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${color}" stop-opacity=".65"/>
        <stop offset=".45" stop-color="${color}"/>
        <stop offset="1" stop-color="#000" stop-opacity=".45"/>
      </linearGradient>
      <clipPath id="ct${u}"><path d="M17 11h36l-17 43h-2L17 11Z"/></clipPath>
      <clipPath id="cb${u}"><path d="M35 56h2l17 43H17l18-43Z"/></clipPath>
    </defs>
    <ellipse cx="35" cy="107" rx="24" ry="3" fill="#000" opacity=".45"/>
    <!-- колони -->
    <rect x="12" y="8" width="5" height="94" rx="2" fill="url(#w${u})"/>
    <rect x="53" y="8" width="5" height="94" rx="2" fill="url(#w${u})"/>
    <!-- стъкло -->
    <path d="M17 11h36l-17 43h-2L17 11Z" fill="url(#g${u})" stroke="#dbeef7" stroke-opacity=".38"/>
    <path d="M35 56h2l17 43H17l18-43Z" fill="url(#g${u})" stroke="#dbeef7" stroke-opacity=".38"/>
    <!-- пясък -->
    <g clip-path="url(#ct${u})"><rect x="17" y="${54 - topH}" width="36" height="${topH}" fill="url(#s${u})"/></g>
    <g clip-path="url(#cb${u})"><rect x="17" y="${99 - botH}" width="36" height="${botH}" fill="url(#s${u})"/></g>
    <rect x="34.3" y="52" width="1.6" height="42" fill="${color}" opacity=".85"/>
    <ellipse cx="35" cy="${99 - botH}" rx="${6 + botH * 0.45}" ry="2.6" fill="${color}" opacity=".9"/>
    <!-- отблясъци -->
    <path d="M23 14l9 22M22 96l9-22" stroke="#fff" stroke-opacity=".3" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <!-- капаци -->
    <rect x="8" y="2" width="54" height="8" rx="3" fill="url(#w${u})" stroke="#2e2211" stroke-width=".8"/>
    <rect x="8" y="100" width="54" height="8" rx="3" fill="url(#w${u})" stroke="#2e2211" stroke-width=".8"/>
    <rect x="10" y="3.4" width="50" height="1.6" rx="1" fill="#e6c17f" opacity=".55"/>
  </svg>`;
}

/* ---------- малки икони ---------- */
export const ICONS = {
  key:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="4"/><path d="M11 11l8 8M16 16l2-2M19 19l2-2"/></svg>`,
  wand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21 16 8"/><path d="m17 3 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 2.6 6.6L21 9.6l-5 4.4 1.6 7L12 17.4 6.4 21 8 14 3 9.6l6.4-1L12 2Z"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
};
