import { describe, expect, it } from 'vitest';
import { buildReportPdf } from '../report';
import { createGame } from '@/engine';
import { fixturePack, fixtureProfile } from '@/engine/__fixtures__/pack';

describe('report pdf', () => {
  it('builds a non-empty PDF blob without the what-if', () => {
    const g = createGame(fixturePack, fixtureProfile, 3);
    const blob = buildReportPdf(g.report(), fixturePack);
    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(1000);
  });
});
