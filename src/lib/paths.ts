// Base-path-aware URL builder so the site works at "/" locally and "/repo/" on GitHub Pages.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export const withBase = (p: string): string => {
  const path = p.startsWith('/') ? p : `/${p}`;
  return `${BASE}${path}` || '/';
};

export const moduleHref = (id: string) => withBase(`/modules/${id}`);
export const lessonHref = (moduleId: string, lessonId: string) => withBase(`/modules/${moduleId}/${lessonId}`);

// Module hue → CSS color helpers (consistent card/ring/tag accents).
export const hue = (h: number, s = 70, l = 55, a = 1) => `hsl(${h} ${s}% ${l}% / ${a})`;
