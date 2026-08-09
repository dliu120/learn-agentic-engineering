/**
 * localStorage-backed progress store (browser-only at call time; safe to import on the server
 * because no browser API is touched at module top-level).
 *
 * Keys:
 *   lesson key  = `${moduleId}/${lessonId}`
 *   quiz key    = lesson key (lesson quiz) or `${moduleId}/module-gate`
 *   gate key    = moduleId
 */
import { storageGet, storageSet } from '@/lib/storage';

export const STORAGE_KEY = 'allm:progress:v1';
const LESSON_KEY_MIGRATIONS: Record<string, string> = {
  'foundations-prompts-to-harnesses/context-engineering':
    'conversation-context-engineering/context-engineering',
};

export interface LessonRec {
  completed: boolean;
  completedAt?: string;
}
export interface QuizRec {
  passed: boolean;
  bestScore: number; // 0..1
  attempts: number;
  lastAnswers?: unknown;
}
export interface ProgressState {
  version: 1;
  lessons: Record<string, LessonRec>;
  quizzes: Record<string, QuizRec>;
  gates: Record<string, boolean>;
  streak: { count: number; lastDay?: string };
  lastVisited?: { moduleId: string; lessonId: string };
}

export interface Manifest {
  modules: {
    id: string;
    lessonKeys: string[];
    lessons: { key: string; title: string; href: string }[];
  }[];
}

const empty = (): ProgressState => ({ version: 1, lessons: {}, quizzes: {}, gates: {}, streak: { count: 0 } });

function read(): ProgressState {
  try {
    const raw = storageGet(STORAGE_KEY);
    if (!raw) return empty();
    const state = { ...empty(), ...JSON.parse(raw) } as ProgressState;
    let changed = false;
    for (const [oldKey, newKey] of Object.entries(LESSON_KEY_MIGRATIONS)) {
      const oldLesson = state.lessons[oldKey];
      const newLesson = state.lessons[newKey];
      if (oldLesson) {
        state.lessons[newKey] = {
          completed: oldLesson.completed || newLesson?.completed || false,
          completedAt: newLesson?.completedAt ?? oldLesson.completedAt,
        };
        changed = true;
      }
      const oldQuiz = state.quizzes[oldKey];
      const newQuiz = state.quizzes[newKey];
      if (oldQuiz) {
        state.quizzes[newKey] = {
          passed: oldQuiz.passed || newQuiz?.passed || false,
          bestScore: Math.max(oldQuiz.bestScore, newQuiz?.bestScore ?? 0),
          attempts: Math.max(oldQuiz.attempts, newQuiz?.attempts ?? 0),
          lastAnswers: newQuiz?.lastAnswers ?? oldQuiz.lastAnswers,
        };
        changed = true;
      }
      if (state.lessons[oldKey]) {
        delete state.lessons[oldKey];
        changed = true;
      }
      if (state.quizzes[oldKey]) {
        delete state.quizzes[oldKey];
        changed = true;
      }
      if (state.lastVisited && lessonKey(state.lastVisited.moduleId, state.lastVisited.lessonId) === oldKey) {
        const [moduleId, lessonId] = newKey.split('/');
        state.lastVisited = { moduleId, lessonId };
        changed = true;
      }
    }
    if (changed) storageSet(STORAGE_KEY, JSON.stringify(state));
    return state;
  } catch {
    return empty();
  }
}

function write(s: ProgressState): boolean {
  if (!storageSet(STORAGE_KEY, JSON.stringify(s))) return false;
  emit();
  return true;
}

const listeners = new Set<() => void>();
export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function emit(): void {
  listeners.forEach((l) => l());
  try {
    window.dispatchEvent(new CustomEvent('allm:progress'));
  } catch {
    /* no window (SSR) */
  }
}

export const lessonKey = (moduleId: string, lessonId: string): string => `${moduleId}/${lessonId}`;

const dayStr = (offset = 0): string => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

function bumpStreak(s: ProgressState): void {
  const today = dayStr();
  if (s.streak.lastDay === today) return;
  s.streak.count = s.streak.lastDay === dayStr(-1) ? s.streak.count + 1 : 1;
  s.streak.lastDay = today;
}

// ---- reads ----
export const getState = (): ProgressState => read();
export const isLessonDone = (moduleId: string, lessonId: string): boolean =>
  !!read().lessons[lessonKey(moduleId, lessonId)]?.completed;
export const isGatePassed = (moduleId: string): boolean => !!read().gates[moduleId];

export function overall(manifest: Manifest): {
  pct: number;
  lessonsDone: number;
  quizzesPassed: number;
  streak: number;
} {
  const s = read();
  const all = manifest.modules.flatMap((m) => m.lessonKeys);
  const done = all.filter((k) => s.lessons[k]?.completed).length;
  return {
    pct: all.length ? Math.round((100 * done) / all.length) : 0,
    lessonsDone: Object.values(s.lessons).filter((l) => l.completed).length,
    quizzesPassed: Object.values(s.quizzes).filter((q) => q.passed).length,
    streak: s.streak.count,
  };
}

// ---- writes ----
export function markLessonComplete(moduleId: string, lessonId: string): void {
  const s = read();
  s.lessons[lessonKey(moduleId, lessonId)] = { completed: true, completedAt: new Date().toISOString() };
  s.lastVisited = { moduleId, lessonId };
  bumpStreak(s);
  write(s);
}

export function setLastVisited(moduleId: string, lessonId: string): void {
  const s = read();
  s.lastVisited = { moduleId, lessonId };
  write(s);
}

export function recordQuiz(key: string, score: number, passed: boolean, answers?: unknown): QuizRec {
  const s = read();
  const prev = s.quizzes[key] ?? { passed: false, bestScore: 0, attempts: 0 };
  s.quizzes[key] = {
    passed: prev.passed || passed,
    bestScore: Math.max(prev.bestScore, score),
    attempts: prev.attempts + 1,
    lastAnswers: answers,
  };
  bumpStreak(s);
  write(s);
  return s.quizzes[key];
}

export function passGate(moduleId: string): void {
  const s = read();
  s.gates[moduleId] = true;
  bumpStreak(s);
  write(s);
}

// ---- import / export / reset ----
export const exportJSON = (): string => JSON.stringify(read(), null, 2);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isProgressState = (value: unknown): value is ProgressState => {
  if (!isRecord(value) || value.version !== 1) return false;
  if (!isRecord(value.lessons) || !isRecord(value.quizzes) || !isRecord(value.gates) || !isRecord(value.streak)) return false;
  if (typeof value.streak.count !== 'number') return false;
  if (!Object.values(value.lessons).every((entry) => isRecord(entry) && typeof entry.completed === 'boolean')) return false;
  if (
    !Object.values(value.quizzes).every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.passed === 'boolean' &&
        typeof entry.bestScore === 'number' &&
        typeof entry.attempts === 'number',
    )
  ) return false;
  if (!Object.values(value.gates).every((gate) => typeof gate === 'boolean')) return false;
  if (
    value.lastVisited !== undefined &&
    (!isRecord(value.lastVisited) ||
      typeof value.lastVisited.moduleId !== 'string' ||
      typeof value.lastVisited.lessonId !== 'string')
  ) return false;
  return true;
};

export function importJSON(text: string): boolean {
  try {
    const parsed: unknown = JSON.parse(text);
    if (isProgressState(parsed)) return write(parsed);
  } catch {
    /* fallthrough */
  }
  return false;
}
export const reset = (): void => {
  write(empty());
};
