// Four tiny synthesized blips (no audio files to download on slow networks) + three persisted
// sound channels the player switches separately in the ♪ panel: background music, sound effects
// and the voice-over. Web Audio only starts after a user gesture; every caller is behind a tap.
export type Blip = 'select' | 'good' | 'bad' | 'coin';
export type Channel = 'music' | 'sfx' | 'voice';
export const CHANNELS: Channel[] = ['music', 'sfx', 'voice'];

const LEGACY_KEY = 'muted'; // the old single toggle: '1' meant everything off
const keyFor = (c: Channel) => `audio.${c}`;
let ctx: AudioContext | null = null;

function readChannel(c: Channel): boolean {
  try {
    const v = globalThis.localStorage?.getItem(keyFor(c));
    if (v === '1' || v === '0') return v === '1';
    return globalThis.localStorage?.getItem(LEGACY_KEY) !== '1';
  } catch {
    return true;
  }
}
const on: Record<Channel, boolean> = {
  music: readChannel('music'),
  sfx: readChannel('sfx'),
  voice: readChannel('voice'),
};

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

const muteListeners = new Set<(muted: boolean) => void>();
const channelListeners = new Set<(channel: Channel, on: boolean) => void>();

export function isOn(channel: Channel): boolean {
  return on[channel];
}

/** Called whenever one channel is switched (music fades out, the voice stops mid-line, …). */
export function onChannelChange(cb: (channel: Channel, on: boolean) => void): void {
  channelListeners.add(cb);
}

export function setOn(channel: Channel, value: boolean): void {
  on[channel] = value;
  try {
    globalThis.localStorage?.setItem(keyFor(channel), value ? '1' : '0');
  } catch {
    /* private mode: keep it for this session only */
  }
  for (const cb of channelListeners) cb(channel, value);
  for (const cb of muteListeners) cb(isMuted());
}

/** True when every channel is off (the ♪ icon shows × then). */
export function isMuted(): boolean {
  return CHANNELS.every((c) => !on[c]);
}

/** Called after any channel change with the all-off state, for icons that show ♪ / ×. */
export function onMuteChange(cb: (muted: boolean) => void): void {
  muteListeners.add(cb);
}

/** Switch every channel at once. */
export function setMuted(muted: boolean): void {
  for (const c of CHANNELS) setOn(c, !muted);
}

export function play(blip: Blip): void {
  if (!on.sfx || typeof AudioContext === 'undefined') return;
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
