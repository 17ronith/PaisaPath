import { describe, expect, it } from 'vitest';
import { incomeCoins, incomeLabel, scaleToCoins, stageOfChapter } from '../economy';
import { profile } from '../__fixtures__/builders';

describe('economy scaler (M1 formula)', () => {
  it('₹200 bat keeps its share of the month: 200 / 400 / 1000 coins', () => {
    expect(scaleToCoins(200, 1, profile({ pocketMoneyMonthly: 5000 }))).toBe(200);
    expect(scaleToCoins(200, 1, profile({ pocketMoneyMonthly: 2500 }))).toBe(400);
    expect(scaleToCoins(200, 1, profile({ pocketMoneyMonthly: 1000 }))).toBe(1000);
  });

  it('stages 2–3 use the fixed salary references', () => {
    expect(scaleToCoins(20000, 2, profile())).toBe(25000);
    expect(scaleToCoins(50000, 3, profile())).toBe(60000);
  });

  it('pay and earn round symmetrically', () => {
    const p = profile({ pocketMoneyMonthly: 800 });
    expect(scaleToCoins(-150, 1, p)).toBe(-scaleToCoins(150, 1, p));
    expect(scaleToCoins(0, 1, p)).toBe(0);
  });

  it('calendar: ch 1–4 stage 1, 5–7 stage 2, 8–10 stage 3; income per stage', () => {
    expect([1, 4, 5, 7, 8, 10].map(stageOfChapter)).toEqual([1, 1, 2, 2, 3, 3]);
    expect([1, 2, 3].map((s) => incomeCoins(s as 1 | 2 | 3))).toEqual([5000, 25000, 60000]);
  });

  it('persona only changes the income label', () => {
    expect(incomeLabel('scholarship', 1)).toBe('ePASS credited');
    expect(incomeLabel('earner', 1)).toBe('Wages this month');
    expect(incomeLabel('pocket_money', 2)).toBe('Salary credited');
  });
});
