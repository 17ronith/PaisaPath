// Background music (PLAYTEST-01 #12) + a step blip for the walk (#1).
// The music is the team's three picks, always in the same order (a → b → c → a …), streamed
// from public/assets/music (credits in that folder's README). If none of them loads (files
// missing, old browser), the synthesised chiptune below plays instead: no file, nothing to fetch.
// Honours the music switch from ./audio. Start only after a user gesture.
import { isOn, onChannelChange } from './audio';

const TRACKS = ['a', 'b', 'c'];
/** Quiet enough to sit under the voice-over (clips are normalised to −18 LUFS, tracks to −20). */
const TRACK_VOL = 0.35;

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
let track: HTMLAudioElement | null = null;
let trackIndex = 0;
let failures = 0; // tracks in a row that wouldn't load; all of them → fall back to the chiptune
let started = false;

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

// ISSUES #25: switching music off must be instant. The tracks pause and resume where they were;
// for the chiptune, zeroing the master gain silences notes already scheduled ahead.
onChannelChange((channel, value) => {
  if (channel !== 'music') return;
  if (track) {
    if (value) void track.play().catch(() => undefined);
    else track.pause();
  }
  if (!ctx) return;
  // gain, not suspend: footstep blips share this context and follow the sound-effects switch
  if (master) master.gain.value = value ? 1 : 0;
  if (value && timer && ctx.state === 'suspended') void ctx.resume();
});

// Don't keep playing from a phone's background tab.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!track) return;
    if (document.hidden) track.pause();
    else if (isOn('music')) void track.play().catch(() => undefined);
  });
}

function playTrack(i: number): void {
  if (!track) return;
  trackIndex = i % TRACKS.length;
  track.src = `${import.meta.env.BASE_URL}assets/music/${TRACKS[trackIndex]}.mp3`;
  if (isOn('music')) void track.play().catch(() => undefined);
}

function startTracks(): void {
  track = new Audio();
  track.preload = 'auto';
  track.volume = TRACK_VOL;
  track.addEventListener('playing', () => (failures = 0));
  track.addEventListener('ended', () => playTrack(trackIndex + 1));
  track.addEventListener('error', () => {
    failures += 1;
    if (failures < TRACKS.length) return playTrack(trackIndex + 1);
    track?.removeAttribute('src');
    track = null;
    startSynth();
  });
  playTrack(0);
}

function startSynth(): void {
  if (timer || !ctx) return;
  master = ctx.createGain();
  master.gain.value = isOn('music') ? 1 : 0;
  master.connect(ctx.destination);
  nextStep = 0;
  nextTime = ctx.currentTime + 0.05;
  timer = setInterval(schedule, TICK_MS);
  schedule();
}

// A second copy of this module (hot reload, double import) must not leave an unmutable loop.
const shared = globalThis as { __lmStopMusic?: () => void };

/** Idempotent. Call from a tap handler (Title START is the natural place). */
export function startMusic(): void {
  if (started) return;
  started = true;
  if (shared.__lmStopMusic && shared.__lmStopMusic !== stopMusic) shared.__lmStopMusic();
  shared.__lmStopMusic = stopMusic;
  try {
    // Unlock the audio context inside this tap, so the chiptune fallback (and the footsteps)
    // can start later even if the tracks fail after the tap is over.
    if (typeof AudioContext !== 'undefined') {
      ctx ??= new AudioContext();
      if (ctx.state === 'suspended') void ctx.resume();
    }
    if (typeof Audio !== 'undefined') startTracks();
    else startSynth();
  } catch {
    /* decoration only */
  }
}

export function stopMusic(): void {
  started = false;
  if (track) {
    track.pause();
    track.removeAttribute('src');
    track = null;
  }
  failures = 0;
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
  return started;
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
