// Asserts the union of topicNumbers across all lessons equals {1..22}. Used by the DoD.
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
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
    byModule[dir.name] ??= [];
    for (const n of nums) {
      seen.add(n);
      byModule[dir.name].push(n);
    }
  }
}

const all = Array.from({ length: 22 }, (_, i) => i + 1);
const missing = all.filter((n) => !seen.has(n));

console.log('Topic coverage by module:');
for (const [m, nums] of Object.entries(byModule)) {
  console.log(`  ${m}: ${[...new Set(nums)].sort((a, b) => a - b).join(', ')}`);
}

if (missing.length) {
  console.error(`\n✗ MISSING topics: ${missing.join(', ')}`);
  process.exit(1);
}
console.log(`\n✓ All 22 topics covered (${seen.size}/22).`);
