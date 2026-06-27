import { describe, it, expect } from 'vitest';
import { dailyEntrySchema } from '../src/content/schemas/daily';
import { quizQuestion } from '../src/content/schemas/quiz';

describe('quiz schema encodings', () => {
  it('accepts a valid mcq (correct = number)', () => {
    expect(quizQuestion.safeParse({ id: 'a', type: 'mcq', question: 'q', options: ['x', 'y'], correct: 0, explanation: 'e' }).success).toBe(true);
  });
  it('rejects mcq with array correct', () => {
    expect(quizQuestion.safeParse({ id: 'a', type: 'mcq', question: 'q', options: ['x', 'y'], correct: [0], explanation: 'e' }).success).toBe(false);
  });
  it('accepts ordering (correct = number[])', () => {
    expect(quizQuestion.safeParse({ id: 'a', type: 'ordering', question: 'q', options: ['x', 'y', 'z'], correct: [2, 0, 1], explanation: 'e' }).success).toBe(true);
  });
  it('accepts matching with pairs and no correct', () => {
    expect(
      quizQuestion.safeParse({ id: 'a', type: 'matching', question: 'q', pairs: [{ left: 'a', right: '1' }, { left: 'b', right: '2' }], explanation: 'e' }).success,
    ).toBe(true);
  });
  it('rejects matching with < 2 pairs', () => {
    expect(quizQuestion.safeParse({ id: 'a', type: 'matching', question: 'q', pairs: [{ left: 'a', right: '1' }], explanation: 'e' }).success).toBe(false);
  });
});

describe('daily entry schema', () => {
  const base = {
    date: '2026-06-25',
    generatedAt: new Date().toISOString(),
    curationFlag: 'curated' as const,
    sourcesUsed: ['Hacker News'],
    audio: { available: false },
    lessons: [
      {
        id: 'l1',
        headline: 'h',
        sourceLinks: [{ title: 't', url: 'https://e.com/a', source: 'S' }],
        summaryBullets: ['one bullet here', 'two bullet here'],
        whyItMatters: 'because',
        module: 'rag-retrieval',
        secondaryModules: [],
        moduleRationale: 'r',
        tags: ['rag'],
        meta: { difficulty: 'intermediate', readingTimeMin: 2 },
      },
    ],
  };

  it('accepts a valid curated entry (microQuiz optional)', () => {
    expect(dailyEntrySchema.safeParse(base).success).toBe(true);
  });
  it('allows a site-root-relative url (quiet-day cards)', () => {
    const e = structuredClone(base);
    e.lessons[0].sourceLinks[0].url = '/modules';
    expect(dailyEntrySchema.safeParse(e).success).toBe(true);
  });
  it('rejects a bad date', () => {
    const e = structuredClone(base);
    (e as { date: string }).date = '06-25-2026';
    expect(dailyEntrySchema.safeParse(e).success).toBe(false);
  });
});
