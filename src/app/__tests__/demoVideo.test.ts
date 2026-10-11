import { describe, expect, it } from 'vitest';
import { loadContent } from '@/content';
import { createGame } from '@/engine';
import { fixtureProfile } from '@/engine/__fixtures__/pack';
import type { Game, Step } from '@/shared/types';
import { DEMO_VIDEO } from '../demoVideo';

/** Plays the demo build; first try takes the first choice, a restart takes the good one. */
function play(game: Game): string[] {
  const seen: string[] = [];
  for (let i = 0; i < 200; i++) {
    const step: Step = game.next();
    if (step.kind === 'done') break;
    if (step.kind === 'task' || step.kind === 'event') {
      const item = step.kind === 'task' ? step.task : step.event;
      const retry = seen.at(-1) === `${step.kind}:${item.id}`;
      seen.push(`${step.kind}:${item.id}`);
      const choice = retry ? item.choices.find((c) => c.quality === 'good') : item.choices[0];
      game.choose((choice ?? item.choices[0]).id);
    } else if (step.kind === 'minigame_offer') {
      seen.push(`minigame:${step.minigame.id}`);
      game.playMinigame(step.minigame.id, true);
    } else if (step.kind === 'stage_end') {
      seen.push(`stage_end:${step.yearsSkipped}`);
    } else if (step.kind === 'invest') {
      seen.push('invest');
      game.allocate({});
    } else if (step.kind === 'quiz_after') {
      game.answerQuiz([0, 0, 0, 0, 0]);
    } else if (step.kind === 'epilogue') {
      seen.push('epilogue');
    }
  }
  return seen;
}

describe('demo-video build (?video)', () => {
  const content = loadContent();

  it('serves exactly the script, in order, with the stage jumps between', () => {
    const game = createGame(content, fixtureProfile, 97, { demoScript: DEMO_VIDEO });
    // first choice everywhere, whatever its quality: weak picks must not add detours, and a
    // critical pick replays the same task (the restart rule) before moving on
    expect(play(game)).toEqual([
      'task:budget_simple_s1_01',
      'task:safety_medium_s1_01',
      'task:safety_medium_s1_01',
      'minigame:kirana_rush',
      'task:save_hard_s1_02',
      'stage_end:5',
      'task:budget_medium_s2_01',
      'event:emi_pressure',
      'task:invest_simple_s2_01',
      'stage_end:6',
      'task:safety_hard_s3_01',
      'task:safety_hard_s3_01',
      'stage_end:25',
      'epilogue',
    ]);
  });

  it('every scripted id exists in the content pack', () => {
    const tasks = new Set(content.tasks.map((t) => t.id));
    const events = new Set(content.events.map((e) => e.id));
    const games = new Set<string>(content.minigames.map((m) => m.id));
    for (const b of DEMO_VIDEO) {
      if (b.main) expect(tasks.has(b.main), b.main).toBe(true);
      if (b.event) expect(events.has(b.event), b.event).toBe(true);
      if (b.minigame) expect(games.has(b.minigame), b.minigame).toBe(true);
    }
  });

  it('leaves normal games alone', () => {
    const game = createGame(content, fixtureProfile, 97);
    expect(game.state.demoScript).toBeUndefined();
  });
});
