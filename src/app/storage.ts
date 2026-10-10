// Local-first persistence (IndexedDB via idb-keyval). Nickname + game state only; no PII.
import { get, set, del } from 'idb-keyval';
import type { GameState, Profile } from '@/shared/types';

const KEY_STATE = 'lmbli.state.v1';
const KEY_DRAFT = 'lmbli.profileDraft.v1';

const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await fn();
  } catch {
    return fallback; // private mode / blocked storage: play on, just don't persist
  }
};

export const saveState = (state: GameState): Promise<void> =>
  safe(() => set(KEY_STATE, state), undefined);
export const loadState = (): Promise<GameState | null> =>
  safe(async () => (await get<GameState>(KEY_STATE)) ?? null, null);
export const clearState = (): Promise<void> => safe(() => del(KEY_STATE), undefined);

export const saveProfileDraft = (draft: Partial<Profile>): Promise<void> =>
  safe(() => set(KEY_DRAFT, draft), undefined);
export const loadProfileDraft = (): Promise<Partial<Profile> | null> =>
  safe(async () => (await get<Partial<Profile>>(KEY_DRAFT)) ?? null, null);
export const clearProfileDraft = (): Promise<void> => safe(() => del(KEY_DRAFT), undefined);
