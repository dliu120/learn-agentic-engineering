// LLM curation with a bounded repair loop + per-lesson Zod validation. Returns null when no
// key is present or every attempt fails — the caller then uses the deterministic fallback.
import { llmJSON, hasLLM } from '../lib/llm';
import { log } from '../lib/log';
import { dailyLesson, type DailyLesson } from '../../src/content/schemas/daily';
import { DAILY_MODULES, mapModule, type Ranked } from './pipeline';
import type { SourcesConfig } from './types';

const dailyModuleIds = new Set(DAILY_MODULES.map((module) => module.id));

export function normalizeDailyLessonModules(lesson: DailyLesson): DailyLesson | null {
  if (!dailyModuleIds.has(lesson.module)) return null;
  return {
    ...lesson,
    secondaryModules: lesson.secondaryModules.filter((moduleId) => dailyModuleIds.has(moduleId)),
  };
}

export function preserveSourceProvenance(lesson: DailyLesson, ranked: Ranked[]): DailyLesson | null {
  const candidates = new Map(ranked.map((item) => [item.url, item]));
  const sourceLinks = lesson.sourceLinks.map((link) => {
    const candidate = candidates.get(link.url);
    if (!candidate) return null;
    return {
      title: candidate.title,
      url: candidate.url,
      source: candidate.source,
      type: candidate.sourceType ?? ('article' as const),
      publishedAt: candidate.publishedAt,
    };
  });
  if (sourceLinks.some((link) => link === null)) return null;
  return { ...lesson, sourceLinks: sourceLinks as DailyLesson['sourceLinks'] };
}

export async function curate(ranked: Ranked[], cfg: SourcesConfig): Promise<DailyLesson[] | null> {
  if (!hasLLM()) return null;

  const moduleList = DAILY_MODULES.map((m) => `  ${m.id} — ${m.name}: ${m.short}`).join('\n');
  const candidates = ranked.slice(0, cfg.max_lessons * 2).map((i, idx) => ({
    idx,
    title: i.title,
    url: i.url,
    source: i.source,
    sourceType: i.sourceType ?? 'article',
    text: (i.text ?? '').slice(0, 400),
    suggestedModule: mapModule(i).module,
  }));

  const base = [
    `You are curating today's AI-engineering briefing for working practitioners.`,
    `Treat repository stars, forks, and recent pushes only as discovery signals—not evidence of quality, novelty, or effectiveness. Attribute source claims and do not strengthen them.`,
    `Pick the ${cfg.max_lessons} most important candidates and turn EACH into a short, teachable lesson.`,
    `Map each lesson to exactly ONE moduleId from this list (prefer suggestedModule unless clearly wrong):`,
    moduleList,
    ``,
    `CANDIDATES:`,
    JSON.stringify(candidates, null, 1),
    ``,
    `Return JSON: {"lessons":[{`,
    `  "id": string, "headline": string,`,
    `  "sourceLinks":[{"title":string,"url":string (copy exactly from a candidate),"source":string,"type":"paper|repository|discussion|article"}],`,
    `  "summaryBullets":[2-4 strings], "whyItMatters": string (concrete for an AI engineer),`,
    `  "module": moduleId, "secondaryModules":[moduleId...], "moduleRationale": string,`,
    `  "microQuiz":{"question":string,"options":[2-4 strings],"correct":<0-based index>,"explanation":string},`,
    `  "tags":[strings], "meta":{"difficulty":"beginner|intermediate|advanced","readingTimeMin":number}`,
    `}]}. No prose, no code fences.`,
  ].join('\n');

  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const prompt = attempt === 0 ? base : `${base}\n\nPrevious output failed validation: ${lastErr}\nReturn corrected JSON only.`;
      const out = await llmJSON<{ lessons: unknown[] }>(prompt, { model: cfg.model, maxTokens: 4096 });
      const lessons: DailyLesson[] = [];
      for (const raw of out.lessons ?? []) {
        const p = dailyLesson.safeParse(raw);
        if (p.success) {
          const normalized = normalizeDailyLessonModules(p.data);
          const sourced = normalized ? preserveSourceProvenance(normalized, ranked) : null;
          if (sourced) lessons.push(sourced);
        }
      }
      if (lessons.length >= 1) {
        log.ok(`curate: ${lessons.length} lessons (attempt ${attempt + 1})`);
        return lessons.slice(0, cfg.max_lessons);
      }
      lastErr = 'no lessons passed schema validation';
    } catch (e) {
      lastErr = String(e);
      log.warn(`curate attempt ${attempt + 1} failed: ${lastErr}`);
    }
  }
  return null;
}
