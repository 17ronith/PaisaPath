// The demo-video build: `?video` plays the moments of docs/demo/SCRIPT.md in the script's order
// (one beat per chapter; skipped chapters across a stage are its time jump). See DemoBeat.
import type { DemoBeat } from '@/shared/types';

export const DEMO_VIDEO: DemoBeat[] = [
  { chapter: 1, main: 'budget_simple_s1_01' }, // 1 · biryani or chips → the turf match
  { chapter: 2, main: 'safety_medium_s1_01', minigame: 'kirana_rush' }, // 2 · scholarship call; 3 · Kirana Rush
  { chapter: 3, main: 'save_hard_s1_02' }, // 4 · where the emergency fund lives → five years later
  { chapter: 5, main: 'budget_medium_s2_01' }, // 5 · no-cost EMI
  { chapter: 6, event: 'emi_pressure' }, // 5 · EMI deducted, the trip you can't afford
  { chapter: 7, main: 'invest_simple_s2_01' }, // 6 · start early (banyan); Charminar Market from the HUD
  { chapter: 8, main: 'safety_hard_s3_01' }, // 7 · the police video call → epilogue, after-quiz, report
];

export function demoVideoOn(): boolean {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').has('video');
  } catch {
    return false;
  }
}
