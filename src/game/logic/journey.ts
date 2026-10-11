// The life journey across the Hyderabad map: a fixed path of 8 landmarks, each one a phase
// of the player's life, holding one or two of the engine's 10 monthly chapters. The player
// never picks where to go — the path is the story. Pure (no Phaser) so it is unit-tested.
import type { Stage } from '@/shared/types';

export type LandmarkId =
  'charminar' | 'qutb' | 'durgam' | 'shilparamam' | 'hitec' | 'birla' | 'tankbund' | 'ramoji';

export interface Landmark {
  id: LandmarkId;
  stage: Stage;
  chapters: number[]; // engine chapters played here, in order
  age: number; // player's age while here
  phase: string; // short life-phase title (English fallback; i18n key landmark.<id>.phase)
  backdrop: string; // texture key of its 08_hyderabad_backgrounds scene
}

/** In walking order. Stage 1 = ch 1–4, Stage 2 = ch 5–7, Stage 3 = ch 8–10 (engine contract). */
export const JOURNEY: Landmark[] = [
  {
    id: 'charminar',
    stage: 1,
    chapters: [1],
    age: 16,
    phase: 'First pocket money',
    backdrop: 'bg_01_charminar',
  },
  {
    id: 'qutb',
    stage: 1,
    chapters: [2],
    age: 16,
    phase: 'Saving up',
    backdrop: 'bg_07_qutb_shahi_tombs',
  },
  {
    id: 'durgam',
    stage: 1,
    chapters: [3],
    age: 17,
    phase: 'Friends and weekends',
    backdrop: 'bg_02_durgam_cheruvu',
  },
  {
    id: 'shilparamam',
    stage: 1,
    chapters: [4],
    age: 17,
    phase: 'Festival season',
    backdrop: 'bg_05_shilparamam',
  },
  {
    id: 'hitec',
    stage: 2,
    chapters: [5, 6],
    age: 23,
    phase: 'First job in the city',
    backdrop: 'bg_09_hitec_city',
  },
  {
    id: 'birla',
    stage: 2,
    chapters: [7],
    age: 24,
    phase: 'Family and duties',
    backdrop: 'bg_06_birla_mandir',
  },
  {
    id: 'tankbund',
    stage: 3,
    chapters: [8, 9],
    age: 30,
    phase: 'A growing family',
    backdrop: 'bg_03_tank_bund_buddha',
  },
  {
    id: 'ramoji',
    stage: 3,
    chapters: [10],
    age: 31,
    phase: 'Big dreams',
    backdrop: 'bg_04_film_city',
  },
];

export function landmarkForChapter(chapter: number): Landmark {
  const c = Math.min(10, Math.max(1, chapter));
  return JOURNEY.find((l) => l.chapters.includes(c)) ?? JOURNEY[JOURNEY.length - 1];
}

export function landmarkIndex(id: LandmarkId): number {
  return JOURNEY.findIndex((l) => l.id === id);
}

/** Landmarks fully behind the player when `chapter` is the current one. */
export function doneLandmarks(chapter: number): LandmarkId[] {
  return JOURNEY.filter((l) => Math.max(...l.chapters) < chapter).map((l) => l.id);
}

/** Map time of day per life stage: student days, first-job evenings, busy nights. */
export function timeOfDay(stage: Stage): 'day' | 'evening' | 'night' {
  return stage === 1 ? 'day' : stage === 2 ? 'evening' : 'night';
}

export type Point = [number, number];
export interface Edge {
  from: string;
  to: string;
  path: Point[];
}

/**
 * Road route between two landmarks along map edges (either direction), as one point list.
 * Breadth-first over landmarks, so it passes through intermediate landmarks when there is
 * no direct road (e.g. Tank Bund → Birla → Charminar → Film City). Empty when unreachable.
 */
export function route(edges: Edge[], from: string, to: string): Point[] {
  if (from === to) return [];
  const adj = new Map<string, { to: string; path: Point[] }[]>();
  const link = (a: string, b: string, path: Point[]): void => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push({ to: b, path });
  };
  for (const e of edges) {
    link(e.from, e.to, e.path);
    link(e.to, e.from, [...e.path].reverse());
  }
  const prev = new Map<string, { node: string; path: Point[] }>();
  const queue = [from];
  const seen = new Set([from]);
  while (queue.length) {
    const n = queue.shift()!;
    if (n === to) break;
    for (const nb of adj.get(n) ?? []) {
      if (seen.has(nb.to)) continue;
      seen.add(nb.to);
      prev.set(nb.to, { node: n, path: nb.path });
      queue.push(nb.to);
    }
  }
  if (!prev.has(to)) return [];
  const legs: Point[][] = [];
  for (let n = to; n !== from; n = prev.get(n)!.node) legs.unshift(prev.get(n)!.path);
  return legs.flatMap((leg, i) => (i === 0 ? leg : leg.slice(1)));
}
