import { CARDS, MONTHS, KIND_JP, KIND_EN, ID, cardSVG, BACK_SVG, preloadArt } from './cards.js?v=6';
import { newMatch, applyAction, viewFor, computeYaku, yakuProgress, matchesIn, YAKU } from './engine.js';
import { cpuAction } from './ai.js';
import { play, setSound as setAudio } from './sound.js?v=2';
import { hostRoom, joinRoom, cleanCode } from './net.js';

const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const store = {
  get(k, d) { try { const v = localStorage.getItem('yh.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('yh.' + k, JSON.stringify(v)); } catch { /* ignore */ } },
};

const EMOTES = [
  ['よろしく', 'Good luck'],
  ['お見事', 'Nicely played'],
  ['まいった', 'You got me'],
  ['まだまだ', 'Not over yet'],
  ['もう一勝負', 'One more game'],
];

// ---------------- state ----------------
let mode = null; // 'cpu' | 'host' | 'guest'
let state = null; // authoritative state (cpu / host)
let view = null; // what is on screen
let link = null; // network handle
let timer = null;
let cpuLevel = 'normal';
let selected = null;
let hints = store.get('hints', true);
let sound = store.get('sound', true);
const seen = { call: 0, yaku: 0, seq: 0, phase: '' };

// ---------------- sound ----------------

// ---------------- controller ----------------
function startCpu(rounds, name) {
  mode = 'cpu';
  state = newMatch({ rounds, names: [name, '胴元 The house'] });
  enterTable();
  publish();
}

function commit(s) {
  state = s;
  publish();
}

function publish() {
  render(viewFor(state, 0));
  if (mode === 'host' && link) link.send({ t: 'state', view: viewFor(state, 1) });
  pump();
}

function act(p, a) {
  const r = applyAction(state, p, a);
  if (r.ok) commit(r.state);
  return r.ok;
}

function pump() {
  clearTimeout(timer);
  const s = state;
  if (!s) return;
  if (s.phase === 'draw') {
    timer = setTimeout(() => act(s.turn, { type: 'draw' }), 620);
    return;
  }
  if (mode === 'cpu') {
    if ((s.phase === 'roundEnd' || s.phase === 'gameEnd') && !s.ready[1]) {
      act(1, { type: 'ready' });
      return;
    }
    if (s.turn === 1 && ['play', 'pickPlay', 'pickDraw', 'koikoi'].includes(s.phase)) {
      const wait = s.phase === 'koikoi' ? 1700 : s.phase === 'play' ? 900 : 700;
      timer = setTimeout(() => act(1, cpuAction(state, 1, cpuLevel)), wait);
    }
  }
}

// The player's own action, wherever the game runs.
function send(a) {
  if (!view) return;
  if (mode === 'guest') link.send({ t: 'act', a });
  else act(0, a);
}

function sendEmote(i) {
  showBubble(view.me, i);
  if (link) link.send({ t: 'emote', i });
  if (mode === 'cpu' && Math.random() < 0.6) setTimeout(() => showBubble(1, [0, 2, 3][Math.floor(Math.random() * 3)]), 1200);
}

// ---------------- table render ----------------
function cardEl(id, extra = '') {
  const b = el('button', 'card ' + extra);
  b.type = 'button';
  b.dataset.card = id;
  b.innerHTML = cardSVG(id, { label: true });
  b.setAttribute('aria-label', `${CARDS[id].jp}, ${CARDS[id].en}`);
  return b;
}
function backEl() {
  const d = el('div', 'card back', BACK_SVG);
  return d;
}

function snapshotRects() {
  const m = new Map();
  document.querySelectorAll('#table [data-card]').forEach((e) => m.set(e.dataset.card, e.getBoundingClientRect()));
  return m;
}

function flip(before, v, fresh) {
  const deckRect = $('#deck').getBoundingClientRect();
  if (fresh) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    document.querySelectorAll('#field [data-card], #myHand [data-card], #oppHand .card').forEach((e) => {
      const to = e.getBoundingClientRect();
      e.animate([
        { transform: `translate(${deckRect.left - to.left}px, ${deckRect.top - to.top}px) scale(${deckRect.width / to.width})`, transformOrigin: 'top left', opacity: 0.4 },
        { transform: 'none', transformOrigin: 'top left', opacity: 1 },
      ], { duration: 380, delay: i++ * 35, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    });
    return;
  }
  const oppRect = $('#oppHand').getBoundingClientRect();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  document.querySelectorAll('#table [data-card]').forEach((e) => {
    const id = e.dataset.card;
    let from = before.get(id);
    const to = e.getBoundingClientRect();
    if (!from && v.last && String(v.last.card) === id) {
      from = v.last.from === 'deck' ? deckRect : v.last.p !== v.me ? { left: oppRect.right - to.width, top: oppRect.top, width: to.width, height: to.height } : null;
    }
    if (!from) return;
    const dx = from.left - to.left, dy = from.top - to.top;
    const sx = from.width / to.width, sy = from.height / to.height;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01) return;
    e.animate([
      { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, zIndex: 10 },
      { transformOrigin: 'top left', transform: 'none', zIndex: 10 },
    ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
}

function render(v) {
  const prev = view;
  view = v;
  const me = v.me, op = 1 - me;
  if (prev && (prev.phase !== v.phase || prev.turn !== v.turn || prev.seq !== v.seq)) selected = null;
  if (selected != null && !v.hands[me].includes(selected)) selected = null;
  const before = snapshotRects();

  // top bar
  const mo = MONTHS[(v.round - 1) % 12];
  $('#roundInfo').innerHTML = `<span class="month" lang="ja">${mo.old}</span><span>Month ${v.round} of ${v.rounds}</span>`;

  // players
  const tag = (p) => {
    const parts = [`<span class="nm">${esc(v.names[p])}</span>`, `<span class="pts">${v.scores[p]}<small>pts</small></span>`];
    if (v.oya === p) parts.push('<span class="badge" lang="ja" title="Dealer: plays first this month">親</span>');
    if (v.koi[p]) parts.push(`<span class="badge koi" lang="ja" title="Called koi-koi">こいこい${v.koi[p] > 1 ? '×' + v.koi[p] : ''}</span>`);
    return parts.join('');
  };
  const myTurn = v.turn === me && !['roundEnd', 'gameEnd'].includes(v.phase);
  const oppTag = $('#oppTag'), meTag = $('#meTag');
  keepBubble(oppTag, () => (oppTag.innerHTML = tag(op)));
  keepBubble(meTag, () => (meTag.innerHTML = tag(me)));
  oppTag.classList.toggle('turn', !myTurn && !['roundEnd', 'gameEnd'].includes(v.phase));
  meTag.classList.toggle('turn', myTurn);

  // opponent hand
  const oh = $('#oppHand');
  oh.innerHTML = '';
  for (let i = 0; i < v.oppHandCount; i++) oh.append(backEl());

  // captures
  renderCaps($('#oppCaps'), v.caps[op]);
  renderCaps($('#meCaps'), v.caps[me]);

  // deck
  const dk = $('#deck');
  dk.innerHTML = '';
  if (v.deckCount > 0) {
    dk.append(backEl());
    dk.append(el('span', 'count', `${v.deckCount} left`));
  }
  if (v.drawn != null) dk.append(cardEl(v.drawn, 'drawn'));

  // field
  const fd = $('#field');
  fd.innerHTML = '';
  const picking = myTurn && (v.phase === 'pickPlay' || v.phase === 'pickDraw');
  const selMatches = selected != null ? matchesIn(v.field, selected) : [];
  for (const id of v.field) {
    const isOpt = picking ? v.pending.options.includes(id) : selected != null && selMatches.includes(id);
    const c = cardEl(id, isOpt ? 'match' : '');
    if (isOpt) c.addEventListener('click', () => onFieldClick(id));
    else c.tabIndex = -1;
    fd.append(c);
  }
  if (selected != null && selMatches.length === 0 && v.phase === 'play' && myTurn) {
    const d = el('button', 'drop', `<span><b lang="ja">場に出す</b>Place on table</span>`);
    d.type = 'button';
    d.addEventListener('click', () => playSelected());
    fd.append(d);
  }

  // my hand
  const mh = $('#myHand');
  mh.innerHTML = '';
  const canPlay = myTurn && v.phase === 'play';
  mh.classList.toggle('active', canPlay);
  for (const id of v.hands[me]) {
    const can = hints && canPlay && matchesIn(v.field, id).length > 0;
    const c = cardEl(id, (can ? 'can ' : '') + (selected === id ? 'sel' : ''));
    if (canPlay) {
      c.addEventListener('click', () => onHandClick(id));
      c.addEventListener('dblclick', () => { selected = id; playSelected(); });
    } else c.tabIndex = -1;
    mh.append(c);
  }

  // status line
  $('#status').innerHTML = statusText(v, myTurn);

  // reach panel
  renderReach(v);

  flip(before, v, !prev || prev.seq !== v.seq);
  if (!prev || prev.seq !== v.seq) play('deal');

  // sounds for moves
  if (prev && v.last && JSON.stringify(prev.last) !== JSON.stringify(v.last)) play(v.last.taken.length ? 'take' : 'place');

  // events: calls, yaku, end of round
  handleEvents(prev, v);
}

function keepBubble(node, fn) {
  const b = node.querySelector('.bubble');
  fn();
  if (b) node.append(b);
}

function statusText(v, myTurn) {
  const opName = esc(v.names[1 - v.me]);
  if (v.phase === 'roundEnd' || v.phase === 'gameEnd') return '';
  if (!myTurn) {
    if (v.phase === 'koikoi') return `<span lang="ja">思案中</span>${opName} is deciding whether to keep going`;
    return `<span lang="ja">相手の番</span>${opName} is playing`;
  }
  switch (v.phase) {
    case 'play': return selected != null
      ? `<span lang="ja">あなたの番</span>${matchesIn(v.field, selected).length ? 'Tap a lit card on the table to take it' : 'No match. Place it on the table'}`
      : `<span lang="ja">あなたの番</span>Choose a card from your hand`;
    case 'pickPlay':
    case 'pickDraw': return `<span lang="ja">どちらを取る</span>Two cards match. Choose which one to take`;
    case 'draw': return `<span lang="ja">山札</span>Drawing from the pile`;
    case 'koikoi': return `<span lang="ja">役ができた</span>You made a yaku`;
    default: return '';
  }
}

const GROUPS = ['bright', 'animal', 'ribbon', 'chaff'];
function renderCaps(node, caps) {
  node.innerHTML = '';
  for (const k of GROUPS) {
    const ids = caps.filter((id) => CARDS[id].kind === k).sort((a, b) => a - b);
    if (!ids.length) continue;
    const g = el('div', 'cap-group');
    g.append(el('div', 'lbl', `${KIND_JP[k]}<em>${ids.length}</em>`));
    const row = el('div', 'cap-row');
    ids.forEach((id) => { const c = cardEl(id); c.tabIndex = -1; row.append(c); });
    g.append(row);
    node.append(g);
  }
}

function renderReach(v) {
  const me = v.me;
  const prog = yakuProgress(v.caps[me]);
  const now = computeYaku(v.caps[me]);
  const opp = computeYaku(v.caps[1 - me]);
  let h = `<h3><b lang="ja">役</b>Yaku in reach</h3>`;
  for (const p of prog) {
    const done = p.have >= p.need;
    h += `<div class="yk ${done ? 'done' : ''}" title="${YAKU[p.key].en}"><span lang="ja">${YAKU[p.key].jp}</span><span class="bar"><i style="width:${Math.min(100, (p.have / p.need) * 100)}%"></i></span><span>${p.have}/${p.need}</span></div>`;
  }
  h += `<div class="now">Points so far<br>You <b>${now.total}</b>&ensp;${esc(v.names[1 - me])} <b>${opp.total}</b></div>`;
  $('#reach').innerHTML = h;
}

// ---------------- interactions ----------------
function onHandClick(id) {
  if (selected === id) {
    const ms = matchesIn(view.field, id);
    if (ms.length !== 2) return playSelected();
  }
  selected = id;
  render(view);
}

function onFieldClick(id) {
  const v = view;
  if (v.phase === 'pickPlay' || v.phase === 'pickDraw') return send({ type: 'pick', target: id });
  if (selected != null) send({ type: 'play', card: selected, target: id });
}

function playSelected() {
  if (selected == null) return;
  const ms = matchesIn(view.field, selected);
  if (ms.length === 2) return; // must choose a target
  send({ type: 'play', card: selected });
}

// ---------------- events / overlays ----------------
let pendingModal = null;
function handleEvents(prev, v) {
  const me = v.me;
  let delay = 0;
  if (v.newYaku && v.newYaku.seq !== seen.yaku) {
    seen.yaku = v.newYaku.seq;
    if (prev) {
      const names = v.newYaku.list.map((y) => y.jp).join('　');
      const who = v.newYaku.p === me ? 'Your yaku' : `${v.names[v.newYaku.p]}'s yaku`;
      banner(names, `${who}: ${v.newYaku.total} pts`, 'yaku');
      play('yaku');
      delay = 1400;
    }
  }
  if (v.call && v.call.seq !== seen.call) {
    seen.call = v.call.seq;
    if (prev) {
      const who = v.call.p === me ? 'You' : v.names[v.call.p];
      if (v.call.what === 'koikoi') banner('こいこい', `${who} keep${v.call.p === me ? '' : 's'} going`, 'koi');
      else banner('勝負', `${who} stop${v.call.p === me ? '' : 's'} and score${v.call.p === me ? '' : 's'}`, 'shobu');
      play(v.call.what);
      delay = 1400;
    }
  }
  const key = `${v.seq}:${v.phase}:${v.turn}:${v.ready?.[me]}`;
  if (key === seen.phase) return;
  seen.phase = key;
  clearTimeout(pendingModal);
  if (v.phase === 'koikoi' && v.turn === me) {
    pendingModal = setTimeout(() => koiModal(view), delay);
  } else if (v.phase === 'roundEnd' || v.phase === 'gameEnd') {
    const r = v.result;
    const tune = v.phase === 'gameEnd' ? 'gameEnd' : !r || r.winner == null ? 'draw-round' : r.winner === me ? 'win' : 'lose';
    if (!v.ready[me]) setTimeout(() => play(tune), delay);
    pendingModal = setTimeout(() => endModal(view), delay + 300);
  } else if (modalKind === 'koi' || modalKind === 'end') {
    closeModal();
  }
}

let bannerTimer = null;
function banner(text, sub, cls) {
  const b = $('#banner');
  b.innerHTML = `<div class="call ${cls}" lang="ja">${esc(text)}<small lang="en">${esc(sub)}</small></div>`;
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => (b.innerHTML = ''), 1550);
}

let modalKind = null;
function openModal(html, kind, onMount) {
  modalKind = kind;
  $('#modal').innerHTML = html;
  $('#modalWrap').classList.remove('hidden');
  onMount?.($('#modal'));
  const f = $('#modal').querySelector('[data-focus]') || $('#modal').querySelector('button');
  f?.focus({ preventScroll: true });
}
function closeModal() {
  modalKind = null;
  $('#modalWrap').classList.add('hidden');
  $('#modal').innerHTML = '';
}

function yakuItems(list) {
  return `<ul class="yaku-list">${list.map((y) => `<li><span class="jp" lang="ja">${y.jp}</span><span class="en">${y.read}. ${y.en}</span><span class="pt">${y.pts}</span></li>`).join('')}</ul>`;
}

function koiModal(v) {
  if (v.phase !== 'koikoi' || v.turn !== v.me) return;
  const y = computeYaku(v.caps[v.me]);
  const oppKoi = v.koi[1 - v.me] > 0;
  let mult = 1; if (y.total >= 7) mult *= 2; if (oppKoi) mult *= 2;
  openModal(`<h2 lang="ja">役ができた<small lang="en">You made a yaku</small></h2>
    ${yakuItems(y.list)}
    <div class="total-line"><span>Stop now and you score${mult > 1 ? ` (×${mult})` : ''}</span><b>${y.total * mult}</b></div>
    <p>Keep going to build a bigger hand. If ${esc(v.names[1 - v.me])} makes a yaku before you stop, their points double.</p>
    <div class="koi-choice">
      <button class="go" data-a="koikoi"><b lang="ja">こいこい</b><span>Keep going</span></button>
      <button class="stop" data-a="shobu" data-focus><b lang="ja">勝負</b><span>Stop and score</span></button>
    </div>`, 'koi', (m) => {
    m.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => { closeModal(); send({ type: b.dataset.a }); }));
  });
}

function endModal(v) {
  if (v.phase !== 'roundEnd' && v.phase !== 'gameEnd') return;
  const me = v.me, r = v.result;
  const board = `<div class="scoreboard"><div>${esc(v.names[me])}<b>${v.scores[me]}</b></div><div class="vs" lang="ja">対</div><div>${esc(v.names[1 - me])}<b>${v.scores[1 - me]}</b></div></div>`;
  const waiting = v.ready[me] ? `<div class="waiting">Waiting for ${esc(v.names[1 - me])}<span class="dots"></span></div>` : '';
  if (v.phase === 'gameEnd') {
    const d = v.scores[me] - v.scores[1 - me];
    const title = d > 0 ? ['勝ち', 'You win the game'] : d < 0 ? ['負け', `${v.names[1 - me]} wins the game`] : ['引き分け', 'A drawn game'];
    openModal(`<h2 lang="ja">${title[0]}<small lang="en">${esc(title[1])}</small></h2>
      <p>${v.rounds} months played.</p>${board}
      <div class="actions"><button class="btn" data-leave>Back to menu</button>${v.ready[me] ? '' : '<button class="btn primary" data-ready data-focus>Play again</button>'}</div>${waiting}`, 'end', bindEnd);
    return;
  }
  let head, body;
  if (r.winner == null) {
    head = ['流れ', 'No one scored this month'];
    body = '<p>Both hands ran out before anyone stopped. The dealer stays the same.</p>';
  } else {
    const iWon = r.winner === me;
    head = [iWon ? 'お見事' : '残念', iWon ? `You take ${r.pts} points` : `${v.names[r.winner]} takes ${r.pts} points`];
    const notes = [];
    if (r.base >= 7) notes.push('7 points or more: doubled');
    if (r.koiOpp) notes.push(`${r.winner === me ? v.names[1 - me] : 'You'} called koi-koi: doubled`);
    body = yakuItems(r.list) + `<div class="total-line"><span>${r.base} pts${r.mult > 1 ? ` ×${r.mult}` : ''}${notes.length ? `<br><small>${esc(notes.join('. '))}</small>` : ''}</span><b>${r.pts}</b></div>`;
  }
  const last = v.round >= v.rounds;
  openModal(`<h2 lang="ja">${head[0]}<small lang="en">${esc(head[1])}</small></h2>${body}${board}
    <div class="actions">${v.ready[me] ? '' : `<button class="btn primary" data-ready data-focus>${last ? 'See final score' : 'Next month'}</button>`}</div>${waiting}`, 'end', bindEnd);
}

function bindEnd(m) {
  m.querySelector('[data-ready]')?.addEventListener('click', () => send({ type: 'ready' }));
  m.querySelector('[data-leave]')?.addEventListener('click', () => leave());
}

function showBubble(p, i) {
  if (!view) return;
  const node = p === view.me ? $('#meTag') : $('#oppTag');
  node.querySelector('.bubble')?.remove();
  const [jp, en] = EMOTES[i] || EMOTES[0];
  const b = el('div', 'bubble', `<b lang="ja">${jp}</b>${en}`);
  node.append(b);
  setTimeout(() => b.remove(), 2600);
}

let toastTimer = null;
function toast(msg, ms = 3500) {
  const t = $('#toast');
  t.innerHTML = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}

function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ---------------- guide ----------------
function guide() {
  const cards = (ids) => `<div class="cards">${ids.map((id) => `<span class="card">${cardSVG(id, { label: false })}</span>`).join('')}</div>`;
  const kind = (k) => CARDS.filter((c) => c.kind === k).map((c) => c.id);
  const rows = [
    ['goko', 10, [0, 8, 28, 40, 44], 'All five brights.'],
    ['shiko', 8, [0, 8, 28, 44], 'Four brights without the rain man.'],
    ['ameshiko', 7, [], 'Four brights including the rain man.'],
    ['sanko', 5, [0, 8, 28], 'Three brights, not counting the rain man.'],
    ['hanami', 5, [8, 32], 'Cherry curtain and sake cup. Drinking under the blossoms.'],
    ['tsukimi', 5, [28, 32], 'Full moon and sake cup. Drinking under the moon.'],
    ['inoshikacho', 5, [24, 36, 20], 'Boar, deer and butterflies. The name is read in that order.'],
    ['akatan', 5, ID.poetry, 'The three red ribbons with poems written on them.'],
    ['aotan', 5, ID.blue, 'The three blue ribbons.'],
    ['tane', 1, kind('animal'), '5 animals for 1 point, plus 1 for each extra.'],
    ['tan', 1, kind('ribbon'), '5 ribbons for 1 point, plus 1 for each extra.'],
    ['kasu', 1, [], '10 plain cards for 1 point, plus 1 for each extra. The sake cup counts as a plain too.'],
  ];
  const months = MONTHS.map((m, i) => `<div class="mn"><b lang="ja">${m.flower}</b>${m.n}. ${m.en}</div><div class="cards">${[0, 1, 2, 3].map((j) => `<span class="card">${cardSVG(i * 4 + j, { label: false })}</span>`).join('')}</div>`).join('');
  openModal(`<div class="guide"><h2 lang="ja">遊び方<small lang="en">How to play</small></h2>
    <ol>
      <li>Each month has four cards. On your turn, play a card from your hand. If it shares a month with a card on the table, you take both.</li>
      <li>Then the top card of the pile is turned over and matched the same way.</li>
      <li>Collect cards to make <span lang="ja">役</span> (yaku), the scoring sets below.</li>
      <li>When you make a yaku, choose <span lang="ja">こいこい</span> to keep going for more, or <span lang="ja">勝負</span> to stop and bank the points. Call koi-koi and lose, and the other player's points double.</li>
      <li>A hand of 7 points or more also doubles. The month's winner deals next.</li>
    </ol>
    <h3><span lang="ja">役一覧</span> Yaku</h3>
    ${rows.map(([k, p, ids, note]) => `<div class="gy"><span class="nm" lang="ja">${YAKU[k].jp}<small lang="en">${YAKU[k].read}</small></span><span class="pt">${p}</span>${ids.length ? cards(ids) : ''}<span class="note">${note}</span></div>`).join('')}
    <h3><span lang="ja">十二ヶ月</span> The twelve months</h3>
    <div class="month-grid">${months}</div>
    <div class="actions"><button class="btn primary" data-close data-focus>Close</button></div></div>`, 'guide', (m) => {
    m.querySelector('[data-close]').addEventListener('click', closeModal);
  });
}

// ---------------- screens ----------------
function enterTable() {
  closeModal();
  selected = null;
  view = null;
  Object.assign(seen, { call: 0, yaku: 0, phase: '' });
  $('#lobby').classList.add('hidden');
  $('#table').classList.remove('hidden');
  $('#emotes').classList.toggle('hidden', false);
}

function leave() {
  clearTimeout(timer);
  link?.close();
  link = null;
  mode = null;
  state = null;
  view = null;
  closeModal();
  $('#table').classList.add('hidden');
  $('#lobby').classList.remove('hidden');
  showLobbyMain();
  history.replaceState(null, '', location.pathname);
}

function showLobbyMain() {
  $('#lobbyMain').classList.remove('hidden');
  $('#waitPanel').classList.add('hidden');
}

function lobbyName() {
  const n = $('#nameInput').value.trim() || 'Player';
  store.set('name', n);
  return n;
}
function lobbyRounds() {
  const r = +document.querySelector('input[name="rounds"]:checked').value;
  store.set('rounds', r);
  return r;
}

function hostGame() {
  const name = lobbyName();
  const rounds = lobbyRounds();
  $('#lobbyMain').classList.add('hidden');
  $('#waitPanel').classList.remove('hidden');
  $('#roomCode').textContent = '····';
  $('#waitLabel').textContent = 'Opening a room';
  let code = null;
  try {
    link = hostRoom({
      onOpen(c) {
        code = c;
        $('#roomCode').textContent = c;
        $('#waitLabel').textContent = 'Room open. Send this code to your friend.';
      },
      onGuest() { /* wait for hello */ },
      onData(m) {
        if (m.t === 'hello') {
          mode = 'host';
          state = newMatch({ rounds, names: [name, String(m.name || 'Guest').slice(0, 14)] });
          enterTable();
          publish();
          toast(`<b lang="ja">いらっしゃい</b> ${esc(m.name || 'Guest')} joined`);
        } else if (m.t === 'act' && state) {
          act(1, m.a);
        } else if (m.t === 'emote') showBubble(1, m.i);
      },
      onClose() {
        if (mode === 'host') { toast('<b lang="ja">退出</b> Your friend left the room.', 6000); setTimeout(leave, 1500); }
      },
      onError(e) {
        toast(`Could not open a room: ${esc(e.message || e.type)}`, 6000);
        leave();
      },
    });
  } catch (e) {
    toast(esc(e.message), 6000);
    showLobbyMain();
  }
  $('#copyLink').onclick = async () => {
    if (!code) return;
    const url = `${location.origin}${location.pathname}?room=${code}`;
    try { await navigator.clipboard.writeText(url); toast('Invite link copied'); } catch { toast(url, 8000); }
  };
}

function joinGame(code) {
  const name = lobbyName();
  code = cleanCode(code);
  if (code.length !== 4) { toast('Room codes are 4 letters.'); return; }
  $('#lobbyMain').classList.add('hidden');
  $('#waitPanel').classList.remove('hidden');
  $('#roomCode').textContent = code;
  $('#waitLabel').textContent = 'Joining room';
  $('#waitHint').innerHTML = 'Connecting<span class="dots"></span>';
  $('#copyLink').classList.add('hidden');
  try {
    link = joinRoom(code, {
      onOpen(conn) {
        mode = 'guest';
        conn.send({ t: 'hello', name });
      },
      onData(m) {
        if (m.t === 'state') {
          if (!view || $('#table').classList.contains('hidden')) enterTable();
          render(m.view);
        } else if (m.t === 'emote') showBubble(1 - view.me, m.i);
        else if (m.t === 'full') { toast('That room already has two players.', 6000); leave(); }
      },
      onClose() {
        if (mode) { toast('<b lang="ja">退出</b> The host closed the room.', 6000); setTimeout(leave, 1500); }
      },
      onError(e) {
        const msg = e.type === 'peer-unavailable' || e.type === 'timeout' ? `No open room with the code ${code}.` : `Connection problem: ${esc(e.message || e.type)}`;
        toast(msg, 6000);
        leave();
      },
    });
  } catch (e) {
    toast(esc(e.message), 6000);
    leave();
  }
}

// ---------------- tooltips ----------------
const tip = $('#tip');
document.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const c = e.target.closest('[data-card], .guide .card');
  if (!c || !c.dataset.card) { tip.classList.add('hidden'); return; }
  const card = CARDS[+c.dataset.card];
  const r = c.getBoundingClientRect();
  tip.innerHTML = `<b lang="ja">${card.jp}</b>${card.en} (${KIND_EN[card.kind]})`;
  tip.style.left = r.left + r.width / 2 + 'px';
  tip.style.top = r.top + 'px';
  tip.classList.remove('hidden');
});
document.addEventListener('pointerout', (e) => { if (e.target.closest?.('[data-card]')) tip.classList.add('hidden'); });
document.addEventListener('pointerdown', () => tip.classList.add('hidden'));

// ---------------- wire up ----------------
function initLobby() {
  $('#nameInput').value = store.get('name', '');
  const r = store.get('rounds', 6);
  const radio = document.querySelector(`input[name="rounds"][value="${r}"]`);
  if (radio) radio.checked = true;
  $('#cpuLevel').value = store.get('level', 'normal');

  // decorative fan of the five brights
  const tc = $('#titleCards');
  [0, 8, 28, 40, 44].forEach((id, i) => {
    const d = el('div', 'tc', cardSVG(id, { label: false }));
    const rot = -24 + i * 12;
    d.style.left = `${i * 54}px`;
    d.style.top = `${Math.abs(i - 2) * 8}px`;
    d.style.transform = `rotate(${rot}deg)`;
    d.style.setProperty('--h', `rotate(${rot * 1.3}deg) translateY(-6px)`);
    tc.append(d);
  });

  $('#playCpu').addEventListener('click', () => {
    cpuLevel = $('#cpuLevel').value;
    store.set('level', cpuLevel);
    startCpu(lobbyRounds(), lobbyName());
  });
  $('#hostBtn').addEventListener('click', hostGame);
  $('#joinForm').addEventListener('submit', (e) => { e.preventDefault(); joinGame($('#codeInput').value); });
  $('#codeInput').addEventListener('input', (e) => (e.target.value = cleanCode(e.target.value)));
  $('#cancelWait').addEventListener('click', leave);
  $('#guideBtnLobby').addEventListener('click', guide);
  $('#guideBtn').addEventListener('click', guide);
  $('#leaveBtn').addEventListener('click', () => {
    openModal(`<h2 lang="ja">退席<small lang="en">Leave the table?</small></h2><p>${mode === 'cpu' ? 'This game will be lost.' : 'This ends the game for both players.'}</p>
      <div class="actions"><button class="btn" data-stay data-focus>Stay</button><button class="btn primary" data-go>Leave</button></div>`, 'leave', (m) => {
      m.querySelector('[data-stay]').addEventListener('click', () => { closeModal(); if (view) { seen.phase = ''; handleEvents(view, view); } });
      m.querySelector('[data-go]').addEventListener('click', leave);
    });
  });
  const hb = $('#hintBtn');
  hb.setAttribute('aria-pressed', String(hints));
  hb.addEventListener('click', () => { hints = !hints; store.set('hints', hints); hb.setAttribute('aria-pressed', String(hints)); if (view) render(view); });
  const sb = $('#soundBtn');
  const setSound = () => { sb.innerHTML = `<svg><use href="#i-${sound ? 'sound' : 'mute'}"/></svg>`; sb.setAttribute('aria-label', sound ? 'Sound on' : 'Sound off'); };
  setSound();
  setAudio(sound);
  sb.addEventListener('click', () => { sound = !sound; store.set('sound', sound); setAudio(sound); setSound(); });

  const list = $('#emoteList');
  EMOTES.forEach(([jp, en], i) => {
    const b = el('button', '', `<b lang="ja">${jp}</b>${en}`);
    b.addEventListener('click', () => { list.classList.add('hidden'); $('#emoteToggle').setAttribute('aria-expanded', 'false'); sendEmote(i); });
    list.append(b);
  });
  $('#emoteToggle').addEventListener('click', () => {
    const open = list.classList.toggle('hidden');
    $('#emoteToggle').setAttribute('aria-expanded', String(!open));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalKind === 'guide') closeModal();
  });
  window.addEventListener('resize', () => { if (view) render(view); });

  const room = new URLSearchParams(location.search).get('room');
  if (room) {
    $('#codeInput').value = cleanCode(room);
    toast(`Invited to room ${esc(cleanCode(room))}. Enter your name and press Join.`, 6000);
    $('#nameInput').focus();
  }
}

initLobby();
preloadArt();

// test hook
window.__yh = { play, get state() { return state; }, get view() { return view; }, act, send, load: (s) => commit(s) };
