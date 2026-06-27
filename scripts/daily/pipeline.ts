import { MODULES } from '../../src/content/modules';
import { dailyEntrySchema, type DailyEntry, type DailyLesson } from '../../src/content/schemas/daily';
import type { RawItem, SourcesConfig } from './types';

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

const ageHours = (iso?: string): number => {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return isNaN(t) ? 0 : (Date.now() - t) / 3600_000;
};

export function normalize(items: RawItem[]): RawItem[] {
  return items
    .map((i) => ({ ...i, title: i.title.replace(/\s+/g, ' ').trim() }))
    .filter((i) => i.title.length > 8 && /^https?:\/\//.test(i.url));
}

export function dedupe(items: RawItem[]): RawItem[] {
  const seen = new Set<string>();
  const out: RawItem[] = [];
  for (const i of items) {
    const keyUrl = i.url.replace(/[#?].*$/, '').replace(/\/$/, '');
    const keyTitle = i.title.toLowerCase().slice(0, 60);
    if (seen.has(keyUrl) || seen.has(keyTitle)) continue;
    seen.add(keyUrl);
    seen.add(keyTitle);
    out.push(i);
  }
  return out;
}

const relevanceHits = (i: RawItem, allow: string[]): string[] => {
  const hay = `${i.title} ${i.text ?? ''}`.toLowerCase();
  return allow.filter((t) => hay.includes(t.toLowerCase()));
};

export function filterItems(items: RawItem[], cfg: SourcesConfig): RawItem[] {
  return items.filter((i) => {
    if (ageHours(i.publishedAt) > cfg.window_hours) return false;
    return relevanceHits(i, cfg.allowlist).length >= cfg.min_relevance;
  });
}

export interface Ranked extends RawItem {
  score: number;
  hits: string[];
}

export function rank(items: RawItem[], cfg: SourcesConfig, weightOf: (src: string) => number): Ranked[] {
  // corroboration: how many distinct sources mention a similar title token-set
  const titleSig = (t: string) => t.toLowerCase().split(/\W+/).filter((w) => w.length > 4).slice(0, 4).sort().join(' ');
  const corrob = new Map<string, Set<string>>();
  for (const i of items) {
    const k = titleSig(i.title);
    if (!corrob.has(k)) corrob.set(k, new Set());
    corrob.get(k)!.add(i.source);
  }
  return items
    .map((i) => {
      const recency = Math.pow(0.5, ageHours(i.publishedAt) / cfg.recency_half_life_hours);
      const sig = Math.log1p((i.signals?.points ?? 0) + (i.signals?.comments ?? 0)) / 6;
      const corroboration = (corrob.get(titleSig(i.title))!.size - 1) * 0.15;
      const hits = relevanceHits(i, cfg.allowlist);
      const score = weightOf(i.source) * recency + Math.min(sig, 0.5) + corroboration + Math.min(hits.length, 4) * 0.05;
      return { ...i, score, hits };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, cfg.candidate_cap);
}

export function mapModule(i: RawItem): { module: string; secondary: string[]; rationale: string; tags: string[] } {
  const hay = `${i.title} ${i.text ?? ''}`.toLowerCase();
  // Score by specificity: a multi-word keyword ("prompt injection") outweighs a generic
  // single-word one ("prompt"), so news maps to the most specific matching module.
  const scored = MODULES.map((m) => {
    const matched = m.keywords.filter((k) => hay.includes(k.toLowerCase()));
    const score = matched.reduce((s, k) => s + k.trim().split(/\s+/).length, 0);
    return { id: m.id, name: m.name, order: m.order, matched, score };
  })
    .filter((s) => s.matched.length > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order);

  if (scored.length === 0) {
    return { module: MODULES[0].id, secondary: [], rationale: 'No strong keyword match; defaulted to foundations.', tags: [] };
  }
  const best = scored[0];
  return {
    module: best.id,
    secondary: scored.slice(1, 3).map((s) => s.id),
    rationale: `Matched ${best.name} on: ${best.matched.slice(0, 4).join(', ')}.`,
    tags: best.matched.slice(0, 5),
  };
}

const bullets = (i: RawItem): string[] => {
  const text = (i.text ?? '').replace(/\s+/g, ' ').trim();
  const sents = text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 25).slice(0, 3);
  const out = sents.length >= 2 ? sents : [`Surfaced from ${i.source}.`, `Open the source to read the details.`];
  return out.slice(0, 4).map((s) => (s.length > 220 ? s.slice(0, 217) + '…' : s));
};

// Deterministic curation used when no LLM is available (flagged uncurated-fallback).
export function templatedLessons(ranked: Ranked[], cfg: SourcesConfig): DailyLesson[] {
  return ranked.slice(0, cfg.max_lessons).map((i, idx) => {
    const mm = mapModule(i);
    const moduleName = MODULES.find((m) => m.id === mm.module)?.name ?? mm.module;
    const signals: Record<string, number> = {};
    if (i.signals?.points != null) signals.points = i.signals.points;
    if (i.signals?.comments != null) signals.comments = i.signals.comments;
    return {
      id: `${slug(i.title)}-${idx}`,
      headline: i.title,
      sourceLinks: [{ title: i.title, url: i.url, source: i.source }],
      summaryBullets: bullets(i),
      whyItMatters: `Relevant to ${moduleName}. ${mm.rationale} Read it through that lens.`,
      module: mm.module as DailyLesson['module'],
      secondaryModules: mm.secondary as DailyLesson['secondaryModules'],
      moduleRationale: mm.rationale,
      tags: mm.tags.length ? mm.tags : ['ai'],
      meta: { difficulty: 'intermediate', readingTimeMin: 2, ...(Object.keys(signals).length ? { signals } : {}) },
    };
  });
}

export function quietDay(date: string): DailyEntry {
  return dailyEntrySchema.parse({
    date,
    generatedAt: new Date().toISOString(),
    curationFlag: 'quiet-day',
    sourcesUsed: [],
    audio: { available: false },
    lessons: [
      {
        id: 'quiet-day-evergreen',
        headline: 'A quiet day — revisit a fundamental',
        sourceLinks: [{ title: 'Browse the curriculum', url: '/modules', source: 'ALLM Academy' }],
        summaryBullets: [
          'No fresh items cleared the relevance + recency bar today.',
          'Use the slack to re-derive a core idea instead of skimming news.',
        ],
        whyItMatters: 'Staying current is necessary but not sufficient — fundamentals are what let you judge the news.',
        module: 'foundations-prompts-to-harnesses',
        secondaryModules: [],
        moduleRationale: 'Evergreen fallback card.',
        tags: ['quiet-day'],
        meta: { difficulty: 'beginner', readingTimeMin: 1 },
      },
    ],
  });
}

export function buildEntry(opts: {
  date: string;
  lessons: DailyLesson[];
  curationFlag: DailyEntry['curationFlag'];
  sourcesUsed: string[];
  audio: DailyEntry['audio'];
}): DailyEntry {
  return dailyEntrySchema.parse({
    date: opts.date,
    generatedAt: new Date().toISOString(),
    curationFlag: opts.curationFlag,
    sourcesUsed: opts.sourcesUsed,
    audio: opts.audio,
    lessons: opts.lessons,
  });
}
