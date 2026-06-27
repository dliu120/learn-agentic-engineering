// M2 — the KV cache is the dynamic memory bottleneck. Weights are fixed; KV grows with
// sequence length × batch until it hits HBM capacity → preemption / paging.
import { svgEl, cssColor } from '@/lib/motion';
import { mountStepper } from './stepper';

export function init(root: HTMLElement, { reduced }: { reduced: boolean }): void {
  const W = 640,
    H = 220,
    pad = 24,
    barW = W - pad * 2,
    barY = 70,
    barH = 70;
  const stage = document.createElement('div');
  stage.className = 'w-full';
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'w-full', role: 'img' });
  svg.setAttribute('aria-label', 'GPU memory as a fixed bar: weights stay constant while the KV cache grows with sequence length and batch until it overflows capacity.');

  const title = svgEl('text', { x: pad, y: 40, fill: cssColor('--text-muted'), 'font-size': 13, 'font-family': 'JetBrains Mono, monospace' });
  title.textContent = 'GPU HBM (fixed capacity)';
  svg.append(title);

  const frame = svgEl('rect', { x: pad, y: barY, width: barW, height: barH, rx: 6, fill: 'none', stroke: cssColor('--border'), 'stroke-width': 1.5 });
  const weights = svgEl('rect', { x: pad, y: barY, width: 0, height: barH, fill: cssColor('--accent-2', 0.8) });
  const kv = svgEl('rect', { x: pad, y: barY, width: 0, height: barH, fill: cssColor('--accent', 0.85) });
  (weights.style as CSSStyleDeclaration).transition = 'width .6s ease';
  (kv.style as CSSStyleDeclaration).transition = 'width .6s ease, x .6s ease, fill .3s';
  svg.append(weights, kv, frame);

  // capacity marker (100%)
  const capLine = svgEl('line', { x1: pad + barW, y1: barY - 6, x2: pad + barW, y2: barY + barH + 6, stroke: cssColor('--signal-bad'), 'stroke-width': 1.5, 'stroke-dasharray': '3 3' });
  svg.append(capLine);

  const legend = svgEl('text', { x: pad, y: 170, fill: cssColor('--text-faint'), 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
  svg.append(legend);
  legend.textContent = '■ weights (fixed)   ■ KV cache (grows with seq × batch)';

  stage.append(svg);
  root.append(stage);

  const wFrac = 0.55; // weights take a constant slice
  const setBars = (kvFrac: number, overflow: boolean) => {
    weights.setAttribute('width', String(wFrac * barW));
    kv.setAttribute('x', String(pad + wFrac * barW));
    const maxKv = Math.min(kvFrac, 1 - wFrac);
    kv.setAttribute('width', String(maxKv * barW));
    kv.setAttribute('fill', overflow ? cssColor('--signal-bad', 0.9) : cssColor('--accent', 0.85));
    frame.setAttribute('stroke', overflow ? cssColor('--signal-bad') : cssColor('--border'));
  };

  const steps = [
    { caption: 'Load the model: weights occupy a fixed slice of HBM and never change at serving time.', kv: 0, of: false },
    { caption: 'One request, short context: a small KV cache appears. Comfortable headroom.', kv: 0.08, of: false },
    { caption: 'Batch of 8 with long contexts: KV scales with seq × batch and now dominates the free space — KV, not weights, caps concurrency.', kv: 0.4, of: false },
    { caption: 'Push the batch further: KV demand exceeds capacity → OOM. The server preempts/recomputes, and PagedAttention pages KV in fixed blocks to fit.', kv: 0.6, of: true },
  ];

  mountStepper(root, stage, {
    steps: steps.map((s, i) => ({ label: `t${i}`, caption: s.caption })),
    onStep: (i) => setBars(steps[i].kv, steps[i].of),
    reduced,
    loop: true,
    autoMs: 2800,
  });
}
