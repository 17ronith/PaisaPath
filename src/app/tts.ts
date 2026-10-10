// Read-aloud (PLAYTEST-01 #22b). Web Speech API, no network, no account.
// Voices for te-IN / hi-IN exist on most Android Chrome builds; where they don't, we stay silent
// rather than reading Telugu text with an English voice. Bhashini TTS is the "next step".
import type { Lang } from '@/shared/types';

const LOCALE: Record<Lang, string> = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN' };
const KEY = 'tts';

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

export function ttsSupported(): boolean {
  return synth() !== null;
}

export function ttsEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setTtsEnabled(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (!on) stop();
}

/** Best voice for the language, or null if the device has none (then we don't speak). */
export function voiceFor(lang: Lang): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const want = LOCALE[lang].toLowerCase();
  const voices = s.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase() === want) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(want.slice(0, 2))) ??
    (lang === 'en' ? (voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? null) : null)
  );
}

/** Speak `text` in `lang` if TTS is on and a matching voice exists. Cancels anything still speaking. */
export function speak(text: string, lang: Lang): boolean {
  const s = synth();
  if (!s || !ttsEnabled() || !text.trim()) return false;
  const voice = voiceFor(lang);
  if (!voice) return false;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.95;
  s.speak(u);
  return true;
}

/** Speak a situation followed by its options, numbered, with a short pause between. */
export function speakChoices(situation: string, options: string[], lang: Lang): boolean {
  const list = options.map((o, i) => `${i + 1}. ${o}`).join('. ');
  return speak(`${situation}. ${list}`, lang);
}

export function stop(): void {
  synth()?.cancel();
}

// Chrome loads voices asynchronously; warm the list so the first speak() finds them.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () =>
    window.speechSynthesis.getVoices(),
  );
}
