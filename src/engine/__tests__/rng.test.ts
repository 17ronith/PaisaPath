import { describe, expect, it } from 'vitest';
import { bindRng, createRng, fromState, seedState } from '../rng';

const take = (n: number, next: () => number) => Array.from({ length: n }, next);

describe('rng (xorshift32)', () => {
  it('same seed → same sequence; different seed → different sequence', () => {
    const a = createRng(42);
    const b = createRng(42);
    const c = createRng(43);
    const sa = take(20, a.next);
    expect(take(20, b.next)).toEqual(sa);
    expect(take(20, c.next)).not.toEqual(sa);
  });

  it('state round-trips: fromState(state) continues the same sequence', () => {
    const a = createRng(7);
    take(5, a.next);
    const b = fromState(a.state);
    expect(take(10, b.next)).toEqual(take(10, a.next));
  });

  it('bindRng writes the state back into its holder (GameState.rng)', () => {
    const holder = { rng: seedState(9) };
    const r = bindRng(holder);
    const before = holder.rng;
    r.next();
    expect(holder.rng).not.toBe(before);
    expect(holder.rng).toBe(r.state);
  });

  it('next() is in [0,1), int() in range, roughly uniform', () => {
    const r = createRng(123);
    const xs = take(5000, r.next);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean).toBeGreaterThan(0.47);
    expect(mean).toBeLessThan(0.53);
    for (let i = 0; i < 200; i++) expect(r.int(4)).toBeLessThan(4);
  });

  it('seed 0 and huge seeds (Date.now()) give a valid non-zero state', () => {
    expect(seedState(0)).not.toBe(0);
    expect(seedState(Date.now())).toBeGreaterThan(0);
  });
});
