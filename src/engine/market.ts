// Charminar Market — the stock-simulator device (docs/plan/STOCKS.md).
// Pure, seeded, testable. Prices = seeded quarterly returns + scripted beats; the student's
// trades never move prices. Scored on behaviour (five checks), never on money made.
import type {
  GameState,
  MarketApi,
  MarketCandle,
  MarketChecks,
  MarketCompany,
  MarketCompanyId,
  MarketNews,
  MarketOrder,
  MarketRun,
  MarketState,
  NcfeItem,
} from '@/shared/types';
import { bindRng, type Rng } from './rng';
import { normal } from './invest';
import {
  BANYAN_YEARLY_PCT,
  BEATS,
  CANDLES_PER_TURN,
  COMPANIES,
  CRASH_TURN,
  MARKET_TURNS,
  NEWS,
  PAPER_CASH,
  PAPER_TURNS,
  START_PRICE,
  TIP_COMPANY,
  TIP_TURN,
  TRADE_FEE,
} from './marketData';

export const MARKET_UNLOCK_CHAPTER = 5;
export const LOW_CHURN_MAX_TRADES = 6;
const IDS = COMPANIES.map((c) => c.id);

export function emptyMarketState(): MarketState {
  return { runs: [], evidence: [], scamsFaced: 0, scamsSpotted: 0 };
}

const zero = (): Record<MarketCompanyId, number> => ({
  zipeats: 0,
  dashkart: 0,
  autogo: 0,
  chaiwala: 0,
});

export function newRun(mode: 'paper' | 'real', deposit: number, seed: number): MarketRun {
  const prices = {} as Record<MarketCompanyId, number[]>;
  const candles = {} as Record<MarketCompanyId, MarketCandle[][]>;
  for (const id of IDS) {
    prices[id] = [START_PRICE[id]];
    candles[id] = [];
  }
  return {
    mode,
    seed,
    rng: seed >>> 0 || 1,
    turn: 0,
    turns: mode === 'paper' ? PAPER_TURNS : MARKET_TURNS,
    cash: mode === 'paper' ? PAPER_CASH : deposit,
    deposit: mode === 'paper' ? PAPER_CASH : deposit,
    holdings: zero(),
    prices,
    candles,
    trades: [],
    soldOnTurn: [],
    finished: false,
  };
}

export const priceOf = (run: MarketRun, id: MarketCompanyId): number => {
  const p = run.prices[id];
  return p[p.length - 1];
};

export const runValue = (run: MarketRun): number =>
  Math.round(run.cash + IDS.reduce((n, id) => n + run.holdings[id] * priceOf(run, id), 0));

export const newsFor = (run: MarketRun): MarketNews | null =>
  run.finished ? null : (NEWS.find((n) => n.turn === run.turn + 1) ?? null);

/** Quarterly % move for a company on a given turn: seeded noise + scripted beat, clipped. */
export function quarterMovePct(c: MarketCompany, turn: number, rng: Rng): number {
  const beat = BEATS[turn]?.[c.id] ?? 0;
  const pct = c.meanQuarterPct + normal(rng) * c.volQuarterPct + beat;
  return Math.max(-60, Math.min(80, pct));
}

/** Decorative candles: a noisy walk from open to close, highs/lows a touch beyond. */
export function candlesFor(open: number, close: number, rng: Rng): MarketCandle[] {
  const out: MarketCandle[] = [];
  let o = open;
  for (let i = 0; i < CANDLES_PER_TURN; i++) {
    const target = open + ((close - open) * (i + 1)) / CANDLES_PER_TURN;
    const noise =
      (rng.next() - 0.5) * Math.abs(close - open) * 0.5 + (rng.next() - 0.5) * open * 0.02;
    const c = i === CANDLES_PER_TURN - 1 ? close : Math.max(1, target + noise);
    const h = Math.max(o, c) * (1 + rng.next() * 0.012);
    const l = Math.min(o, c) * (1 - rng.next() * 0.012);
    out.push({ o: r2(o), h: r2(h), l: r2(l), c: r2(c) });
    o = c;
  }
  return out;
}
const r2 = (n: number): number => Math.round(n * 100) / 100;

export function applyTrades(run: MarketRun, orders: MarketOrder[]): MarketRun {
  if (run.finished) throw new Error('run finished');
  for (const o of orders) {
    const shares = Math.trunc(o.shares);
    if (!shares) continue;
    const price = priceOf(run, o.company);
    if (shares > 0) {
      const cost = shares * price + TRADE_FEE;
      if (cost > run.cash + 1e-6) throw new Error(`not enough cash for ${shares} ${o.company}`);
      run.cash = Math.round((run.cash - cost) * 100) / 100;
      run.holdings[o.company] += shares;
    } else {
      const n = -shares;
      if (n > run.holdings[o.company]) throw new Error(`not enough ${o.company} shares to sell`);
      run.holdings[o.company] -= n;
      run.cash = Math.round((run.cash + n * price - TRADE_FEE) * 100) / 100;
      if (!run.soldOnTurn.includes(run.turn + 1)) run.soldOnTurn.push(run.turn + 1);
    }
    run.trades.push({ turn: run.turn + 1, company: o.company, shares, price, fee: TRADE_FEE });
  }
  return run;
}

export function advanceTurn(run: MarketRun): { valueBefore: number; valueAfter: number } {
  if (run.finished) throw new Error('run finished');
  const rng = bindRng(run);
  const valueBefore = runValue(run);
  const turn = run.turn + 1;
  for (const c of COMPANIES) {
    const open = priceOf(run, c.id);
    const close = Math.max(1, r2(open * (1 + quarterMovePct(c, turn, rng) / 100)));
    run.candles[c.id].push(candlesFor(open, close, rng));
    run.prices[c.id].push(close);
  }
  run.turn = turn;
  if (run.turn >= run.turns) run.finished = true;
  return { valueBefore, valueAfter: runValue(run) };
}

/** Happiness effect of a quarter: drops hurt, panic-selling in the crash hurts more, gains please. */
export function happinessFor(
  run: MarketRun,
  valueBefore: number,
  valueAfter: number,
): { delta: number; panicSold: boolean } {
  const invested = valueBefore > run.cash + 1e-6 || IDS.some((id) => run.holdings[id] > 0);
  const change = valueBefore > 0 ? (valueAfter - valueBefore) / valueBefore : 0;
  const panicSold = run.turn === CRASH_TURN && run.soldOnTurn.includes(CRASH_TURN);
  let delta = 0;
  if (invested && change < -0.1) delta -= 3;
  if (invested && change > 0.1) delta += 2;
  if (panicSold) delta -= 8;
  return { delta, panicSold };
}

export function checksFor(run: MarketRun): MarketChecks {
  // diversified: among turns where the student held anything, held ≥ 2 companies at least half the time
  let investedTurns = 0;
  let diversifiedTurns = 0;
  const held = zero();
  for (let t = 1; t <= run.turns; t++) {
    for (const tr of run.trades.filter((x) => x.turn === t)) held[tr.company] += tr.shares;
    const n = IDS.filter((id) => held[id] > 0).length;
    if (n > 0) investedTurns += 1;
    if (n >= 2) diversifiedTurns += 1;
  }
  const diversified = investedTurns > 0 && diversifiedTurns * 2 >= investedTurns;
  // held through crash: had holdings entering the crash turn and sold nothing on it
  const heldBefore = zero();
  for (const tr of run.trades.filter((x) => x.turn < CRASH_TURN))
    heldBefore[tr.company] += tr.shares;
  const hadHoldings = IDS.some((id) => heldBefore[id] > 0);
  const heldThroughCrash =
    run.turns >= CRASH_TURN && hadHoldings && !run.soldOnTurn.includes(CRASH_TURN);
  // refused the tip: no net buy of the tipped company on the tip turn
  const tipNet = run.trades
    .filter((x) => x.turn === TIP_TURN && x.company === TIP_COMPANY)
    .reduce((n, x) => n + x.shares, 0);
  const refusedTip = run.turns >= TIP_TURN && tipNet <= 0;
  const fees = run.trades.length * TRADE_FEE;
  const finalValue = runValue(run);
  const years = run.turns / 4;
  const banyanValue = Math.round(run.deposit * Math.pow(1 + BANYAN_YEARLY_PCT / 100, years));
  return {
    diversified,
    heldThroughCrash,
    refusedTip,
    lowChurn: run.trades.length <= LOW_CHURN_MAX_TRADES,
    beatBanyan: finalValue >= banyanValue,
    deposit: run.deposit,
    finalValue,
    banyanValue,
    fees,
    trades: run.trades.length,
    panicSells: run.soldOnTurn.includes(CRASH_TURN) ? 1 : 0,
  };
}

export function evidenceFor(ch: MarketChecks): { item: NcfeItem; value: 0 | 1 }[] {
  const b = (x: boolean): 0 | 1 => (x ? 1 : 0);
  return [
    { item: 'diversification', value: b(ch.diversified) },
    { item: 'risk_return', value: b(ch.heldThroughCrash) },
    { item: 'long_term_goals', value: b(ch.heldThroughCrash) },
    { item: 'risk_return', value: b(ch.refusedTip) },
    { item: 'considers_affordability', value: b(ch.lowChurn) },
  ];
}

/** Binds the market to a GameState. All mutation goes through here. */
export function createMarketApi(s: GameState): MarketApi {
  const ms = (): MarketState => (s.market ??= emptyMarketState());
  const cur = (): MarketRun => {
    const r = ms().current;
    if (!r) throw new Error('no market run in progress');
    return r;
  };
  return {
    companies: () => COMPANIES,
    eligible: () => s.chapter >= MARKET_UNLOCK_CHAPTER,
    state: () => ms(),
    start(mode, deposit) {
      const m = ms();
      if (m.current) throw new Error('a run is already in progress');
      if (mode === 'real') {
        const d = Math.floor(deposit);
        if (d <= 0 || d > s.bars.savings)
          throw new Error('deposit must be between 1 and your savings');
        s.bars.savings -= d;
        deposit = d;
      }
      const seed = (s.seed * 31 + (m.runs.length + 1) * 7919) >>> 0 || 1;
      m.current = newRun(mode, deposit, seed);
      return m.current;
    },
    current: () => ms().current ?? null,
    news: () => (ms().current ? newsFor(cur()) : null),
    price: (id) => priceOf(cur(), id),
    value: () => runValue(cur()),
    trade: (orders) => applyTrades(cur(), orders),
    nextTurn() {
      const run = cur();
      const { valueBefore, valueAfter } = advanceTurn(run);
      const { delta, panicSold } = happinessFor(run, valueBefore, valueAfter);
      if (run.mode === 'real' && delta !== 0)
        s.bars.happiness = Math.max(0, Math.min(100, s.bars.happiness + delta));
      return {
        run,
        valueBefore,
        valueAfter,
        happinessDelta: run.mode === 'real' ? delta : 0,
        panicSold,
        news: newsFor(run),
      };
    },
    finish() {
      const m = ms();
      const run = cur();
      if (!run.finished) throw new Error('run not finished');
      const checks = checksFor(run);
      run.checks = checks;
      if (run.mode === 'real') {
        s.bars.savings += runValue(run); // settle: no fee on the final sale
        m.evidence.push(...evidenceFor(checks));
        m.scamsFaced += 1;
        if (checks.refusedTip) m.scamsSpotted += 1;
      }
      m.runs.push(run);
      m.current = undefined;
      return checks;
    },
    close() {
      /* holdings stay in the run; resume later */
    },
  };
}
