// Mini-game logic only (scenes need a browser). Seeded rng from the engine keeps draws reproducible.
import { describe, expect, it, vi } from 'vitest';
import { createRng } from '@/engine/rng';
import { SortRound, drawBalanced, once, shuffle, type SortItem } from '../sortRound';
import {
  KIRANA_ITEMS,
  KIRANA_PASS,
  KIRANA_POOL,
  KIRANA_TIME_MS,
  fallMsFor,
  newKiranaRound,
} from '../kiranaItems';
import { SCAM_ITEMS, SCAM_PASS, SCAM_POOL, newScamRound } from '../scamMessages';

type AB = 'a' | 'b';
const deck = (answers: AB[]): (SortItem<AB> & { n: number })[] =>
  answers.map((answer, n) => ({ answer, why: `item ${n}`, n }));
const rand = (seed: number) => {
  const r = createRng(seed);
  return () => r.next();
};
const flip = (a: AB): AB => (a === 'a' ? 'b' : 'a');

describe('once (onDone guard)', () => {
  it('forwards the first call only', () => {
    const spy = vi.fn();
    const done = once(spy);
    expect(done.called).toBe(false);
    done.call(true);
    done.call(false);
    done.call(true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(true);
    expect(done.called).toBe(true);
  });

  it('a quit followed by the scene shutdown still reports exactly once (won = false)', () => {
    const spy = vi.fn();
    const done = once(spy);
    done.call(false); // ✕ pressed → finish(false)
    done.call(false); // SHUTDOWN handler
    expect(spy.mock.calls).toEqual([[false]]);
  });

  it('tolerates a missing callback', () => {
    expect(() => once(undefined).call(true)).not.toThrow();
  });
});

describe('SortRound', () => {
  const opts = { timeLimitMs: 10_000, passCount: 3 };

  it('scores answers, advances, and finishes after the last item', () => {
    const r = new SortRound(deck(['a', 'b', 'a', 'b']), opts);
    expect(r.answer('a')).toMatchObject({ correct: true, missed: false });
    expect(r.answer('a')).toMatchObject({ correct: false, missed: false });
    expect(r.miss()).toMatchObject({ correct: false, missed: true });
    expect(r.finished).toBe(false);
    expect(r.answer('b')).toMatchObject({ correct: true });
    expect(r.finished).toBe(true);
    expect(r.current).toBeNull();
    expect(r.answer('a')).toBeNull();
    expect(r.correct).toBe(2);
    expect(r.won).toBe(false);
  });

  it('the clock ends the round; unseen items count as wrong', () => {
    const r = new SortRound(deck(['a', 'a', 'a', 'a']), opts);
    r.answer('a');
    r.answer('a');
    r.tick(6000);
    r.tick(6000);
    expect(r.timeUp).toBe(true);
    expect(r.remainingMs).toBe(0);
    expect(r.finished).toBe(true);
    expect(r.answer('a')).toBeNull();
    expect(r.correct).toBe(2);
    expect(r.total).toBe(4);
    expect(r.won).toBe(false);
  });

  it('wins exactly at the pass mark', () => {
    const items = deck(['a', 'b', 'a', 'b']);
    const atPass = new SortRound(items, opts);
    items.forEach((it, i) => atPass.answer(i < 3 ? it.answer : flip(it.answer)));
    expect(atPass.won).toBe(true);
    const below = new SortRound(items, opts);
    items.forEach((it, i) => below.answer(i < 2 ? it.answer : flip(it.answer)));
    expect(below.won).toBe(false);
  });

  it('ignores negative ticks and ticks after the end', () => {
    const r = new SortRound(deck(['a']), { timeLimitMs: 10_000, passCount: 1 });
    r.tick(-500);
    expect(r.remainingMs).toBe(10_000);
    r.answer('a');
    r.tick(20_000);
    expect(r.remainingMs).toBe(10_000);
    expect(r.won).toBe(true);
  });

  it('rejects impossible rounds', () => {
    expect(() => new SortRound([], opts)).toThrow();
    expect(() => new SortRound(deck(['a', 'b']), opts)).toThrow(/passCount/);
  });
});

describe('drawBalanced / shuffle', () => {
  it('draws n distinct items split evenly between the answers', () => {
    const pool = deck(['a', 'a', 'a', 'a', 'a', 'a', 'b', 'b', 'b', 'b', 'b', 'b']);
    const out = drawBalanced(pool, 8, rand(7));
    expect(out).toHaveLength(8);
    expect(new Set(out.map((x) => x.n)).size).toBe(8);
    expect(out.filter((x) => x.answer === 'a')).toHaveLength(4);
  });

  it('tops up from the bigger group when one runs out', () => {
    const out = drawBalanced(deck(['a', 'b', 'b', 'b', 'b']), 4, rand(1));
    expect(out.filter((x) => x.answer === 'a')).toHaveLength(1);
    expect(out).toHaveLength(4);
  });

  it('is reproducible for a seed and does not mutate the pool', () => {
    const pool = deck(['a', 'b', 'a', 'b', 'a', 'b']);
    const copy = [...pool];
    expect(drawBalanced(pool, 4, rand(3))).toEqual(drawBalanced(pool, 4, rand(3)));
    expect(pool).toEqual(copy);
    expect(
      shuffle(pool, rand(9))
        .map((x) => x.n)
        .sort(),
    ).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

const BRANDS =
  /\b(SBI|HDFC|ICICI|Axis|Kotak|Paytm|PhonePe|GPay|Google ?Pay|Amazon|Flipkart|Swiggy|Zomato|WhatsApp|Instagram|YouTube|Jio|Airtel|Lays|Coca|Pepsi|Cadbury|Maggi)\b/i;
const FORBIDDEN = /IIIT|Paisa Path/i;

describe('Kirana Rush', () => {
  it('pass mark is 70% of 10 items in 30 s', () => {
    expect(KIRANA_ITEMS).toBe(10);
    expect(KIRANA_PASS).toBe(7);
    expect(KIRANA_TIME_MS).toBe(30_000);
  });

  it('pool: unique names, positive prices, enough of each kind for a balanced round', () => {
    expect(new Set(KIRANA_POOL.map((i) => i.name)).size).toBe(KIRANA_POOL.length);
    expect(KIRANA_POOL.every((i) => i.price > 0 && i.why.length > 0)).toBe(true);
    for (const kind of ['need', 'want'] as const) {
      expect(KIRANA_POOL.filter((i) => i.answer === kind).length).toBeGreaterThanOrEqual(
        KIRANA_ITEMS / 2,
      );
    }
  });

  it('items speed up, and all 10 can land within the 30 s clock', () => {
    const falls = Array.from({ length: KIRANA_ITEMS }, (_, i) => fallMsFor(i));
    for (let i = 1; i < falls.length; i++) expect(falls[i]).toBeLessThanOrEqual(falls[i - 1]);
    expect(falls.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(KIRANA_TIME_MS);
  });

  it('a round is 5 needs + 5 wants; a perfect player wins, 6/10 loses', () => {
    const r = newKiranaRound(rand(42));
    expect(r.items.filter((i) => i.answer === 'need')).toHaveLength(5);
    r.items.forEach((it) => r.answer(it.answer));
    expect(r.won).toBe(true);

    const weak = newKiranaRound(rand(42));
    weak.items.forEach((it, i) =>
      weak.answer(i < 6 ? it.answer : it.answer === 'need' ? 'want' : 'need'),
    );
    expect(weak.correct).toBe(6);
    expect(weak.won).toBe(false);
  });

  it('text uses no brand names', () => {
    for (const i of KIRANA_POOL) expect(`${i.name} ${i.why}`).not.toMatch(BRANDS);
  });
});

describe('Scam or Legit', () => {
  it('8 messages, 6 to win, 4 scams + 4 legit per round', () => {
    expect(SCAM_ITEMS).toBe(8);
    expect(SCAM_PASS).toBe(6);
    const r = newScamRound(rand(5));
    expect(r.items).toHaveLength(8);
    expect(r.items.filter((m) => m.answer === 'scam')).toHaveLength(4);
  });

  it('6/8 wins, 5/8 loses', () => {
    for (const [right, won] of [
      [6, true],
      [5, false],
    ] as const) {
      const r = newScamRound(rand(11));
      r.items.forEach((m, i) =>
        r.answer(i < right ? m.answer : m.answer === 'scam' ? 'legit' : 'scam'),
      );
      expect(r.won).toBe(won);
    }
  });

  it('covers the scams in the brief, and no message uses a real brand', () => {
    const all = SCAM_POOL.map((m) => `${m.sender} ${m.text} ${m.why}`).join('\n');
    expect(all).toMatch(/UPI PIN/);
    expect(all).toMatch(/OTP .*by mistake/);
    expect(all).toMatch(/₹5,000\/day/);
    expect(all).toMatch(/[Ss]cholarship/);
    for (const m of SCAM_POOL) {
      expect(`${m.sender} ${m.text} ${m.why}`).not.toMatch(BRANDS);
      expect(`${m.sender} ${m.text}`).not.toMatch(FORBIDDEN);
    }
  });

  it('never asks the player for an OTP/PIN as a correct "legit" action', () => {
    for (const m of SCAM_POOL.filter((x) => x.answer === 'legit')) {
      expect(m.text).not.toMatch(/(enter|share|send|forward).{0,20}(PIN|OTP)/i);
    }
  });
});
