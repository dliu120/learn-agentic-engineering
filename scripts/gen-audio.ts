// Build-time core-concept narration via edge-tts. Hash-cached so unchanged narration is skipped.
// GUARD: if edge-tts is not installed, logs a warning and exits 0 (never fails the build).
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { readFrontmatter } from './lib/frontmatter';
import { log } from './lib/log';

const exec = promisify(execFile);
const ROOT = 'src/content/lessons';
const OUT = 'public/audio/core';
const MANIFEST = 'scripts/.audio-manifest.json';

async function fileExists(p: string) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // voice from sources.yaml (best-effort)
  let voice = 'en-US-AriaNeural';
  try {
    const cfg = parseYaml(await readFile('sources.yaml', 'utf8')) as { voice?: string };
    if (cfg.voice) voice = cfg.voice;
  } catch {
    /* default */
  }

  try {
    await exec('edge-tts', ['--version']);
  } catch {
    log.warn('edge-tts not installed — skipping core audio generation (transcripts still render).');
    log.warn('  install with: pip install edge-tts');
    return;
  }

  let manifest: Record<string, string> = {};
  try {
    manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  } catch {
    /* first run */
  }

  await mkdir(OUT, { recursive: true });
  let made = 0;
  let skipped = 0;

  const dirs = await readdir(ROOT, { withFileTypes: true });
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const files = await readdir(join(ROOT, dir.name));
    for (const f of files) {
      if (!f.endsWith('.mdx')) continue;
      const fm = await readFrontmatter(join(ROOT, dir.name, f));
      if (!fm.hasAudio || !fm.narration) continue;
      const moduleId = String(fm.moduleId);
      const lessonId = String(fm.lessonId);
      const narration = String(fm.narration);
      const key = `${moduleId}-${lessonId}`;
      const hash = createHash('sha256').update(narration + voice).digest('hex').slice(0, 16);
      const mp3 = join(OUT, `${key}.mp3`);
      if (manifest[key] === hash && (await fileExists(mp3))) {
        skipped++;
        continue;
      }
      try {
        await exec('edge-tts', ['--voice', voice, '--text', narration, '--write-media', mp3, '--write-subtitles', join(OUT, `${key}.vtt`)]);
        manifest[key] = hash;
        made++;
        log.ok(`audio: ${key}`);
      } catch (e) {
        log.warn(`audio failed for ${key}: ${String(e)}`);
      }
    }
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  log.ok(`gen-audio done · ${made} generated · ${skipped} cached`);
}

main().catch((e) => {
  log.err(e);
  // never fail the build on audio
  process.exit(0);
});
