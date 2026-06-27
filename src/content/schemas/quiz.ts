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
    if ((q.type === 'multi' || q.type === 'ordering') && !Array.isArray(q.correct)) {
      ctx.addIssue({ code: 'custom', message: `${q.type}.correct must be number[] of option indices` });
    }
    if (q.type === 'matching' && (!q.pairs || q.pairs.length < 2)) {
      ctx.addIssue({ code: 'custom', message: 'matching requires >=2 pairs (correct is derived; omit it)' });
    }
  });

export type QuizQuestion = z.infer<typeof quizQuestion>;
