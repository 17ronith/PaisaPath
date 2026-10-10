// Pure round logic shared by both mini-games (no Phaser, so Vitest can drive it).
// A round is a deck of items, each with one right answer out of two buttons, a clock that only
// runs while an item is on screen, and a pass mark. Scenes render it; this decides it.

export type OnDone = (won: boolean) => void;

/** Wraps onDone so it fires exactly once, whichever path ends the game (finish, quit, shutdown). */
export function once(onDone: OnDone | undefined): { call: OnDone; readonly called: boolean } {
  let called = false;
  return {
    call(won) {
      if (called) return;
      called = true;
      onDone?.(won);
    },
    get called() {
      return called;
    },
  };
}

export interface SortItem<A extends string> {
  answer: A;
  /** One line shown after the tap: why this is a need / a scam. */
  why: string;
}

export interface Verdict<T> {
  item: T;
  correct: boolean;
  /** true when the item ran out of time (fell off / time up) instead of being answered. */
  missed: boolean;
}

export interface RoundOptions {
  timeLimitMs: number;
  passCount: number;
}

export class SortRound<A extends string, T extends SortItem<A>> {
  private index = 0;
  private elapsed = 0;
  readonly verdicts: Verdict<T>[] = [];

  constructor(
    readonly items: readonly T[],
    readonly opts: RoundOptions,
  ) {
    if (items.length === 0) throw new Error('SortRound needs at least one item');
    if (opts.passCount > items.length) throw new Error('passCount exceeds the number of items');
  }

  get current(): T | null {
    return this.finished ? null : this.items[this.index];
  }

  get position(): number {
    return this.index;
  }

  get remainingMs(): number {
    return Math.max(0, this.opts.timeLimitMs - this.elapsed);
  }

  get timeUp(): boolean {
    return this.elapsed >= this.opts.timeLimitMs;
  }

  get finished(): boolean {
    return this.index >= this.items.length || this.timeUp;
  }

  get correct(): number {
    return this.verdicts.filter((v) => v.correct).length;
  }

  /** Items never shown because the clock ran out count as wrong. */
  get total(): number {
    return this.items.length;
  }

  get won(): boolean {
    return this.correct >= this.opts.passCount;
  }

  /** Advance the clock (call only while an item is live; feedback pauses don't count). */
  tick(dtMs: number): void {
    if (this.finished) return;
    this.elapsed = Math.min(this.opts.timeLimitMs, this.elapsed + Math.max(0, dtMs));
  }

  answer(a: A): Verdict<T> | null {
    return this.resolve(a);
  }

  /** The live item timed out (fell past the counter). */
  miss(): Verdict<T> | null {
    return this.resolve(null);
  }

  private resolve(a: A | null): Verdict<T> | null {
    const item = this.current;
    if (!item) return null;
    const v: Verdict<T> = { item, correct: a !== null && a === item.answer, missed: a === null };
    this.verdicts.push(v);
    this.index += 1;
    return v;
  }
}

/**
 * Draw `n` items from `pool`, as balanced as possible between the two answers, shuffled.
 * `random` returns floats in [0, 1) (Math.random in the scenes, a seeded rng in tests).
 */
export function drawBalanced<A extends string, T extends SortItem<A>>(
  pool: readonly T[],
  n: number,
  random: () => number,
): T[] {
  const groups = new Map<A, T[]>();
  for (const item of shuffle(pool, random)) {
    const g = groups.get(item.answer) ?? [];
    g.push(item);
    groups.set(item.answer, g);
  }
  const lanes = [...groups.values()];
  const out: T[] = [];
  for (let i = 0; out.length < n && lanes.some((l) => l.length > 0); i++) {
    const lane = lanes[i % lanes.length];
    const item = lane.shift();
    if (item) out.push(item);
  }
  return shuffle(out, random);
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
