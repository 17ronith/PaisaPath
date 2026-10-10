// Hints after two fails (README §6 #10), end to end through the Game API as the UI sees it.
import { describe, expect, it } from 'vitest';
import type { Game, Step } from '@/shared/types';
import { createGame, loadGame } from '../game';
import { choice, event, pack, task } from '../__fixtures__/builders';
import { fixtureProfile } from '../__fixtures__/pack';

/** Acknowledge info steps and skip side offers until `stop` matches. */
function advanceTo(g: Game, stop: (s: Step) => boolean, max = 50): Step {
  for (let i = 0; i < max; i++) {
    const s = g.next();
    if (stop(s)) return s;
    if (s.kind === 'minigame_offer') g.skipMinigame();
    else if (s.kind === 'invest') g.allocate({});
    else if (s.kind === 'task' || s.kind === 'event') throw new Error(`unexpected ${s.kind}`);
  }
  throw new Error('stop condition never met');
}

const scam = task('scam', {
  pillar: 'safety',
  concept: 'spot_fake_officials',
  choices: [
    choice('pay', 'critical', {
      effects: [{ label: 'Paid', wallet: -500, happiness: -25 }],
      hint: 'Who asks for money to GIVE you money?',
    }),
    choice('portal', 'good'),
  ],
});
const spend = task('spend', {
  choices: [choice('order', 'weak', { detourTaskId: 'fix' }), choice('cook', 'good')],
});
const fix = task('fix', {
  isDetour: true,
  choices: [
    choice('borrow', 'critical', { hint: 'Borrowing to cover a want makes it worse.' }),
    choice('skip', 'good'),
  ],
});
const isTask = (id: string) => (s: Step) => s.kind === 'task' && s.task.id === id;

describe('hints after two fails', () => {
  it('turn on at the second restart, survive save/resume, and carry the hint text to the UI', () => {
    const content = pack({ tasks: [scam], events: [] });
    const g = createGame(content, fixtureProfile, 1);
    expect(advanceTo(g, isTask('scam'))).toMatchObject({ hintsOn: false });
    g.choose('pay');
    expect(g.next()).toMatchObject({ task: { id: 'scam' }, hintsOn: false });
    g.choose('pay');

    const resumed = loadGame(content, g.toJSON());
    const step = resumed.next();
    expect(step).toMatchObject({ kind: 'task', task: { id: 'scam' }, hintsOn: true });
    const pay = step.kind === 'task' ? step.task.choices.find((c) => c.id === 'pay') : undefined;
    expect(pay?.hint).toMatch(/GIVE you money/);
    expect(resumed.state.failCounts.scam).toBe(2);
    expect(resumed.choose('portal')).toMatchObject({ quality: 'good', critical: false });
  });

  it('are per task: the next task starts without hints', () => {
    const other = task('other', { pillar: 'save', concept: 'pay_yourself_first' });
    const content = pack({ tasks: [scam, other], events: [] });
    for (let seed = 1; seed < 40; seed++) {
      const g = createGame(content, fixtureProfile, seed);
      if (!isTask('scam')(advanceTo(g, (s) => s.kind === 'task'))) continue;
      g.choose('pay');
      g.next();
      g.choose('pay');
      expect(g.next()).toMatchObject({ hintsOn: true });
      g.choose('portal');
      expect(advanceTo(g, isTask('other'))).toMatchObject({ hintsOn: false });
      return;
    }
    throw new Error('scam never came first in 40 seeds');
  });

  it('also apply inside a detour: a critical detour choice restarts the detour, then it rejoins', () => {
    const g = createGame(pack({ tasks: [spend, fix], events: [] }), fixtureProfile, 3);
    advanceTo(g, isTask('spend'));
    const startBars = { ...g.state.bars };
    expect(g.choose('order')).toMatchObject({ quality: 'weak', detourTaskId: 'fix' });
    expect(g.next()).toMatchObject({ task: { id: 'fix' }, isDetour: true, hintsOn: false });
    const detourBars = { ...g.state.bars };
    g.choose('borrow');
    expect(g.next()).toMatchObject({ task: { id: 'fix' }, isDetour: true, hintsOn: false });
    expect(g.state.bars).toEqual(detourBars);
    g.choose('borrow');
    expect(g.next()).toMatchObject({ task: { id: 'fix' }, isDetour: true, hintsOn: true });
    g.choose('skip');
    expect(g.state.detoursTaken).toBe(1);
    expect(g.state.restarts).toBe(2);
    expect(g.state.bars.wallet).toBe(startBars.wallet);
    const after = g.next();
    expect(after.kind === 'task' && after.task.id === 'fix').toBe(false);
  });

  it('a critical event choice re-serves the same event with bars restored', () => {
    const trap = event('trap', {
      weight: 1,
      choices: [
        choice('fall', 'critical', { effects: [{ label: 'Lost', wallet: -300 }] }),
        choice('ignore', 'good'),
      ],
    });
    for (let seed = 1; seed < 40; seed++) {
      const g = createGame(pack({ tasks: [], events: [trap] }), fixtureProfile, seed);
      const s = advanceTo(g, (x) => x.kind === 'event' || x.kind === 'stage_end');
      if (s.kind !== 'event') continue;
      const bars = { ...g.state.bars };
      expect(g.choose('fall').critical).toBe(true);
      expect(g.next()).toMatchObject({ kind: 'event', event: { id: 'trap' } });
      expect(g.state.bars).toEqual(bars);
      expect(g.state.failCounts.trap).toBe(1);
      return;
    }
    throw new Error('no event drawn in 40 seeds');
  });
});
