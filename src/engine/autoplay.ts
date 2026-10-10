// Scripted players for tests and `npm run sim`: always-good, always-worst, random.
import type { Choice, Game, Portfolio, Quality, Step } from '@/shared/types';
import { createRng, type Rng } from './rng';

export type Policy = 'good' | 'worst' | 'random';
const RANK: Record<Quality, number> = { good: 0, ok: 1, weak: 2, critical: 3 };

/**
 * First try follows the policy; on a restart the policy never repeats a 'critical' choice and
 * rotates through the rest, so even "always worst" can finish.
 */
export function pickChoice(policy: Policy, choices: Choice[], retries: number, rng: Rng): Choice {
  const ranked = [...choices].sort((a, b) => RANK[a.quality] - RANK[b.quality]);
  if (policy === 'worst') ranked.reverse();
  const safe = ranked.filter((c) => c.quality !== 'critical');
  const pool = retries > 0 && safe.length > 0 ? safe : ranked;
  if (policy === 'random') return retries >= 2 ? pool[retries % pool.length] : rng.pick(pool);
  return pool[retries % pool.length];
}

export interface AutoplayOptions {
  policy: Policy;
  /** Seed for the player's own randomness (separate from the game's RNG). */
  seed?: number;
  maxSteps?: number;
  quizAnswers?: number[];
  onStep?: (step: Step, game: Game) => void;
}

function allocationFor(policy: Policy, savings: number, rng: Rng): Portfolio {
  if (policy === 'worst' || savings <= 0) return {};
  if (policy === 'good') {
    return {
      banyan: Math.floor(savings * 0.4),
      chai: Math.floor(savings * 0.2),
      mango: Math.floor(savings * 0.1),
    };
  }
  const share = rng.next() * 0.8;
  return { banyan: Math.floor(savings * share * 0.5), mango: Math.floor(savings * share * 0.5) };
}

/** Plays until 'done' (or maxSteps). Returns the last step seen. */
export function autoplay(game: Game, opts: AutoplayOptions): Step {
  const rng = createRng(opts.seed ?? 1);
  let step: Step = game.next();
  for (let i = 0; i < (opts.maxSteps ?? 500); i++) {
    opts.onStep?.(step, game);
    if (step.kind === 'done') return step;
    if (step.kind === 'task' || step.kind === 'event') {
      const item = step.kind === 'task' ? step.task : step.event;
      const retries = game.state.failCounts[item.id] ?? 0;
      game.choose(pickChoice(opts.policy, item.choices, retries, rng).id);
    } else if (step.kind === 'minigame_offer') {
      const play = !step.locked && opts.policy !== 'worst';
      if (play) game.playMinigame(step.minigame.id, opts.policy === 'good' || rng.next() < 0.5);
      else game.skipMinigame();
    } else if (step.kind === 'invest') {
      game.allocate(allocationFor(opts.policy, step.savingsCoins, rng));
    } else if (step.kind === 'quiz_after') {
      game.answerQuiz(opts.quizAnswers ?? [0, 0, 0, 0, 0]);
    }
    step = game.next();
  }
  return step;
}
