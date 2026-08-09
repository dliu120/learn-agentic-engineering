// DOM hydration helpers (browser-only). Reads the embedded lesson manifest + progress store
// and fills dashboard chips, module bars, and the resume button.
import { overall, getState, type Manifest } from '@/lib/progress';

function readManifest(): Manifest {
  const el = document.getElementById('lesson-manifest');
  if (!el?.textContent) return { modules: [] };
  try {
    return JSON.parse(el.textContent) as Manifest;
  } catch {
    return { modules: [] };
  }
}

const setText = (sel: string, v: string): void => {
  const el = document.querySelector(sel);
  if (el) el.textContent = v;
};

export function hydrateDashboard(): void {
  const render = () => {
    const manifest = readManifest();
    const o = overall(manifest);
    setText('[data-summary="overall"]', `${o.pct}%`);
    setText('[data-summary="lessons"]', String(o.lessonsDone));
    setText('[data-summary="quizzes"]', String(o.quizzesPassed));
    setText('[data-summary="streak"]', String(o.streak));

    const st = getState();
    for (const m of manifest.modules) {
      const done = m.lessonKeys.filter((key) => st.lessons[key]?.completed).length;
      const pct = m.lessonKeys.length ? Math.round((100 * done) / m.lessonKeys.length) : 0;
      const bar = document.querySelector<HTMLElement>(`[data-module-progress-bar="${m.id}"]`);
      if (bar) bar.style.width = `${pct}%`;
      const label = document.querySelector<HTMLElement>(`[data-module-progress-label="${m.id}"]`);
      if (label) label.textContent = done > 0 ? `${done}/${m.lessonKeys.length} complete` : label.dataset.defaultLabel ?? '';
    }

    const resume = document.querySelector<HTMLAnchorElement>('[data-resume-target]');
    if (resume && st.lastVisited) {
      const key = `${st.lastVisited.moduleId}/${st.lastVisited.lessonId}`;
      const lesson = manifest.modules
        .find((module) => module.id === st.lastVisited?.moduleId)
        ?.lessons.find((candidate) => candidate.key === key);
      resume.textContent = lesson ? `Resume: ${lesson.title}` : 'Resume where you left off';
      resume.href = lesson?.href ?? resume.href;
    }
  };

  render();
  window.addEventListener('allm:progress', render);
}

export function hydrateModuleCards(): void {
  const manifest = readManifest();
  const st = getState();
  for (const m of manifest.modules) {
    const done = m.lessonKeys.filter((key) => st.lessons[key]?.completed).length;
    const pct = m.lessonKeys.length ? Math.round((100 * done) / m.lessonKeys.length) : 0;
    const bar = document.querySelector<HTMLElement>(`[data-module-progress-bar="${m.id}"]`);
    if (bar) bar.style.width = `${pct}%`;
    const label = document.querySelector<HTMLElement>(`[data-module-progress-label="${m.id}"]`);
    if (label) label.textContent = done > 0 ? `${done}/${m.lessonKeys.length} complete` : label.dataset.defaultLabel ?? '';
  }
}
