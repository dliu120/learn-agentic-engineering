/** @jsxImportSource preact */
import { useMemo, useState } from 'preact/hooks';
import type { QuizQuestion } from '@/content/schemas/quiz';
import { recordQuiz, markLessonComplete, passGate, lessonKey } from '@/lib/progress';

interface Props {
  questions: QuizQuestion[];
  moduleId: string;
  lessonId: string;
  isGate?: boolean;
  passThreshold?: number;
  colorHue?: number;
}

type AnswerState = Record<string, number | number[]>;

// Stable shuffle seeded by question id so render order is deterministic per build but mixed.
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (const c of seed) h = (h ^ c.charCodeAt(0)) * 16777619;
  const out = arr.map((v, i) => ({ v, k: ((h ^ (i * 2654435761)) >>> 0) / 2 ** 32 }));
  out.sort((a, b) => a.k - b.k);
  return out.map((o) => o.v);
}

function isCorrect(q: QuizQuestion, a: number | number[] | undefined): boolean {
  if (a === undefined) return false;
  if (q.type === 'mcq') return a === q.correct;
  if (q.type === 'multi') {
    const want = (q.correct as number[]) ?? [];
    const got = (a as number[]) ?? [];
    return want.length === got.length && want.every((x) => got.includes(x));
  }
  if (q.type === 'ordering') {
    const want = (q.correct as number[]) ?? [];
    const got = (a as number[]) ?? [];
    return want.length === got.length && want.every((x, i) => got[i] === x);
  }
  return false; // matching handled separately (its own state)
}

export default function Quiz({ questions, moduleId, lessonId, isGate = false, passThreshold = 0.7, colorHue = 190 }: Props) {
  const [answers, setAnswers] = useState<AnswerState>({});
  // matching: per-question map of leftIndex -> chosen rightIndex
  const [matches, setMatches] = useState<Record<string, Record<number, number>>>({});
  const [submitted, setSubmitted] = useState(false);

  const accent = `hsl(${colorHue} 70% 55%)`;

  // Precompute shuffled right-columns for matching questions.
  const matchRights = useMemo(() => {
    const m: Record<string, { label: string; origIndex: number }[]> = {};
    for (const q of questions) {
      if (q.type === 'matching' && q.pairs) {
        m[q.id] = seededShuffle(
          q.pairs.map((p, i) => ({ label: p.right, origIndex: i })),
          q.id,
        );
      }
    }
    return m;
  }, [questions]);

  const matchingCorrect = (q: QuizQuestion): boolean => {
    if (q.type !== 'matching' || !q.pairs) return false;
    const chosen = matches[q.id] ?? {};
    return q.pairs.every((_, li) => chosen[li] === li); // origIndex equality = correct pairing
  };

  const perQuestionCorrect = (q: QuizQuestion): boolean =>
    q.type === 'matching' ? matchingCorrect(q) : isCorrect(q, answers[q.id]);

  const score = useMemo(() => {
    if (!submitted) return 0;
    const right = questions.filter(perQuestionCorrect).length;
    return questions.length ? right / questions.length : 0;
  }, [submitted, answers, matches, questions]);

  const passed = score >= passThreshold;

  const allAnswered = questions.every((q) => {
    if (q.type === 'matching') {
      const chosen = matches[q.id] ?? {};
      return q.pairs?.every((_, li) => chosen[li] !== undefined);
    }
    if (q.type === 'multi' || q.type === 'ordering') return Array.isArray(answers[q.id]);
    return answers[q.id] !== undefined;
  });

  function submit() {
    setSubmitted(true);
    const right = questions.filter(perQuestionCorrect).length;
    const s = questions.length ? right / questions.length : 0;
    const key = isGate ? `${moduleId}/module-gate` : lessonKey(moduleId, lessonId);
    recordQuiz(key, s, s >= passThreshold, { answers, matches });
    if (s >= passThreshold) {
      if (isGate) passGate(moduleId);
      else markLessonComplete(moduleId, lessonId);
    }
  }

  function retry() {
    setSubmitted(false);
    setAnswers({});
    setMatches({});
  }

  const setMulti = (qid: string, idx: number) =>
    setAnswers((a) => {
      const cur = new Set((a[qid] as number[]) ?? []);
      cur.has(idx) ? cur.delete(idx) : cur.add(idx);
      return { ...a, [qid]: [...cur].sort((x, y) => x - y) };
    });

  const moveOrder = (qid: string, len: number, from: number, dir: -1 | 1) =>
    setAnswers((a) => {
      const cur = ((a[qid] as number[]) ?? Array.from({ length: len }, (_, i) => i)).slice();
      const to = from + dir;
      if (to < 0 || to >= cur.length) return a;
      [cur[from], cur[to]] = [cur[to], cur[from]];
      return { ...a, [qid]: cur };
    });

  return (
    <section class="card mt-8 p-5" aria-label={isGate ? 'Module gate quiz' : 'Lesson quiz'}>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-text">{isGate ? '★ Gate quiz' : 'Check yourself'}</h2>
        <span class="text-xs text-text-faint">
          {questions.length} question{questions.length === 1 ? '' : 's'} · pass ≥ {Math.round(passThreshold * 100)}%
        </span>
      </div>

      <ol class="mt-4 space-y-6">
        {questions.map((q, qi) => {
          const correct = submitted && perQuestionCorrect(q);
          const order = (answers[q.id] as number[]) ?? (q.options?.map((_, i) => i) ?? []);
          return (
            <li key={q.id} class="border-t border-border pt-4 first:border-0 first:pt-0">
              <p class="font-medium text-text">
                <span class="mr-2 font-mono text-text-faint">{qi + 1}.</span>
                {q.question}
              </p>

              {/* mcq */}
              {q.type === 'mcq' && (
                <div class="mt-3 space-y-2">
                  {q.options!.map((opt, oi) => (
                    <label
                      key={oi}
                      class="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2.5 hover:bg-surface-2"
                      style={submitted && oi === q.correct ? `border-color:${accent}` : undefined}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        disabled={submitted}
                        checked={answers[q.id] === oi}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        class="mt-1 accent-current"
                      />
                      <span class="text-sm text-text-muted">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* multi */}
              {q.type === 'multi' && (
                <div class="mt-3 space-y-2">
                  <p class="text-xs text-text-faint">Select all that apply.</p>
                  {q.options!.map((opt, oi) => (
                    <label key={oi} class="flex cursor-pointer items-start gap-2 rounded-md border border-border p-2.5 hover:bg-surface-2"
                      style={submitted && (q.correct as number[]).includes(oi) ? `border-color:${accent}` : undefined}>
                      <input
                        type="checkbox"
                        disabled={submitted}
                        checked={((answers[q.id] as number[]) ?? []).includes(oi)}
                        onChange={() => setMulti(q.id, oi)}
                        class="mt-1"
                      />
                      <span class="text-sm text-text-muted">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* ordering */}
              {q.type === 'ordering' && (
                <div class="mt-3 space-y-2">
                  <p class="text-xs text-text-faint">Put these in the correct order.</p>
                  {order.map((optIdx, pos) => (
                    <div key={optIdx} class="flex items-center gap-2 rounded-md border border-border p-2.5">
                      <span class="font-mono text-xs text-text-faint">{pos + 1}</span>
                      <span class="flex-1 text-sm text-text-muted">{q.options![optIdx]}</span>
                      <button class="rounded px-1.5 text-text-muted hover:text-text disabled:opacity-30" disabled={submitted || pos === 0} aria-label="Move up" onClick={() => moveOrder(q.id, q.options!.length, pos, -1)}>↑</button>
                      <button class="rounded px-1.5 text-text-muted hover:text-text disabled:opacity-30" disabled={submitted || pos === order.length - 1} aria-label="Move down" onClick={() => moveOrder(q.id, q.options!.length, pos, 1)}>↓</button>
                    </div>
                  ))}
                </div>
              )}

              {/* matching */}
              {q.type === 'matching' && q.pairs && (
                <div class="mt-3 space-y-2">
                  <p class="text-xs text-text-faint">Match each item to its pair.</p>
                  {q.pairs.map((p, li) => {
                    const chosen = matches[q.id]?.[li];
                    const ok = submitted && chosen === li;
                    return (
                      <div key={li} class="flex flex-wrap items-center gap-2 rounded-md border border-border p-2.5"
                        style={ok ? `border-color:${accent}` : submitted ? 'border-color:rgb(var(--signal-bad))' : undefined}>
                        <span class="min-w-[8rem] flex-1 text-sm text-text-muted">{p.left}</span>
                        <span class="text-text-faint">→</span>
                        <select
                          disabled={submitted}
                          value={chosen ?? ''}
                          onChange={(e) =>
                            setMatches((m) => ({ ...m, [q.id]: { ...(m[q.id] ?? {}), [li]: Number((e.target as HTMLSelectElement).value) } }))
                          }
                          class="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text"
                        >
                          <option value="" disabled>
                            choose…
                          </option>
                          {matchRights[q.id]?.map((r) => (
                            <option key={r.origIndex} value={r.origIndex}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}

              {submitted && (
                <p class="mt-3 rounded-md p-2.5 text-sm" style={`background:${correct ? 'rgb(var(--signal-good)/0.12)' : 'rgb(var(--signal-bad)/0.12)'}`}>
                  <span class="font-semibold" style={`color:${correct ? 'rgb(var(--signal-good))' : 'rgb(var(--signal-bad))'}`}>
                    {correct ? '✓ Correct. ' : '✗ Not quite. '}
                  </span>
                  <span class="text-text-muted">{q.explanation}</span>
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div class="mt-6 flex items-center gap-3">
        {!submitted ? (
          <button
            onClick={submit}
            disabled={!allAnswered}
            class="rounded-lg px-5 py-2 font-medium text-bg disabled:cursor-not-allowed disabled:opacity-40"
            style={`background:${accent}`}
          >
            Submit answers
          </button>
        ) : (
          <>
            <span class="text-sm font-semibold" style={`color:${passed ? 'rgb(var(--signal-good))' : 'rgb(var(--signal-warn))'}`}>
              {passed ? (isGate ? 'Gate passed — next module unlocked!' : 'Lesson complete!') : 'Keep going'} · {Math.round(score * 100)}%
            </span>
            <button onClick={retry} class="rounded-lg border border-border px-4 py-2 text-sm text-text hover:bg-surface-2">
              Try again
            </button>
          </>
        )}
        {!allAnswered && !submitted && <span class="text-xs text-text-faint">Answer every question to submit.</span>}
      </div>
    </section>
  );
}
