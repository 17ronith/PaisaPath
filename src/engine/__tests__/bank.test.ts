import { describe, expect, it } from 'vitest';
import { bank, clear, isBanked } from '../bank';
import { state } from '../__fixtures__/builders';

describe('mistake bank', () => {
  it('banks a concept once (dedupe)', () => {
    const s = state();
    expect(bank(s, 'needs_vs_wants')).toBe(true);
    expect(bank(s, 'needs_vs_wants')).toBe(false);
    expect(s.mistakes).toEqual(['needs_vs_wants']);
    expect(isBanked(s, 'needs_vs_wants')).toBe(true);
  });

  it('clear moves a banked concept to learned; clearing an unbanked one does nothing', () => {
    const s = state();
    bank(s, 'spot_fake_officials');
    expect(clear(s, 'spot_fake_officials')).toBe(true);
    expect(s.mistakes).toEqual([]);
    expect(s.learned).toEqual(['spot_fake_officials']);
    expect(clear(s, 'spot_fake_officials')).toBe(false);
  });

  it('failing a learned concept again re-banks it', () => {
    const s = state();
    bank(s, 'x');
    clear(s, 'x');
    bank(s, 'x');
    expect(s.mistakes).toEqual(['x']);
    expect(s.learned).toEqual([]);
  });
});
