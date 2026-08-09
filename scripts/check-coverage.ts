import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { TOTAL_TOPIC_COUNT } from '../src/content/modules';
import { readFrontmatter } from './lib/frontmatter';

const ROOT = 'src/content/lessons';

const seen = new Set<number>();
const byModule: Record<string, number[]> = {};

const dirs = await readdir(ROOT, { withFileTypes: true });
for (const dir of dirs) {
  if (!dir.isDirectory()) continue;
  const files = await readdir(join(ROOT, dir.name));
  for (const f of files) {
    if (!f.endsWith('.mdx')) continue;
    const fm = await readFrontmatter(join(ROOT, dir.name, f));
    const nums = (fm.topicNumbers as number[] | undefined) ?? [];
    const moduleId = (fm.moduleId as string | undefined) ?? dir.name;
    byModule[moduleId] ??= [];
    for (const n of nums) {
      seen.add(n);
      byModule[moduleId].push(n);
    }
  }
}

const all = Array.from({ length: TOTAL_TOPIC_COUNT }, (_, i) => i + 1);
const missing = all.filter((n) => !seen.has(n));

console.log('Topic coverage by module:');
for (const [m, nums] of Object.entries(byModule)) {
  const topics = [...new Set(nums)].sort((a, b) => a - b);
  console.log(`  ${m}: ${topics.length > 0 ? topics.join(', ') : '(unnumbered primer)'}`);
}

if (missing.length) {
  console.error(`\n✗ MISSING topics: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`\n✓ All ${TOTAL_TOPIC_COUNT} topics covered (${seen.size}/${TOTAL_TOPIC_COUNT}).`);
