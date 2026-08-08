import { beforeEach, describe, expect, it } from 'vitest';
import {
  CURRICULUM_TRACKS,
  MODULES,
  MODULES_BY_TRACK,
  TOTAL_TOPIC_COUNT,
} from '../src/content/modules';
import { MODULE_IDS } from '../src/content/schemas/module-ids';
import { buildManifest } from '../src/lib/manifest';
import { getState, isModuleUnlocked, STORAGE_KEY } from '../src/lib/progress';

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

  it('requires every prerequisite gate before unlocking a module', () => {
    expect(isModuleUnlocked('foundations-prompts-to-harnesses')).toBe(true);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        lessons: {},
        quizzes: {},
        gates: { 'graph-workflow-engineering': true },
        streak: { count: 0 },
      }),
    );
    expect(isModuleUnlocked('capstone-strategy-tradeoffs-failure-modes')).toBe(false);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        lessons: {},
        quizzes: {},
        gates: {
          'graph-workflow-engineering': true,
          'eval-observability': true,
        },
        streak: { count: 0 },
      }),
    );
    expect(isModuleUnlocked('capstone-strategy-tradeoffs-failure-modes')).toBe(true);
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
