// Seeded xorshift32 (CONTRACTS §2.6). Every random decision in the engine goes through an Rng,
// and the Rng's state lives in GameState.rng, so a saved game replays exactly.

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  pick<T>(items: readonly T[]): T;
  readonly state: number;
}

/** Murmur3 finaliser: turns small or adjacent seeds (1, 2, 3, Date.now()) into well-mixed states. */
export function seedState(seed: number): number {
  let h = (Math.floor(seed) ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = (h ^ (h >>> 16)) >>> 0;
  return h || 1;
}

/** One xorshift32 step. State must be non-zero. */
export function xorshift32(x: number): number {
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

/** An Rng whose state is read from and written back to `holder.rng` on every draw. */
export function bindRng(holder: { rng: number }): Rng {
  const rng: Rng = {
    next() {
      holder.rng = xorshift32(holder.rng >>> 0 || 1);
      return holder.rng / 4294967296;
    },
    int(n) {
      return Math.floor(rng.next() * n);
    },
    pick(items) {
      if (items.length === 0) throw new Error('rng.pick on an empty list');
      return items[rng.int(items.length)];
    },
    get state() {
      return holder.rng;
    },
  };
  return rng;
}

export const createRng = (seed: number): Rng => bindRng({ rng: seedState(seed) });
export const fromState = (state: number): Rng => bindRng({ rng: state >>> 0 || 1 });
