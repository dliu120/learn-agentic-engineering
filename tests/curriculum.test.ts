import { describe, expect, it } from 'vitest';
import {
  CURRICULUM_TRACKS,
  MODULES,
  MODULES_BY_TRACK,
  TOTAL_TOPIC_COUNT,
} from '../src/content/modules';
import { MODULE_IDS } from '../src/content/schemas/module-ids';

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
});
