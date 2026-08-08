import type { CollectionEntry } from 'astro:content';
import { MODULES } from '@/content/modules';
import { lessonKey, type Manifest } from '@/lib/progress';
import { lessonHref } from '@/lib/paths';

// Build-time lesson manifest (module → lesson keys), embedded as JSON for the client
// so progress %s can be computed in the browser without another fetch.
export function buildManifest(lessons: CollectionEntry<'lessons'>[]): Manifest {
  return {
    modules: MODULES.map((m) => {
      const moduleLessons = lessons
        .filter((l) => l.data.moduleId === m.id && !l.data.isModuleGate)
        .sort((a, b) => a.data.order - b.data.order);
      return {
        id: m.id,
        lessonKeys: moduleLessons.map((lesson) => lessonKey(m.id, lesson.data.lessonId)),
        lessons: moduleLessons.map((lesson) => ({
          key: lessonKey(m.id, lesson.data.lessonId),
          title: lesson.data.title,
          href: lessonHref(m.id, lesson.data.lessonId),
        })),
      };
    }),
  };
}
