// Four tiny synthesized blips (no audio files to download on slow networks) + a persisted
// mute toggle. Web Audio only starts after a user gesture; every caller is behind a tap.
export type Blip = 'select' | 'good' | 'bad' | 'coin';

const KEY = 'muted';
let ctx: AudioContext | null = null;
let muted = (() => {
  try {
    return globalThis.localStorage?.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();

/** [frequency Hz, duration s, wave] per note, played in sequence. */
const SHAPES: Record<Blip, [number, number, OscillatorType][]> = {
  select: [[660, 0.05, 'square']],
  good: [
    [523, 0.08, 'square'],
    [784, 0.12, 'square'],
  ],
  bad: [
    [220, 0.1, 'sawtooth'],
    [165, 0.16, 'sawtooth'],
  ],
  coin: [
    [988, 0.06, 'square'],
    [1319, 0.14, 'square'],
  ],
};

const listeners = new Set<(muted: boolean) => void>();

export function isMuted(): boolean {
  return muted;
}

/** Called on every mute toggle (music suspends instantly; read-aloud stops). */
export function onMuteChange(cb: (muted: boolean) => void): void {
  listeners.add(cb);
}

export function setMuted(on: boolean): void {
  muted = on;
  try {
    globalThis.localStorage?.setItem(KEY, on ? '1' : '0');
  } catch {
    /* private mode: keep it for this session only */
  }
  for (const cb of listeners) cb(on);
}

export function play(blip: Blip): void {
  if (muted || typeof AudioContext === 'undefined') return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    let at = ctx.currentTime;
    for (const [freq, dur, wave] of SHAPES[blip]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + dur);
      at += dur;
    }
  } catch {
    /* audio is decoration; never let it break a tap */
  }
}
