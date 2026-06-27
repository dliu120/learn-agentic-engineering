// DOM hydration helpers (browser-only). Reads the embedded lesson manifest + progress store
// and fills dashboard chips, module bars, and the resume button.
import { overall, moduleProgress, getState, type Manifest } from '@/lib/progress';
import { withBase } from '@/lib/paths';

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

    for (const m of manifest.modules) {
      const pct = moduleProgress(m.id, m.lessonKeys);
      const bar = document.querySelector<HTMLElement>(`[data-module-progress-bar="${m.id}"]`);
      if (bar) bar.style.width = `${pct}%`;
      const label = document.querySelector(`[data-module-progress-label="${m.id}"]`);
      if (label && pct > 0) label.textContent = `${pct}% complete`;
    }

    const st = getState();
    const resume = document.querySelector<HTMLAnchorElement>('[data-resume-target]');
    if (resume && st.lastVisited) {
      resume.textContent = 'Resume where you left off';
      resume.href = withBase(`/modules/${st.lastVisited.moduleId}/${st.lastVisited.lessonId}`);
    }
  };

  render();
  window.addEventListener('allm:progress', render);
}

export function hydrateModuleCards(): void {
  // Same bar/label fill used on the module index page.
  const manifest = readManifest();
  for (const m of manifest.modules) {
    const pct = moduleProgress(m.id, m.lessonKeys);
    const bar = document.querySelector<HTMLElement>(`[data-module-progress-bar="${m.id}"]`);
    if (bar) bar.style.width = `${pct}%`;
    const label = document.querySelector(`[data-module-progress-label="${m.id}"]`);
    if (label && pct > 0) label.textContent = `${pct}% complete`;
  }
}
