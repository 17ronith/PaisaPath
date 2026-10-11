// Voice-over for the Professor (lessons, praise, hints, explainer narration) and the characters'
// opening lines in battles. Clips are generated offline with Kokoro (src/content/voice/README.md)
// and matched by the exact line on screen, so an edited line goes silent rather than wrong.
// Lines without a clip (Telugu, or text added after the last generation) use the device's own
// voice for that language when it has one. Everything obeys the "voice-over" switch.
import manifest from '@/content/voice/manifest.json';
import { voiceKey } from '@/content/voice/key';
import { getLang } from '@/shared/i18n';
import type { Lang } from '@/shared/types';
import { audioTap, isOn, onChannelChange } from './audio';

const CLIPS = new Set<string>(manifest.keys as string[]);
const LOCALE: Record<Lang, string> = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' };

let el: HTMLAudioElement | null = null;
let queue: string[] = [];
let busy = false;
let generation = 0; // bumps on stop, so callbacks from a cut-off line can't start the next one

export function hasClip(line: string): boolean {
  return CLIPS.has(voiceKey(line));
}

/** Say `line` now, cutting off anything still being said. */
export function say(line: string | undefined): void {
  stopVoice();
  sayAfter(line);
}

/** Say `line` after whatever is being said (explainer steps, a hint after the opening). */
export function sayAfter(line: string | undefined): void {
  if (!line?.trim() || !isOn('voice')) return;
  queue.push(line);
  if (!busy) next();
}

export function stopVoice(): void {
  generation += 1;
  queue = [];
  busy = false;
  if (el) {
    el.onended = el.onerror = null;
    el.pause();
  }
  speech()?.cancel();
}

function next(): void {
  const line = queue.shift();
  if (line === undefined || !isOn('voice')) {
    busy = false;
    return;
  }
  busy = true;
  const gen = generation;
  const done = () => {
    if (gen === generation) next();
  };
  if (CLIPS.has(voiceKey(line))) playClip(line, done);
  else if (!speakWithDevice(line, done)) done();
}

function playClip(line: string, done: () => void): void {
  const audio = player();
  if (!audio) return done();
  audio.onended = done;
  audio.onerror = () => {
    // missing file or unsupported codec: try the device voice before giving up
    if (!speakWithDevice(line, done)) done();
  };
  audio.src = `${import.meta.env.BASE_URL}assets/voice/${voiceKey(line)}.mp3`;
  audioTap('voice', voiceKey(line));
  audio.play().catch(() => done());
}

function player(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  el ??= new Audio();
  return el;
}

function speech(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null;
}

/** Device text-to-speech in the current language; false if this device has no such voice. */
function speakWithDevice(line: string, done: () => void): boolean {
  const s = speech();
  if (!s) return false;
  const want = LOCALE[getLang()].toLowerCase();
  const voices = s.getVoices();
  const voice =
    voices.find((v) => v.lang.toLowerCase() === want) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(want.slice(0, 2)));
  if (!voice) return false;
  const u = new SpeechSynthesisUtterance(line);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.95;
  u.onend = done;
  u.onerror = done;
  s.speak(u);
  return true;
}

// iOS only lets an <audio> element play after it has been started inside a tap: start it once,
// silently, on the first tap anywhere, and reuse that one element for every line.
if (typeof window !== 'undefined') {
  const unlock = () => {
    const audio = player();
    if (audio && !audio.src) {
      audio.src =
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      audio.play().catch(() => undefined);
    }
    speech()?.getVoices(); // Chrome loads device voices lazily
  };
  window.addEventListener('pointerdown', unlock, { once: true, capture: true });
}

onChannelChange((channel, value) => {
  if (channel === 'voice' && !value) stopVoice();
});
