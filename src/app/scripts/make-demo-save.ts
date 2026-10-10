// `npx tsx src/app/scripts/make-demo-save.ts` → public/demo-save.json
// A seeded GameState at the start of Stage 3 (chapter 8) with a banked mistake and a portfolio,
// so the demo can jump straight to investing → epilogue → what-if → report (README §8 step 7).
import { writeFileSync } from 'node:fs';
import { createGame } from '@/engine';
import { pickChoice } from '@/engine/autoplay';
import { createRng } from '@/engine/rng';
import { loadContent } from '@/content';
import type { Profile, Step } from '@/shared/types';

const content = loadContent();
const profile: Profile = {
  nickname: 'Ravi',
  lang: 'en',
  avatar: 'avatar_01',
  persona: 'scholarship',
  pocketMoneyMonthly: 2000,
  flags: ['has_bank_account', 'upi_shared'],
  difficulty: 'medium',
  quizBefore: 2,
  quizBeforeAnswers: [0, 0, 2, 1, 0],
  joinCode: 'HYD-097',
};
const SEED = 97;
const game = createGame(content, profile, SEED);
const rng = createRng(7);
let step: Step = game.next();
let weakUsed = 0;
for (let i = 0; i < 400; i++) {
  if (step.kind === 'chapter_start' && step.chapter >= 8) break; // stop at Stage 3 start
  if (step.kind === 'done') break;
  if (step.kind === 'task' || step.kind === 'event') {
    const item = step.kind === 'task' ? step.task : step.event;
    const retries = game.state.failCounts[item.id] ?? 0;
    // mostly good play, but bank exactly two mistakes early so the demo has a "returns in disguise" + what-if
    const weak = item.choices.find((c) => c.quality === 'weak');
    const choice =
      weakUsed < 2 && weak && step.kind === 'task' && !step.isDetour && retries === 0
        ? (weakUsed++, weak)
        : pickChoice('good', item.choices, retries, rng);
    game.choose(choice.id);
  } else if (step.kind === 'minigame_offer') {
    if (step.locked) game.skipMinigame();
    else game.playMinigame(step.minigame.id, true);
  } else if (step.kind === 'invest') {
    game.allocate({
      banyan: Math.floor(step.savingsCoins * 0.5),
      chai: Math.floor(step.savingsCoins * 0.2),
      mango: Math.floor(step.savingsCoins * 0.1),
    });
  } else if (step.kind === 'quiz_after') {
    game.answerQuiz([0, 1, 0, 2, 1]);
  }
  step = game.next();
}
const state = game.toJSON();
writeFileSync('public/demo-save.json', JSON.stringify(state));
const s = game.state;
console.log(
  `demo-save.json: chapter ${s.chapter} stage ${s.stage} · wallet ${s.bars.wallet} savings ${s.bars.savings} happy ${s.bars.happiness} · mistakes [${s.mistakes}] learned [${s.learned}] · portfolio ${JSON.stringify(s.portfolio)} · log ${s.log.length} entries`,
);
