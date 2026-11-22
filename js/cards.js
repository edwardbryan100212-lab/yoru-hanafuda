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
// Card art: traditional-style SVGs by Louie Mantia (Wikimedia Commons, CC BY-SA 4.0),
// recoloured slightly softer by tools/soften.py. Files live in cards/<id>.svg.
export const ART_VERSION = 1;
const src = (name) => `cards/${name}.svg?v=${ART_VERSION}`;

export function cardSVG(id, { label = true } = {}) {
  const c = CARDS[id];
  const m = MONTHS[c.month - 1];
  return `<img class="art" src="${src(id)}" alt="${c.jp}, ${c.en}" draggable="false" decoding="async">`
    + (label ? `<span class="mk" lang="ja" aria-hidden="true">${m.flower}</span>` : '');
}

export const BACK_SVG = `<img class="art" src="${src('back-yoru')}" alt="" draggable="false" decoding="async">`;

// Warm the cache so cards don't pop in on the first deal.
export function preloadArt() {
  [...CARDS.map((c) => c.id), 'back-yoru'].forEach((n) => { const i = new Image(); i.src = src(n); });
}
