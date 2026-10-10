// Fresh GameState for a new game (shared by createGame and the what-if replay).
import type { GameState, Profile } from '@/shared/types';
import { seedState } from './rng';

export const HAPPINESS_START = 70;

export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

export function initialState(profile: Profile, seed: number): GameState {
  return {
    profile: clone(profile),
    seed,
    rng: seedState(seed),
    chapter: 1,
    stage: 1,
    bars: { wallet: 0, savings: 0, happiness: HAPPINESS_START },
    flags: [...profile.flags],
    scheduled: [],
    mistakes: [],
    learned: [],
    log: [],
    seenTasks: [],
    seenExplainers: [],
    failCounts: {},
    detoursTaken: 0,
    restarts: 0,
    portfolio: {},
    phase: 'chapter_start',
  };
}
