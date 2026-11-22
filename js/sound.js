// Game sounds from real recordings (see README credits).
// Cards, kotsuzumi, hyōshigi and taiko: 効果音ラボ (soundeffect-lab.info).
// Shamisen notes: FluidR3 GM soundfont via midi-js-soundfonts (CC BY 3.0).

const FILES = {
  put: 'card-put1', flip: 'card-turn-over1', pick: 'card-pick1', deal: 'card-hand-out1', shuffle: 'card-shuffle1',
  tsuzumi: 'kotsudumi1', clap1: 'hyoushigi1', clap2: 'hyoushigi2', taiko: 'drum-japanese1',
  E3: 'shamisen-E3', A3: 'shamisen-A3', B3: 'shamisen-B3', C4: 'shamisen-C4', E4: 'shamisen-E4',
  F4: 'shamisen-F4', A4: 'shamisen-A4', B4: 'shamisen-B4', C5: 'shamisen-C5', E5: 'shamisen-E5',
};
// Skip silence at the start of some recordings (seconds), measured from the files.
const LEAD = { flip: 0.09, pick: 0.22, deal: 0.08, shuffle: 0.1 };
const SHAMISEN_GAIN = 5; // the soundfont notes peak at about 0.08

let ctx = null;
let out = null;
let enabled = true;
const buffers = {};
let loading = null;

export function setSound(on) { enabled = on; }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = 0.9;
    out.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function loadSounds() {
  if (loading) return loading;
  const c = ac();
  loading = Promise.all(Object.entries(FILES).map(async ([k, f]) => {
    try {
      const res = await fetch(`sounds/${f}.mp3`);
      buffers[k] = await c.decodeAudioData(await res.arrayBuffer());
    } catch { /* a missing sound just stays silent */ }
  }));
  return loading;
}

// Play one recording. at: seconds from now; len: cut off with a short fade.
function sample(key, { at = 0, gain = 1, rate = 1, len = null } = {}) {
  const b = buffers[key];
  if (!b) return;
  const c = ctx;
  const t = c.currentTime + 0.01 + at;
  const s = c.createBufferSource();
  s.buffer = b;
  s.playbackRate.value = rate;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  s.connect(g).connect(out);
  const lead = LEAD[key] || 0;
  if (len) {
    g.gain.setValueAtTime(gain, t + len * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    s.start(t, lead, len + 0.05);
  } else {
    s.start(t, lead);
  }
}

// Shamisen note that rings out for its full length.
const note = (n, at, gain = 1) => sample(n, { at, gain: gain * SHAMISEN_GAIN });

// The kabuki figure from the reference clip: four kotsuzumi "pon"s, 0.108 s apart, fading out.
function tsuzumiFigure(at = 0, scale = 1) {
  [1, 0.74, 0.7, 0.1].forEach((g, i) => sample('tsuzumi', { at: at + i * 0.108, gain: 1.4 * g * scale, rate: 1.03 }));
}

const PHRASES = {
  // Rising, ends on a strong E with the low octave underneath.
  win: [['E4', 0], ['F4', 0.22], ['A4', 0.44], ['B4', 0.66], ['C5', 0.88], ['B4', 1.18], ['E5', 1.4, 1.2], ['E4', 1.4, 0.8]],
  // Falling, settles low.
  lose: [['C5', 0], ['B4', 0.26], ['A4', 0.52], ['F4', 0.86], ['E4', 1.2, 1.1], ['E3', 1.2, 0.8]],
  // Undecided: left hanging.
  'draw-round': [['A3', 0], ['B3', 0.4, 1.1]],
  gameEnd: [['E4', 0], ['A4', 0.18], ['B4', 0.36], ['E5', 0.54], ['C5', 0.9], ['B4', 1.08], ['A4', 1.26], ['E4', 1.62, 1.1], ['E3', 1.62, 0.8]],
};

export function play(name) {
  if (!enabled) return;
  try { ac(); } catch { return; }
  if (!loading) loadSounds();
  switch (name) {
    case 'place': sample('put', { gain: 1.4, rate: 0.96 + Math.random() * 0.08 }); break;
    case 'take': sample('put', { gain: 1.4 }); sample('put', { at: 0.09, gain: 1.1, rate: 1.06 }); break;
    case 'draw': sample('flip', { gain: 1.3 }); break;
    case 'deal': sample('clap1', { gain: 1.2 }); sample('clap1', { at: 0.42, gain: 1.1 }); sample('deal', { at: 0.6, gain: 1.1, len: 1.6 }); break;
    case 'shuffle': sample('shuffle', { gain: 1.1, len: 1.8 }); break;
    case 'yaku': sample('taiko', { gain: 1.4, len: 1.6 }); break;
    case 'koikoi': tsuzumiFigure(); break;
    case 'shobu': sample('taiko', { gain: 1.4, len: 1.4 }); tsuzumiFigure(0.5); break;
    case 'win': case 'lose': case 'draw-round': case 'gameEnd':
      PHRASES[name].forEach(([n, at, g]) => note(n, at, g || 1));
      if (name === 'gameEnd') tsuzumiFigure(2.3, 0.9);
      break;
    default: break;
  }
}
