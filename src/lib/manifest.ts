import type { CollectionEntry } from 'astro:content';
import { MODULES } from '@/content/modules';
import { lessonKey, type Manifest } from '@/lib/progress';

// Build-time lesson manifest (module → lesson keys), embedded as JSON for the client
// so progress %s can be computed in the browser without another fetch.
export function buildManifest(lessons: CollectionEntry<'lessons'>[]): Manifest {
  return {
    modules: MODULES.map((m) => ({
      id: m.id,
      lessonKeys: lessons
        .filter((l) => l.data.moduleId === m.id && !l.data.isModuleGate)
        .map((l) => lessonKey(m.id, l.data.lessonId)),
    })),
  };
}
