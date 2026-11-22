// Simple CPU opponent: greedy capture value plus yaku awareness.
import { CARDS, ID } from './cards.js';
import { computeYaku, matchesIn } from './engine.js';

const BASE = { bright: 20, animal: 9, ribbon: 6, chaff: 1 };
const KEY = new Set([ID.sake, ID.boar, ID.deer, ID.butterfly, ...ID.poetry, ...ID.blue]);

function value(id, caps) {
  let v = BASE[CARDS[id].kind];
  if (KEY.has(id)) v += 6;
  const after = computeYaku([...caps, id]).total - computeYaku(caps).total;
  return v + after * 12;
}

function bestTarget(field, id, caps) {
  const ms = matchesIn(field, id);
  return ms.sort((a, b) => value(b, caps) - value(a, caps))[0];
}

export function cpuAction(s, p, level = 'normal') {
  const caps = s.caps[p];
  const opp = s.caps[1 - p];
  if (s.phase === 'pickPlay' || s.phase === 'pickDraw') {
    return { type: 'pick', target: s.pending.options.sort((a, b) => value(b, caps) - value(a, caps))[0] };
  }
  if (s.phase === 'koikoi') {
    const y = computeYaku(caps).total;
    const oppY = computeYaku(opp).total;
    const cards = s.hands[p].length;
    const go = level !== 'easy' && y < 5 && cards >= 4 && oppY < 3 && s.koi[p] < 2;
    return { type: go ? 'koikoi' : 'shobu' };
  }
  // play
  let best = null;
  for (const id of s.hands[p]) {
    const ms = matchesIn(s.field, id);
    let score;
    if (ms.length === 0) {
      // discarding: prefer low-value cards the opponent can't cheaply grab
      score = -value(id, caps) * 0.6 - value(id, opp) * 0.5;
    } else if (ms.length === 3) {
      score = ms.reduce((a, t) => a + value(t, caps), value(id, caps)) + 10;
    } else {
      const t = bestTarget(s.field, id, caps);
      score = value(id, caps) + value(t, caps) + value(t, opp) * 0.4;
    }
    if (level === 'easy') score += Math.random() * 30;
    if (!best || score > best.score) best = { id, score };
  }
  const ms = matchesIn(s.field, best.id);
  return { type: 'play', card: best.id, target: ms.length === 2 ? bestTarget(s.field, best.id, caps) : undefined };
}
