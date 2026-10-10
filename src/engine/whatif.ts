// whatIf() (CONTRACTS §2.5): replay the game from its seed with the player's own choices, except
// the biggest mistake, which is swapped for the best choice they didn't make.
import type {
  AssetId,
  Choice,
  ContentPack,
  Game,
  GameState,
  Portfolio,
  Quality,
  WhatIfResult,
} from '@/shared/types';
import { LAST_CHAPTER } from './economy';
import { portfolioTotal } from './invest';
import { allocationRecords, wonMinigameAt } from './records';
import { biggestMistakeIndex } from './scoring';
import { clone, initialState } from './state';

export type GameFactory = (content: ContentPack, state: GameState) => Game;

const PHASES: GameState['phase'][] = [
  'chapter_start',
  'invest',
  'main_task',
  'detour',
  'event',
  'minigame',
  'stage_end',
  'epilogue',
  'quiz_after',
  'done',
];
const progress = (chapter: number, phase: GameState['phase']) =>
  chapter * PHASES.length + PHASES.indexOf(phase);
const EPILOGUE = progress(LAST_CHAPTER, 'epilogue');
const RANK: Record<Quality, number> = { good: 0, ok: 1, weak: 2, critical: 3 };
const MAX_REPLAY_STEPS = 2000;

/** For tasks the player never saw in the replayed path: best first, rotating on retries. */
function fallbackChoice(choices: Choice[], retries: number): Choice {
  const ranked = [...choices].sort((a, b) => RANK[a.quality] - RANK[b.quality]);
  const safe = ranked.filter((c) => c.quality !== 'critical');
  const pool = safe.length > 0 ? safe : ranked;
  return pool[retries % pool.length];
}

/**
 * Replays `real` from its seed up to the point it has reached (at most the epilogue), feeding back
 * the logged choice for each task/event id in order, the recorded mini-game wins and allocations.
 * `substitute` swaps the choice of one log entry.
 */
export function replay(
  content: ContentPack,
  real: GameState,
  make: GameFactory,
  substitute?: { index: number; choiceId: string },
): GameState {
  const game = make(content, initialState(real.profile, real.seed));
  const queues = new Map<string, number[]>();
  real.log.forEach((e, i) => queues.set(e.taskId, [...(queues.get(e.taskId) ?? []), i]));
  const allocations = allocationRecords(real);
  const target = Math.min(progress(real.chapter, real.phase), EPILOGUE);

  for (let i = 0; i < MAX_REPLAY_STEPS; i++) {
    const s = game.state;
    if (progress(s.chapter, s.phase) >= target) break;
    const step = game.next();
    if (step.kind === 'task' || step.kind === 'event') {
      const item = step.kind === 'task' ? step.task : step.event;
      const idx = queues.get(item.id)?.shift();
      let id =
        idx === undefined
          ? undefined
          : idx === substitute?.index
            ? substitute.choiceId
            : real.log[idx].choiceId;
      if (!id || !item.choices.some((c) => c.id === id)) {
        id = fallbackChoice(item.choices, s.failCounts[item.id] ?? 0).id;
      }
      game.choose(id);
    } else if (step.kind === 'minigame_offer') {
      if (!step.locked && wonMinigameAt(real, s.chapter)) game.playMinigame(step.minigame.id, true);
      else game.skipMinigame();
    } else if (step.kind === 'invest') {
      const rec = allocations.find((r) => r.chapter === s.chapter);
      const alloc: Portfolio = {};
      if (rec && rec.savings > 0) {
        for (const [k, v] of Object.entries(rec.alloc) as [AssetId, number][]) {
          alloc[k] = Math.floor((v * step.savingsCoins) / rec.savings);
        }
        const over = portfolioTotal(alloc) - step.savingsCoins;
        if (over > 0) alloc.cashbox = Math.max(0, (alloc.cashbox ?? 0) - over);
      }
      game.allocate(portfolioTotal(alloc) <= step.savingsCoins ? alloc : {});
    } else if (step.kind === 'quiz_after' || step.kind === 'done') {
      break;
    }
  }
  return game.state;
}

/** The best choice the player didn't make: good, else ok. */
export function bestAlternative(choices: Choice[], actualId: string): Choice | undefined {
  const others = choices.filter((c) => c.id !== actualId);
  return others.find((c) => c.quality === 'good') ?? others.find((c) => c.quality === 'ok');
}

export function whatIf(
  content: ContentPack,
  real: GameState,
  make: GameFactory,
): WhatIfResult | null {
  const index = biggestMistakeIndex(real.log);
  if (index === -1) return null;
  const entry = real.log[index];
  const item = entry.isEvent
    ? content.events.find((e) => e.id === entry.taskId)
    : content.tasks.find((t) => t.id === entry.taskId);
  const actualChoice = item?.choices.find((c) => c.id === entry.choiceId);
  const altChoice =
    item && actualChoice ? bestAlternative(item.choices, actualChoice.id) : undefined;
  if (!actualChoice || !altChoice) return null;
  let alt: GameState;
  try {
    alt = replay(content, real, make, { index, choiceId: altChoice.id });
  } catch {
    return null; // a hand-made save whose log can't be replayed: no what-if rather than a crash
  }
  return {
    entry: clone(entry),
    actualChoice,
    altChoice,
    actualEnd: { ...real.bars },
    altEnd: { ...alt.bars },
    actualPortfolioTotal: portfolioTotal(real.portfolio),
    altPortfolioTotal: portfolioTotal(alt.portfolio),
  };
}
