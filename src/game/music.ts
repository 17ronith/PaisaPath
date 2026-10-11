// Background chiptune (PLAYTEST-01 #12) + a step blip for the walk (#1). Synthesised with the
// Web Audio API: no file to download, no licence line, nothing for slow 3G to fetch.
// Honours the mute flag from ./audio (polled every bar). Start only after a user gesture.
import { isOn, onChannelChange } from './audio';

const BPM = 112;
const BEAT = 60 / BPM; // seconds
const STEP = BEAT / 2; // eighth notes
const BARS = 8;
const STEPS = BARS * 8;
const LOOKAHEAD_S = 0.25;
const TICK_MS = 100;
const VOL = 0.028;

// A-minor pentatonic, two octaves. 0 = rest.
const N = {
  A3: 220,
  C4: 261.6,
  D4: 293.7,
  E4: 329.6,
  G4: 392,
  A4: 440,
  C5: 523.3,
  D5: 587.3,
  E5: 659.3,
  G5: 784,
};
// Melody: 64 eighth-notes, Hyderabad-evening cheerful, mostly stepwise so it loops without a seam.
const MELODY: number[] = [
  N.A4,
  0,
  N.C5,
  N.A4,
  N.G4,
  0,
  N.E4,
  0,
  N.D4,
  N.E4,
  N.G4,
  0,
  N.A4,
  0,
  0,
  0,
  N.C5,
  0,
  N.D5,
  N.C5,
  N.A4,
  0,
  N.G4,
  0,
  N.E4,
  N.G4,
  N.A4,
  0,
  N.G4,
  0,
  0,
  0,
  N.A4,
  0,
  N.C5,
  N.A4,
  N.G4,
  0,
  N.E4,
  0,
  N.D4,
  N.E4,
  N.G4,
  0,
  N.A4,
  0,
  N.C5,
  0,
  N.E5,
  0,
  N.D5,
  N.C5,
  N.A4,
  0,
  N.C5,
  0,
  N.G4,
  0,
  N.E4,
  0,
  N.A4,
  0,
  0,
  0,
];
// Bass: one note per beat (32 beats).
const BASS: number[] = [
  N.A3,
  N.A3,
  N.A3,
  N.A3,
  N.A3 * 0.75,
  N.A3 * 0.75,
  N.A3 * 0.75,
  N.A3 * 0.75,
  (N.A3 * (4 / 3)) / 2,
  (N.A3 * (4 / 3)) / 2,
  (N.A3 * (4 / 3)) / 2,
  (N.A3 * (4 / 3)) / 2,
  N.A3 * 0.89,
  N.A3 * 0.89,
  N.A3 * 0.89,
  N.A3 * 0.89,
  N.A3,
  N.A3,
  N.A3,
  N.A3,
  N.A3 * 0.75,
  N.A3 * 0.75,
  N.A3 * 0.75,
  N.A3 * 0.75,
  (N.A3 * (4 / 3)) / 2,
  (N.A3 * (4 / 3)) / 2,
  N.A3 * 0.89,
  N.A3 * 0.89,
  N.A3,
  N.A3,
  N.A3,
  N.A3,
];

let ctx: AudioContext | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let nextStep = 0;
let nextTime = 0;
let master: GainNode | null = null;

function note(freq: number, at: number, dur: number, type: OscillatorType, gain: number): void {
  if (!ctx || !master || freq <= 0) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(master);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function schedule(): void {
  if (!ctx) return;
  // mute = silence without losing the beat position, so unmuting continues in time
  if (master) master.gain.value = isOn('music') ? 1 : 0;
  while (nextTime < ctx.currentTime + LOOKAHEAD_S) {
    const i = nextStep % STEPS;
    const m = MELODY[i];
    if (m) note(m, nextTime, STEP * 0.9, 'square', VOL);
    if (i % 2 === 0) {
      const b = BASS[(i / 2) % BASS.length];
      if (b) note(b, nextTime, BEAT * 0.8, 'triangle', VOL * 1.6);
    }
    // soft hi-hat tick on off-beats
    if (i % 2 === 1) note(6000, nextTime, 0.02, 'square', VOL * 0.25);
    nextStep += 1;
    nextTime += STEP;
  }
}

// ISSUES #25: switching music off must be instant. Zeroing the master gain silences notes already
// scheduled ahead; switching it back on continues the loop where it was.
onChannelChange((channel, value) => {
  if (channel !== 'music' || !ctx) return;
  // gain, not suspend: footstep blips share this context and follow the sound-effects switch
  if (master) master.gain.value = value ? 1 : 0;
  if (value && timer && ctx.state === 'suspended') void ctx.resume();
});

// A second copy of this module (hot reload, double import) must not leave an unmutable loop.
const shared = globalThis as { __lmStopMusic?: () => void };

/** Idempotent. Call from a tap handler (Title START is the natural place). */
export function startMusic(): void {
  if (timer || typeof AudioContext === 'undefined') return;
  if (shared.__lmStopMusic && shared.__lmStopMusic !== stopMusic) shared.__lmStopMusic();
  shared.__lmStopMusic = stopMusic;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    master = ctx.createGain();
    master.gain.value = isOn('music') ? 1 : 0;
    master.connect(ctx.destination);
    nextStep = 0;
    nextTime = ctx.currentTime + 0.05;
    timer = setInterval(schedule, TICK_MS);
    schedule();
  } catch {
    /* decoration only */
  }
}

export function stopMusic(): void {
  if (timer) clearInterval(timer);
  timer = null;
  try {
    master?.disconnect();
  } catch {
    /* ignore */
  }
  master = null;
}

export function musicPlaying(): boolean {
  return timer !== null;
}

/** One short footstep; alternate `left` for a two-tone walk. */
export function stepBlip(left = true): void {
  if (!isOn('sfx') || typeof AudioContext === 'undefined') return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const at = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(left ? 180 : 150, at);
    osc.frequency.exponentialRampToValueAtTime(70, at + 0.06);
    g.gain.setValueAtTime(0.05, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.08);
  } catch {
    /* ignore */
  }
}
