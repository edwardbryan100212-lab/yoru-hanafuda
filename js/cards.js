// 48 hanafuda cards: data and hand-drawn SVG art (no images).
// id = (month - 1) * 4 + index. Index 0 is always the highest card of the month.

export const MONTHS = [
  { n: 1, flower: '松', read: 'matsu', en: 'Pine', old: '睦月' },
  { n: 2, flower: '梅', read: 'ume', en: 'Plum blossom', old: '如月' },
  { n: 3, flower: '桜', read: 'sakura', en: 'Cherry blossom', old: '弥生' },
  { n: 4, flower: '藤', read: 'fuji', en: 'Wisteria', old: '卯月' },
  { n: 5, flower: '菖蒲', read: 'ayame', en: 'Iris', old: '皐月' },
  { n: 6, flower: '牡丹', read: 'botan', en: 'Peony', old: '水無月' },
  { n: 7, flower: '萩', read: 'hagi', en: 'Bush clover', old: '文月' },
  { n: 8, flower: '芒', read: 'susuki', en: 'Pampas grass', old: '葉月' },
  { n: 9, flower: '菊', read: 'kiku', en: 'Chrysanthemum', old: '長月' },
  { n: 10, flower: '紅葉', read: 'momiji', en: 'Maple', old: '神無月' },
  { n: 11, flower: '柳', read: 'yanagi', en: 'Willow', old: '霜月' },
  { n: 12, flower: '桐', read: 'kiri', en: 'Paulownia', old: '師走' },
];

// kind: bright (光) | animal (タネ) | ribbon (短冊) | chaff (カス)
const SPEC = [
  // month 1
  ['bright', 'crane', '松に鶴', 'Crane and sun'], ['ribbon', 'poetry', '松に赤短', 'Poetry ribbon'], ['chaff'], ['chaff'],
  ['animal', 'warbler', '梅に鶯', 'Bush warbler'], ['ribbon', 'poetry', '梅に赤短', 'Poetry ribbon'], ['chaff'], ['chaff'],
  ['bright', 'curtain', '桜に幕', 'Camp curtain'], ['ribbon', 'poetry', '桜に赤短', 'Poetry ribbon'], ['chaff'], ['chaff'],
  ['animal', 'cuckoo', '藤に不如帰', 'Cuckoo'], ['ribbon', 'plain', '藤に短冊', 'Red ribbon'], ['chaff'], ['chaff'],
  ['animal', 'bridge', '菖蒲に八橋', 'Eight-plank bridge'], ['ribbon', 'plain', '菖蒲に短冊', 'Red ribbon'], ['chaff'], ['chaff'],
  ['animal', 'butterfly', '牡丹に蝶', 'Butterflies'], ['ribbon', 'blue', '牡丹に青短', 'Blue ribbon'], ['chaff'], ['chaff'],
  ['animal', 'boar', '萩に猪', 'Boar'], ['ribbon', 'plain', '萩に短冊', 'Red ribbon'], ['chaff'], ['chaff'],
  ['bright', 'moon', '芒に月', 'Full moon'], ['animal', 'geese', '芒に雁', 'Geese'], ['chaff'], ['chaff'],
  ['animal', 'sake', '菊に盃', 'Sake cup'], ['ribbon', 'blue', '菊に青短', 'Blue ribbon'], ['chaff'], ['chaff'],
  ['animal', 'deer', '紅葉に鹿', 'Deer'], ['ribbon', 'blue', '紅葉に青短', 'Blue ribbon'], ['chaff'], ['chaff'],
  ['bright', 'rainman', '柳に小野道風', 'Rain man'], ['animal', 'swallow', '柳に燕', 'Swallow'], ['ribbon', 'plain', '柳に短冊', 'Red ribbon'], ['chaff', 'lightning', '柳のカス', 'Lightning'],
  ['bright', 'phoenix', '桐に鳳凰', 'Phoenix'], ['chaff'], ['chaff'], ['chaff'],
];

export const KIND_JP = { bright: '光', animal: 'タネ', ribbon: '短冊', chaff: 'カス' };
export const KIND_EN = { bright: 'Bright', animal: 'Animal', ribbon: 'Ribbon', chaff: 'Plain' };

export const CARDS = SPEC.map((s, id) => {
  const m = MONTHS[Math.floor(id / 4)];
  const [kind, tag = null, jp, en] = s;
  return {
    id,
    month: m.n,
    index: id % 4,
    kind,
    tag,
    jp: jp || `${m.flower}のカス`,
    en: `${m.en}: ${en || 'plain'}`,
  };
});

export const ID = {
  crane: 0, curtain: 8, moon: 28, rainman: 40, phoenix: 44,
  sake: 32, boar: 24, deer: 36, butterfly: 20,
  poetry: [1, 5, 9], blue: [21, 33, 37],
};

// ---------- art ----------
const R = '#c7362b', K = '#1d1916', G = '#2d6a45', G2 = '#5d8f45', B = '#2a4a8a',
  Y = '#e4b43a', P = '#6b4c95', PK = '#f2b6c4', BR = '#7c4a2a', W = '#fbf7ec', CR = '#f3e9d3';

const f = (n) => +n.toFixed(2);

function blossom(x, y, r, petal, center = Y, edge = R) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    s += `<circle cx="${f(x + Math.cos(a) * r * 0.62)}" cy="${f(y + Math.sin(a) * r * 0.62)}" r="${f(r * 0.5)}" fill="${petal}" stroke="${edge}" stroke-width=".45"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="${f(r * 0.28)}" fill="${center}"/>`;
}

function mist(y, color = R, x = 2, w = 56) {
  return `<path d="M${x} ${y} q6 -4 12 0 t12 0 t12 0 t12 0 t${w - 48} 0 v5 q-6 3 -12 0 t-12 0 t-12 0 t-12 0 t-${w - 48} 0z" fill="${color}" opacity=".95"/>`;
}

function ribbon(x, y, rot, color, text = '') {
  let t = '';
  [...text].forEach((ch, i) => {
    t += `<text x="0" y="${f(-15 + i * 7.4)}" font-size="6.6" text-anchor="middle" fill="${K}" font-family="'Shippori Mincho B1',serif" font-weight="700">${ch}</text>`;
  });
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="-6" y="-24" width="12" height="47" rx="1" fill="${color}" stroke="${K}" stroke-width=".7"/><rect x="-4.6" y="-22.6" width="9.2" height="44.2" fill="none" stroke="${W}" stroke-opacity=".35" stroke-width=".5"/>${t}</g>`;
}

function pineCluster(x, y, s = 1) {
  let lines = '';
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    lines += `<line x1="0" y1="2" x2="${f(Math.cos(a) * 12)}" y2="${f(Math.sin(a) * 8)}" stroke="${K}" stroke-width=".45"/>`;
  }
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-13 1 Q0 -12 13 1 Q0 -2 -13 1z" fill="${G}"/>${lines}</g>`;
}

function mapleLeaf(x, y, s, color = R, rot = 0) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 5 : 2;
    pts.push(`${f(Math.cos(a) * r)},${f(Math.sin(a) * r)}`);
  }
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><polygon points="${pts.join(' ')}" fill="${color}" stroke="${K}" stroke-width=".35"/><line x1="0" y1="0" x2="0" y2="4" stroke="${K}" stroke-width=".4"/></g>`;
}

function kiku(x, y, r, petal = Y, center = R) {
  let s = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 360;
    s += `<ellipse cx="${x}" cy="${f(y - r * 0.55)}" rx="${f(r * 0.17)}" ry="${f(r * 0.5)}" fill="${petal}" stroke="${K}" stroke-width=".35" transform="rotate(${a} ${x} ${y})"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="${f(r * 0.28)}" fill="${center}" stroke="${K}" stroke-width=".4"/>`;
}

function hangingWisteria(x, y, len) {
  let s = `<path d="M${x} ${y} q-3 ${len / 3} 0 ${len}" stroke="${K}" stroke-width=".6" fill="none"/>`;
  const n = Math.round(len / 3);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const r = 2.6 * (1 - t * 0.7);
    s += `<circle cx="${f(x - Math.sin(t * 3) * 1.6 + (i % 2 ? 1.4 : -1.4) * (1 - t))}" cy="${f(y + 2 + i * 3)}" r="${f(r)}" fill="${P}" stroke="${K}" stroke-width=".3"/>`;
  }
  return s;
}

function irisFlower(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0 C-7 -3 -8 -9 -2 -10 C-1 -6 0 -3 0 0z" fill="${P}" stroke="${K}" stroke-width=".4"/>
    <path d="M0 0 C7 -3 8 -9 2 -10 C1 -6 0 -3 0 0z" fill="${P}" stroke="${K}" stroke-width=".4"/>
    <path d="M0 0 C-3 -6 -2 -13 0 -15 C2 -13 3 -6 0 0z" fill="#8a6ac0" stroke="${K}" stroke-width=".4"/>
    <path d="M-1 -4 L1 -4 L0 -8z" fill="${Y}"/></g>`;
}

function blades(x0, y0, n, h, spread) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + (i - n / 2) * spread;
    const lean = (i - n / 2) * 2.4;
    s += `<path d="M${f(x)} ${y0} Q${f(x + lean * 0.3)} ${f(y0 - h * 0.6)} ${f(x + lean)} ${f(y0 - h + (i % 3) * 4)} Q${f(x + lean * 0.4 + 1.6)} ${f(y0 - h * 0.5)} ${f(x + 2.4)} ${y0}z" fill="${G}" stroke="${K}" stroke-width=".3"/>`;
  }
  return s;
}

function peony(x, y, r) {
  return `<g transform="translate(${x} ${y})">
    <circle r="${r}" fill="${R}" stroke="${K}" stroke-width=".5"/>
    <circle r="${f(r * 0.72)}" fill="#e0574a" stroke="${K}" stroke-width=".4"/>
    <circle r="${f(r * 0.45)}" fill="${R}" stroke="${K}" stroke-width=".4"/>
    <path d="M${-r} 0 Q0 ${f(-r * 0.5)} ${r} 0 M${f(-r * 0.8)} ${f(r * 0.4)} Q0 0 ${f(r * 0.8)} ${f(r * 0.4)}" stroke="${K}" stroke-width=".4" fill="none"/>
    <circle r="${f(r * 0.16)}" fill="${Y}"/></g>`;
}

function peonyLeaves(x, y) {
  return `<g transform="translate(${x} ${y})">
    <path d="M0 0 C-14 -2 -18 8 -12 14 C-6 10 -2 6 0 0z" fill="${G}" stroke="${K}" stroke-width=".4"/>
    <path d="M0 0 C12 -4 18 6 14 13 C8 10 3 6 0 0z" fill="${G2}" stroke="${K}" stroke-width=".4"/>
    <path d="M0 0 C-4 8 -2 16 4 20 C6 14 4 6 0 0z" fill="${G}" stroke="${K}" stroke-width=".4"/></g>`;
}

function hagi(x, y, dir = 1) {
  let s = `<path d="M${x} ${y} q${10 * dir} -30 ${30 * dir} -40" stroke="${K}" stroke-width=".9" fill="none"/>`;
  for (let i = 1; i < 9; i++) {
    const t = i / 9;
    const px = x + dir * (30 * t * t + 10 * t * (1 - t) * 2);
    const py = y - (40 * t * t + 60 * t * (1 - t));
    s += `<ellipse cx="${f(px - 2.4 * dir)}" cy="${f(py)}" rx="2.2" ry="1.1" fill="${i % 3 === 0 ? '#b5464e' : R}" transform="rotate(${-30 * dir} ${f(px)} ${f(py)})"/>`;
    s += `<ellipse cx="${f(px + 2.4 * dir)}" cy="${f(py + 1.2)}" rx="2.2" ry="1.1" fill="${G2}" transform="rotate(${30 * dir} ${f(px)} ${f(py)})"/>`;
  }
  return s;
}

function willowStrands(xs) {
  return xs.map((x, i) => `<path d="M${x} 2 q${i % 2 ? 4 : -4} 26 ${i % 2 ? 2 : -2} 52" stroke="${G2}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M${x + 1} 4 q${i % 2 ? 3 : -3} 22 ${i % 2 ? 1 : -1} 40" stroke="${G}" stroke-width=".8" fill="none" stroke-dasharray="3 2"/>`).join('');
}

function kiriFlowers(x, y) {
  let s = `<path d="M${x} ${y + 14} L${x} ${y - 4}" stroke="${K}" stroke-width=".7"/>`;
  for (let i = 0; i < 7; i++) {
    const dx = (i % 3 - 1) * 3.4, dy = Math.floor(i / 3) * 4.4;
    s += `<ellipse cx="${x + dx}" cy="${y + dy - 6}" rx="2" ry="2.6" fill="${P}" stroke="${K}" stroke-width=".3"/>`;
  }
  return s;
}

function kiriLeaf(x, y, s = 1, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 C-12 -2 -14 -16 0 -20 C14 -16 12 -2 0 0z" fill="${G}" stroke="${K}" stroke-width=".5"/><path d="M0 0 L0 -18 M0 -8 L-6 -13 M0 -8 L6 -13 M0 -13 L-4 -17 M0 -13 L4 -17" stroke="${K}" stroke-width=".4"/></g>`;
}

// --- specials ---
const SPECIAL = {
  crane: () => `<circle cx="40" cy="24" r="13" fill="${R}"/>
    <path d="M26 72 C18 66 16 58 24 54 C30 51 38 56 40 62 C42 68 34 74 26 72z" fill="${W}" stroke="${K}" stroke-width=".7"/>
    <path d="M18 60 C12 52 14 46 22 50 C24 54 22 58 18 60z" fill="${K}"/>
    <path d="M37 58 C40 50 37 42 41 36" stroke="${K}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <circle cx="41.5" cy="35" r="2.4" fill="${W}" stroke="${K}" stroke-width=".5"/>
    <circle cx="41.5" cy="33.6" r="1.1" fill="${R}"/>
    <path d="M43.6 35 L48 36" stroke="${K}" stroke-width=".9"/>
    <path d="M28 72 L26 86 M32 72 L33 86" stroke="${K}" stroke-width=".7"/>`,
  warbler: () => `<g transform="translate(36 36) rotate(-12)">
    <ellipse cx="0" cy="0" rx="8" ry="5" fill="#7d8f37" stroke="${K}" stroke-width=".6"/>
    <circle cx="7" cy="-3" r="3.6" fill="#7d8f37" stroke="${K}" stroke-width=".6"/>
    <path d="M10.4 -3 L14 -2.4 L10.4 -1.6z" fill="${K}"/><circle cx="8" cy="-3.6" r=".7" fill="${K}"/>
    <path d="M-7 1 L-15 4 L-8 -2z" fill="#5f6f28" stroke="${K}" stroke-width=".5"/>
    <path d="M-3 -2 C0 -6 4 -5 5 -2" stroke="${K}" stroke-width=".5" fill="none"/></g>`,
  curtain: () => `<path d="M2 52 Q16 60 30 52 Q44 60 58 52 V94 H2z" fill="${R}" stroke="${K}" stroke-width=".7"/>
    <path d="M2 52 Q16 60 30 52 Q44 60 58 52" stroke="${W}" stroke-width="1.6" fill="none"/>
    ${[14, 30, 46].map((x) => `<circle cx="${x}" cy="72" r="5.2" fill="${W}" stroke="${K}" stroke-width=".5"/>${blossom(x, 72, 4.2, R, W, K)}`).join('')}
    <path d="M2 84 H58" stroke="${W}" stroke-width="1"/>`,
  cuckoo: () => `<path d="M44 12 a8 8 0 1 0 6 13 a6.5 6.5 0 1 1 -6 -13z" fill="${Y}"/>
    <g transform="translate(22 22) rotate(-18)">
    <path d="M-12 0 C-6 -10 2 -8 6 -2 L14 -6 L8 0 L14 6 L6 2 C2 8 -6 8 -12 0z" fill="${K}"/>
    <circle cx="-8" cy="-1" r=".8" fill="${R}"/><path d="M-12 0 L-15 1" stroke="${K}" stroke-width=".8"/></g>`,
  bridge: () => `<g stroke="${K}" stroke-width=".7" transform="translate(0 16)">
    <path d="M2 58 L22 50 L22 56 L2 64z" fill="${BR}"/>
    <path d="M22 50 L44 60 L44 66 L22 56z" fill="#9a6339"/>
    <path d="M44 60 L58 54 L58 60 L44 66z" fill="${BR}"/>
    <path d="M8 64 V72 M16 60 V68 M30 60 V70 M38 63 V72 M50 63 V70" /></g>`,
  butterfly: () => [[18, 22, -10], [40, 30, 14]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})">
    <path d="M0 0 C-8 -10 -14 -4 -10 2 C-14 6 -8 12 0 2z" fill="${B}" stroke="${K}" stroke-width=".5"/>
    <path d="M0 0 C8 -10 14 -4 10 2 C14 6 8 12 0 2z" fill="${Y}" stroke="${K}" stroke-width=".5"/>
    <circle cx="-6" cy="-3" r="1.4" fill="${R}"/><circle cx="6" cy="-3" r="1.4" fill="${R}"/>
    <path d="M0 -4 L0 4 M0 -4 L-2 -8 M0 -4 L2 -8" stroke="${K}" stroke-width=".6"/></g>`).join(''),
  boar: () => `<g transform="translate(30 66)">
    <path d="M-18 4 C-18 -8 -6 -12 6 -10 C14 -9 20 -4 20 2 C20 6 16 8 12 8 L-14 8 C-17 8 -18 6 -18 4z" fill="#8a5a33" stroke="${K}" stroke-width=".7"/>
    <path d="M-12 -6 L-8 -12 L-4 -9 L0 -13 L4 -10 L8 -12 L10 -8" stroke="${K}" stroke-width=".7" fill="none"/>
    <path d="M18 0 L24 2 L20 5z" fill="#6b4224" stroke="${K}" stroke-width=".5"/><circle cx="14" cy="-3" r=".9" fill="${K}"/>
    <path d="M19 4 Q22 6 20 8" stroke="${W}" stroke-width=".8" fill="none"/>
    <path d="M-12 8 L-14 14 M-6 8 L-4 14 M6 8 L4 14 M12 8 L14 14" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/></g>`,
  moon: () => `<rect x="2" y="2" width="56" height="52" fill="${R}"/><circle cx="30" cy="30" r="17" fill="${W}" stroke="${K}" stroke-width=".5"/>`,
  geese: () => `<rect x="2" y="2" width="56" height="50" fill="${R}"/>${[[16, 16], [30, 24], [44, 15]].map(([x, y]) => `<path d="M${x - 7} ${y - 3} Q${x - 3} ${y - 1} ${x} ${y + 2} Q${x + 3} ${y - 1} ${x + 7} ${y - 3} Q${x + 3} ${y + 2} ${x} ${y + 5} Q${x - 3} ${y + 2} ${x - 7} ${y - 3}z" fill="${K}"/>`).join('')}`,
  sake: () => `<g transform="translate(30 50)">
    <ellipse cx="0" cy="0" rx="16" ry="6" fill="${R}" stroke="${K}" stroke-width=".7"/>
    <path d="M-16 0 Q-14 12 0 13 Q14 12 16 0" fill="${R}" stroke="${K}" stroke-width=".7"/>
    <ellipse cx="0" cy="0" rx="12.5" ry="4" fill="#a82a22"/>
    <path d="M-6 13 L-5 17 H5 L6 13" fill="${K}"/>
    <text x="0" y="10" font-size="7.6" text-anchor="middle" fill="${Y}" font-family="'Shippori Mincho B1',serif" font-weight="800">寿</text></g>`,
  deer: () => `<g transform="translate(30 62)">
    <path d="M-14 0 C-14 -8 10 -9 12 -2 C13 3 8 5 -10 5 C-13 5 -14 3 -14 0z" fill="#a46a3a" stroke="${K}" stroke-width=".7"/>
    ${[-10, -5, 2, 8].map((x) => `<circle cx="${x}" cy="-1" r="1" fill="${W}"/>`).join('')}
    <path d="M8 -4 C12 -12 16 -18 18 -20" stroke="#a46a3a" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M18 -20 C14 -22 13 -18 16 -16 C20 -15 22 -18 18 -20z" fill="#a46a3a" stroke="${K}" stroke-width=".6"/>
    <path d="M17 -22 L14 -30 M15 -26 L11 -28 M19 -22 L22 -30 M21 -26 L25 -27" stroke="${K}" stroke-width=".9"/>
    <circle cx="16.4" cy="-19" r=".7" fill="${K}"/>
    <path d="M-10 5 L-11 20 M-6 5 L-5 20 M4 5 L3 20 M9 4 L11 20" stroke="${K}" stroke-width="1.2"/></g>`,
  rainman: () => `<rect x="2" y="2" width="56" height="92" fill="${K}"/>${willowStrands([8, 50])}
    <path d="M2 82 Q16 76 30 82 T58 82 V94 H2z" fill="${B}"/>
    <path d="M4 86 q4 -2 8 0 t8 0 M30 88 q4 -2 8 0 t8 0" stroke="${W}" stroke-width=".6" fill="none"/>
    <path d="M14 34 Q30 14 46 34z" fill="${Y}" stroke="${R}" stroke-width=".7"/>
    <path d="M30 22 V34 M22 28 L24 34 M38 28 L36 34" stroke="${R}" stroke-width=".5"/>
    <path d="M30 34 L30 46" stroke="${W}" stroke-width=".7"/>
    <circle cx="27" cy="40" r="3.4" fill="${CR}"/>
    <path d="M22 44 C18 54 18 68 22 76 H36 C38 66 37 54 33 44z" fill="${R}" stroke="${W}" stroke-width=".4"/>
    <path d="M25 50 L33 52 M24 60 L35 62" stroke="${Y}" stroke-width=".6"/>
    <path d="M22 76 L18 80 M36 76 L40 80" stroke="${W}" stroke-width=".8"/>
    <g transform="translate(46 74)"><ellipse rx="4.6" ry="3" fill="${G2}" stroke="${W}" stroke-width=".4"/><circle cx="-2.4" cy="-2.4" r="1" fill="${Y}"/><circle cx="2.4" cy="-2.4" r="1" fill="${Y}"/></g>`,
  swallow: () => `<g transform="translate(32 36) rotate(20)">
    <path d="M-14 -2 C-6 -6 4 -6 10 -2 L20 -10 L14 0 L20 8 L10 2 C4 6 -6 6 -14 -2z" fill="${K}" stroke="${W}" stroke-width=".3"/>
    <circle cx="-10" cy="-2" r="1.6" fill="${R}"/><path d="M-14 -2 L-17 -1" stroke="${K}" stroke-width=".8"/></g>`,
  lightning: () => `<rect x="2" y="2" width="56" height="92" fill="${R}"/>
    <path d="M2 20 Q14 10 26 20 T50 20 T58 18 V2 H2z" fill="${K}"/>
    <path d="M2 70 Q16 60 30 70 T58 68 V94 H2z" fill="${K}"/>
    <path d="M34 16 L22 44 L32 44 L20 72 L42 38 L32 38 L44 16z" fill="${Y}" stroke="${K}" stroke-width=".6"/>
    ${[12, 46].map((x) => `<circle cx="${x}" cy="46" r="5" fill="${W}" stroke="${K}" stroke-width=".7"/><path d="M${x - 3} 46 a3 3 0 0 1 6 0" stroke="${K}" stroke-width=".7" fill="none"/>`).join('')}`,
  phoenix: () => `<circle cx="30" cy="18" r="12" fill="${R}"/>
    <g transform="translate(30 40)">
    <path d="M-4 -2 C-20 -16 -26 -6 -24 4 C-18 0 -10 2 -4 4z" fill="${G2}" stroke="${K}" stroke-width=".5"/>
    <path d="M4 -2 C20 -16 26 -6 24 4 C18 0 10 2 4 4z" fill="${G2}" stroke="${K}" stroke-width=".5"/>
    <path d="M-16 -6 L-20 0 M-12 -8 L-16 0 M16 -6 L20 0 M12 -8 L16 0" stroke="${Y}" stroke-width=".8"/>
    <ellipse cx="0" cy="2" rx="5" ry="8" fill="${R}" stroke="${K}" stroke-width=".5"/>
    <path d="M0 -6 C-2 -12 2 -14 3 -10" stroke="${Y}" stroke-width="1.6" fill="none"/>
    <circle cx="3" cy="-10" r="1.8" fill="${Y}" stroke="${K}" stroke-width=".4"/>
    <path d="M-3 9 C-10 20 -6 28 -12 34 M0 10 C0 22 2 28 0 36 M3 9 C10 20 6 28 12 34" stroke="${R}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M-3 9 C-10 20 -6 28 -12 34 M3 9 C10 20 6 28 12 34" stroke="${Y}" stroke-width=".6" fill="none"/></g>`,
};

// --- month backgrounds ---
const BASE = [
  // 1 pine
  (c) => `${c.index !== 0 ? `<path d="M2 2 H58 V30 Q44 20 30 26 Q16 32 2 22z" fill="${R}"/>` : ''}
    <path d="M2 94 V78 Q20 66 40 76 Q50 80 58 76 V94z" fill="${K}"/>
    <path d="M30 94 C28 80 34 70 26 56 C22 48 28 40 34 36" stroke="${BR}" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    ${pineCluster(36, 36, 1.0)}${pineCluster(18, 52, 0.85)}${pineCluster(42, 60, 0.9)}${c.index >= 2 ? pineCluster(22, 74, 0.8) : ''}`,
  // 2 plum
  (c) => `<path d="M6 94 C10 70 18 56 34 44 C42 38 50 26 54 10" stroke="${K}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M22 58 C14 50 10 40 12 30" stroke="${K}" stroke-width="1.4" fill="none"/>
    ${[[12, 30, 4.2], [40, 40, 4], [52, 16, 3.6], [18, 70, 3.8], [28, 50, 3.4], [48, 30, 3]].map(([x, y, r]) => blossom(x, y, r, R, Y, K)).join('')}
    ${c.index === 0 ? mist(84) : mist(16)}${c.index === 3 ? mist(80) : ''}`,
  // 3 cherry
  (c) => `${c.index !== 0 ? `<path d="M2 94 V80 Q30 70 58 80 V94z" fill="${K}"/>` : ''}
    ${[[14, 16], [30, 10], [46, 18], [20, 32], [40, 34], [10, 48], [50, 46]].slice(0, c.index === 0 ? 5 : 7).map(([x, y]) => blossom(x, y, 5, W, R, R) + blossom(x + 4, y + 4, 3.4, PK, R, R)).join('')}
    ${c.index === 0 ? '' : mist(60)}${c.index === 2 ? mist(70) : ''}`,
  // 4 wisteria
  (c) => `<path d="M2 6 Q20 14 34 6 T58 8" stroke="${K}" stroke-width="1.4" fill="none"/>
    ${hangingWisteria(12, 8, 30)}${hangingWisteria(26, 10, c.index === 0 ? 24 : 40)}${hangingWisteria(42, 8, 34)}${c.index !== 0 ? hangingWisteria(52, 8, 24) : ''}
    ${c.index === 0 ? '' : `<path d="M2 94 V84 Q30 76 58 86 V94z" fill="${K}"/>`}`,
  // 5 iris
  (c) => `${blades(30, 94, c.index === 0 ? 7 : 9, c.index === 0 ? 60 : 46, 4.6)}
    ${irisFlower(20, c.index === 0 ? 40 : 50, 1.1)}${irisFlower(38, c.index === 0 ? 34 : 44, 1.2)}${c.index !== 0 ? irisFlower(28, 34, 1) : ''}`,
  // 6 peony
  (c) => `${peonyLeaves(30, 66)}${peony(30, c.index === 0 ? 64 : 50, 10)}${c.index >= 2 ? peony(16, 30, 6) : ''}`,
  // 7 bush clover
  (c) => `${hagi(6, 94, 1)}${hagi(54, 94, -1)}${c.index !== 0 ? hagi(20, 94, 1) : ''}
    ${c.index >= 2 ? `<path d="M2 2 H58 V12 Q30 4 2 12z" fill="${R}" opacity=".9"/>` : ''}`,
  // 8 susuki
  (c) => `${c.index >= 2 ? `<rect x="2" y="2" width="56" height="50" fill="${R}"/>` : ''}
    <path d="M2 94 V56 Q30 40 58 56 V94z" fill="${K}"/>
    ${Array.from({ length: 11 }, (_, i) => `<path d="M${6 + i * 5} 94 Q${5 + i * 5} 70 ${8 + i * 5} ${52 + (i % 3) * 3}" stroke="${CR}" stroke-width=".55" fill="none"/>`).join('')}`,
  // 9 chrysanthemum
  (c) => `<path d="M30 94 C28 80 34 70 30 54" stroke="${G}" stroke-width="1.4" fill="none"/>
    ${kiriLeafLike(16, 84)}${kiriLeafLike(44, 80, -1)}
    ${c.index === 0 ? kiku(46, 22, 10) + kiku(14, 28, 7, R, Y) : kiku(30, 34, 13) + kiku(14, 60, 7, R, Y) + kiku(46, 62, 7, W, Y)}`,
  // 10 maple
  (c) => `<path d="M58 4 C40 12 30 20 22 40 M40 12 C44 24 52 30 56 34" stroke="${K}" stroke-width="1.2" fill="none"/>
    ${[[44, 12, 1.4], [28, 20, 1.6], [52, 30, 1.2], [14, 30, 1.3], [22, 44, 1.2], [44, 40, 1.4]].slice(0, c.index === 0 ? 4 : 6).map(([x, y, s], i) => mapleLeaf(x, y, s, i % 2 ? '#d6522e' : R, i * 25)).join('')}
    ${c.index >= 2 ? [[16, 72, 1.5], [36, 80, 1.3], [48, 64, 1.4], [26, 58, 1.1]].map(([x, y, s], i) => mapleLeaf(x, y, s, i % 2 ? Y : R, i * 40)).join('') : ''}`,
  // 11 willow
  (c) => (c.tag === 'rainman' || c.tag === 'lightning') ? '' : `<rect x="2" y="2" width="56" height="92" fill="${c.tag === 'swallow' ? '#e7dcc0' : CR}"/>${willowStrands([10, 22, 40, 52])}
    <path d="M2 86 Q30 78 58 86 V94 H2z" fill="${B}"/>`,
  // 12 paulownia
  (c) => `${c.index === 3 ? `<rect x="2" y="70" width="56" height="24" fill="${Y}"/>` : ''}
    ${kiriLeaf(16, 92, 1.3, -20)}${kiriLeaf(44, 92, 1.3, 20)}${kiriLeaf(30, 90, 1.5, 0)}
    ${c.index === 0 ? kiriFlowers(14, 58) + kiriFlowers(46, 58) : kiriFlowers(30, 30) + kiriFlowers(16, 46) + kiriFlowers(44, 44)}`,
];

function kiriLeafLike(x, y, dir = 1) {
  return `<path d="M${x} ${y} C${x - 8 * dir} ${y - 6} ${x - 4 * dir} ${y - 16} ${x + 6 * dir} ${y - 14} C${x + 8 * dir} ${y - 6} ${x + 4 * dir} ${y} ${x} ${y}z" fill="${G}" stroke="${K}" stroke-width=".4"/>`;
}

function ribbonFor(c) {
  if (c.kind !== 'ribbon') return '';
  const pos = { 1: [22, 58, -12], 2: [24, 62, 10], 3: [34, 64, -8], 4: [34, 62, 8], 5: [40, 62, -10], 6: [42, 34, 12], 7: [30, 48, -8], 9: [16, 66, -10], 10: [16, 62, 10], 11: [34, 52, 10] }[c.month];
  const color = c.tag === 'blue' ? B : R;
  const text = c.tag === 'poetry' ? (c.month === 3 ? 'みよしの' : 'あかよろし') : '';
  return ribbon(pos[0], pos[1], pos[2], color, text);
}

const cache = new Map();

export function cardSVG(id, { label = true } = {}) {
  const key = id + (label ? 'L' : '');
  if (cache.has(key)) return cache.get(key);
  const c = CARDS[id];
  const m = MONTHS[c.month - 1];
  const art = BASE[c.month - 1](c) + (c.tag && SPECIAL[c.tag] ? SPECIAL[c.tag]() : '') + ribbonFor(c);
  const tag = label
    ? `<g class="lbl"><rect x="3.2" y="3.2" width="${m.flower.length > 1 ? 15 : 9}" height="9" rx="1.6" fill="${W}" fill-opacity=".9" stroke="${K}" stroke-width=".4"/><text x="${m.flower.length > 1 ? 10.7 : 7.7}" y="10.2" font-size="6.4" text-anchor="middle" fill="${K}" font-family="'Shippori Mincho B1',serif" font-weight="700">${m.flower}</text></g>`
    : '';
  const svg = `<svg viewBox="0 0 60 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${c.jp}, ${c.en}">
    <rect x="0" y="0" width="60" height="96" rx="3.6" fill="#5e1914"/>
    <rect x="2" y="2" width="56" height="92" rx="2.4" fill="${CR}"/>
    <svg x="2" y="2" width="56" height="92" viewBox="2 2 56 92" overflow="hidden">${art}</svg>${tag}</svg>`;
  cache.set(key, svg);
  return svg;
}

export const BACK_SVG = `<svg viewBox="0 0 60 96" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect width="60" height="96" rx="3.6" fill="#2a1410"/>
  <rect x="2" y="2" width="56" height="92" rx="2.4" fill="#3b1a14"/>
  <rect x="5" y="5" width="50" height="86" rx="1.6" fill="none" stroke="#7a3a2c" stroke-width=".6"/>
  <text x="30" y="54" font-size="15" text-anchor="middle" fill="#8c4636" font-family="'Shippori Mincho B1',serif" font-weight="800">花</text></svg>`;
