// Task and event selection (CONTRACTS §2.3, §2.2 step 4).
import type {
  ContentPack,
  Difficulty,
  Framing,
  GameState,
  PersonaId,
  Pillar,
  RandomEvent,
  Stage,
  Task,
} from '@/shared/types';
import { stageOfChapter } from './economy';
import { pendingEvents } from './records';
import type { Rng } from './rng';

export const PILLARS: Pillar[] = ['budget', 'save', 'invest', 'safety'];
export const EVENT_CHANCE = 0.5;
export const RETURNING_CHANCE = 0.5;
export const BANKED_EVENT_WEIGHT = 3;

type Framed = { framings: Partial<Record<PersonaId, Framing>> & { default: Framing } };
type Flagged = { requiresFlags?: string[]; excludesFlags?: string[] };

export function framingFor(item: Framed, persona: PersonaId): Framing {
  return item.framings[persona] ?? item.framings.default;
}

export function flagsOk(item: Flagged, flags: string[]): boolean {
  return (
    (item.requiresFlags ?? []).every((f) => flags.includes(f)) &&
    !(item.excludesFlags ?? []).some((f) => flags.includes(f))
  );
}

/** Main tasks finished without a restart (optionally only those in `stage`), from the log. */
export function completedMainTasks(s: GameState, content: ContentPack, stage?: Stage): Task[] {
  const byId = new Map(content.tasks.map((t) => [t.id, t]));
  const out: Task[] = [];
  for (const e of s.log) {
    if (e.isEvent || e.isDetour || e.quality === 'critical') continue;
    if (stage !== undefined && stageOfChapter(e.chapter) !== stage) continue;
    const t = byId.get(e.taskId);
    if (t) out.push(t);
  }
  return out;
}

/** Investing tasks unlock after one finished task each from budget, save and safety. */
export function investUnlocked(s: GameState, content: ContentPack): boolean {
  const done = new Set(completedMainTasks(s, content).map((t) => t.pillar));
  return done.has('budget') && done.has('save') && done.has('safety');
}

function preferDifficulty(tasks: Task[], difficulty: Difficulty, rng: Rng): Task {
  const same = tasks.filter((t) => t.difficulty === difficulty);
  const pool = same.length > 0 ? same : tasks;
  return pool.length === 1 ? pool[0] : rng.pick(pool);
}

export interface TaskPick {
  task: Task;
  returning: boolean;
}

/** Picks this chapter's main task, or null if the stage has no eligible task left. */
export function pickMainTask(s: GameState, content: ContentPack, rng: Rng): TaskPick | null {
  const eligible = content.tasks.filter(
    (t) => t.stage === s.stage && !t.isDetour && !s.seenTasks.includes(t.id) && flagsOk(t, s.flags),
  );
  const gated = investUnlocked(s, content)
    ? eligible
    : eligible.filter((t) => t.pillar !== 'invest');
  const pool = gated.length > 0 ? gated : eligible;
  if (pool.length === 0) return null;
  const difficulty = s.profile.difficulty;

  // A banked concept comes back in disguise.
  const returningPool = pool.filter((t) => s.mistakes.includes(t.concept));
  if (returningPool.length > 0 && rng.next() < RETURNING_CHANCE) {
    return { task: preferDifficulty(returningPool, difficulty, rng), returning: true };
  }

  // Pillar rotation: the pillar with the fewest finished main tasks this stage.
  const done: Record<Pillar, number> = { budget: 0, save: 0, invest: 0, safety: 0 };
  for (const t of completedMainTasks(s, content, s.stage)) done[t.pillar] += 1;
  const pillars = PILLARS.filter((p) => pool.some((t) => t.pillar === p));
  const least = Math.min(...pillars.map((p) => done[p]));
  const tied = pillars.filter((p) => done[p] === least);
  const pillar = tied.length === 1 ? tied[0] : rng.pick(tied);
  const task = preferDifficulty(
    pool.filter((t) => t.pillar === pillar),
    difficulty,
    rng,
  );
  return { task, returning: s.mistakes.includes(task.concept) };
}

/**
 * The chapter's event: a pending triggered event always wins; otherwise 50% chance of a random
 * unseen event for this stage, weighted ×3 when its concept is banked.
 */
export function pickEvent(s: GameState, content: ContentPack, rng: Rng): RandomEvent | null {
  for (const id of pendingEvents(s)) {
    const ev = content.events.find((e) => e.id === id);
    if (ev) return ev;
  }
  if (rng.next() >= EVENT_CHANCE) return null;
  const seen = new Set(s.log.filter((e) => e.isEvent).map((e) => e.taskId));
  const pool = content.events.filter(
    (e) => e.stages.includes(s.stage) && !seen.has(e.id) && flagsOk(e, s.flags) && e.weight > 0,
  );
  if (pool.length === 0) return null;
  const weights = pool.map(
    (e) => e.weight * (e.concept && s.mistakes.includes(e.concept) ? BANKED_EVENT_WEIGHT : 1),
  );
  let r = rng.next() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) return pool[i];
  }
  return pool[pool.length - 1];
}
