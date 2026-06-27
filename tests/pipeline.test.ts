import { describe, it, expect } from 'vitest';
import { normalize, dedupe, filterItems, rank, mapModule, quietDay, templatedLessons } from '../scripts/daily/pipeline';
import type { RawItem, SourcesConfig } from '../scripts/daily/types';

const cfg: SourcesConfig = {
  window_hours: 100000,
  candidate_cap: 10,
  per_source_cap: 8,
  min_relevance: 1,
  recency_half_life_hours: 24,
  max_lessons: 6,
  model: 'x',
  voice: 'x',
  allowlist: ['kv cache', 'rag', 'agent', 'quantization', 'prompt injection'],
  feeds: [],
};

const mk = (over: Partial<RawItem>): RawItem => ({ title: 't', url: 'https://e.com/a', source: 'S', ...over });

describe('normalize + dedupe', () => {
  it('drops short/invalid and dedupes by url', () => {
    const items = normalize([
      mk({ title: 'A real KV cache article', url: 'https://e.com/x' }),
      mk({ title: 'A real KV cache article', url: 'https://e.com/x?utm=1' }), // dupe (querystring stripped)
      mk({ title: 'short', url: 'https://e.com/y' }), // too short
      mk({ title: 'no protocol', url: 'ftp://e.com/z' }), // bad url
    ]);
    const out = dedupe(items);
    expect(out).toHaveLength(1);
    expect(out[0].url).toContain('/x');
  });
});

describe('filter', () => {
  it('keeps only items with allowlist hits', () => {
    const items = [mk({ title: 'New KV cache trick' }), mk({ title: 'Unrelated cooking blog' })];
    const out = filterItems(items, cfg);
    expect(out).toHaveLength(1);
  });
});

describe('rank', () => {
  it('returns scored items sorted desc and capped', () => {
    const items = Array.from({ length: 20 }, (_, i) => mk({ title: `agent rag item ${i}`, url: `https://e.com/${i}`, signals: { points: i } }));
    const out = rank(items, cfg, () => 1);
    expect(out.length).toBeLessThanOrEqual(cfg.candidate_cap);
    for (let i = 1; i < out.length; i++) expect(out[i - 1].score).toBeGreaterThanOrEqual(out[i].score);
  });
});

describe('mapModule', () => {
  it('maps a KV-cache item to the inference module', () => {
    expect(mapModule(mk({ title: 'vLLM KV cache + PagedAttention update' })).module).toBe('inference-internals-performance');
  });
  it('maps a prompt-injection item to the production-ops module', () => {
    expect(mapModule(mk({ title: 'A new prompt injection attack' })).module).toBe('production-ops-cost-safety-multitenancy');
  });
});

describe('schema-valid outputs', () => {
  it('quietDay validates', () => {
    const e = quietDay('2026-06-25');
    expect(e.curationFlag).toBe('quiet-day');
    expect(e.lessons.length).toBeGreaterThanOrEqual(1);
  });
  it('templatedLessons produce >=2 bullets and a valid module', () => {
    const ranked = rank([mk({ title: 'agent rag retrieval reranking', text: 'A. B sentence here that is long enough. C is another long sentence.' })], cfg, () => 1);
    const lessons = templatedLessons(ranked, cfg);
    expect(lessons[0].summaryBullets.length).toBeGreaterThanOrEqual(2);
    expect(lessons[0].sourceLinks[0].url).toMatch(/^https?:\/\//);
  });
});
