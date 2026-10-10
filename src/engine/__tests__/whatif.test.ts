import { describe, expect, it } from 'vitest';
import type { Game } from '@/shared/types';
import { autoplay } from '../autoplay';
import { createGame, EngineGame } from '../game';
import { replay } from '../whatif';
import { fixturePack, fixtureProfile } from '../__fixtures__/pack';
import { pack } from '../__fixtures__/builders';

const make = (c: typeof fixturePack, st: Game['state']) => new EngineGame(c, st);

describe('what-if replay', () => {
  it('replaying the log without a swap reproduces the real game exactly', () => {
    for (const policy of ['good', 'random', 'worst'] as const) {
      for (let seed = 1; seed <= 8; seed++) {
        const g = createGame(fixturePack, fixtureProfile, seed);
        autoplay(g, { policy, seed });
        const again = replay(fixturePack, g.state, make);
        expect(again.bars).toEqual(g.state.bars);
        expect(again.portfolio).toEqual(g.state.portfolio);
        expect(again.log).toEqual(g.state.log);
      }
    }
  });

  it('is deterministic across calls', () => {
    const g = createGame(fixturePack, fixtureProfile, 12);
    autoplay(g, { policy: 'random', seed: 3 });
    const a = g.whatIf();
    expect(a).not.toBeNull();
    expect(g.whatIf()).toEqual(a);
  });

  it('swapping a pure-loss mistake ends with at least as much in the wallet', () => {
    // No events or mini-games: the only difference between the runs is the swapped choice.
    const content = pack({ events: [], minigames: [] });
    const g = createGame(content, fixtureProfile, 6);
    let step = g.next();
    for (let i = 0; i < 300 && step.kind !== 'done'; i++) {
      if (step.kind === 'task') {
        const id = step.task.id === 'b1' ? 'order' : step.task.id === 'd1' ? 'skip' : undefined;
        const good = step.task.choices.find((c) => c.quality === 'good') ?? step.task.choices[0];
        g.choose(id ?? good.id);
      } else if (step.kind === 'invest') g.allocate({});
      else if (step.kind === 'quiz_after') g.answerQuiz([0, 0, 0, 0, 0]);
      step = g.next();
    }
    const w = g.whatIf();
    expect(w?.entry.taskId).toBe('b1');
    expect(w?.actualChoice.id).toBe('order');
    expect(w?.altChoice.id).toBe('snack');
    expect(w!.altEnd.wallet).toBeGreaterThan(w!.actualEnd.wallet);
  });

  it('returns null when there was no mistake', () => {
    const g = createGame(fixturePack, fixtureProfile, 2);
    autoplay(g, { policy: 'good' });
    expect(g.whatIf()).toBeNull();
  });
});
