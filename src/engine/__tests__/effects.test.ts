import { describe, expect, it } from 'vitest';
import type { Effect } from '@/shared/types';
import { applyEffect, fireDue, resolveEffects } from '../effects';
import { pendingEvents } from '../records';
import { profile, state } from '../__fixtures__/builders';

const p = profile({ pocketMoneyMonthly: 5000 }); // 1 real ₹ = 1 coin in stage 1

describe('applyEffect', () => {
  it('scales money, clamps happiness to 0..100', () => {
    const bars = { wallet: 1000, savings: 0, happiness: 95 };
    expect(applyEffect(bars, { label: 'x', wallet: -200, happiness: 10 }, 1, p)).toEqual({
      wallet: 800,
      savings: 0,
      happiness: 100,
    });
    expect(applyEffect(bars, { label: 'x', happiness: -200 }, 1, p).happiness).toBe(0);
  });

  it('a savings shortfall comes out of the wallet', () => {
    const bars = { wallet: 1000, savings: 300, happiness: 50 };
    expect(applyEffect(bars, { label: 'emergency', savings: -500 }, 1, p)).toEqual({
      wallet: 800,
      savings: 0,
      happiness: 50,
    });
  });
});

describe('consequence scheduler', () => {
  const run = (effects: Effect[], chapters: number) => {
    const s = state({ pocketMoneyMonthly: 5000 });
    s.bars.wallet = 10000;
    resolveEffects(s, effects, 'src');
    const firedAt: number[] = [];
    for (let ch = 2; ch <= chapters; ch++) {
      s.chapter = ch;
      if (fireDue(s).length) firedAt.push(ch);
    }
    return { s, firedAt };
  };

  it('delayChapters 2 fires at chapter+2, not before', () => {
    const { s, firedAt } = run([{ label: 'later', wallet: -100, delayChapters: 2 }], 6);
    expect(firedAt).toEqual([3]);
    expect(s.bars.wallet).toBe(9900);
    expect(s.scheduled).toEqual([]);
  });

  it('EMI everyChapters 1 × 3 fires exactly three times (now + next two chapters)', () => {
    const emi: Effect = { label: 'EMI', wallet: -500, repeat: { everyChapters: 1, times: 3 } };
    const { s, firedAt } = run([emi], 8);
    expect(firedAt).toEqual([2, 3]);
    expect(s.bars.wallet).toBe(10000 - 3 * 500);
  });

  it('delayed + repeating: delay 1, every 2, times 2 → chapters 2 and 4', () => {
    const e: Effect = {
      label: 'x',
      wallet: -10,
      delayChapters: 1,
      repeat: { everyChapters: 2, times: 2 },
    };
    expect(run([e], 8).firedAt).toEqual([2, 4]);
  });

  it('flags are set and cleared; triggerEvent queues a pending event', () => {
    const s = state();
    resolveEffects(s, [{ label: 'lend', setFlag: 'lent_friend' }], 'src');
    expect(s.flags).toContain('lent_friend');
    resolveEffects(
      s,
      [{ label: 'asks again', delayChapters: 1, triggerEvent: 'e1', clearFlag: 'lent_friend' }],
      'src',
    );
    expect(pendingEvents(s)).toEqual([]);
    s.chapter = 2;
    fireDue(s);
    expect(s.flags).not.toContain('lent_friend');
    expect(pendingEvents(s)).toEqual(['e1']);
  });

  it('money scheduled in stage 1 keeps its stage-1 value when it fires in stage 2', () => {
    const s = state({ pocketMoneyMonthly: 1000 }); // stage 1: 1 real ₹ = 5 coins
    s.chapter = 4;
    resolveEffects(s, [{ label: 'repay', wallet: -100, delayChapters: 1 }], 'src');
    s.chapter = 5;
    s.stage = 2;
    fireDue(s);
    expect(s.bars.wallet).toBe(-500); // not -125 (stage-2 rate)
  });
});
