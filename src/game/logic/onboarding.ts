// Pure onboarding helpers (no Phaser) so they can be unit-tested.
import type {
  Difficulty,
  Lang,
  LifeQuestion,
  PersonaId,
  Profile,
  QuizQuestion,
} from '@/shared/types';

export const NAME_MAX = 12;
/** Saharsh's 48×48 characters (public/assets/sprites), each with a `_back` view for battles. */
export const AVATARS = [
  'avatar_boy_1',
  'avatar_girl_1',
  'avatar_boy_2',
  'avatar_girl_2',
  'avatar_neutral',
] as const;
/** Saves from before the new sprites: old Kenney keys → the new character drawn in their place. */
export const LEGACY_AVATARS: Record<string, (typeof AVATARS)[number]> = {
  avatar_01: 'avatar_boy_1',
  avatar_02: 'avatar_girl_1',
  avatar_03: 'avatar_boy_2',
  avatar_04: 'avatar_girl_2',
};

/** Letters (any script, incl. Telugu vowel signs), digits and single spaces. No emoji. Max 12. */
export function sanitizeName(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{M}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
    .trim();
}

/** CONTEXT.md §2.4: 0–1 correct → simple, 2–3 → medium, 4–5 → hard. */
export function difficultyFromScore(score: number): Difficulty {
  if (score <= 1) return 'simple';
  if (score <= 3) return 'medium';
  return 'hard';
}

export function scoreQuiz(quiz: QuizQuestion[], answers: number[]): number {
  return quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
}

/** Answers to L1–L4, as chosen option index per question id. */
export type LifeAnswers = Partial<Record<LifeQuestion['id'], number>>;

export interface ProfileDraft {
  nickname: string;
  lang: Lang;
  avatar: string;
  persona: PersonaId;
  pocketMoneyMonthly: number;
  flags: string[];
  joinCode?: string; // ISSUES #36: set when an NGO facilitator did the setup
}

const DEFAULT_POCKET_MONEY = 800;

export function draftFromLifeAnswers(
  questions: LifeQuestion[],
  answers: LifeAnswers,
  base: { nickname: string; lang: Lang; avatar: string },
): ProfileDraft {
  let persona: PersonaId = 'pocket_money';
  let pocketMoneyMonthly = DEFAULT_POCKET_MONEY;
  const flags: string[] = [];
  for (const q of questions) {
    const idx = answers[q.id];
    if (idx == null) continue;
    const opt = q.options[idx];
    if (!opt) continue;
    if (opt.persona) persona = opt.persona;
    if (opt.pocketMoneyMonthly != null) pocketMoneyMonthly = opt.pocketMoneyMonthly;
    if (opt.setFlag && !flags.includes(opt.setFlag)) flags.push(opt.setFlag);
  }
  return { ...base, persona, pocketMoneyMonthly, flags };
}

export function nextPersona(order: PersonaId[], current: PersonaId): PersonaId {
  const i = order.indexOf(current);
  return order[(i + 1) % order.length];
}

export function finishProfile(
  draft: ProfileDraft,
  quiz: QuizQuestion[],
  answers: number[],
): Profile {
  const quizBefore = scoreQuiz(quiz, answers);
  return {
    ...draft,
    flags: [...draft.flags],
    difficulty: difficultyFromScore(quizBefore),
    quizBefore,
    quizBeforeAnswers: [...answers],
  };
}
