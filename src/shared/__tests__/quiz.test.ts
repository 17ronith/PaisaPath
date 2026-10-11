import { describe, expect, it } from 'vitest';
import { loadContent } from '@/content';
import { afterQuiz } from '../quiz';

describe('after-quiz (ISSUES #34)', () => {
  const pack = loadContent();
  const after = afterQuiz(pack);

  it('asks five different questions than the before-quiz', () => {
    expect(after).toHaveLength(5);
    after.forEach((q, i) => expect(q.text).not.toBe(pack.quiz[i].text));
  });

  it('tests the same concept, in the same order, as the before-quiz', () => {
    expect(after.map((q) => q.concept)).toEqual(pack.quiz.map((q) => q.concept));
  });

  it('has a valid answer for every question', () => {
    after.forEach((q) => expect(q.options[q.answer]).toBeTruthy());
  });

  it('falls back to the before-quiz when no after set is given', () => {
    expect(afterQuiz({ quiz: pack.quiz })).toBe(pack.quiz);
  });
});
