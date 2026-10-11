// ISSUES #34: the before- and after-quiz test the same five concepts, but the after-quiz asks
// them a different way (new situation, new format), so the learning gain isn't just memory.
// Every consumer (engine scoring, the Quiz scene, scripts) picks the after set through here.
import type { ContentPack, QuizQuestion } from './types';

/** The questions the after-quiz asks: `quizAfter` when it has all five, else `quiz`. */
export function afterQuiz(content: Pick<ContentPack, 'quiz' | 'quizAfter'>): QuizQuestion[] {
  return content.quizAfter && content.quizAfter.length === content.quiz.length
    ? content.quizAfter
    : content.quiz;
}
