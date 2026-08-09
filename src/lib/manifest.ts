import { MODULES } from '@/content/modules';
import type { ModuleId } from '@/content/schemas/module-ids';
import { lessonKey, type Manifest } from '@/lib/progress';
import { lessonHref } from '@/lib/paths';

export interface LessonManifestSource {
  data: {
    moduleId: ModuleId;
    lessonId: string;
    title: string;
    order: number;
    isModuleGate: boolean;
  };
}

// Build-time lesson manifest (module → lesson keys), embedded as JSON for the client
// so progress %s can be computed in the browser without another fetch.
export function buildManifest(lessons: LessonManifestSource[]): Manifest {
  return {
    modules: MODULES.map((m) => {
      const moduleLessons = lessons
        .filter((l) => l.data.moduleId === m.id)
        .sort((a, b) => a.data.order - b.data.order);
      const topicLessons = moduleLessons.filter((lesson) => !lesson.data.isModuleGate);
      return {
        id: m.id,
        lessonKeys: topicLessons.map((lesson) => lessonKey(m.id, lesson.data.lessonId)),
        lessons: moduleLessons.map((lesson) => ({
          key: lessonKey(m.id, lesson.data.lessonId),
          title: lesson.data.title,
          href: lessonHref(m.id, lesson.data.lessonId),
        })),
      };
    }),
  };
}
