// Effects and the consequence scheduler (CONTRACTS §1 Effect, §2.2 step 1).
// Money in an Effect is authored in real ₹ and scaled to coins with the stage it was caused in.
import type { Bars, Effect, GameState, Profile, ScheduledEffect, Stage } from '@/shared/types';
import { scaleToCoins, stageOfChapter } from './economy';
import { queueEvent } from './records';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Pure bar arithmetic. A savings shortfall comes out of the wallet (no buffer → it hurts). */
export function applyEffect(bars: Bars, effect: Effect, stage: Stage, profile: Profile): Bars {
  let wallet = bars.wallet + (effect.wallet ? scaleToCoins(effect.wallet, stage, profile) : 0);
  let savings = bars.savings + (effect.savings ? scaleToCoins(effect.savings, stage, profile) : 0);
  if (savings < 0) {
    wallet += savings;
    savings = 0;
  }
  const happiness = clamp(bars.happiness + (effect.happiness ?? 0), 0, 100);
  return { wallet, savings, happiness };
}

/** Applies bars, flags and the follow-up event of one effect to the state. */
export function fireEffect(s: GameState, effect: Effect, stage: Stage): void {
  s.bars = applyEffect(s.bars, effect, stage, s.profile);
  if (effect.setFlag && !s.flags.includes(effect.setFlag)) s.flags.push(effect.setFlag);
  if (effect.clearFlag) s.flags = s.flags.filter((f) => f !== effect.clearFlag);
  if (effect.triggerEvent) queueEvent(s, effect.triggerEvent);
}

const delayOf = (e: Effect) => Math.max(0, Math.floor(e.delayChapters ?? 0));
const timesOf = (e: Effect) => Math.max(1, Math.floor(e.repeat?.times ?? 1));
const everyOf = (e: Effect) => Math.max(1, Math.floor(e.repeat?.everyChapters ?? 1));

/** Chapter in which a scheduled effect was caused; its money scales with that chapter's stage. */
export function originChapter(x: ScheduledEffect): number {
  const e = x.effect;
  return x.fireChapter - (timesOf(e) - x.remaining) * everyOf(e) - delayOf(e);
}

/** Coins one firing of a scheduled effect moves in or out of the wallet. */
export function scheduledWalletCoins(x: ScheduledEffect, profile: Profile): number {
  return x.effect.wallet
    ? scaleToCoins(x.effect.wallet, stageOfChapter(originChapter(x)), profile)
    : 0;
}

/**
 * Queues an effect for a future chapter start. With delayChapters 0 the first firing has already
 * happened now, so only the repeats are queued.
 */
export function scheduleEffect(s: GameState, effect: Effect, sourceTaskId: string): void {
  const delay = delayOf(effect);
  const times = timesOf(effect);
  if (delay > 0) {
    s.scheduled.push({ effect, fireChapter: s.chapter + delay, sourceTaskId, remaining: times });
  } else if (times > 1) {
    s.scheduled.push({
      effect,
      fireChapter: s.chapter + everyOf(effect),
      sourceTaskId,
      remaining: times - 1,
    });
  }
}

/** Resolves a choice's effects: immediate ones fire now, delayed/repeating ones are queued. */
export function resolveEffects(
  s: GameState,
  effects: Effect[],
  sourceTaskId: string,
): { firedNow: Effect[]; scheduled: Effect[] } {
  const firedNow: Effect[] = [];
  const scheduled: Effect[] = [];
  for (const e of effects) {
    if (delayOf(e) === 0) {
      fireEffect(s, e, s.stage);
      firedNow.push(e);
    }
    if (delayOf(e) > 0 || timesOf(e) > 1) {
      scheduleEffect(s, e, sourceTaskId);
      scheduled.push(e);
    }
  }
  return { firedNow, scheduled };
}

/** Fires every scheduled effect due at (or before) the current chapter; repeats are re-queued. */
export function fireDue(s: GameState): Effect[] {
  const due = s.scheduled
    .filter((x) => x.fireChapter <= s.chapter)
    .sort((a, b) => a.fireChapter - b.fireChapter);
  const rest = s.scheduled.filter((x) => x.fireChapter > s.chapter);
  const fired: Effect[] = [];
  for (const x of due) {
    fireEffect(s, x.effect, stageOfChapter(originChapter(x)));
    fired.push(x.effect);
    if (x.remaining > 1) {
      rest.push({
        ...x,
        fireChapter: x.fireChapter + everyOf(x.effect),
        remaining: x.remaining - 1,
      });
    }
  }
  s.scheduled = rest;
  return fired;
}
