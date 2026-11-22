// Koi-Koi rules engine. Pure state + actions, no DOM.
import { CARDS, ID } from './cards.js?v=4';

export const YAKU = {
  goko: { jp: '五光', read: 'Gokō', en: 'Five brights' },
  shiko: { jp: '四光', read: 'Shikō', en: 'Four brights' },
  ameshiko: { jp: '雨四光', read: 'Ame-shikō', en: 'Rainy four brights' },
  sanko: { jp: '三光', read: 'Sankō', en: 'Three brights' },
  hanami: { jp: '花見酒', read: 'Hanami-zake', en: 'Cherry-viewing sake' },
  tsukimi: { jp: '月見酒', read: 'Tsukimi-zake', en: 'Moon-viewing sake' },
  inoshikacho: { jp: '猪鹿蝶', read: 'Ino-shika-chō', en: 'Boar, deer, butterflies' },
  akatan: { jp: '赤短', read: 'Akatan', en: 'Red poetry ribbons' },
  aotan: { jp: '青短', read: 'Aotan', en: 'Blue ribbons' },
  tane: { jp: 'タネ', read: 'Tane', en: 'Five animals' },
  tan: { jp: '短冊', read: 'Tanzaku', en: 'Five ribbons' },
  kasu: { jp: 'カス', read: 'Kasu', en: 'Ten plains' },
};

export function computeYaku(caps) {
  const has = (id) => caps.includes(id);
  const k = (kind) => caps.filter((id) => CARDS[id].kind === kind).length;
  const list = [];
  const add = (key, pts) => list.push({ key, pts, ...YAKU[key] });
  const brights = k('bright');
  const rain = has(ID.rainman);
  if (brights === 5) add('goko', 10);
  else if (brights === 4 && !rain) add('shiko', 8);
  else if (brights === 4) add('ameshiko', 7);
  else if (brights === 3 && !rain) add('sanko', 5);
  if (has(ID.curtain) && has(ID.sake)) add('hanami', 5);
  if (has(ID.moon) && has(ID.sake)) add('tsukimi', 5);
  if (has(ID.boar) && has(ID.deer) && has(ID.butterfly)) add('inoshikacho', 5);
  if (ID.poetry.every(has)) add('akatan', 5);
  if (ID.blue.every(has)) add('aotan', 5);
  const animals = k('animal');
  if (animals >= 5) add('tane', animals - 4);
  const ribbons = k('ribbon');
  if (ribbons >= 5) add('tan', ribbons - 4);
  const plains = k('chaff') + (has(ID.sake) ? 1 : 0); // sake cup also counts as a plain
  if (plains >= 10) add('kasu', plains - 9);
  return { list, total: list.reduce((a, y) => a + y.pts, 0) };
}

// Progress toward each yaku, for the hint panel.
export function yakuProgress(caps) {
  const has = (id) => caps.includes(id);
  const k = (kind) => caps.filter((id) => CARDS[id].kind === kind).length;
  return [
    { key: 'sanko', have: Math.min(k('bright'), 5), need: 3 },
    { key: 'inoshikacho', have: [ID.boar, ID.deer, ID.butterfly].filter(has).length, need: 3 },
    { key: 'akatan', have: ID.poetry.filter(has).length, need: 3 },
    { key: 'aotan', have: ID.blue.filter(has).length, need: 3 },
    { key: 'tane', have: k('animal'), need: 5 },
    { key: 'tan', have: k('ribbon'), need: 5 },
    { key: 'kasu', have: k('chaff') + (has(ID.sake) ? 1 : 0), need: 10 },
  ];
}

function shuffle(a, rnd = Math.random) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const month = (id) => CARDS[id].month;
export const matchesIn = (field, id) => field.filter((f) => month(f) === month(id));

export function newMatch({ rounds = 6, names = ['You', 'Opponent'] } = {}) {
  const s = {
    v: 1,
    names,
    rounds,
    round: 0,
    scores: [0, 0],
    oya: Math.random() < 0.5 ? 0 : 1,
    history: [],
  };
  deal(s);
  return s;
}

function deal(s) {
  let tries = 0;
  for (;;) {
    tries++;
    const deck = shuffle([...Array(48).keys()]);
    const hands = [[], []];
    const field = [];
    for (let r = 0; r < 4; r++) {
      hands[s.oya].push(deck.pop(), deck.pop());
      field.push(deck.pop(), deck.pop());
      hands[1 - s.oya].push(deck.pop(), deck.pop());
    }
    const counts = {};
    field.forEach((id) => (counts[month(id)] = (counts[month(id)] || 0) + 1));
    if (Object.values(counts).some((n) => n === 4) && tries < 50) continue; // four of a month on the field: redeal
    Object.assign(s, {
      round: s.round + 1,
      deck,
      field,
      hands,
      caps: [[], []],
      turn: s.oya,
      phase: 'play',
      pending: null,
      drawn: null,
      best: [0, 0],
      koi: [0, 0],
      result: null,
      ready: [false, false],
      last: null,
      seq: (s.seq || 0) + 1,
    });
    break;
  }
  // Teshi (four of a month) or kuttsuki (four pairs) in hand: instant 6 points.
  for (const p of [s.oya, 1 - s.oya]) {
    const c = {};
    s.hands[p].forEach((id) => (c[month(id)] = (c[month(id)] || 0) + 1));
    const v = Object.values(c);
    const teshi = v.some((n) => n === 4);
    const kuttsuki = v.length === 4 && v.every((n) => n === 2);
    if (teshi || kuttsuki) {
      endRound(s, p, [{ key: teshi ? 'teshi' : 'kuttsuki', jp: teshi ? '手四' : 'くっつき', read: teshi ? 'Teshi' : 'Kuttsuki', en: teshi ? 'Four of a month in hand' : 'Four pairs in hand', pts: 6 }], 6, 1);
      return;
    }
  }
}

function capture(s, p, played, target, from) {
  const ms = matchesIn(s.field, played);
  let taken;
  if (ms.length === 0) {
    s.field.push(played);
    taken = [];
  } else if (ms.length === 3) {
    taken = ms;
  } else {
    taken = [target ?? ms[0]];
  }
  if (taken.length) {
    s.field = s.field.filter((f) => !taken.includes(f));
    s.caps[p].push(played, ...taken);
  }
  s.last = { p, card: played, taken, from };
}

export function applyAction(s0, p, a) {
  const s = structuredClone(s0);
  const err = (m) => ({ ok: false, error: m, state: s0 });
  if (a.type === 'ready') {
    if (s.phase !== 'roundEnd' && s.phase !== 'gameEnd') return err('not over');
    s.ready[p] = true;
    if (s.ready[0] && s.ready[1]) {
      if (s.phase === 'gameEnd') {
        Object.assign(s, { round: 0, scores: [0, 0], history: [] });
      } else if (s.round >= s.rounds) {
        s.phase = 'gameEnd';
        s.ready = [false, false];
        return { ok: true, state: s };
      }
      if (s.result && s.result.winner != null) s.oya = s.result.winner;
      deal(s);
    }
    return { ok: true, state: s };
  }
  if (p !== s.turn) return err('not your turn');
  switch (a.type) {
    case 'play': {
      if (s.phase !== 'play') return err('wrong phase');
      if (!s.hands[p].includes(a.card)) return err('not in hand');
      s.hands[p] = s.hands[p].filter((c) => c !== a.card);
      const ms = matchesIn(s.field, a.card);
      if (ms.length === 2) {
        if (a.target != null && ms.includes(a.target)) {
          capture(s, p, a.card, a.target, 'hand');
          s.phase = 'draw';
        } else {
          s.pending = { card: a.card, options: ms, from: 'hand' };
          s.phase = 'pickPlay';
        }
      } else {
        capture(s, p, a.card, null, 'hand');
        s.phase = 'draw';
      }
      break;
    }
    case 'pick': {
      if (s.phase !== 'pickPlay' && s.phase !== 'pickDraw') return err('wrong phase');
      if (!s.pending.options.includes(a.target)) return err('bad target');
      capture(s, p, s.pending.card, a.target, s.pending.from);
      const wasDraw = s.phase === 'pickDraw';
      s.pending = null;
      s.drawn = null;
      if (wasDraw) afterTurn(s, p);
      else s.phase = 'draw';
      break;
    }
    case 'draw': {
      if (s.phase !== 'draw') return err('wrong phase');
      const card = s.deck.pop();
      const ms = matchesIn(s.field, card);
      if (ms.length === 2) {
        s.drawn = card;
        s.pending = { card, options: ms, from: 'deck' };
        s.phase = 'pickDraw';
        s.last = { p, card, taken: [], from: 'deck', reveal: true };
      } else {
        capture(s, p, card, null, 'deck');
        afterTurn(s, p);
      }
      break;
    }
    case 'koikoi': {
      if (s.phase !== 'koikoi') return err('wrong phase');
      s.koi[p]++;
      s.call = { p, what: 'koikoi', n: s.koi[p], seq: (s.call?.seq || 0) + 1 };
      endTurn(s);
      break;
    }
    case 'shobu': {
      if (s.phase !== 'koikoi') return err('wrong phase');
      s.call = { p, what: 'shobu', seq: (s.call?.seq || 0) + 1 };
      scoreFor(s, p);
      break;
    }
    default:
      return err('unknown action');
  }
  return { ok: true, state: s };
}

function afterTurn(s, p) {
  const y = computeYaku(s.caps[p]);
  if (y.total > s.best[p]) {
    s.best[p] = y.total;
    s.newYaku = { p, list: y.list, total: y.total, seq: (s.newYaku?.seq || 0) + 1 };
    if (s.hands[p].length === 0) return scoreFor(s, p); // no cards left: must stop
    s.phase = 'koikoi';
    return;
  }
  endTurn(s);
}

function endTurn(s) {
  s.turn = 1 - s.turn;
  if (s.hands[0].length === 0 && s.hands[1].length === 0) {
    endRound(s, null, [], 0, 1);
    return;
  }
  s.phase = 'play';
}

function scoreFor(s, p) {
  const y = computeYaku(s.caps[p]);
  let mult = 1;
  if (y.total >= 7) mult *= 2;
  if (s.koi[1 - p] > 0) mult *= 2;
  endRound(s, p, y.list, y.total, mult);
}

function endRound(s, winner, list, base, mult) {
  const pts = base * mult;
  if (winner != null) s.scores[winner] += pts;
  s.result = { winner, list, base, mult, pts, koiOpp: winner != null ? s.koi[1 - winner] : 0 };
  s.history.push({ round: s.round, winner, pts });
  s.phase = 'roundEnd';
  s.ready = [false, false];
}

// What a given player may see (hides the other hand and the deck order).
export function viewFor(s, p) {
  const v = structuredClone(s);
  v.me = p;
  v.oppHandCount = s.hands[1 - p].length;
  v.hands = p === 0 ? [s.hands[0], []] : [[], s.hands[1]];
  v.deckCount = s.deck.length;
  delete v.deck;
  return v;
}
