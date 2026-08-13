import { readdir, readFile } from 'node:fs/promises';
import { dailyEntrySchema } from '../src/content/schemas/daily';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

const toUtcDay = (date: string): number => {
  if (!DATE.test(date)) throw new Error(`invalid daily filename: ${date}`);
  const value = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(value) || new Date(value).toISOString().slice(0, 10) !== date) {
    throw new Error(`invalid calendar date: ${date}`);
  }
  return value;
};

export function findMissingDates(dates: string[]): string[] {
  if (dates.length === 0) return [];
  const unique = [...new Set(dates)];
  if (unique.length !== dates.length) throw new Error('duplicate daily dates');
  unique.forEach(toUtcDay);
  unique.sort();

  const present = new Set(unique);
  const missing: string[] = [];
  for (let value = toUtcDay(unique[0]); value <= toUtcDay(unique.at(-1)!); value += DAY_MS) {
    const date = new Date(value).toISOString().slice(0, 10);
    if (!present.has(date)) missing.push(date);
  }
  return missing;
}

export async function checkDailyContinuity(directory = 'src/content/daily'): Promise<number> {
  const names = (await readdir(directory)).filter((name) => name.endsWith('.json')).sort();
  const dates = names.map((name) => name.slice(0, -5));
  if (dates.length === 0) throw new Error('no daily entries found');

  for (const [index, name] of names.entries()) {
    const raw = JSON.parse(await readFile(`${directory}/${name}`, 'utf8'));
    const parsed = dailyEntrySchema.parse(raw);
    if (parsed.date !== dates[index]) {
      throw new Error(`${name}: date field ${parsed.date} does not match filename`);
    }
  }

  const missing = findMissingDates(dates);
  if (missing.length) throw new Error(`missing daily entries: ${missing.join(', ')}`);
  return dates.length;
}

if (import.meta.main) {
  checkDailyContinuity()
    .then((count) => console.log(`✓ ${count} continuous daily entries`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
