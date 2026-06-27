// Daily pipeline orchestrator. Run from repo root:
//   npm run daily            → writes src/content/daily/<today>.json
//   npm run daily:dry        → writes .tmp/<today>.json, no site changes
//   npm run daily -- --date=2026-06-25
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse as parseYaml } from 'yaml';
import { fetchFeed } from './sources';
import { withTimeout } from '../lib/http';
import { hasLLM } from '../lib/llm';
import { log } from '../lib/log';
import { normalize, dedupe, filterItems, rank, templatedLessons, quietDay, buildEntry } from './pipeline';
import { curate } from './curate';
import type { RawItem, SourcesConfig } from './types';
import type { DailyEntry, DailyLesson } from '../../src/content/schemas/daily';

const exec = promisify(execFile);
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const dateArg = (args.find((a) => a.startsWith('--date=')) ?? '').split('=')[1];
const utcDay = () => new Date().toISOString().slice(0, 10);

async function digest(date: string, lessons: DailyLesson[], cfg: SourcesConfig, dry: boolean): Promise<DailyEntry['audio']> {
  const transcript =
    `Today's AI engineering briefing. ` + lessons.map((l, i) => `Item ${i + 1}: ${l.headline}. ${l.whyItMatters}`).join(' ');
  try {
    await exec('edge-tts', ['--version']);
  } catch {
    return { available: false, transcript };
  }
  if (dry) return { available: false, transcript };
  try {
    await mkdir('public/audio/daily', { recursive: true });
    const mp3 = `public/audio/daily/${date}.mp3`;
    const vtt = `public/audio/daily/${date}.vtt`;
    await exec('edge-tts', ['--voice', cfg.voice, '--text', transcript, '--write-media', mp3, '--write-subtitles', vtt]);
    return { available: true, mp3: `/audio/daily/${date}.mp3`, vtt: `/audio/daily/${date}.vtt`, transcript };
  } catch (e) {
    log.warn('edge-tts digest failed:', String(e));
    return { available: false, transcript };
  }
}

async function main() {
  const date = dateArg || utcDay();
  const cfg = parseYaml(await readFile('sources.yaml', 'utf8')) as SourcesConfig;
  const weightOf = (src: string) => cfg.feeds.find((f) => f.name === src)?.weight ?? 0.5;
  log.info(`daily ${date} ${dry ? '(dry-run)' : ''} · LLM ${hasLLM() ? 'on' : 'off'} · ${cfg.feeds.length} feeds`);

  const settled = await Promise.allSettled(
    cfg.feeds.map((f) => withTimeout(f.name, fetchFeed(f, cfg.per_source_cap), 25000)),
  );
  const raws: RawItem[] = [];
  const used: string[] = [];
  settled.forEach((r, i) => {
    const f = cfg.feeds[i];
    if (r.status === 'fulfilled') {
      const items = r.value.slice(0, cfg.per_source_cap);
      if (items.length) used.push(f.name);
      raws.push(...items);
      log.ok(`${f.name}: ${r.value.length} items`);
    } else {
      log.warn(`${f.name} failed: ${r.reason}`);
    }
  });

  const items = filterItems(dedupe(normalize(raws)), cfg);
  const ranked = rank(items, cfg, weightOf);
  log.info(`pipeline: ${raws.length} raw → ${items.length} filtered → ${ranked.length} ranked`);

  let entry: DailyEntry;
  if (ranked.length === 0) {
    entry = quietDay(date);
    log.warn('no candidates cleared the bar → quiet-day');
  } else {
    let lessons = await curate(ranked, cfg);
    let flag: DailyEntry['curationFlag'] = 'curated';
    if (!lessons) {
      lessons = templatedLessons(ranked, cfg);
      flag = 'uncurated-fallback';
      log.warn(`LLM curation off/failed → templated fallback (${lessons.length} lessons)`);
    }
    const audio = await digest(date, lessons, cfg, dry);
    entry = buildEntry({ date, lessons, curationFlag: flag, sourcesUsed: used, audio });
  }

  const json = JSON.stringify(entry, null, 2);
  if (dry) {
    await mkdir('.tmp', { recursive: true });
    await writeFile(`.tmp/${date}.json`, json);
    log.ok(`dry-run → .tmp/${date}.json · ${entry.lessons.length} lessons · flag=${entry.curationFlag} · audio=${entry.audio.available}`);
  } else {
    await mkdir('src/content/daily', { recursive: true });
    await writeFile(`src/content/daily/${date}.json`, json);
    log.ok(`wrote src/content/daily/${date}.json · ${entry.lessons.length} lessons · flag=${entry.curationFlag}`);
  }
}

main().catch((e) => {
  log.err(e);
  process.exit(1);
});
