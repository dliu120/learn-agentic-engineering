/** @jsxImportSource preact */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { QuizQuestion } from '@/content/schemas/quiz';
import { lessonKey, markLessonComplete, passGate, recordQuiz } from '@/lib/progress';

interface Props {
  questions: QuizQuestion[];
  moduleId: string;
  lessonId: string;
  isGate?: boolean;
  passThreshold?: number;
}

type AnswerState = Record<string, number | number[]>;
type MatchState = Record<string, Record<number, number>>;

export const effectivePassThreshold = (isGate: boolean, requested: number): number =>
  isGate ? Math.max(0.8, requested) : requested;

export function seededShuffle<T>(values: T[], seed: string): T[] {
  let hash = 2166136261;
  for (const character of seed) hash = (hash ^ character.charCodeAt(0)) * 16777619;
  return values
    .map((value, index) => ({ value, rank: ((hash ^ (index * 2654435761)) >>> 0) / 2 ** 32 }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ value }) => value);
}

export function isStructuredAnswerCorrect(question: QuizQuestion, answer: number | number[] | undefined): boolean {
  if (answer === undefined) return false;
  if (question.type === 'mcq') return answer === question.correct;
  if (question.type === 'multi') {
    const expected = (question.correct as number[]) ?? [];
    const actual = (answer as number[]) ?? [];
    return expected.length === actual.length && expected.every((index) => actual.includes(index));
  }
  if (question.type === 'ordering') {
    const expected = (question.correct as number[]) ?? [];
    const actual = (answer as number[]) ?? [];
    return expected.length === actual.length && expected.every((index, position) => actual[position] === index);
  }
  return false;
}

export function createOrderingDefaults(questions: QuizQuestion[]): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  for (const question of questions) {
    if (question.type !== 'ordering' || !question.options) continue;
    const natural = question.options.map((_, index) => index);
    const shuffled = seededShuffle(natural, `${question.id}:ordering`);
    const correct = (question.correct as number[]) ?? natural;
    result[question.id] =
      shuffled.every((value, index) => value === correct[index])
        ? [...shuffled.slice(1), shuffled[0]]
        : shuffled;
  }
  return result;
}

export default function Quiz({
  questions,
  moduleId,
  lessonId,
  isGate = false,
  passThreshold = 0.7,
}: Props) {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [matches, setMatches] = useState<MatchState>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [orderAnnouncement, setOrderAnnouncement] = useState('');
  const questionRef = useRef<HTMLParagraphElement>(null);
  const resultRef = useRef<HTMLParagraphElement>(null);
  const initialQuestionRef = useRef(true);

  useEffect(() => {
    if (initialQuestionRef.current) {
      initialQuestionRef.current = false;
      return;
    }
    if (!finished) questionRef.current?.focus();
  }, [currentIndex, finished]);

  useEffect(() => {
    if (finished) resultRef.current?.focus();
  }, [finished]);

  const matchRights = useMemo(() => {
    const result: Record<string, { label: string; originalIndex: number }[]> = {};
    for (const question of questions) {
      if (question.type === 'matching' && question.pairs) {
        result[question.id] = seededShuffle(
          question.pairs.map((pair, index) => ({ label: pair.right, originalIndex: index })),
          question.id,
        );
      }
    }
    return result;
  }, [questions]);

  const orderingDefaults = useMemo(() => createOrderingDefaults(questions), [questions]);

  const matchingCorrect = (question: QuizQuestion): boolean => {
    if (question.type !== 'matching' || !question.pairs) return false;
    const selected = matches[question.id] ?? {};
    return question.pairs.every((_, leftIndex) => selected[leftIndex] === leftIndex);
  };

  const questionCorrect = (question: QuizQuestion): boolean =>
    question.type === 'matching'
      ? matchingCorrect(question)
      : isStructuredAnswerCorrect(
          question,
          question.type === 'ordering'
            ? answers[question.id] ?? orderingDefaults[question.id]
            : answers[question.id],
        );

  const questionAnswered = (question: QuizQuestion): boolean => {
    if (question.type === 'matching') {
      const selected = matches[question.id] ?? {};
      return !!question.pairs?.every((_, leftIndex) => selected[leftIndex] !== undefined);
    }
    if (question.type === 'multi') return Array.isArray(answers[question.id]) && (answers[question.id] as number[]).length > 0;
    if (question.type === 'ordering') return true;
    return answers[question.id] !== undefined;
  };

  const current = questions[currentIndex];
  const threshold = effectivePassThreshold(isGate, passThreshold);
  const currentChecked = checked[current.id] ?? false;
  const currentCorrect = currentChecked && questionCorrect(current);
  const rightCount = questions.filter(questionCorrect).length;
  const score = questions.length ? rightCount / questions.length : 0;
  const passed = score >= threshold;

  const setMulti = (questionId: string, optionIndex: number) =>
    setAnswers((currentAnswers) => {
      const selected = new Set((currentAnswers[questionId] as number[]) ?? []);
      selected.has(optionIndex) ? selected.delete(optionIndex) : selected.add(optionIndex);
      return { ...currentAnswers, [questionId]: [...selected].sort((a, b) => a - b) };
    });

  const moveOrder = (questionId: string, length: number, from: number, direction: -1 | 1) =>
    setAnswers((currentAnswers) => {
      const order = ((currentAnswers[questionId] as number[]) ?? orderingDefaults[questionId] ?? Array.from({ length }, (_, index) => index)).slice();
      const to = from + direction;
      if (to < 0 || to >= order.length) return currentAnswers;
      [order[from], order[to]] = [order[to], order[from]];
      setOrderAnnouncement(
        `${questions.find((question) => question.id === questionId)?.options?.[order[to]] ?? 'Item'} moved to position ${to + 1}.`,
      );
      return { ...currentAnswers, [questionId]: order };
    });

  const finish = () => {
    const finalScore = questions.length ? questions.filter(questionCorrect).length / questions.length : 0;
    const key = isGate ? `${moduleId}/module-gate` : lessonKey(moduleId, lessonId);
    recordQuiz(key, finalScore, finalScore >= threshold, { answers, matches });
    if (finalScore >= threshold) {
      isGate ? passGate(moduleId) : markLessonComplete(moduleId, lessonId);
    }
    setFinished(true);
  };

  const reset = () => {
    setAnswers({});
    setMatches({});
    setChecked({});
    setCurrentIndex(0);
    setFinished(false);
    setOrderAnnouncement('');
  };

  const advance = () => {
    if (currentIndex === questions.length - 1) finish();
    else setCurrentIndex((index) => index + 1);
  };

  const checkCurrent = () => {
    if (current.type === 'ordering' && !answers[current.id]) {
      setAnswers((value) => ({ ...value, [current.id]: orderingDefaults[current.id] }));
    }
    setChecked((value) => ({ ...value, [current.id]: true }));
  };

  const order =
    (answers[current.id] as number[]) ??
    orderingDefaults[current.id] ??
    (current.options?.map((_, index) => index) ?? []);
  const wrongQuestions = questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => !questionCorrect(question));

  return (
    <section class="mt-10 rounded-md bg-surface p-5 sm:p-6" aria-label={isGate ? 'Module gate quiz' : 'Lesson quiz'}>
      <header class="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p class="eyebrow">{isGate ? 'Module Gate' : 'Retrieval Practice'}</p>
          <h2 class="mt-2 text-xl font-semibold tracking-[-0.02em] text-text">
            {isGate ? 'Check the whole module' : 'Check one idea at a time'}
          </h2>
        </div>
        <span class="font-mono text-xs tabular-nums text-text-faint">
          {finished ? 'Complete' : `Question ${currentIndex + 1} of ${questions.length}`}
        </span>
      </header>

      <div class="mt-5 h-1 bg-surface-2" aria-hidden="true">
        <div
          class="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${finished ? 100 : ((currentIndex + (currentChecked ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {finished ? (
        <div class="mt-7">
          <p ref={resultRef} tabIndex={-1} class="text-2xl font-semibold tracking-[-0.03em] text-text">
            {passed ? (isGate ? 'Gate passed.' : 'Lesson complete.') : 'Review the missed ideas.'}
          </p>
          <p class="mt-2 text-sm text-text-muted">
            {rightCount} of {questions.length} correct · {Math.round(score * 100)}%
          </p>
          {wrongQuestions.length > 0 && (
            <div class="mt-5 rounded-md bg-bg p-4">
              <p class="text-sm font-medium text-text">Revisit</p>
              <ul class="mt-2 space-y-2 text-sm text-text-muted">
                {wrongQuestions.map(({ question, index }) => (
                  <li>
                    {index + 1}. {question.question}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={reset}
            class="mt-5 rounded-sm border border-border px-4 py-2 text-sm text-text hover:border-accent hover:text-accent active:translate-y-px"
          >
            Try again
          </button>
        </div>
      ) : (
        <div class="mt-7">
          <p ref={questionRef} tabIndex={-1} class="text-base font-medium leading-relaxed text-text">{current.question}</p>

          {current.type === 'mcq' && (
            <div class="mt-4 space-y-2">
              {current.options!.map((option, optionIndex) => (
                <label class="flex cursor-pointer items-start gap-3 rounded-sm border border-border p-3 hover:bg-surface">
                  <input
                    type="radio"
                    name={current.id}
                    disabled={currentChecked}
                    checked={answers[current.id] === optionIndex}
                    onChange={() => setAnswers((value) => ({ ...value, [current.id]: optionIndex }))}
                    class="mt-1 accent-current"
                  />
                  <span class="text-sm leading-relaxed text-text-muted">{option}</span>
                </label>
              ))}
            </div>
          )}

          {current.type === 'multi' && (
            <div class="mt-4 space-y-2">
              <p class="text-xs text-text-faint">Select all that apply.</p>
              {current.options!.map((option, optionIndex) => (
                <label class="flex cursor-pointer items-start gap-3 rounded-sm border border-border p-3 hover:bg-surface">
                  <input
                    type="checkbox"
                    disabled={currentChecked}
                    checked={((answers[current.id] as number[]) ?? []).includes(optionIndex)}
                    onChange={() => setMulti(current.id, optionIndex)}
                    class="mt-1"
                  />
                  <span class="text-sm leading-relaxed text-text-muted">{option}</span>
                </label>
              ))}
            </div>
          )}

          {current.type === 'ordering' && (
            <div class="mt-4 space-y-2">
              <p class="text-xs text-text-faint">Put these in the correct order.</p>
              <p class="sr-only" aria-live="polite">{orderAnnouncement}</p>
              {order.map((optionIndex, position) => (
                <div key={optionIndex} class="flex items-center gap-3 rounded-sm border border-border p-3">
                  <span class="font-mono text-xs tabular-nums text-text-faint">{position + 1}</span>
                  <span class="min-w-0 flex-1 text-sm leading-relaxed text-text-muted">
                    {current.options![optionIndex]}
                  </span>
                  <button
                    type="button"
                    class="min-h-11 min-w-11 rounded-sm border border-border text-text-muted hover:border-accent hover:text-accent disabled:opacity-30"
                    disabled={currentChecked || position === 0}
                    aria-label={`Move ${current.options![optionIndex]} from position ${position + 1} up`}
                    onClick={() => moveOrder(current.id, current.options!.length, position, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    class="min-h-11 min-w-11 rounded-sm border border-border text-text-muted hover:border-accent hover:text-accent disabled:opacity-30"
                    disabled={currentChecked || position === order.length - 1}
                    aria-label={`Move ${current.options![optionIndex]} from position ${position + 1} down`}
                    onClick={() => moveOrder(current.id, current.options!.length, position, 1)}
                  >
                    Down
                  </button>
                </div>
              ))}
            </div>
          )}

          {current.type === 'matching' && current.pairs && (
            <div class="mt-4 space-y-2">
              <p class="text-xs text-text-faint">Match each item to its pair.</p>
              {current.pairs.map((pair, leftIndex) => {
                const selected = matches[current.id]?.[leftIndex];
                return (
                  <label class="grid gap-2 rounded-sm border border-border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(11rem,0.8fr)] sm:items-center">
                    <span class="text-sm leading-relaxed text-text-muted">{pair.left}</span>
                    <select
                      disabled={currentChecked}
                      value={selected === undefined ? '__unselected__' : String(selected)}
                      aria-label={`Match for ${pair.left}`}
                      onChange={(event) => {
                        const value = (event.target as HTMLSelectElement).value;
                        if (value === '__unselected__') return;
                        setMatches((currentMatches) => ({
                          ...currentMatches,
                          [current.id]: {
                            ...(currentMatches[current.id] ?? {}),
                            [leftIndex]: Number(value),
                          },
                        }));
                      }}
                      class="rounded-sm border border-border bg-surface px-2 py-2 text-sm text-text"
                    >
                      <option value="__unselected__" disabled>
                        Choose…
                      </option>
                      {matchRights[current.id]?.map((right) => (
                        <option value={String(right.originalIndex)}>{right.label}</option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          )}

          <div aria-live="polite" aria-atomic="true" class={currentChecked ? 'mt-5' : ''}>
            {currentChecked && (
              <div
                class="border-l-2 p-4 text-sm leading-relaxed"
                style={{
                  borderColor: currentCorrect ? 'rgb(var(--signal-good))' : 'rgb(var(--signal-bad))',
                }}
              >
                <p
                  class="font-semibold"
                  style={{
                    color: currentCorrect ? 'rgb(var(--signal-good))' : 'rgb(var(--signal-bad))',
                  }}
                >
                  {currentCorrect ? 'Correct.' : 'Review this.'}
                </p>
                <p class="mt-1 text-text-muted">{current.explanation}</p>
              </div>
            )}
          </div>

          <div class="mt-6 flex flex-wrap items-center gap-3">
            {!currentChecked ? (
              <button
                type="button"
                onClick={checkCurrent}
                disabled={!questionAnswered(current)}
                class="rounded-sm bg-accent px-5 py-2.5 font-medium text-bg disabled:cursor-not-allowed disabled:opacity-40 active:translate-y-px"
              >
                Check answer
              </button>
            ) : (
              <button
                type="button"
                onClick={advance}
                class="rounded-sm bg-accent px-5 py-2.5 font-medium text-bg active:translate-y-px"
              >
                {currentIndex === questions.length - 1 ? 'Finish quiz' : 'Next question'}
              </button>
            )}
            {currentIndex > 0 && !currentChecked && (
              <button
                type="button"
                onClick={() => setCurrentIndex((index) => index - 1)}
                class="rounded-sm border border-border px-4 py-2.5 text-sm text-text hover:border-accent hover:text-accent"
              >
                Previous question
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
