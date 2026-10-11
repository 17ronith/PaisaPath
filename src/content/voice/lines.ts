// Every line the game voices, with the voice role that should say it. Run as a script to dump them
// for generate.py:  npx tsx src/content/voice/lines.ts > lines.json
// What is voiced (and nothing else): the Professor's lessons, praise and hints, the explainer
// animations' narration, and the characters' opening lines in battles (scam calls, friends, family).
import { pathToFileURL } from 'node:url';
import type { Lang, RandomEvent, Task } from '@/shared/types';
import { loadContent, localize, STRINGS } from '../index';
import { normaliseLine, voiceKey } from './key';

export type VoiceRole = 'professor' | 'narrator' | 'scammer' | 'female' | 'elder' | 'young';

export interface VoiceLine {
  key: string;
  text: string;
  lang: Lang;
  role: VoiceRole;
  where: string;
}

/** Languages that get generated clips. Telugu falls back to the device's own voice, if it has one. */
export const VOICED_LANGS: Lang[] = ['en', 'hi'];

/** The Professor's praise after a good choice. Mirrors BattleScene's fallback until en.json has the keys. */
const PRAISE = [
  "Sharp. That's exactly how it's done.",
  'Good call. Your future self just got richer.',
  "That's the move. On we go.",
  'Well handled. Nothing to teach here.',
];
const SAFETY_CONCEPTS = new Set([
  'spot_fake_officials',
  'never_share_otp_pin',
  'too_good_to_be_true',
  'instant_loan_trap',
  'fake_payment_proof',
]);

/** Who is talking in a battle opening, from the framing's speaker tag. */
export function speakerRole(speaker: string, safety: boolean): VoiceRole {
  const s = speaker.toLowerCase();
  if (
    /^your |^clinic$|bad luck|notice board|news|sms|email|request|food app|wallet|gut|stomach/.test(
      s,
    )
  )
    return 'narrator';
  if (/mom|aunt|sana|senior|teacher|principal|receptionist/.test(s)) return 'female';
  if (/friend|classmate|co-worker|cousin|imran|kiran|colleague/.test(s)) return 'young';
  if (safety || /^'|caller|unknown|admin|recruiter|chat group|organiser|loan app/.test(s))
    return 'scammer';
  return 'elder';
}

function isSafety(owner: Task | RandomEvent): boolean {
  return 'pillar' in owner ? owner.pillar === 'safety' : SAFETY_CONCEPTS.has(owner.concept ?? '');
}

export function voiceLines(): VoiceLine[] {
  const base = loadContent();
  const out = new Map<string, VoiceLine>();
  const add = (text: string | undefined, lang: Lang, role: VoiceRole, where: string) => {
    if (!text?.trim()) return;
    const key = voiceKey(text);
    if (!out.has(key)) out.set(key, { key, text: normaliseLine(text), lang, role, where });
  };
  // Roles come from the English speaker tags; translated framings reuse them.
  const roles = new Map<string, VoiceRole>();

  for (const lang of VOICED_LANGS) {
    const pack = lang === 'en' ? base : localize(base, lang);
    for (const owner of [...pack.tasks, ...pack.events] as (Task | RandomEvent)[]) {
      for (const [persona, f] of Object.entries(owner.framings)) {
        if (!f) continue;
        const id = `${owner.id}.framings.${persona}`;
        if (lang === 'en') roles.set(id, speakerRole(f.speaker, isSafety(owner)));
        add(f.text, lang, roles.get(id) ?? 'narrator', `${id}.text`);
      }
      for (const c of owner.choices) {
        add(c.lesson, lang, 'professor', `${owner.id}.choices.${c.id}.lesson`);
        add(c.hint, lang, 'professor', `${owner.id}.choices.${c.id}.hint`);
      }
    }
    for (const x of pack.explainers)
      x.steps.forEach((s, i) => {
        if (s.op === 'text') add(s.text, lang, 'professor', `${x.id}.steps.${i}`);
      });
    const str = (k: string, fallback?: string) => STRINGS[lang][k] ?? STRINGS.en[k] ?? fallback;
    add(str('battle.hint_generic'), lang, 'professor', 'strings:battle.hint_generic');
    PRAISE.forEach((p, i) =>
      add(
        str(`professor.praise.${i + 1}`, p),
        lang,
        'professor',
        `strings:professor.praise.${i + 1}`,
      ),
    );
  }
  return [...out.values()];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(JSON.stringify(voiceLines(), null, 1) + '\n');
}
