import { describe, expect, it } from 'vitest';
import type { LogEntry, NcfeItem } from '@/shared/types';
import { attitudeBand, NCFE_BEHAVIOUR, NCFE_KNOWLEDGE, quizEvidence, summarize } from '../scoring';
import { choice, pack, state, task } from '../__fixtures__/builders';

const ITEMS: NcfeItem[] = [...NCFE_KNOWLEDGE, ...NCFE_BEHAVIOUR];

/** One task per NCFE item: 'good' shows it (+ plans ahead), 'bad' doesn't (+ spends now). */
const content = pack({
  tasks: ITEMS.map((item, i) =>
    task(`t${i}`, {
      pillar: (['budget', 'save', 'invest', 'safety'] as const)[i % 4],
      choices: [
        choice('good', 'good', { ncfe: [{ item, value: 1 }], attitude: 'later', scam: 'spotted' }),
        choice('bad', 'weak', { ncfe: [{ item, value: 0 }], attitude: 'now', scam: 'fell' }),
      ],
    }),
  ),
});

const entry = (taskId: string, choiceId: string, extra: Partial<LogEntry> = {}): LogEntry => ({
  chapter: 1,
  taskId,
  choiceId,
  quality: choiceId === 'good' ? 'good' : 'weak',
  before: { wallet: 1000, savings: 0, happiness: 70 },
  after: { wallet: 1000, savings: 0, happiness: 70 },
  isDetour: false,
  isEvent: false,
  ...extra,
});

function scoreWith(pick: (i: number) => 'good' | 'bad') {
  const s = state();
  s.log = ITEMS.map((_, i) => entry(`t${i}`, pick(i)));
  return summarize(s, content, null);
}

describe('NCFE-aligned score', () => {
  it('all good choices → 8/8, 9/9, attitude 5, literate', () => {
    const { ncfe, perPillar, safety } = scoreWith(() => 'good');
    expect(ncfe).toMatchObject({ knowledge: 8, behaviour: 9, attitude: 5, literate: true });
    expect(perPillar.budget.good).toBe(perPillar.budget.total);
    expect(safety).toEqual({ spotted: 17, faced: 17 });
  });

  it('all bad choices → 0, 0, attitude 1, not literate', () => {
    const { ncfe, safety } = scoreWith(() => 'bad');
    expect(ncfe).toMatchObject({ knowledge: 0, behaviour: 0, attitude: 1, literate: false });
    expect(ncfe.items.division).toBe(0);
    expect(safety.spotted).toBe(0);
  });

  it('item = 1 when the mean of its evidence is ≥ 0.5; null without evidence', () => {
    const s = state();
    s.log = [entry('t0', 'good'), entry('t0', 'bad'), entry('t1', 'bad')];
    const { items } = summarize(s, content, null).ncfe;
    expect(items.division).toBe(1); // mean 0.5
    expect(items.time_value).toBe(0);
    expect(items.inflation).toBeNull();
  });

  it('after-quiz answers are knowledge evidence for the items their concept tests', () => {
    const quizContent = pack({
      ...content,
      concepts: [
        ...content.concepts,
        {
          id: 'cost_of_borrowing',
          pillar: 'budget',
          name: 'Cost of borrowing',
          explainerId: 'exp_a',
          // the behaviour tag must be ignored for a quiz
          ncfe: ['loan_interest', 'simple_interest', 'considers_affordability'],
        },
      ],
      quiz: [
        {
          id: 'K1',
          concept: 'cost_of_borrowing',
          pillar: 'budget',
          text: 'q',
          options: ['a', 'b'],
          answer: 0,
        },
        {
          id: 'K2',
          concept: 'inflation',
          pillar: 'invest',
          text: 'q',
          options: ['a', 'b'],
          answer: 1,
        },
      ],
    });
    const s = state();
    expect(summarize(s, quizContent, null).ncfe.items.loan_interest).toBeNull(); // mid-game
    s.quizAfterAnswers = [0, 0]; // K1 right, K2 wrong
    const { items } = summarize(s, quizContent, null).ncfe;
    expect(items).toMatchObject({ loan_interest: 1, simple_interest: 1, inflation: 0 });
    expect(items.considers_affordability).toBeNull();
    expect(quizEvidence(quizContent, undefined)).toEqual([]);
  });

  it('quiz evidence pools with gameplay evidence under the ≥ 0.5 mean rule', () => {
    const quizContent = pack({
      ...content,
      quiz: [
        {
          id: 'K1',
          concept: 'division',
          pillar: 'budget',
          text: 'q',
          options: ['a', 'b'],
          answer: 0,
        },
      ],
    });
    const s = state();
    s.log = [entry('t0', 'good')]; // t0 evidences division = 1
    s.quizAfterAnswers = [1]; // wrong → 0; mean 0.5 → still 1
    expect(summarize(s, quizContent, null).ncfe.items.division).toBe(1);
    s.log = [entry('t0', 'bad')];
    expect(summarize(s, quizContent, null).ncfe.items.division).toBe(0);
  });

  it('attitude bands at 19 / 20 / 39 / 40 / 80 %', () => {
    expect([0.19, 0.2, 0.39, 0.4, 0.59, 0.6, 0.79, 0.8].map(attitudeBand)).toEqual([
      1, 2, 2, 3, 3, 4, 4, 5,
    ]);
  });
});

describe('summary', () => {
  it('biggest mistake = weak/critical entry with max coins lost + 20 × happiness lost', () => {
    const s = state();
    const bars = (wallet: number, happiness: number) => ({ wallet, savings: 0, happiness });
    s.log = [
      entry('t0', 'bad', { before: bars(1000, 70), after: bars(500, 70) }), // 500
      entry('t1', 'bad', { before: bars(1000, 70), after: bars(900, 40) }), // 100 + 600
      entry('t2', 'good', { before: bars(1000, 70), after: bars(0, 0) }), // not a mistake
    ];
    expect(summarize(s, content, null).biggestMistake?.taskId).toBe('t1');
    s.log = [entry('t2', 'good')];
    expect(summarize(s, content, null).biggestMistake).toBeNull();
  });

  it('learning gain is null until the after-quiz is answered', () => {
    const s = state({ quizBefore: 2 });
    expect(summarize(s, content, null).learningGain).toBeNull();
    s.quizAfter = 4;
    expect(summarize(s, content, null)).toMatchObject({ quizAfter: 4, learningGain: 2 });
  });
});
