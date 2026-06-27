import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';

// Reads frontmatter from an MDX/MD file. Works for both YAML and JSON frontmatter
// (JSON is valid YAML), which is what our two authoring paths produce.
export async function readFrontmatter(path: string): Promise<Record<string, unknown>> {
  const text = await readFile(path, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  try {
    return (parse(m[1]) as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}
