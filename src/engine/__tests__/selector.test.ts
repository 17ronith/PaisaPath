import { describe, expect, it } from 'vitest';
import type { Pillar } from '@/shared/types';
import { createGame } from '../game';
import { autoplay } from '../autoplay';
import { queueEvent } from '../records';
import { createRng, type Rng } from '../rng';
import { framingFor, investUnlocked, pickEvent, pickMainTask } from '../selector';
import { fixturePack, fixtureProfile } from '../__fixtures__/pack';
import { event, framing, pack, state, task } from '../__fixtures__/builders';

/** An Rng that always returns `v` (for forcing the 50% branches). */
const fixed = (v: number): Rng => ({
  next: () => v,
  int: (n) => Math.floor(v * n),
  pick: (xs) => xs[Math.floor(v * xs.length)],
  state: 1,
});

describe('task selector', () => {
  it('stage 1 chapters 1–4 hit all 4 pillars once (always-good, 20 seeds)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = createGame(fixturePack, fixtureProfile, seed);
      const pillars: Pillar[] = [];
      autoplay(g, {
        policy: 'good',
        onStep: (step, game) => {
          if (step.kind === 'task' && !step.isDetour && game.state.chapter <= 4) {
            pillars.push(step.task.pillar);
          }
        },
      });
      expect(new Set(pillars).size).toBe(4);
      expect(pillars).toHaveLength(4);
    }
  });

  it('investing is never served before one budget, save and safety task', () => {
    for (const policy of ['good', 'worst', 'random'] as const) {
      for (let seed = 1; seed <= 15; seed++) {
        const g = createGame(fixturePack, fixtureProfile, seed);
        autoplay(g, {
          policy,
          seed,
          onStep: (step, game) => {
            if (step.kind === 'task' && step.task.pillar === 'invest' && !step.isDetour) {
              expect(investUnlocked(game.state, fixturePack)).toBe(true);
            }
          },
        });
      }
    }
  });

  it('a banked concept returns in disguise when a matching unseen task exists', () => {
    const content = pack({
      tasks: [...fixturePack.tasks, task('b1_hard', { difficulty: 'hard' })],
    });
    const s = state();
    s.seenTasks = ['b1'];
    s.mistakes = ['needs_vs_wants'];
    s.log = [
      {
        chapter: 1,
        taskId: 'b1',
        choiceId: 'order',
        quality: 'weak',
        before: s.bars,
        after: s.bars,
        isDetour: false,
        isEvent: false,
      },
    ];
    s.chapter = 2;
    expect(pickMainTask(s, content, fixed(0.1))).toEqual({
      task: content.tasks.find((t) => t.id === 'b1_hard'),
      returning: true,
    });
    const other = pickMainTask(s, content, fixed(0.9));
    expect(other?.returning).toBe(false);
    expect(other?.task.pillar).not.toBe('budget'); // rotation: budget already done this stage
  });

  it('falls back to any difficulty when the bucket is empty', () => {
    const s = state({ difficulty: 'hard' }); // fixture tasks are all 'medium'
    const pick = pickMainTask(s, fixturePack, createRng(1));
    expect(pick?.task.difficulty).toBe('medium');
  });

  it('prefers the player difficulty when the pillar has it', () => {
    const content = pack({
      tasks: [task('easy', { difficulty: 'simple' }), task('hard', { difficulty: 'hard' })],
    });
    for (let seed = 1; seed <= 10; seed++) {
      expect(pickMainTask(state({ difficulty: 'hard' }), content, createRng(seed))?.task.id).toBe(
        'hard',
      );
    }
  });

  it('respects requiresFlags / excludesFlags and skips detours', () => {
    const content = pack({
      tasks: [
        task('needs_upi', { requiresFlags: ['upi_own'] }),
        task('no_bank', { excludesFlags: ['has_bank_account'] }),
        task('detour', { isDetour: true }),
        task('plain'),
      ],
    });
    const s = state({ flags: ['has_bank_account'] });
    expect(pickMainTask(s, content, createRng(3))?.task.id).toBe('plain');
  });

  it('framing falls back to default for a persona without its own', () => {
    const t = task('x', {
      framings: { default: framing('DEFAULT'), earner: framing('EARNER') },
    });
    expect(framingFor(t, 'earner').title).toBe('EARNER');
    expect(framingFor(t, 'scholarship').title).toBe('DEFAULT');
  });
});

describe('event selector', () => {
  it('a pending triggered event always wins', () => {
    const s = state();
    queueEvent(s, 'e1');
    expect(pickEvent(s, fixturePack, fixed(0.99))?.id).toBe('e1');
  });

  it('no pending event: 50% roll', () => {
    expect(pickEvent(state(), fixturePack, fixed(0.6))).toBeNull();
    expect(pickEvent(state(), fixturePack, fixed(0.1))?.id).toBe('e1');
  });

  it('banked concept weighs ×3', () => {
    const content = pack({
      events: [event('banked', { concept: 'needs_vs_wants' }), event('other')],
    });
    const s = state();
    s.mistakes = ['needs_vs_wants'];
    const rng = createRng(99);
    let banked = 0;
    let total = 0;
    for (let i = 0; i < 4000; i++) {
      const ev = pickEvent(s, content, rng);
      if (!ev) continue;
      total += 1;
      if (ev.id === 'banked') banked += 1;
    }
    expect(banked / total).toBeGreaterThan(0.7);
    expect(banked / total).toBeLessThan(0.8);
  });
});
