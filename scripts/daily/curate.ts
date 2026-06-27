// LLM curation with a bounded repair loop + per-lesson Zod validation. Returns null when no
// key is present or every attempt fails — the caller then uses the deterministic fallback.
import { llmJSON, hasLLM } from '../lib/llm';
import { log } from '../lib/log';
import { MODULES } from '../../src/content/modules';
import { dailyLesson, type DailyLesson } from '../../src/content/schemas/daily';
import { mapModule, type Ranked } from './pipeline';
import type { SourcesConfig } from './types';

export async function curate(ranked: Ranked[], cfg: SourcesConfig): Promise<DailyLesson[] | null> {
  if (!hasLLM()) return null;

  const moduleList = MODULES.map((m) => `  ${m.id} — ${m.name}: ${m.short}`).join('\n');
  const candidates = ranked.slice(0, cfg.max_lessons * 2).map((i, idx) => ({
    idx,
    title: i.title,
    url: i.url,
    source: i.source,
    text: (i.text ?? '').slice(0, 400),
    suggestedModule: mapModule(i).module,
  }));

  const base = [
    `You are curating today's AI-engineering briefing for working practitioners.`,
    `Pick the ${cfg.max_lessons} most important candidates and turn EACH into a short, teachable lesson.`,
    `Map each lesson to exactly ONE moduleId from this list (prefer suggestedModule unless clearly wrong):`,
    moduleList,
    ``,
    `CANDIDATES:`,
    JSON.stringify(candidates, null, 1),
    ``,
    `Return JSON: {"lessons":[{`,
    `  "id": string, "headline": string,`,
    `  "sourceLinks":[{"title":string,"url":string (absolute http from the candidate),"source":string}],`,
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
        if (p.success) lessons.push(p.data);
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
