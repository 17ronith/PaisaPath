// `npm run sim` — plays a seeded game with a policy and prints bars per chapter.
// Saharsh extends this; output goes into M2/final reports as an experiment.
import { createGame } from '../index';
import { fixturePack, fixtureProfile } from '../__fixtures__/pack';
import type { Choice, Step } from '@/shared/types';

const policy = (process.argv[2] ?? 'good') as 'good' | 'worst' | 'random';
const order: Record<string, number> = { good: 0, ok: 1, weak: 2, critical: 3 };
const pick = (choices: Choice[], rnd: () => number): Choice => {
  if (policy === 'random') return choices[Math.floor(rnd() * choices.length)];
  const sorted = [...choices].sort((a, b) => order[a.quality] - order[b.quality]);
  return policy === 'good' ? sorted[0] : sorted[sorted.length - 1];
};

let x = 12345;
const rnd = () => (x = (x * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const g = createGame(fixturePack, fixtureProfile, 1);
console.log(`policy=${policy}`);
for (let i = 0; i < 60; i++) {
  const step: Step = g.next();
  if (step.kind === 'done') break;
  if (step.kind === 'task' || step.kind === 'event') {
    const choices = step.kind === 'task' ? step.task.choices : step.event.choices;
    const c = pick(choices, rnd);
    const o = g.choose(c.id);
    console.log(
      `ch${g.state.chapter.toString().padStart(2)} ${step.kind.padEnd(5)} ${c.id.padEnd(8)} ${c.quality.padEnd(8)} wallet=${o.after.wallet} happy=${o.after.happiness}${o.critical ? ' RESTART' : ''}`,
    );
  } else if (step.kind === 'minigame_offer') g.skipMinigame();
  else if (step.kind === 'invest') g.allocate({});
  else if (step.kind === 'quiz_after') g.answerQuiz([0, 0, 0, 0, 0]);
  else console.log(`ch${g.state.chapter.toString().padStart(2)} ${step.kind}`);
}
console.log(JSON.stringify(g.summary().perPillar));
