import { z } from 'zod';
import { MODULE_IDS } from './module-ids';

// Single source of truth for the daily entry shape — imported by BOTH
// src/content/config.ts AND scripts/daily/* so curation can validate before write.
export const moduleEnum = z.enum(MODULE_IDS);

// Curated items use absolute http(s) links; quiet-day evergreen cards may use a
// site-root-relative path (e.g. "/modules/...").
const sourceLink = z.object({
  title: z.string(),
  url: z
    .string()
    .refine((u) => /^https?:\/\//.test(u) || u.startsWith('/'), 'absolute http(s) URL or site-root-relative path'),
  source: z.string(),
});

export const microQuiz = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2),
  correct: z.number(),
  explanation: z.string(),
});

export const dailyLesson = z.object({
  id: z.string(),
  headline: z.string(),
  sourceLinks: z.array(sourceLink).min(1),
  summaryBullets: z.array(z.string()).min(2).max(4),
  whyItMatters: z.string(),
  module: moduleEnum,
  secondaryModules: z.array(moduleEnum).default([]),
  moduleRationale: z.string(),
  microQuiz: microQuiz.optional(), // degraded/quiet days omit it
  tags: z.array(z.string()),
  meta: z.object({
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    readingTimeMin: z.number(),
    signals: z.record(z.string(), z.number()).optional(),
  }),
});

export const dailyEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  generatedAt: z.string(),
  curationFlag: z.enum(['curated', 'uncurated-fallback', 'quiet-day']),
  sourcesUsed: z.array(z.string()),
  audio: z.object({
    mp3: z.string().optional(),
    vtt: z.string().optional(),
    transcript: z.string().optional(),
    durationSec: z.number().optional(),
    available: z.boolean(),
  }),
  lessons: z.array(dailyLesson).min(1),
});

export type DailyEntry = z.infer<typeof dailyEntrySchema>;
export type DailyLesson = z.infer<typeof dailyLesson>;
