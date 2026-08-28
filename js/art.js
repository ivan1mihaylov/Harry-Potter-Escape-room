/* ============================================================
   art.js — SVG графиката (шапка, предмети, камъни).
   Гербовете на домовете са истинските рисувани гербове и стоят
   като картинки в assets/img/ — виж assets/CREDITS.md.
   ============================================================ */

export const HOUSES = {
  gryffindor: { name: 'Грифиндор', animal: 'Лъв', color: '#c4382f', color2: '#f0c04a', motto: 'Смелост, дързост, воля' },
  slytherin:  { name: 'Слидерин',  animal: 'Змия', color: '#2e9e6b', color2: '#c9cdd0', motto: 'Амбиция, хитрост, находчивост' },
  ravenclaw:  { name: 'Рейвънклоу', animal: 'Орел', color: '#3f6fd8', color2: '#b98a3a', motto: 'Ум, знание, остроумие' },
  hufflepuff: { name: 'Хафълпаф',  animal: 'Язовец', color: '#e0b32a', color2: '#2b2b2b', motto: 'Труд, вярност, търпение' },
};

let _uid = 0;
const CREST_SRC = {
  gryffindor: 'assets/img/crest-gryffindor.png',
  slytherin:  'assets/img/crest-slytherin.png',
  ravenclaw:  'assets/img/crest-ravenclaw.png',
  hufflepuff: 'assets/img/crest-hufflepuff.png',
};
const HOGWARTS_SRC = 'assets/img/crest-hogwarts.png';

/* Гербът остава <svg>, за да пасне на същите правила в CSS (svg{width:100%}),
   но вътре е самата картинка — «meet» я вписва, без да я разтяга.        */
export function crestSVG(house) {
  const src = CREST_SRC[house] || HOGWARTS_SRC;
  const alt = house && HOUSES[house] ? HOUSES[house].name : 'Хогуортс';
  return `<svg viewBox="0 0 100 122" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Герб на ${alt}">
    <image href="${src}" x="0" y="0" width="100" height="122" preserveAspectRatio="xMidYMid meet"/>
  </svg>`;
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
/* Скъпоценният камък се строи от истински фасети: короната и павилионът
   са осмостени и всяка стена получава своя стойност на светлината, а
   отдолу камъкът хвърля цветно петно. Затова блести, вместо да е петно. */
function mix(hex, other, k) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const a = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16));
  const b = [0, 2, 4].map(i => parseInt(other.slice(i, i + 2), 16));
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * k)
    .toString(16).padStart(2, '0')).join('');
}
const light = (c, k) => mix(c, 'ffffff', k);
const dark  = (c, k) => mix(c, '000000', k);

export function gemSVG(color, glyph = '') {
  const u = 'g' + (++_uid);
  const N = 8;                       /* осем фасети в кръг */
  const R = 22, GR = 19, TB = 9;     /* корона, поясче, маса */
  const pt = (r, i, cy = 26) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2 + Math.PI / N;
    return [30 + Math.cos(a) * r, cy + Math.sin(a) * r * 0.42];
  };
  /* светлината пада горе вляво: стойността на всяка фасета се смята от
     ъгъла ѝ спрямо тази посока, не от индекса                          */
  const LIGHT = -Math.PI * 0.75;
  const mid = i => (i / N) * Math.PI * 2 - Math.PI / 2 + (Math.PI * 2) / N;
  const lum = i => 0.5 + 0.5 * Math.cos(mid(i) - LIGHT);

  const crown = [], pav = [], table = [];
  for (let i = 0; i < N; i++) {
    const a = pt(GR, i), b = pt(GR, (i + 1) % N);
    const ta = pt(TB, i), tb = pt(TB, (i + 1) % N);
    const k = lum(i);
    crown.push(`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}
      L${tb[0].toFixed(1)} ${(tb[1] - 8).toFixed(1)}L${ta[0].toFixed(1)} ${(ta[1] - 8).toFixed(1)}Z"
      fill="${k > 0.55 ? light(color, (k - 0.55) * 1.5) : dark(color, (0.55 - k) * 0.9)}"/>`);
    table.push(`${ta[0].toFixed(1)},${(ta[1] - 8).toFixed(1)}`);
    /* павилион: от поясчето към върха */
    const kp = 1 - lum(i) * 0.85;   /* павилионът връща светлината обърнато */
    pav.push(`<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L30 54Z"
      fill="${kp > 0.5 ? light(color, (kp - 0.5) * 0.9) : dark(color, (0.5 - kp) * 1.35)}"/>`);
  }

  return `<svg viewBox="0 0 60 60">
    <defs>
      <radialGradient id="gl${u}" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="${color}" stop-opacity=".7"/>
        <stop offset="1" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="tb${u}" x1=".2" y1="0" x2=".8" y2="1">
        <stop offset="0" stop-color="${light(color, 0.75)}"/>
        <stop offset=".55" stop-color="${light(color, 0.25)}"/>
        <stop offset="1" stop-color="${dark(color, 0.2)}"/>
      </linearGradient>
      <radialGradient id="sp${u}" cx="34%" cy="24%" r="52%">
        <stop offset="0" stop-color="#fff" stop-opacity=".85"/>
        <stop offset=".55" stop-color="#fff" stop-opacity=".1"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <!-- цветното петно, което камъкът хвърля -->
    <ellipse cx="30" cy="50" rx="21" ry="8" fill="url(#gl${u})"/>
    <ellipse cx="30" cy="56" rx="13" ry="2.6" fill="#000" opacity=".45"/>

    <g>
      ${pav.join('')}
      ${crown.join('')}
      <polygon points="${table.join(' ')}" fill="url(#tb${u})"/>
      <!-- ръбове между фасетите -->
      <g fill="none" stroke="#fff" stroke-opacity=".3" stroke-width=".7">
        ${Array.from({ length: N }, (_, i) => {
          const a = pt(GR, i), t = pt(TB, i);
          return `<path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${t[0].toFixed(1)} ${(t[1] - 8).toFixed(1)}"/>
                  <path d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L30 54"/>`;
        }).join('')}
      </g>
      <polygon points="${table.join(' ')}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width=".9"/>
      <ellipse cx="30" cy="26" rx="${GR}" ry="${(GR * 0.42).toFixed(1)}"
               fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1"/>
    </g>

    <!-- блясък и искра -->
    <ellipse cx="30" cy="20" rx="16" ry="11" fill="url(#sp${u})"/>
    <path d="M21 14l1.6 4.4L27 20l-4.4 1.6L21 26l-1.6-4.4L15 20l4.4-1.6L21 14Z"
          fill="#fff" opacity=".75"/>
    <path d="M40 30l.9 2.5L43.5 33l-2.6.9L40 36.5l-.9-2.6L36.5 33l2.6-.5L40 30Z"
          fill="#fff" opacity=".45"/>
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
