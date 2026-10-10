// Mistake bank (CONTEXT §2.8): weak/critical choices bank the concept; a later good answer on the
// same concept clears it into `learned`.
import type { GameState } from '@/shared/types';

export function isBanked(s: GameState, concept: string): boolean {
  return s.mistakes.includes(concept);
}

/** Banks a concept (deduped). A learned concept that is failed again goes back to the bank. */
export function bank(s: GameState, concept: string): boolean {
  s.learned = s.learned.filter((c) => c !== concept);
  if (isBanked(s, concept)) return false;
  s.mistakes.push(concept);
  return true;
}

/** Moves a banked concept to `learned`. Returns false if it wasn't banked. */
export function clear(s: GameState, concept: string): boolean {
  if (!isBanked(s, concept)) return false;
  s.mistakes = s.mistakes.filter((c) => c !== concept);
  if (!s.learned.includes(concept)) s.learned.push(concept);
  return true;
}
