// Pure display maths for the HUD, bars and explainer animations (no Phaser).
import type { ExplainerStep } from '@/shared/types';

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Fill ratio 0..1 for a bar. max ≤ 0 → empty. */
export function fillRatio(value: number, max: number): number {
  if (max <= 0) return 0;
  return clamp(value / max, 0, 1);
}

/** Bars turn red at or below 30% (ronith.md: "colour shifts at 30%"). */
export function isLow(value: number, max: number): boolean {
  return fillRatio(value, max) <= 0.3;
}

/** 5 hearts, one per 20 happiness; rounds up so 1..20 still shows one heart. */
export function heartsFor(happiness: number): number {
  return clamp(Math.ceil(clamp(happiness, 0, 100) / 20), 0, 5);
}

/** `grow` op: value at the end of each year 0..years via principal × (1+r)^t. */
export function growSeries(principal: number, ratePct: number, years: number): number[] {
  const out: number[] = [];
  for (let t = 0; t <= years; t++) out.push(Math.round(principal * Math.pow(1 + ratePct / 100, t)));
  return out;
}

/** Normalise `split` parts so widths always sum to the full bar even if pcts don't add to 100. */
export function splitWidths(pcts: number[], total: number): number[] {
  const sum = pcts.reduce((a, b) => a + Math.max(0, b), 0);
  if (sum <= 0) return pcts.map(() => 0);
  const raw = pcts.map((p) => (Math.max(0, p) / sum) * total);
  const rounded = raw.map(Math.floor);
  rounded[rounded.length - 1] += total - rounded.reduce((a, b) => a + b, 0);
  return rounded;
}

/** When the next step starts after `index` (or the explainer's end) — used to pace `grow`. */
export function timeUntilNext(steps: ExplainerStep[], index: number, durationMs: number): number {
  const at = steps[index].at;
  const later = steps.slice(index + 1).find((s) => s.at > at);
  return Math.max(400, (later ? later.at : durationMs) - at);
}
