import { describe, expect, it } from 'vitest';
import { createOrderingDefaults, effectivePassThreshold, isStructuredAnswerCorrect } from '../src/components/islands/Quiz';
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

  it('starts away from a non-natural correct permutation', () => {
    const question = quizQuestion.parse({
      id: 'non-natural-order',
      type: 'ordering',
      question: 'Order the stages',
      options: ['A', 'B', 'C', 'D', 'E'],
      correct: [1, 3, 2, 0, 4],
      explanation: 'A custom order.',
    });
    expect(createOrderingDefaults([question])[question.id]).not.toEqual(question.correct);
  });

  it('requires at least 80% for module gates', () => {
    expect(effectivePassThreshold(false, 0.7)).toBe(0.7);
    expect(effectivePassThreshold(true, 0.7)).toBe(0.8);
    expect(3 / 4 >= effectivePassThreshold(true, 0.7)).toBe(false);
  });
});
