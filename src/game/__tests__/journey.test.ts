import { describe, expect, it } from 'vitest';
import mapData from '../../../public/assets/hyd/map/map_data.json';
import {
  JOURNEY,
  doneLandmarks,
  landmarkForChapter,
  route,
  timeOfDay,
  type Edge,
} from '../logic/journey';

const edges = mapData.edges as unknown as Edge[];
const nodeIds = mapData.nodes.map((n) => n.id);

describe('journey', () => {
  it('covers all 10 chapters exactly once, in order, matching engine stages', () => {
    const chapters = JOURNEY.flatMap((l) => l.chapters);
    expect(chapters).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const l of JOURNEY)
      for (const c of l.chapters) expect(l.stage).toBe(c <= 4 ? 1 : c <= 7 ? 2 : 3);
  });

  it('uses every map landmark once', () => {
    expect(JOURNEY.map((l) => l.id).sort()).toEqual([...nodeIds].sort());
  });

  it('maps chapters to landmarks and marks finished ones', () => {
    expect(landmarkForChapter(1).id).toBe('charminar');
    expect(landmarkForChapter(6).id).toBe('hitec');
    expect(landmarkForChapter(10).id).toBe('ramoji');
    expect(doneLandmarks(1)).toEqual([]);
    expect(doneLandmarks(5)).toEqual(['charminar', 'qutb', 'durgam', 'shilparamam']);
    expect(doneLandmarks(6)).not.toContain('hitec');
  });

  it('time of day follows the life stage', () => {
    expect([1, 2, 3].map((s) => timeOfDay(s as 1 | 2 | 3))).toEqual(['day', 'evening', 'night']);
  });

  it('every consecutive leg of the journey is walkable on the roads', () => {
    for (let i = 1; i < JOURNEY.length; i++) {
      const pts = route(edges, JOURNEY[i - 1].id, JOURNEY[i].id);
      expect(pts.length, `${JOURNEY[i - 1].id} → ${JOURNEY[i].id}`).toBeGreaterThan(5);
      const end = mapData.nodes.find((n) => n.id === JOURNEY[i].id)!;
      const last = pts[pts.length - 1];
      expect(Math.hypot(last[0] - end.x, last[1] - end.y)).toBeLessThan(12);
    }
  });

  it('routes through intermediate landmarks and in reverse', () => {
    const viaBirla = route(edges, 'tankbund', 'ramoji');
    expect(viaBirla.length).toBeGreaterThan(60);
    expect(route(edges, 'hitec', 'shilparamam')[0]).toEqual(
      edges.find((e) => e.from === 'shilparamam')!.path.at(-1),
    );
    expect(route(edges, 'charminar', 'charminar')).toEqual([]);
  });
});
