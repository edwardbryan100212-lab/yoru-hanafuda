// All sounds are synthesised with Web Audio: no audio files.
// Card snaps, hyōshigi clappers, tsuzumi drum hits and a plucked shamisen.

let ctx = null;
let out = null;
let enabled = true;
const pluckCache = new Map();

export function setSound(on) { enabled = on; }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    out = ctx.createGain();
    out.gain.value = 0.6; // no compressor: it flattened the first drum hit
    out.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noiseBuffer(c, secs) {
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * secs), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function env(c, t, peak, attack, decay) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

function noiseHit(c, t, { type = 'bandpass', freq, q = 1, peak, decay, attack = 0.001, dest = out }) {
  const s = c.createBufferSource();
  s.buffer = noiseBuffer(c, attack + decay + 0.02);
  const f = c.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = env(c, t, peak, attack, decay);
  s.connect(f).connect(g).connect(dest);
  s.start(t); s.stop(t + attack + decay + 0.02);
}

function tone(c, t, { f0, f1 = f0, type = 'sine', peak, decay, attack = 0.002, glide = decay }) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + glide);
  const g = env(c, t, peak, attack, decay);
  o.connect(g).connect(out);
  o.start(t); o.stop(t + attack + decay + 0.05);
}

// A stiff hanafuda card slapped onto a mat: sharp paper crack plus a short low thud.
function snap(c, t, gain = 1, pitch = 1) {
  noiseHit(c, t, { type: 'highpass', freq: 2600 * pitch, q: 0.7, peak: 0.55 * gain, decay: 0.018 });
  noiseHit(c, t, { freq: 1300 * pitch, q: 1.4, peak: 0.5 * gain, decay: 0.045 });
  tone(c, t, { f0: 210 * pitch, f1: 90, peak: 0.5 * gain, decay: 0.07 });
}

// Hyōshigi: two hardwood clappers, the kabuki "start" sound.
function clapper(c, t, gain = 1) {
  noiseHit(c, t, { freq: 2350, q: 18, peak: 1.4 * gain, decay: 0.09 });
  noiseHit(c, t, { freq: 3900, q: 12, peak: 0.6 * gain, decay: 0.05 });
  tone(c, t, { f0: 1180, peak: 0.12 * gain, decay: 0.08, type: 'triangle' });
}

// Tsuzumi "pon": measured from a kabuki clip. Fundamental starts ~290 Hz and sags to ~270 Hz,
// strong partial near 845 Hz, lighter ones at 445 and 1480 Hz, short skin slap on top.
function pon(c, t, gain = 1) {
  tone(c, t, { f0: 292, f1: 268, peak: 0.85 * gain, decay: 0.2, glide: 0.12 });
  tone(c, t, { f0: 850, f1: 836, peak: 0.6 * gain, decay: 0.09 });
  tone(c, t, { f0: 447, f1: 440, peak: 0.18 * gain, decay: 0.18 });
  tone(c, t, { f0: 1480, f1: 1470, peak: 0.16 * gain, decay: 0.07 });
  noiseHit(c, t, { freq: 2200, q: 1.5, peak: 0.35 * gain, decay: 0.012 });
}
// The four-hit figure: pon-pon-pon-pon, about 0.108 s apart, fading.
function ponFigure(c, t, scale = 1) {
  [1, 0.74, 0.7, 0.22].forEach((g, i) => pon(c, t + i * 0.108, g * scale));
}

// Shamisen: Karplus-Strong string with a little "sawari" buzz and a bachi (plectrum) click.
function pluckBuffer(c, freq, secs = 1.6) {
  const key = freq.toFixed(2);
  if (pluckCache.has(key)) return pluckCache.get(key);
  const sr = c.sampleRate;
  const n = Math.floor(sr * secs);
  const buf = c.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  const period = sr / freq;
  const N = Math.floor(period);
  const line = new Float32Array(N);
  for (let i = 0; i < N; i++) line[i] = Math.random() * 2 - 1;
  let idx = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const cur = line[idx];
    const nxt = line[(idx + 1) % N];
    let v = 0.4985 * (cur + nxt) + 0.003 * (cur - last); // averaging = damping, slight brightness
    // sawari: the string brushing the neck adds a soft buzz
    if (i > sr * 0.004) v = Math.tanh(v * 1.6) / 1.6;
    last = cur;
    line[idx] = v;
    d[i] = cur;
    idx = (idx + 1) % N;
  }
  pluckCache.set(key, buf);
  return buf;
}

function pluck(c, t, freq, gain = 1, len = 1.4) {
  const s = c.createBufferSource();
  s.buffer = pluckBuffer(c, freq);
  const body = c.createBiquadFilter();
  body.type = 'peaking'; body.frequency.value = 900; body.Q.value = 1.2; body.gain.value = 6;
  const hp = c.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 160;
  const g = c.createGain();
  g.gain.setValueAtTime(0.55 * gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  s.connect(body).connect(hp).connect(g).connect(out);
  s.start(t); s.stop(t + len + 0.05);
  noiseHit(c, t, { freq: 2400, q: 3, peak: 0.25 * gain, decay: 0.015 }); // bachi hitting the skin
}

// In (miyako-bushi) scale notes, Hz
const N = { E3: 164.81, F3: 174.61, A3: 220, B3: 246.94, C4: 261.63, E4: 329.63, F4: 349.23, A4: 440, B4: 493.88, C5: 523.25, E5: 659.25 };

export function play(name, opts = {}) {
  if (!enabled) return;
  let c;
  try { c = ac(); } catch { return; }
  const t = c.currentTime + 0.01;
  switch (name) {
    case 'place': snap(c, t, 1, 0.95 + Math.random() * 0.1); break;
    case 'take': snap(c, t, 1, 1); snap(c, t + 0.075, 0.8, 1.15); break;
    case 'draw': noiseHit(c, t, { type: 'highpass', freq: 3000, q: 0.5, peak: 0.12, decay: 0.12, attack: 0.04 }); break;
    case 'deal': clapper(c, t, 2.4); clapper(c, t + 0.32, 2.1); break;
    case 'yaku': pon(c, t, 0.8); pon(c, t + 0.2, 0.6); break;
    case 'koikoi': ponFigure(c, t); break;
    case 'shobu': pon(c, t, 1.1); ponFigure(c, t + 0.45, 0.9); break;
    case 'win': { // rising shamisen phrase ending on a strong tonic
      const seq = [[N.E4, 0], [N.F4, 0.16], [N.A4, 0.32], [N.B4, 0.48], [N.C5, 0.64], [N.B4, 0.88], [N.E5, 1.04]];
      seq.forEach(([f, d], i) => pluck(c, t + d, f, i === seq.length - 1 ? 1.1 : 0.85, i === seq.length - 1 ? 1.6 : 0.6));
      pluck(c, t + 1.04, N.E4, 0.6, 1.6);
      pon(c, t + 1.04, 0.7);
      break;
    }
    case 'lose': { // falling phrase
      const seq = [[N.C5, 0], [N.B4, 0.18], [N.A4, 0.36], [N.F4, 0.6], [N.E4, 0.84]];
      seq.forEach(([f, d], i) => pluck(c, t + d, f, 1.3, i === seq.length - 1 ? 1.6 : 0.6));
      pluck(c, t + 0.84, N.E3, 0.8, 1.6);
      break;
    }
    case 'draw-round': { // undecided: two notes left hanging
      pluck(c, t, N.A3, 1.3, 0.8); pluck(c, t + 0.3, N.B3, 1.3, 1.4);
      break;
    }
    case 'gameEnd': {
      const seq = [[N.E4, 0], [N.A4, 0.14], [N.B4, 0.28], [N.E5, 0.42], [N.C5, 0.7], [N.B4, 0.84], [N.A4, 0.98], [N.E4, 1.3]];
      seq.forEach(([f, d]) => pluck(c, t + d, f, 0.9, 0.7));
      pluck(c, t + 1.3, N.E3, 0.5, 1.8);
      ponFigure(c, t + 1.45, 0.75);
      break;
    }
    default: break;
  }
}
