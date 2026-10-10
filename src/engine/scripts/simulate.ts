// `npm run sim -- [--content] [--trace] [--seeds N] [policy]`
// Plays seeded games with scripted players (good / worst / random) on each difficulty and prints
// a balance table: final bars, detours, restarts, lowest happiness, chapters spent broke.
// --content uses the real JSON in src/content (read from disk; the engine never imports content),
// otherwise the engine fixture pack. --trace prints bars per chapter for seed 1.
import { readFileSync } from 'node:fs';
import type { ContentPack, Difficulty, Game } from '@/shared/types';
import { parseContentPack } from '@/shared/schema';
import { autoplay, type Policy } from '../autoplay';
import { createGame } from '../game';
import { portfolioTotal } from '../invest';
import { fixturePack, fixtureProfile } from '../__fixtures__/pack';

const args = process.argv.slice(2);
const useContent = args.includes('--content');
const trace = args.includes('--trace');
const seedsArg = args.indexOf('--seeds');
const seeds = seedsArg >= 0 ? Number(args[seedsArg + 1]) : 20;
const policyArg = args.find((a) => ['good', 'worst', 'random'].includes(a)) as Policy | undefined;
const policies: Policy[] = policyArg ? [policyArg] : ['good', 'random', 'worst'];
const difficulties: Difficulty[] = ['simple', 'medium', 'hard'];

function loadRealContent(): ContentPack {
  const dir = new URL('../../content/', import.meta.url);
  const read = (p: string) => JSON.parse(readFileSync(new URL(p, dir), 'utf8'));
  const onboarding = read('onboarding.json');
  return parseContentPack({
    version: 'sim',
    personas: read('personas.json'),
    lifeQuestions: onboarding.lifeQuestions,
    quiz: onboarding.quiz,
    concepts: read('concepts.json'),
    tasks: ['stage1', 'stage2', 'stage3', 'detours'].flatMap((f) => read(`tasks/${f}.json`)),
    events: read('events.json'),
    explainers: read('explainers.json'),
    minigames: read('minigames.json'),
    assets: read('assets.json'),
    places: read('places.json'),
  });
}

const content = useContent ? loadRealContent() : fixturePack;
const correct = content.quiz.map((q) => q.answer);
const wrong = content.quiz.map((q) => (q.answer + 1) % q.options.length);

interface Run {
  game: Game;
  minHappiness: number;
  brokeChapters: number;
  rows: string[];
}

function play(policy: Policy, difficulty: Difficulty, seed: number): Run {
  const game = createGame(content, { ...fixtureProfile, difficulty }, seed);
  const run: Run = { game, minHappiness: 100, brokeChapters: 0, rows: [] };
  autoplay(game, {
    policy,
    seed,
    quizAnswers: policy === 'good' ? correct : policy === 'worst' ? wrong : undefined,
    onStep: (step, g) => {
      const b = g.state.bars;
      run.minHappiness = Math.min(run.minHappiness, b.happiness);
      if (step.kind === 'chapter_start') {
        if (b.wallet < 0) run.brokeChapters += 1;
        run.rows.push(
          `  ch${String(step.chapter).padStart(2)} s${step.stage}  wallet ${String(b.wallet).padStart(7)}` +
            `  savings ${String(b.savings).padStart(6)}  happy ${String(b.happiness).padStart(3)}` +
            `  fired ${step.fired.map((e) => e.label).join(', ') || '-'}`,
        );
      }
    },
  });
  return run;
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const fmt = (n: number) => (Math.round(n * 10) / 10).toString().padStart(8);

console.log(
  `content=${useContent ? 'src/content' : 'fixture'} · ${content.tasks.length} tasks · ` +
    `${content.events.length} events · ${seeds} seeds per row`,
);
console.log(
  'policy  difficulty   wallet  savings    happy  minHappy  portfolio  detours restarts  broke  literate%  done%',
);
for (const policy of policies) {
  for (const difficulty of difficulties) {
    const runs = Array.from({ length: seeds }, (_, i) => play(policy, difficulty, i + 1));
    const sums = runs.map((r) => r.game.summary());
    console.log(
      `${policy.padEnd(7)} ${difficulty.padEnd(10)}` +
        fmt(avg(sums.map((s) => s.finalBars.wallet))) +
        fmt(avg(sums.map((s) => s.finalBars.savings))) +
        fmt(avg(sums.map((s) => s.finalBars.happiness))) +
        fmt(avg(runs.map((r) => r.minHappiness))) +
        '  ' +
        fmt(avg(runs.map((r) => portfolioTotal(r.game.state.portfolio)))) +
        fmt(avg(sums.map((s) => s.detoursTaken))) +
        fmt(avg(sums.map((s) => s.restarts))) +
        fmt(avg(runs.map((r) => r.brokeChapters))) +
        fmt(100 * avg(sums.map((s) => (s.ncfe.literate ? 1 : 0)))) +
        fmt(100 * avg(runs.map((r) => (r.game.state.phase === 'done' ? 1 : 0)))),
    );
    if (trace) console.log(play(policy, difficulty, 1).rows.join('\n'));
  }
}
