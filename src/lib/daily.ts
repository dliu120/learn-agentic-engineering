import { getCollection, type CollectionEntry } from 'astro:content';

export type DailyEntryDoc = CollectionEntry<'daily'>;

export async function allDays(): Promise<DailyEntryDoc[]> {
  const days = await getCollection('daily');
  return days.sort((a, b) => (a.data.date < b.data.date ? 1 : -1));
}

export async function latestDay(): Promise<DailyEntryDoc | undefined> {
  return (await allDays())[0];
}

// All daily lessons tagged to a module (primary or secondary), newest first.
export async function newsForModule(moduleId: string) {
  const days = await allDays();
  const out: { date: string; lesson: DailyEntryDoc['data']['lessons'][number] }[] = [];
  for (const d of days) {
    for (const l of d.data.lessons) {
      if (l.module === moduleId || l.secondaryModules.includes(moduleId as never)) {
        out.push({ date: d.data.date, lesson: l });
      }
    }
  }
  return out;
}

export const prettyDate = (iso: string): string =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
