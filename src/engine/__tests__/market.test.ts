import { describe, expect, it } from 'vitest';
import { createGame } from '../index';
import { fixturePack, fixtureProfile } from '../__fixtures__/pack';
import { advanceTurn, applyTrades, checksFor, newRun, priceOf, runValue } from '../market';
import {
  CRASH_TURN,
  MARKET_TURNS,
  PAPER_CASH,
  TIP_COMPANY,
  TIP_TURN,
  TRADE_FEE,
} from '../marketData';
import type { Game } from '@/shared/types';

const toChapter = (g: Game, chapter: number): void => {
  for (let i = 0; i < 400 && g.state.chapter < chapter; i++) {
    const step = g.next();
    if (step.kind === 'task' || step.kind === 'event') {
      const item = step.kind === 'task' ? step.task : step.event;
      g.choose((item.choices.find((c) => c.quality === 'good') ?? item.choices[0]).id);
    } else if (step.kind === 'minigame_offer') g.skipMinigame();
    else if (step.kind === 'invest') g.allocate({});
    else if (step.kind === 'quiz_after') g.answerQuiz([0, 0, 0, 0, 0]);
  }
};

describe('Charminar Market — engine', () => {
  it('is locked before chapter 5 and open from chapter 5', () => {
    const g = createGame(fixturePack, fixtureProfile, 11);
    expect(g.market!.eligible()).toBe(false);
    toChapter(g, 5);
    expect(g.market!.eligible()).toBe(true);
  });

  it('paper run uses virtual cash and never touches savings or happiness', () => {
    const g = createGame(fixturePack, fixtureProfile, 11);
    toChapter(g, 5);
    const sav = g.state.bars.savings;
    const hap = g.state.bars.happiness;
    const run = g.market!.start('paper', 0);
    expect(run.cash).toBe(PAPER_CASH);
    g.market!.trade([{ company: 'dashkart', shares: 10 }]);
    while (!g.market!.current()!.finished) g.market!.nextTurn();
    g.market!.finish();
    expect(g.state.bars.savings).toBe(sav);
    expect(g.state.bars.happiness).toBe(hap);
    expect(g.state.market!.evidence).toHaveLength(0);
  });

  it('real run moves deposit out of savings and settles everything back at the end', () => {
    const g = createGame(fixturePack, fixtureProfile, 11);
    toChapter(g, 5);
    g.state.bars.savings = 20_000;
    g.market!.start('real', 8_000);
    expect(g.state.bars.savings).toBe(12_000);
    g.market!.trade([
      { company: 'chaiwala', shares: 20 },
      { company: 'autogo', shares: 10 },
    ]);
    while (!g.market!.current()!.finished) g.market!.nextTurn();
    const checks = g.market!.finish();
    expect(g.state.bars.savings).toBe(12_000 + checks.finalValue);
    expect(checks.deposit).toBe(8_000);
    expect(g.state.market!.runs).toHaveLength(1);
    expect(g.state.market!.evidence.length).toBeGreaterThan(0);
  });

  it('you can only lose what you put in: cash never goes negative, trades are validated', () => {
    const run = newRun('real', 1_000, 5);
    expect(() => applyTrades(run, [{ company: 'zipeats', shares: 100 }])).toThrow();
    expect(() => applyTrades(run, [{ company: 'zipeats', shares: -1 }])).toThrow();
    applyTrades(run, [{ company: 'chaiwala', shares: 5 }]);
    expect(run.cash).toBe(1_000 - 5 * priceOf(run, 'chaiwala') - TRADE_FEE);
    expect(run.cash).toBeGreaterThanOrEqual(0);
  });

  it('prices are seeded and reproducible; 8 turns produce 8 candle sets', () => {
    const a = newRun('real', 5_000, 42);
    const b = newRun('real', 5_000, 42);
    for (let i = 0; i < MARKET_TURNS; i++) {
      advanceTurn(a);
      advanceTurn(b);
    }
    expect(a.prices).toEqual(b.prices);
    expect(a.finished).toBe(true);
    expect(a.candles.dashkart).toHaveLength(MARKET_TURNS);
    expect(a.candles.dashkart[0]).toHaveLength(8);
  });

  it('the crash hits DashKart hardest and the tip quarter spikes it', () => {
    const run = newRun('real', 5_000, 7);
    for (let i = 0; i < MARKET_TURNS; i++) advanceTurn(run);
    const d = run.prices.dashkart;
    const c = run.prices.chaiwala;
    expect(d[CRASH_TURN] / d[CRASH_TURN - 1]).toBeLessThan(c[CRASH_TURN] / c[CRASH_TURN - 1]);
    expect(d[TIP_TURN]).toBeGreaterThan(d[TIP_TURN - 1] * 1.0);
  });

  it('behaviour checks: diversified holder who ignores the tip and holds through the crash passes; tip-buyer who panic-sells fails', () => {
    const good = newRun('real', 10_000, 3);
    applyTrades(good, [
      { company: 'chaiwala', shares: 20 },
      { company: 'autogo', shares: 10 },
    ]);
    for (let i = 0; i < MARKET_TURNS; i++) advanceTurn(good);
    const gc = checksFor(good);
    expect(gc.diversified && gc.heldThroughCrash && gc.refusedTip && gc.lowChurn).toBe(true);

    const bad = newRun('real', 10_000, 3);
    applyTrades(bad, [{ company: TIP_COMPANY, shares: 10 }]);
    for (let i = 0; i < TIP_TURN - 1; i++) advanceTurn(bad);
    applyTrades(bad, [{ company: TIP_COMPANY, shares: 5 }]); // buys the tip on the tip turn
    advanceTurn(bad); // → crash turn begins
    applyTrades(bad, [{ company: TIP_COMPANY, shares: -15 }]); // panic sells in the crash
    while (!bad.finished) advanceTurn(bad);
    const bc = checksFor(bad);
    expect(bc.refusedTip).toBe(false);
    expect(bc.heldThroughCrash).toBe(false);
    expect(bc.diversified).toBe(false);
    expect(bc.panicSells).toBe(1);
  });

  it('value is cash plus holdings at current prices', () => {
    const run = newRun('paper', 0, 1);
    applyTrades(run, [{ company: 'zipeats', shares: 4 }]);
    expect(runValue(run)).toBe(Math.round(run.cash + 4 * priceOf(run, 'zipeats')));
  });
});
