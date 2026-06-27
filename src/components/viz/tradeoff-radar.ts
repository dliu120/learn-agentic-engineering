// M9 — the adaptation tradeoff surface. Four axes (higher = better); each strategy is a
// different shape. There is no universally best choice — pick by your binding constraint.
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

const AXES = ['quality fit', 'low latency', 'low cost', 'freshness'];
// scores 0..1 per axis (higher better). Deliberately opinionated, illustrative.
const STRATS = [
  { t: 'Prompt / ICL', v: [0.55, 0.9, 0.85, 0.6], d: 'In-context learning: zero setup, instant to change, but spends tokens every call and is capped by context.' },
  { t: 'RAG', v: [0.75, 0.65, 0.6, 0.95], d: 'Retrieval: best for volatile, citable knowledge and freshness; adds a retrieval hop and infra.' },
  { t: 'Fine-tune', v: [0.85, 0.8, 0.55, 0.25], d: 'Fine-tuning: best for stable behavior/format/style; a brittle, stale way to inject facts.' },
  { t: 'Distillation', v: [0.7, 0.95, 0.9, 0.3], d: 'Distillation: compress a validated pipeline into a cheaper/faster student; high upfront cost.' },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 320,
    cx = W / 2,
    cy = H / 2 + 6,
    R = 110;
  const n = AXES.length;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'A radar chart over quality fit, latency, cost, and freshness; each adaptation strategy traces a different shape.');

  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, f: number) => [cx + R * f * Math.cos(ang(i)), cy + R * f * Math.sin(ang(i))] as [number, number];

  // grid rings + spokes
  [0.25, 0.5, 0.75, 1].forEach((f) =>
    svg.append(svgEl('polygon', { points: AXES.map((_, i) => pt(i, f).join(',')).join(' '), fill: 'none', stroke: cssColor('--border'), 'stroke-width': 1 })),
  );
  AXES.forEach((a, i) => {
    const [x, y] = pt(i, 1);
    svg.append(svgEl('line', { x1: cx, y1: cy, x2: x, y2: y, stroke: cssColor('--border'), 'stroke-width': 1 }));
    const [lx, ly] = pt(i, 1.18);
    const t = svgEl('text', { x: lx, y: ly, 'text-anchor': 'middle', dy: '0.35em', fill: cssColor('--text-faint'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
    t.textContent = a;
    svg.append(t);
  });

  const shape = svgEl('polygon', { points: '', fill: cssColor('--accent', 0.18), stroke: cssColor('--accent'), 'stroke-width': 2.5 });
  (shape.style as CSSStyleDeclaration).transition = 'all .5s ease';
  svg.append(shape);
  const title = svgEl('text', { x: cx, y: 22, 'text-anchor': 'middle', fill: cssColor('--text'), 'font-size': 13, 'font-weight': 700, 'font-family': 'JetBrains Mono, monospace' });
  svg.append(title);

  stage.append(svg);
  root.append(stage);

  const render = (i: number) => {
    const s = STRATS[i];
    shape.setAttribute('points', s.v.map((f, j) => pt(j, f).join(',')).join(' '));
    title.textContent = s.t;
  };

  mountStepper(root, stage, {
    steps: STRATS.map((s) => ({ label: s.t, caption: `${s.t} — ${s.d}` })),
    onStep: render,
    reduced,
    loop: true,
    autoMs: 3000,
  });
}
