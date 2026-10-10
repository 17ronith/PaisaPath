// Internal bookkeeping stored in GameState.flags under a '~' prefix (content flags never start
// with '~'). Kept in state so it survives toJSON()/loadGame() without a contract change:
//   ~evt:<eventId>                          triggered event waiting to be served
//   ~mg:<chapter>                           mini-game won in that chapter (for what-if replay)
//   ~inv:<chapter>:<savings>:<a>=<n>,...    allocation made at an invest step
import type { AssetId, GameState, Portfolio } from '@/shared/types';

const EVT = '~evt:';
const MG = '~mg:';
const INV = '~inv:';

export const isInternalFlag = (flag: string): boolean => flag.startsWith('~');

export function pendingEvents(s: GameState): string[] {
  return s.flags.filter((f) => f.startsWith(EVT)).map((f) => f.slice(EVT.length));
}

export function queueEvent(s: GameState, eventId: string): void {
  if (!s.flags.includes(EVT + eventId)) s.flags.push(EVT + eventId);
}

export function dequeueEvent(s: GameState, eventId: string): void {
  s.flags = s.flags.filter((f) => f !== EVT + eventId);
}

export function recordMinigameWin(s: GameState, chapter: number): void {
  if (!s.flags.includes(MG + chapter)) s.flags.push(MG + chapter);
}

export function wonMinigameAt(s: GameState, chapter: number): boolean {
  return s.flags.includes(MG + chapter);
}

export interface AllocationRecord {
  chapter: number;
  savings: number;
  alloc: Portfolio;
}

export function recordAllocation(s: GameState, rec: AllocationRecord): void {
  const parts = Object.entries(rec.alloc)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => `${k}=${v}`);
  s.flags.push(`${INV}${rec.chapter}:${rec.savings}:${parts.join(',')}`);
}

export function allocationRecords(s: GameState): AllocationRecord[] {
  return s.flags
    .filter((f) => f.startsWith(INV))
    .map((f) => {
      const [chapter, savings, body] = f.slice(INV.length).split(':');
      const alloc: Portfolio = {};
      for (const part of body ? body.split(',') : []) {
        const [k, v] = part.split('=');
        alloc[k as AssetId] = Number(v);
      }
      return { chapter: Number(chapter), savings: Number(savings), alloc };
    });
}
