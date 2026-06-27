/**
 * localStorage-backed progress store (browser-only at call time; safe to import on the server
 * because no browser API is touched at module top-level).
 *
 * Keys:
 *   lesson key  = `${moduleId}/${lessonId}`
 *   quiz key    = lesson key (lesson quiz) or `${moduleId}/module-gate`
 *   gate key    = moduleId
 */
import { MODULE_ORDER } from '@/content/modules';

export const STORAGE_KEY = 'allm:progress:v1';

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
  modules: { id: string; lessonKeys: string[] }[];
}

const empty = (): ProgressState => ({ version: 1, lessons: {}, quizzes: {}, gates: {}, streak: { count: 0 } });

const hasStorage = () => typeof localStorage !== 'undefined';

function read(): ProgressState {
  if (!hasStorage()) return empty();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}

function write(s: ProgressState): void {
  if (!hasStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  emit();
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

export function isModuleUnlocked(moduleId: string): boolean {
  const idx = MODULE_ORDER.indexOf(moduleId as never);
  if (idx <= 0) return true; // first module (or unknown) always open
  return isGatePassed(MODULE_ORDER[idx - 1]);
}

export function moduleProgress(_moduleId: string, lessonKeys: string[]): number {
  if (lessonKeys.length === 0) return 0;
  const s = read();
  const done = lessonKeys.filter((k) => s.lessons[k]?.completed).length;
  return Math.round((100 * done) / lessonKeys.length);
}

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
export function importJSON(text: string): boolean {
  try {
    const p = JSON.parse(text);
    if (p && typeof p === 'object') {
      write({ ...empty(), ...p, version: 1 });
      return true;
    }
  } catch {
    /* fallthrough */
  }
  return false;
}
export const reset = (): void => write(empty());
