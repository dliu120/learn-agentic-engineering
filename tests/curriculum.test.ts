import { beforeEach, describe, expect, it } from 'vitest';
import {
  CURRICULUM_TRACKS,
  MODULES,
  MODULES_BY_TRACK,
  TOTAL_TOPIC_COUNT,
} from '../src/content/modules';
import { MODULE_IDS } from '../src/content/schemas/module-ids';
import { buildManifest } from '../src/lib/manifest';
import {
  getState,
  importJSON,
  markLessonComplete,
  reset,
  setLastVisited,
  STORAGE_KEY,
} from '../src/lib/progress';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new MemoryStorage(),
  });
  reset();
});

describe('curriculum model', () => {
  it('keeps module IDs and metadata in one-to-one correspondence', () => {
    expect(MODULES.map((module) => module.id).sort()).toEqual([...MODULE_IDS].sort());
    expect(new Set(MODULES.map((module) => module.id)).size).toBe(MODULES.length);
  });

  it('groups every module into exactly one track', () => {
    const grouped = CURRICULUM_TRACKS.flatMap((track) => MODULES_BY_TRACK[track.id]);
    expect(grouped).toHaveLength(MODULES.length);
    expect(new Set(grouped.map((module) => module.id)).size).toBe(MODULES.length);
  });

  it('keeps exact ordered membership for every curriculum track', () => {
    expect(MODULES_BY_TRACK.fundamentals.map((module) => module.id)).toEqual([
      'agent-engineering-fundamentals',
    ]);
    expect(MODULES_BY_TRACK['core-stages'].map((module) => module.id)).toEqual([
      'foundations-prompts-to-harnesses',
      'conversation-context-engineering',
      'reliable-structured-output-tool-calling',
      'agent-control-routing-degradation',
      'graph-workflow-engineering',
    ]);
    expect(MODULES_BY_TRACK['agent-capabilities'].map((module) => module.id)).toEqual([
      'tools-skills-plugins-mcp',
      'state-memory-durable-workflows',
      'spec-driven-agent-engineering',
    ]);
    expect(MODULES_BY_TRACK['production-deep-dives'].map((module) => module.id)).toEqual([
      'inference-internals-performance',
      'model-efficiency-compression',
      'rag-retrieval',
      'eval-observability',
      'production-ops-cost-safety-multitenancy',
      'capstone-strategy-tradeoffs-failure-modes',
    ]);
  });

  it('defines a five-stage prerequisite chain for the core path', () => {
    const core = MODULES_BY_TRACK['core-stages'];
    expect(core[0].prerequisites).toContain('agent-engineering-fundamentals');
    expect(core.map((module) => module.name)).toEqual([
      'Prompt Engineering',
      'Conversation Engineering',
      'Response Engineering',
      'Loop Engineering',
      'Graph Engineering',
    ]);
    core.slice(1).forEach((module, index) => {
      expect(module.prerequisites).toContain(core[index].id);
    });
  });

  it('covers the declared topic range in module metadata', () => {
    const topics = new Set(MODULES.flatMap((module) => module.topicNumbers));
    expect(Array.from({ length: TOTAL_TOPIC_COUNT }, (_, index) => index + 1).every((topic) => topics.has(topic))).toBe(true);
  });

  it('migrates moved lesson progress and last-visited state', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        lessons: {
          'foundations-prompts-to-harnesses/context-engineering': { completed: true },
        },
        quizzes: {
          'foundations-prompts-to-harnesses/context-engineering': {
            passed: true,
            bestScore: 1,
            attempts: 1,
          },
        },
        gates: {},
        streak: { count: 0 },
        lastVisited: {
          moduleId: 'foundations-prompts-to-harnesses',
          lessonId: 'context-engineering',
        },
      }),
    );
    const state = getState();
    expect(state.lessons['conversation-context-engineering/context-engineering']?.completed).toBe(true);
    expect(state.quizzes['conversation-context-engineering/context-engineering']?.passed).toBe(true);
    expect(state.lessons['foundations-prompts-to-harnesses/context-engineering']).toBeUndefined();
    expect(state.lastVisited).toEqual({
      moduleId: 'conversation-context-engineering',
      lessonId: 'context-engineering',
    });
  });

  it('merges conflicting old and new progress conservatively', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        lessons: {
          'foundations-prompts-to-harnesses/context-engineering': { completed: true, completedAt: '2026-01-01' },
          'conversation-context-engineering/context-engineering': { completed: false },
        },
        quizzes: {
          'foundations-prompts-to-harnesses/context-engineering': {
            passed: true,
            bestScore: 1,
            attempts: 2,
            lastAnswers: 'old-best',
          },
          'conversation-context-engineering/context-engineering': {
            passed: false,
            bestScore: 0.2,
            attempts: 5,
            lastAnswers: 'new-latest',
          },
        },
        gates: {},
        streak: { count: 0 },
      }),
    );
    const state = getState();
    expect(state.lessons['conversation-context-engineering/context-engineering']).toEqual({
      completed: true,
      completedAt: '2026-01-01',
    });
    expect(state.quizzes['conversation-context-engineering/context-engineering']).toEqual({
      passed: true,
      bestScore: 1,
      attempts: 5,
      lastAnswers: 'new-latest',
    });
  });

  it('returns migrated progress even when persistence is unavailable', () => {
    const raw = JSON.stringify({
      version: 1,
      lessons: {
        'foundations-prompts-to-harnesses/context-engineering': { completed: true },
      },
      quizzes: {},
      gates: {},
      streak: { count: 0 },
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        length: 1,
        clear() {},
        getItem: () => raw,
        key: () => STORAGE_KEY,
        removeItem() {},
        setItem: () => {
          throw new Error('quota exceeded');
        },
      } satisfies Storage,
    });
    expect(getState().lessons['conversation-context-engineering/context-engineering']?.completed).toBe(true);
  });

  it('does not abort navigation when progress persistence is unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        length: 0,
        clear() {},
        getItem: () => null,
        key: () => null,
        removeItem() {},
        setItem: () => {
          throw new Error('quota exceeded');
        },
      } satisfies Storage,
    });
    expect(() => setLastVisited('foundations-prompts-to-harnesses', 'prompt-context-harness')).not.toThrow();
    expect(importJSON(JSON.stringify({
      version: 1,
      lessons: {},
      quizzes: {},
      gates: {},
      streak: { count: 0 },
    }))).toBe(false);
  });

  it('keeps newer in-memory progress when readable storage cannot be updated', () => {
    const stale = JSON.stringify({
      version: 1,
      lessons: {},
      quizzes: {},
      gates: {},
      streak: { count: 0 },
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        length: 1,
        clear() {},
        getItem: () => stale,
        key: () => STORAGE_KEY,
        removeItem() {},
        setItem: () => {
          throw new Error('quota exceeded');
        },
      } satisfies Storage,
    });

    markLessonComplete('foundations-prompts-to-harnesses', 'prompt-context-harness');

    expect(getState().lessons['foundations-prompts-to-harnesses/prompt-context-harness']?.completed).toBe(true);
  });

  it('rejects malformed progress imports instead of wiping state', () => {
    expect(importJSON('{}')).toBe(false);
    expect(importJSON('{"version":1,"lessons":[],"quizzes":{},"gates":{},"streak":{"count":0}}')).toBe(false);
  });

  it('includes module gates as resume targets but not progress-counted lessons', () => {
    const manifest = buildManifest([
      {
        data: {
          moduleId: 'foundations-prompts-to-harnesses',
          lessonId: 'prompt-context-harness',
          title: 'The Engineering Scope Ladder',
          order: 1,
          isModuleGate: false,
        },
      },
      {
        data: {
          moduleId: 'foundations-prompts-to-harnesses',
          lessonId: 'module-gate',
          title: 'Gate: Prompt Engineering',
          order: 99,
          isModuleGate: true,
        },
      },
    ]);
    const module = manifest.modules.find((entry) => entry.id === 'foundations-prompts-to-harnesses');
    expect(module?.lessonKeys).toEqual(['foundations-prompts-to-harnesses/prompt-context-harness']);
    expect(module?.lessons.map((lesson) => lesson.key)).toEqual([
      'foundations-prompts-to-harnesses/prompt-context-harness',
      'foundations-prompts-to-harnesses/module-gate',
    ]);
  });
});
