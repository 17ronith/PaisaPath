import { describe, expect, it } from 'vitest';
import { createGame, loadGame, scaleToCoins } from '../index';
import { fixturePack, fixtureProfile } from '../__fixtures__/pack';

describe('engine (stub) contract smoke', () => {
  it('starts with chapter_start and serves a task', () => {
    const g = createGame(fixturePack, fixtureProfile, 42);
    const s1 = g.next();
    expect(s1.kind).toBe('chapter_start');
    expect(g.next()).toEqual(s1); // idempotent
    g.next(); // consume? stub returns same until answered — advance by choosing
  });

  it('scales real rupees to coins by pocket money', () => {
    expect(scaleToCoins(200, 1, { ...fixtureProfile, pocketMoneyMonthly: 5000 })).toBe(200);
    expect(scaleToCoins(200, 1, { ...fixtureProfile, pocketMoneyMonthly: 2500 })).toBe(400);
  });

  it('round-trips through toJSON/loadGame', () => {
    const g = createGame(fixturePack, fixtureProfile, 7);
    g.next();
    const g2 = loadGame(fixturePack, g.toJSON());
    expect(g2.state.chapter).toBe(g.state.chapter);
  });
});
