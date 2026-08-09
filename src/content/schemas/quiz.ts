import { z } from 'zod';

/**
 * Quiz answer encoding (authoritative — see goal-prompt §17.3):
 *  - mcq      → options[]; correct: number          (single option index)
 *  - multi    → options[]; correct: number[]        (set of option indices)
 *  - ordering → options[]; correct: number[]        (option indices in required order)
 *  - matching → pairs[];   correct omitted          (pairs[] IS the canonical mapping;
 *                                                    the widget shuffles the right column)
 */
export const quizQuestion = z
  .object({
    id: z.string(),
    type: z.enum(['mcq', 'multi', 'ordering', 'matching']),
    question: z.string(),
    options: z.array(z.string()).optional(),
    pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional(),
    correct: z.union([z.number(), z.array(z.number())]).optional(),
    explanation: z.string(),
  })
  .superRefine((q, ctx) => {
    const needsOptions = q.type === 'mcq' || q.type === 'multi' || q.type === 'ordering';
    if (needsOptions && (!q.options || q.options.length < 2)) {
      ctx.addIssue({ code: 'custom', message: `${q.type} requires >=2 options` });
    }
    if (q.type === 'mcq' && typeof q.correct !== 'number') {
      ctx.addIssue({ code: 'custom', message: 'mcq.correct must be an option index (number)' });
    }
    if (
      q.type === 'mcq' &&
      q.options &&
      typeof q.correct === 'number' &&
      (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length)
    ) {
      ctx.addIssue({ code: 'custom', message: 'mcq.correct must reference an existing option' });
    }
    if ((q.type === 'multi' || q.type === 'ordering') && !Array.isArray(q.correct)) {
      ctx.addIssue({ code: 'custom', message: `${q.type}.correct must be number[] of option indices` });
    }
    if ((q.type === 'multi' || q.type === 'ordering') && q.options && Array.isArray(q.correct)) {
      const unique = new Set(q.correct);
      if (
        unique.size !== q.correct.length ||
        q.correct.some((index) => !Number.isInteger(index) || index < 0 || index >= q.options!.length)
      ) {
        ctx.addIssue({ code: 'custom', message: `${q.type}.correct must contain unique, in-range option indices` });
      }
      if (q.type === 'ordering' && q.correct.length !== q.options.length) {
        ctx.addIssue({ code: 'custom', message: 'ordering.correct must be a complete permutation of option indices' });
      }
      if (q.type === 'multi' && q.correct.length === 0) {
        ctx.addIssue({ code: 'custom', message: 'multi.correct must contain at least one option index' });
      }
    }
    if (q.type === 'matching' && (!q.pairs || q.pairs.length < 2)) {
      ctx.addIssue({ code: 'custom', message: 'matching requires >=2 pairs (correct is derived; omit it)' });
    }
    if (q.type === 'matching' && q.correct !== undefined) {
      ctx.addIssue({ code: 'custom', message: 'matching.correct must be omitted; pairs define the answer' });
    }
  });

export type QuizQuestion = z.infer<typeof quizQuestion>;
