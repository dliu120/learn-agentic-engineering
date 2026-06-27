// Reduced-motion helpers. Viz modules render a static final state when this is true.
export const prefersReducedMotion = (): boolean =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Resolve a design-token CSS var (RGB triplet) to a usable color string for SVG/Canvas.
export const cssColor = (name: string, alpha?: number): string => {
  const v = typeof getComputedStyle !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    : '';
  const triplet = v || '128 128 128';
  return alpha == null ? `rgb(${triplet})` : `rgb(${triplet} / ${alpha})`;
};

export const svgEl = <K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};
