import { describe, expect, it } from 'vitest';
import type { Game, Step } from '@/shared/types';
import { autoplay, pickChoice } from '../autoplay';
import { createGame, loadGame } from '../game';
import { createRng } from '../rng';
import { fixturePack, fixtureProfile } from '../__fixtures__/pack';
import { choice, pack, profile, task } from '../__fixtures__/builders';

/** Answers steps with the 'good' policy until `stop(step)` is true; returns that step. */
function playUntil(g: Game, stop: (s: Step) => boolean, max = 300): Step {
  const rng = createRng(1);
  for (let i = 0; i < max; i++) {
    const step = g.next();
    if (stop(step)) return step;
    if (step.kind === 'task' || step.kind === 'event') {
      const item = step.kind === 'task' ? step.task : step.event;
      g.choose(pickChoice('good', item.choices, g.state.failCounts[item.id] ?? 0, rng).id);
    } else if (step.kind === 'minigame_offer') g.skipMinigame();
    else if (step.kind === 'invest') g.allocate({});
    else if (step.kind === 'quiz_after') g.answerQuiz([0, 0, 0, 0, 0]);
    else if (step.kind === 'done') throw new Error('reached done before the stop condition');
  }
  throw new Error('stop condition never met');
}

const isTask = (id: string) => (s: Step) => s.kind === 'task' && s.task.id === id;

describe('chapter loop', () => {
  it('starts with chapter_start: income in, happiness −3', () => {
    const g = createGame(fixturePack, fixtureProfile, 42);
    const s1 = g.next();
    expect(s1).toMatchObject({ kind: 'chapter_start', chapter: 1, stage: 1, incomeCoins: 5000 });
    expect(g.state.bars).toEqual({ wallet: 5000, savings: 0, happiness: 67 });
  });

  it('an answerable step repeats until answered; an informational one is acknowledged by next()', () => {
    const g = createGame(fixturePack, fixtureProfile, 42);
    expect(g.next().kind).toBe('chapter_start');
    const t1 = g.next();
    expect(t1.kind).toBe('task');
    expect(g.next()).toEqual(t1);
    expect(g.next()).toBe(t1);
  });

  it('a 30-step seeded random run never throws and moves forward', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const g = createGame(fixturePack, fixtureProfile, seed);
      autoplay(g, { policy: 'random', seed, maxSteps: 30 });
      expect(g.state.chapter).toBeGreaterThan(1);
    }
  });

  it('every policy finishes the whole game: 10 chapters → epilogue → quiz → done', () => {
    for (const policy of ['good', 'worst', 'random'] as const) {
      for (let seed = 1; seed <= 8; seed++) {
        const g = createGame(fixturePack, fixtureProfile, seed);
        const kinds: Step['kind'][] = [];
        const last = autoplay(g, { policy, seed, onStep: (s) => kinds.push(s.kind) });
        expect(last.kind).toBe('done');
        expect(kinds.filter((k) => k === 'chapter_start')).toHaveLength(10);
        expect(kinds.filter((k) => k === 'stage_end')).toHaveLength(3);
        expect(kinds.slice(-3)).toEqual(['epilogue', 'quiz_after', 'done']);
        expect(g.state.chapter).toBe(10);
      }
    }
  });

  it('stage ends skip 5, 6 and 25 years', () => {
    const g = createGame(fixturePack, fixtureProfile, 3);
    const years: number[] = [];
    autoplay(g, {
      policy: 'good',
      onStep: (s) => (s.kind === 'stage_end' ? years.push(s.yearsSkipped) : undefined),
    });
    expect(years).toEqual([5, 6, 25]);
  });
});

describe('choices and consequences', () => {
  it('critical: restores bars, re-serves the same task, counts the fail; hints after two', () => {
    const g = createGame(fixturePack, fixtureProfile, 5);
    playUntil(g, isTask('f1'));
    const start = { ...g.state.bars };
    const o = g.choose('pay');
    expect(o.critical).toBe(true);
    expect(o.after.wallet).toBeLessThan(o.before.wallet);
    expect(o.bankedConcept).toBe('spot_fake_officials');
    const again = g.next();
    expect(again).toMatchObject({ kind: 'task', task: { id: 'f1' }, hintsOn: false });
    expect(g.state.bars).toEqual(start);
    expect(g.state.failCounts.f1).toBe(1);
    g.choose('pay');
    expect(g.next()).toMatchObject({ task: { id: 'f1' }, hintsOn: true });
    expect(g.state.restarts).toBe(2);
    const fixed = g.choose('portal');
    expect(fixed.critical).toBe(false);
    expect(fixed.clearedConcept).toBe('spot_fake_officials');
    expect(g.state.learned).toContain('spot_fake_officials');
  });

  it('weak with a detour: serves the detour, then rejoins the chapter', () => {
    const g = createGame(fixturePack, fixtureProfile, 5);
    playUntil(g, isTask('b1'));
    const chapter = g.state.chapter;
    const o = g.choose('order');
    expect(o).toMatchObject({ quality: 'weak', detourTaskId: 'd1', critical: false });
    expect(g.state.mistakes).toContain('needs_vs_wants');
    expect(g.next()).toMatchObject({ kind: 'task', task: { id: 'd1' }, isDetour: true });
    g.choose('skip');
    expect(g.state.detoursTaken).toBe(1);
    const after = g.next();
    expect(after.kind === 'task' && after.task.id === 'd1').toBe(false);
    expect(g.state.chapter).toBeGreaterThanOrEqual(chapter);
  });

  it('a delayed triggerEvent comes back two chapters later, and a good answer clears it', () => {
    // weight 0: e1 can only arrive through the trigger, never as a random draw
    const content = pack({ events: fixturePack.events.map((e) => ({ ...e, weight: 0 })) });
    const g = createGame(content, fixtureProfile, 8);
    playUntil(g, isTask('s1'));
    const lentAt = g.state.chapter;
    g.choose('lend');
    const ev = playUntil(g, (s) => s.kind === 'event' && s.event.id === 'e1');
    expect(g.state.chapter).toBe(lentAt + 2);
    expect(ev.kind).toBe('event');
    expect(g.choose('no').clearedConcept).toBe('pay_yourself_first');
  });

  it('going broke is critical only when another choice would have avoided it', () => {
    const p = profile({ pocketMoneyMonthly: 5000 });
    const splurge = task('splurge', {
      choices: [
        choice('blow', 'ok', { effects: [{ label: 'x', wallet: -9000 }] }),
        choice('keep', 'good'),
      ],
    });
    const g1 = createGame(pack({ tasks: [splurge], events: [] }), p, 1);
    playUntil(g1, isTask('splurge'));
    expect(g1.choose('blow')).toMatchObject({ critical: true, quality: 'critical' });

    const forced = task('forced', {
      choices: [
        choice('a', 'good', { effects: [{ label: 'x', wallet: -9000 }] }),
        choice('b', 'weak', { effects: [{ label: 'x', wallet: -9500 }] }),
      ],
    });
    const g2 = createGame(pack({ tasks: [forced], events: [] }), p, 1);
    playUntil(g2, isTask('forced'));
    expect(g2.choose('a').critical).toBe(false);
  });

  it('choose() without a task step throws', () => {
    const g = createGame(fixturePack, fixtureProfile, 1);
    expect(() => g.choose('x')).toThrow();
    g.next(); // chapter_start
    expect(() => g.choose('x')).toThrow();
    expect(() => g.allocate({})).toThrow();
  });
});

describe('mini-games and investing', () => {
  it('a won mini-game pays 8% of monthly income and +10 happiness', () => {
    for (let seed = 1; seed < 50; seed++) {
      const g = createGame(fixturePack, fixtureProfile, seed);
      const offer = playUntil(g, (s) => s.kind === 'minigame_offer' || s.kind === 'stage_end');
      if (offer.kind !== 'minigame_offer' || offer.locked) continue;
      const before = { ...g.state.bars };
      const fired = g.playMinigame(offer.minigame.id, true);
      expect(fired).toHaveLength(1);
      expect(g.state.bars.wallet - before.wallet).toBe(400);
      expect(g.state.bars.happiness).toBe(Math.min(100, before.happiness + 10));
      return;
    }
    throw new Error('no unlocked mini-game offer in 50 seeds');
  });

  it('mini-games lock below 30 happiness or 10% of income in the wallet', () => {
    const g = createGame(fixturePack, fixtureProfile, 1);
    g.next();
    expect(g.status().minigamesLocked).toBe(false);
    g.state.bars.happiness = 29;
    expect(g.status()).toMatchObject({ minigamesLocked: true });
    g.state.bars.happiness = 80;
    g.state.bars.wallet = 499;
    expect(g.status().minigamesLocked).toBe(true);
    expect(g.status().lockReason).toBeTruthy();
  });

  it('invest step at chapter 5 when there are savings; allocation must fit; stage end grows it', () => {
    const g = createGame(fixturePack, fixtureProfile, 11);
    playUntil(g, (s) => s.kind === 'stage_end');
    g.state.bars.savings = 1000;
    expect(g.next()).toMatchObject({ kind: 'chapter_start', chapter: 5 });
    const inv = g.next();
    expect(inv).toMatchObject({ kind: 'invest', savingsCoins: 1000 });
    expect(() => g.allocate({ banyan: 2000 })).toThrow();
    g.allocate({ banyan: 600 });
    expect(g.state.bars.savings).toBe(400);
    expect(g.state.portfolio).toEqual({ banyan: 600 });
    expect(g.next().kind).toBe('task');
    const end = playUntil(g, (s) => s.kind === 'stage_end');
    expect(end.kind === 'stage_end' && end.yearlyReturns.banyan).toHaveLength(6);
    expect(g.state.portfolio.banyan).not.toBe(600);
  });
});

describe('persistence and determinism', () => {
  it('same seed + same choices → identical games', () => {
    const run = () => {
      const g = createGame(fixturePack, fixtureProfile, 77);
      autoplay(g, { policy: 'random', seed: 4 });
      return g.toJSON();
    };
    expect(run()).toEqual(run());
  });

  it('loadGame(toJSON()) continues identically to the original', () => {
    const g1 = createGame(fixturePack, fixtureProfile, 21);
    const t = playUntil(g1, (s) => s.kind === 'task' && g1.state.chapter >= 3);
    if (t.kind === 'task') g1.choose(t.task.choices[t.task.choices.length - 1].id);
    const g2 = loadGame(fixturePack, g1.toJSON());
    const r1 = createRng(5);
    const r2 = createRng(5);
    for (let i = 0; i < 25; i++) {
      const a = g1.next();
      const b = g2.next();
      expect(b).toEqual(a);
      if (a.kind === 'task' || a.kind === 'event') {
        const item = a.kind === 'task' ? a.task : a.event;
        const fails = g1.state.failCounts[item.id] ?? 0;
        expect(g2.choose(pickChoice('random', item.choices, fails, r2).id)).toEqual(
          g1.choose(pickChoice('random', item.choices, fails, r1).id),
        );
      } else if (a.kind === 'minigame_offer') {
        g1.skipMinigame();
        g2.skipMinigame();
      } else if (a.kind === 'invest') {
        g1.allocate({});
        g2.allocate({});
      }
    }
    expect(g2.toJSON()).toEqual(g1.toJSON());
  });

  it('a save taken while a step is on screen resumes on that same step', () => {
    const g = createGame(fixturePack, fixtureProfile, 9);
    const t = playUntil(g, (s) => s.kind === 'task');
    expect(loadGame(fixturePack, g.toJSON()).next()).toEqual(t);
    const end = playUntil(g, (s) => s.kind === 'stage_end');
    expect(loadGame(fixturePack, g.toJSON()).next()).toEqual(end);
  });
});

describe('end of game', () => {
  it('answerQuiz scores against the quiz, summary has learning gain and a projection', () => {
    const g = createGame(fixturePack, { ...fixtureProfile, quizBefore: 2 }, 4);
    const done = autoplay(g, { policy: 'good', quizAnswers: [0, 0, 0, 1, 0] });
    expect(done.kind).toBe('done');
    expect(g.state.quizAfter).toBe(4);
    const sum = g.summary();
    expect(sum.learningGain).toBe(2);
    expect(sum.projection?.assumptionLine).toMatch(/assumptions, not promises/);
    expect(g.report()).toMatchObject({ nickname: 'Test', persona: 'scholarship' });
  });
});
