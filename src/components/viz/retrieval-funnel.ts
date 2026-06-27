// M6 — two-stage retrieval funnel. A cheap wide net (BM25 + dense) → fuse (RRF) → expensive
// cross-encoder reranks a small candidate set → the few chunks that enter the prompt.
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

const STAGES = [
  { t: 'Corpus', n: '1,000,000', w: 1.0, tone: '--text-faint', d: 'The full document corpus — far too big to read.' },
  { t: 'BM25 + dense recall', n: '~200', w: 0.66, tone: '--accent', d: 'Two cheap first-stage retrievers cast a wide net (lexical + semantic).' },
  { t: 'RRF fusion', n: '~100', w: 0.46, tone: '--accent', d: 'Reciprocal-rank fusion merges both lists without tuning score scales.' },
  { t: 'Cross-encoder rerank', n: 'top 8', w: 0.26, tone: '--signal-good', d: 'An expensive joint encoder re-scores only the survivors for precision.' },
  { t: 'Into the prompt', n: '8 chunks', w: 0.16, tone: '--signal-good', d: 'Only the most relevant, grounded chunks reach the model.' },
];

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 300,
    cx = W / 2,
    top = 24,
    rowH = 44,
    gap = 8;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'A funnel narrowing from a million documents through recall, fusion, and reranking down to eight chunks that enter the prompt.');

  const rows = STAGES.map((s, i) => {
    const y = top + i * (rowH + gap);
    const w = s.w * (W - 80);
    const g = svgEl('g', {});
    const rect = svgEl('rect', { x: cx - w / 2, y, width: w, height: rowH, rx: 6, fill: cssColor(s.tone, 0.16), stroke: cssColor(s.tone), 'stroke-width': 1.5 });
    const t = svgEl('text', { x: cx, y: y + 18, 'text-anchor': 'middle', fill: cssColor('--text'), 'font-size': 12, 'font-weight': 600, 'font-family': 'JetBrains Mono, monospace' });
    t.textContent = s.t;
    const n = svgEl('text', { x: cx, y: y + 34, 'text-anchor': 'middle', fill: cssColor(s.tone), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
    n.textContent = s.n;
    (g.style as CSSStyleDeclaration).transition = 'opacity .4s';
    g.style.opacity = '0.25';
    g.append(rect, t, n);
    svg.append(g);
    return g;
  });

  stage.append(svg);
  root.append(stage);

  const render = (i: number) => rows.forEach((g, j) => (g.style.opacity = j <= i ? '1' : '0.25'));

  mountStepper(root, stage, {
    steps: STAGES.map((s) => ({ label: s.t, caption: `${s.t} (${s.n}) — ${s.d}` })),
    onStep: render,
    reduced,
    loop: true,
    autoMs: 2400,
  });
}
