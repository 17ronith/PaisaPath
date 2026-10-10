// Made-up assets, seeded yearly returns, stage-jump compounding and the epilogue projection
// (CONTRACTS §2.2 step 6, CONTEXT §2.10). Guardrail: every projection carries an assumption line.
import type { AssetDef, AssetId, GameState, Portfolio, Projection } from '@/shared/types';
import { STAGE_END_YEARS } from './economy';
import { allocationRecords } from './records';
import type { Rng } from './rng';

export const ASSET_IDS: AssetId[] = ['cashbox', 'banyan', 'chai', 'mango'];
export const INFLATION_PCT = 5;
export const RETURN_MIN_PCT = -60;
export const RETURN_MAX_PCT = 80;
export const EPILOGUE_AGE = 60;

/** Standard normal via Box–Muller. Always consumes exactly two draws. */
export function normal(rng: Rng): number {
  const u1 = 1 - rng.next(); // (0, 1]
  const u2 = rng.next();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** One year's return in %, Normal(mean, vol) clipped to [−60, +80], rounded to 0.1. */
export function yearlyReturn(asset: AssetDef, rng: Rng): number {
  const r = asset.meanYearlyPct + asset.volatilityPct * normal(rng);
  const clipped = Math.min(RETURN_MAX_PCT, Math.max(RETURN_MIN_PCT, r));
  return Math.round(clipped * 10) / 10;
}

export function portfolioTotal(p: Portfolio): number {
  return Object.values(p).reduce<number>((a, v) => a + (v ?? 0), 0);
}

/**
 * Grows a portfolio over `years`. Returns are drawn for every asset every year (held or not), so
 * RNG use doesn't depend on what the player bought.
 */
export function growPortfolio(
  portfolio: Portfolio,
  assets: AssetDef[],
  years: number,
  rng: Rng,
): { after: Portfolio; yearlyReturns: Record<AssetId, number[]> } {
  const yearlyReturns: Record<AssetId, number[]> = { cashbox: [], banyan: [], chai: [], mango: [] };
  const after: Portfolio = {};
  for (const id of ASSET_IDS) {
    const def = assets.find((a) => a.id === id);
    let value = portfolio[id] ?? 0;
    for (let y = 0; y < years && def; y++) {
      const r = yearlyReturn(def, rng);
      yearlyReturns[id].push(r);
      value *= 1 + r / 100;
    }
    if (portfolio[id] !== undefined) after[id] = Math.round(value);
  }
  return { after, yearlyReturns };
}

/** What `nominal` coins buy after `years` of inflation, in today's money. */
export function realValue(nominal: number, years: number, inflationPct = INFLATION_PCT): number {
  return Math.round(nominal / Math.pow(1 + inflationPct / 100, years));
}

/** Years from an allocation at `chapter` to the epilogue (sum of the stage jumps after it). */
export function yearsToEpilogue(chapter: number): number {
  return Object.entries(STAGE_END_YEARS)
    .filter(([ch]) => Number(ch) >= chapter)
    .reduce((a, [, y]) => a + y, 0);
}

export function assumptionLine(held: AssetDef[]): string {
  const growth = held.filter((a) => a.meanYearlyPct > 0);
  const rates = growth.map((a) => `${a.meanYearlyPct}% a year for ${a.name}`).join(', ');
  return (
    (rates ? `Assumes about ${rates}, with ups and downs, and ` : 'Assumes ') +
    `${INFLATION_PCT}% inflation a year. Real returns vary and can be negative. ` +
    'Simulations are assumptions, not promises.'
  );
}

/** The epilogue view: what was put in, what it became, and the cash-box alternative. */
export function projection(s: GameState, assets: AssetDef[]): Projection {
  const invested: Partial<Record<AssetId, number>> = {};
  let ifNotInvested = 0;
  for (const rec of allocationRecords(s)) {
    const total = portfolioTotal(rec.alloc);
    ifNotInvested += realValue(total, yearsToEpilogue(rec.chapter));
    for (const [id, v] of Object.entries(rec.alloc) as [AssetId, number][]) {
      invested[id] = (invested[id] ?? 0) + v;
    }
  }
  const held = assets.filter((a) => (invested[a.id] ?? 0) > 0 || (s.portfolio[a.id] ?? 0) > 0);
  const perAsset = held.map((asset) => ({
    asset,
    invested: invested[asset.id] ?? 0,
    finalValue: s.portfolio[asset.id] ?? 0,
  }));
  return {
    ageAt: EPILOGUE_AGE,
    assumptionLine: assumptionLine(held),
    perAsset,
    totalInvested: perAsset.reduce((a, p) => a + p.invested, 0),
    totalFinal: perAsset.reduce((a, p) => a + p.finalValue, 0),
    ifNotInvested,
    savingsFinal: s.bars.savings,
  };
}
