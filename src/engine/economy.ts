// Economy scaler and the chapter calendar (CONTRACTS §2.1–2.2).
import type { EconomyParams, PersonaId, Profile, Stage } from '@/shared/types';

export const ECONOMY: EconomyParams = {
  stageIncomeCoins: { 1: 5000, 2: 25000, 3: 60000 },
  stageRealRef: { 1: 0 /* = profile.pocketMoneyMonthly */, 2: 20000, 3: 50000 },
};

export const LAST_CHAPTER = 10;
/** Stage-end chapters → years skipped at that jump. */
export const STAGE_END_YEARS: Record<number, number> = { 4: 5, 7: 6, 10: 25 };
/** Chapters that open with the invest screen (if there are savings). */
export const INVEST_CHAPTERS = [5, 8];

export function stageOfChapter(chapter: number): Stage {
  return chapter <= 4 ? 1 : chapter <= 7 ? 2 : 3;
}

/** Real ₹ per month that maps onto one month of in-game income at this stage. */
export function realRef(stage: Stage, profile: Profile): number {
  return stage === 1 ? Math.max(1, profile.pocketMoneyMonthly) : ECONOMY.stageRealRef[stage];
}

export function incomeCoins(stage: Stage): number {
  return ECONOMY.stageIncomeCoins[stage];
}

/** coins = round(real × stageIncomeCoins / stageRealRef); rounds symmetrically for pay/earn. */
export function scaleToCoins(realRupees: number, stage: Stage, profile: Profile): number {
  const coins = (realRupees * incomeCoins(stage)) / realRef(stage, profile);
  return Math.sign(coins) * Math.round(Math.abs(coins));
}

const STAGE1_LABEL: Record<PersonaId, string> = {
  pocket_money: 'Allowance arrived',
  scholarship: 'ePASS credited',
  earner: 'Wages this month',
};

/** Persona changes only the label of the monthly income, never the amount. */
export function incomeLabel(persona: PersonaId, stage: Stage): string {
  return stage === 1 ? STAGE1_LABEL[persona] : 'Salary credited';
}
