import { describe, expect, it } from 'vitest';
import type { LifeQuestion, QuizQuestion } from '@/shared/types';
import {
  difficultyFromScore,
  draftFromLifeAnswers,
  finishProfile,
  nextPersona,
  sanitizeName,
} from '../logic/onboarding';
import {
  fillRatio,
  growSeries,
  heartsFor,
  isLow,
  splitWidths,
  timeUntilNext,
} from '../logic/display';

const lifeQs: LifeQuestion[] = [
  {
    id: 'L1',
    text: '',
    options: [
      { text: 'family', persona: 'pocket_money' },
      { text: 'scholarship', persona: 'scholarship' },
      { text: 'earn', persona: 'earner' },
    ],
  },
  {
    id: 'L2',
    text: '',
    options: [
      { text: '<100', pocketMoneyMonthly: 200 },
      { text: '300-700', pocketMoneyMonthly: 2000 },
    ],
  },
  { id: 'L3', text: '', options: [{ text: 'yes', setFlag: 'has_bank_account' }] },
  { id: 'L4', text: '', options: [{ text: 'own', setFlag: 'upi_own' }] },
];

const quiz: QuizQuestion[] = [0, 1, 2, 0, 1].map((answer, i) => ({
  id: `K${i + 1}`,
  concept: 'c',
  pillar: 'budget',
  text: '',
  options: ['a', 'b', 'c'],
  answer,
}));

describe('onboarding logic', () => {
  it('sanitizes names: strips emoji/symbols, keeps Telugu, caps at 12', () => {
    expect(sanitizeName('  Ravi 😀!! ')).toBe('Ravi');
    expect(sanitizeName('రవి')).toBe('రవి');
    expect(sanitizeName('Abcdefghijklmnop')).toBe('Abcdefghijkl');
    expect(sanitizeName('a   b')).toBe('a b');
    expect(sanitizeName('🎉')).toBe('');
  });

  it('maps quiz score to difficulty buckets (0–1 / 2–3 / 4–5)', () => {
    expect([0, 1, 2, 3, 4, 5].map(difficultyFromScore)).toEqual([
      'simple',
      'simple',
      'medium',
      'medium',
      'hard',
      'hard',
    ]);
  });

  it('builds a profile draft from life answers', () => {
    const d = draftFromLifeAnswers(
      lifeQs,
      { L1: 2, L2: 1, L3: 0, L4: 0 },
      {
        nickname: 'Ravi',
        lang: 'en',
        avatar: 'avatar_01',
      },
    );
    expect(d.persona).toBe('earner');
    expect(d.pocketMoneyMonthly).toBe(2000);
    expect(d.flags).toEqual(['has_bank_account', 'upi_own']);
  });

  it('falls back to pocket_money and a default band when unanswered', () => {
    const d = draftFromLifeAnswers(lifeQs, {}, { nickname: 'x', lang: 'en', avatar: 'a' });
    expect(d.persona).toBe('pocket_money');
    expect(d.pocketMoneyMonthly).toBeGreaterThan(0);
  });

  it('cycles personas on "Not me? Switch"', () => {
    const order = ['pocket_money', 'scholarship', 'earner'] as const;
    expect(nextPersona([...order], 'earner')).toBe('pocket_money');
    expect(nextPersona([...order], 'pocket_money')).toBe('scholarship');
  });

  it('finishes a profile with before-score and difficulty', () => {
    const d = draftFromLifeAnswers(lifeQs, { L1: 0 }, { nickname: 'n', lang: 'te', avatar: 'a' });
    const p = finishProfile(d, quiz, [0, 1, 0, 0, 0]); // K1, K2, K4 right
    expect(p.quizBefore).toBe(3);
    expect(p.difficulty).toBe('medium');
    expect(p.quizBeforeAnswers).toEqual([0, 1, 0, 0, 0]);
    expect(p.lang).toBe('te');
  });
});

describe('display maths', () => {
  it('fill ratio clamps and handles zero max', () => {
    expect(fillRatio(50, 100)).toBe(0.5);
    expect(fillRatio(-10, 100)).toBe(0);
    expect(fillRatio(500, 100)).toBe(1);
    expect(fillRatio(5, 0)).toBe(0);
    expect(isLow(30, 100)).toBe(true);
    expect(isLow(31, 100)).toBe(false);
  });

  it('hearts: one per 20 happiness, rounded up', () => {
    expect([0, 1, 20, 21, 70, 100, 140].map(heartsFor)).toEqual([0, 1, 1, 2, 4, 5, 5]);
  });

  it('grow series follows principal × (1+r)^t (CONTEXT §6.1 numbers)', () => {
    const s = growSeries(10000, 8, 30);
    expect(s).toHaveLength(31);
    expect(s[0]).toBe(10000);
    expect(s[30]).toBe(100627);
  });

  it('split widths always fill the bar exactly', () => {
    expect(splitWidths([60, 25, 15], 300)).toEqual([180, 75, 45]);
    expect(splitWidths([1, 1, 1], 100).reduce((a, b) => a + b)).toBe(100);
    expect(splitWidths([0, 0], 100)).toEqual([0, 0]);
  });

  it('times a step until the next later step or the end', () => {
    const steps = [
      { at: 0, op: 'clear' as const },
      { at: 500, op: 'clear' as const },
      { at: 500, op: 'clear' as const },
      { at: 6000, op: 'clear' as const },
    ];
    expect(timeUntilNext(steps, 1, 14000)).toBe(5500);
    expect(timeUntilNext(steps, 3, 14000)).toBe(8000);
  });
});
