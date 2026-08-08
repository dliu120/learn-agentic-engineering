import { describe, expect, it } from 'vitest';
import { createOrderingDefaults, isStructuredAnswerCorrect } from '../src/components/islands/Quiz';
import { quizQuestion } from '../src/content/schemas/quiz';

describe('quiz interaction helpers', () => {
  it('starts ordering questions away from the correct answer', () => {
    const question = quizQuestion.parse({
      id: 'stage-order',
      type: 'ordering',
      question: 'Order the stages',
      options: ['Prompt', 'Conversation', 'Response', 'Loop', 'Graph'],
      correct: [0, 1, 2, 3, 4],
      explanation: 'Smallest to largest scope.',
    });
    const initial = createOrderingDefaults([question])[question.id];
    expect(initial).not.toEqual(question.correct);
    expect(isStructuredAnswerCorrect(question, initial)).toBe(false);
    expect(isStructuredAnswerCorrect(question, question.correct)).toBe(true);
  });
});
