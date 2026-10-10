import { describe, expect, it } from 'vitest';
import type { AssetDef } from '@/shared/types';
import {
  growPortfolio,
  projection,
  realValue,
  RETURN_MAX_PCT,
  RETURN_MIN_PCT,
  yearsToEpilogue,
} from '../invest';
import { recordAllocation } from '../records';
import { createRng } from '../rng';
import { fixturePack } from '../__fixtures__/pack';
import { state } from '../__fixtures__/builders';

const asset = (id: AssetDef['id'], mean: number, vol: number): AssetDef => ({
  id,
  name: id,
  blurb: '',
  meanYearlyPct: mean,
  volatilityPct: vol,
  teaches: 'compounding',
});

describe('investing sim', () => {
  it('a zero-volatility asset grows exactly (1 + r)^t', () => {
    const { after, yearlyReturns } = growPortfolio(
      { banyan: 1000 },
      [asset('banyan', 8, 0)],
      5,
      createRng(1),
    );
    expect(after.banyan).toBe(Math.round(1000 * 1.08 ** 5));
    expect(yearlyReturns.banyan).toEqual([8, 8, 8, 8, 8]);
  });

  it('seeded returns are reproducible', () => {
    const run = () => growPortfolio({ mango: 500 }, fixturePack.assets, 25, createRng(42));
    expect(run()).toEqual(run());
  });

  it('cash box stays the same in nominal coins; returns cover all four assets', () => {
    const { after, yearlyReturns } = growPortfolio(
      { cashbox: 700 },
      fixturePack.assets,
      6,
      createRng(3),
    );
    expect(after).toEqual({ cashbox: 700 });
    expect(Object.values(yearlyReturns).map((r) => r.length)).toEqual([6, 6, 6, 6]);
  });

  it('yearly returns are clipped to [−60, +80]', () => {
    const { yearlyReturns } = growPortfolio({}, [asset('mango', 0, 500)], 300, createRng(9));
    expect(Math.min(...yearlyReturns.mango)).toBeGreaterThanOrEqual(RETURN_MIN_PCT);
    expect(Math.max(...yearlyReturns.mango)).toBeLessThanOrEqual(RETURN_MAX_PCT);
  });

  it('projection: invested vs final per asset, cash-box alternative after inflation, assumption line', () => {
    const s = state();
    recordAllocation(s, { chapter: 5, savings: 2000, alloc: { banyan: 1000 } });
    s.portfolio = { banyan: 9000 };
    s.bars.savings = 1000;
    const p = projection(s, fixturePack.assets);
    expect(yearsToEpilogue(5)).toBe(31);
    expect(yearsToEpilogue(8)).toBe(25);
    expect(p.perAsset).toEqual([
      { asset: fixturePack.assets[1], invested: 1000, finalValue: 9000 },
    ]);
    expect(p.ifNotInvested).toBe(realValue(1000, 31));
    expect(p.ifNotInvested).toBeLessThan(1000);
    expect(p.savingsFinal).toBe(1000);
    expect(p.assumptionLine).toMatch(/8% a year.*can be negative.*not promises/);
  });
});
